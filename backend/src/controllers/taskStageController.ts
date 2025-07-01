import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 根据阶段获取当前办理人ID
 */
const getCurrentExecutorId = (stage: string, task: any): number | null => {
  switch (stage) {
    case 'customer_inquiry':
    case 'project_settlement':
      return task.responsiblePersonId;
    case 'proposal_submission':
    case 'teacher_confirmation':
    case 'contract_signing':
    case 'project_execution':
      return task.consultantId;
    case 'project_approval':
      return task.marketManagerId;
    default:
      return null;
  }
};

/**
 * 创建项目通知
 */
const createProjectNotification = async (
  taskId: number,
  targetUserId: number,
  title: string,
  content: string,
  type: string = 'info'
) => {
  try {
    await prisma.notification.create({
      data: {
        title,
        content,
        type,
        userId: targetUserId,
        readStatus: 0,
        relatedId: taskId,
        relatedType: 'project_task',
        createTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('创建通知失败:', error);
  }
};

/**
 * 上传方案附件（方案申报阶段）
 */
export const uploadProposal = async (req: Request, res: Response) => {
  try {
    const { taskId, remark } = req.body;
    const { id: userId } = req.user as any;

    console.log('📤 方案上传请求:', {
      taskId,
      remark,
      user: req.user,
      userId
    });

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      console.error('❌ 方案上传失败: 项目事项不存在', { taskId });
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'proposal_submission') {
      console.error('❌ 方案上传失败: 当前阶段不允许上传方案', {
        taskId,
        currentStage: task.currentStage
      });
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许上传方案',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];

    // 获取操作人姓名 - 优先使用nickName，其次userName
    const operatorName = req.user?.nickName || req.user?.userName;

    console.log('📝 保存操作历史 - 用户信息:', {
      user: req.user,
      operatorName,
      userId
    });

    if (!operatorName) {
      console.error('❌ 警告: 无法获取操作人姓名', { user: req.user });
    }

    // 方案申报阶段的操作记录
    stageHistory.push({
      stage: 'proposal_submission',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName: operatorName || '未知用户',
      action: '上传方案',
      comment: remark
    });

    // 更新项目事项，记录方案上传信息
    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: {
        proposalUploadTime: new Date(),
        proposalComment: remark,
        stageHistory: JSON.stringify(stageHistory)
      },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 发送通知给负责人
    if (updatedTask.responsiblePerson) {
      await createProjectNotification(
        Number(taskId),
        updatedTask.responsiblePerson.id,
        '项目方案已上传',
        `项目"${updatedTask.projectName}"的方案已上传，请查看并跟进客户确认。`,
        'info'
      );
    }

    console.log('✅ 方案上传成功:', {
      taskId,
      operatorName,
      historyCount: stageHistory.length
    });

    res.json({
      code: 0,
      message: '方案上传成功',
      data: updatedTask
    });
  } catch (error) {
    console.error('❌ 上传方案失败:', error);
    res.status(500).json({
      code: 500,
      message: '上传方案失败',
      data: null
    });
  }
};

/**
 * 确认客户同意方案（方案申报阶段）
 */
export const confirmProposal = async (req: Request, res: Response) => {
  try {
    const { taskId, approved, remark } = req.body;
    const { id: userId } = req.user as any;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'proposal_submission') {
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许确认方案',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';
    console.log('📝 保存操作历史 - 用户信息:', req.user);
    console.log('📝 操作人姓名:', operatorName);

    stageHistory.push({
      stage: 'proposal_submission',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: approved ? '客户同意方案' : '客户拒绝方案',
      comment: remark
    });

    let updateData: any = {
      customerApprovalTime: new Date(),
      customerApprovalComment: remark,
      stageHistory: JSON.stringify(stageHistory)
    };

    // 如果客户同意，推进到下一阶段并更新办理人
    if (approved) {
      updateData.currentStage = 'teacher_confirmation';
      // 构建任务数据对象以计算办理人
      const taskForExecutor = {
        ...task,
        currentStage: 'teacher_confirmation'
      };
      updateData.executorId = getCurrentExecutorId('teacher_confirmation', taskForExecutor);
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: updateData,
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 如果客户同意，发送通知给咨询部人员进行师资确定
    if (approved && task.consultant) {
      await createProjectNotification(
        Number(taskId),
        task.consultant.id,
        '需要确认师资',
        `项目"${task.projectName}"的方案已获得客户同意，请确认授课老师。`,
        'info'
      );
    }

    res.json({
      code: 0,
      message: approved ? '客户同意方案，已推进到师资确定阶段' : '客户拒绝方案',
      data: updatedTask
    });
  } catch (error) {
    console.error('确认方案失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认方案失败',
      data: null
    });
  }
};

/**
 * 确认授课老师（师资确定阶段）
 */
export const confirmTeacher = async (req: Request, res: Response) => {
  try {
    const { taskId, teacherInfo, remark } = req.body;
    const { id: userId } = req.user as any;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'teacher_confirmation') {
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许确认师资',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';
    console.log('📝 保存操作历史 - 用户信息:', req.user);
    console.log('📝 操作人姓名:', operatorName);

    stageHistory.push({
      stage: 'teacher_confirmation',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: '确认授课老师',
      comment: remark,
      teacherInfo
    });

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: {
        currentStage: 'project_approval',
        teacherInfo: JSON.stringify(teacherInfo),
        teacherConfirmTime: new Date(),
        teacherConfirmComment: remark,
        stageHistory: JSON.stringify(stageHistory),
        // 自动更新办理人为市场部经理
        executorId: getCurrentExecutorId('project_approval', task)
      },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 发送通知给市场部经理进行项目审批
    if (task.marketManager) {
      await createProjectNotification(
        Number(taskId),
        task.marketManager.id,
        '需要审批项目',
        `项目"${task.projectName}"的师资已确定，请进行项目审批。`,
        'info'
      );
    }

    res.json({
      code: 0,
      message: '师资确定成功，已推进到项目审批阶段',
      data: updatedTask
    });
  } catch (error) {
    console.error('确认师资失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认师资失败',
      data: null
    });
  }
};

/**
 * 项目审批（项目审批阶段）
 */
export const approveProject = async (req: Request, res: Response) => {
  try {
    const { taskId, approved, comment } = req.body;
    const { id: userId } = req.user as any;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'project_approval') {
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许审批',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';
    console.log('📝 保存操作历史 - 用户信息:', req.user);
    console.log('📝 操作人姓名:', operatorName);

    stageHistory.push({
      stage: 'project_approval',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: approved ? '审批通过' : '审批拒绝',
      comment: comment
    });

    let updateData: any = {
      approvalTime: new Date(),
      approvalComment: comment,
      stageHistory: JSON.stringify(stageHistory)
    };

    // 如果审批通过，推进到下一阶段
    if (approved) {
      updateData.currentStage = 'contract_signing';
      // 自动更新办理人为咨询部人员
      updateData.executorId = getCurrentExecutorId('contract_signing', task);
    } else {
      // 审批拒绝，打回到师资确定阶段
      updateData.currentStage = 'teacher_confirmation';
      updateData.executorId = getCurrentExecutorId('teacher_confirmation', task);

      // 添加打回记录到历史中
      stageHistory.push({
        stage: 'teacher_confirmation',
        timestamp: new Date().toISOString(),
        operator: userId,
        operatorName,
        action: '打回重新确认师资',
        comment: '由于审批拒绝，项目已打回到师资确定阶段，请重新确认师资信息。'
      });

      updateData.stageHistory = JSON.stringify(stageHistory);
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: updateData,
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 如果审批通过，发送通知给咨询部人员进行合同签订
    if (approved && task.consultant) {
      await createProjectNotification(
        Number(taskId),
        task.consultant.id,
        '需要跟进合同签订',
        `项目"${task.projectName}"已通过审批，请跟进客户签订合同。`,
        'info'
      );
    } else if (!approved && task.consultant) {
      // 审批拒绝，发送通知给咨询部人员重新确认师资
      await createProjectNotification(
        Number(taskId),
        task.consultant.id,
        '项目已打回，需要重新确认师资',
        `项目"${task.projectName}"审批被拒绝，已打回到师资确定阶段，请重新确认师资信息。审批意见：${comment || '无'}`,
        'warning'
      );
    }

    res.json({
      code: 0,
      message: approved ? '项目审批通过，已推进到合同签订阶段' : '项目审批被拒绝，已打回到师资确定阶段',
      data: updatedTask
    });
  } catch (error) {
    console.error('项目审批失败:', error);
    res.status(500).json({
      code: 500,
      message: '项目审批失败',
      data: null
    });
  }
};

/**
 * 确认合同签订（签订合同阶段）
 */
export const confirmContract = async (req: Request, res: Response) => {
  try {
    const { taskId, signed, comment } = req.body;
    const { id: userId } = req.user as any;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'contract_signing') {
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许确认合同',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';
    console.log('📝 保存操作历史 - 用户信息:', req.user);
    console.log('📝 操作人姓名:', operatorName);

    stageHistory.push({
      stage: 'contract_signing',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: signed ? '客户已签合同' : '客户未签合同',
      comment: comment
    });

    let updateData: any = {
      contractSignTime: new Date(),
      contractSignComment: comment,
      stageHistory: JSON.stringify(stageHistory)
    };

    // 如果合同已签，推进到下一阶段
    if (signed) {
      updateData.currentStage = 'project_execution';
      // 自动更新办理人为咨询部人员（继续由咨询部跟进项目执行）
      updateData.executorId = getCurrentExecutorId('project_execution', task);
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: updateData,
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 如果合同已签，发送通知给咨询部人员跟进项目执行
    if (signed && task.consultant) {
      await createProjectNotification(
        Number(taskId),
        task.consultant.id,
        '项目开始执行',
        `项目"${task.projectName}"的合同已签订，请开始跟进项目执行。`,
        'info'
      );
    }

    res.json({
      code: 0,
      message: signed ? '合同签订确认成功，已推进到项目执行阶段' : '合同未签订',
      data: updatedTask
    });
  } catch (error) {
    console.error('确认合同失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认合同失败',
      data: null
    });
  }
};

/**
 * 确认项目完成（项目进行阶段）
 */
export const confirmProjectCompletion = async (req: Request, res: Response) => {
  try {
    const { taskId, completed, comment } = req.body;
    const { id: userId } = req.user as any;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'project_execution') {
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许确认项目完成',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';
    console.log('📝 保存操作历史 - 用户信息:', req.user);
    console.log('📝 操作人姓名:', operatorName);

    stageHistory.push({
      stage: 'project_execution',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: completed ? '项目已完成' : '项目进行中',
      comment: comment
    });

    let updateData: any = {
      projectCompletionTime: new Date(),
      projectCompletionComment: comment,
      stageHistory: JSON.stringify(stageHistory)
    };

    // 如果项目已完成，推进到下一阶段
    if (completed) {
      updateData.currentStage = 'project_settlement';
      // 自动更新办理人为负责人（由负责人进行结算）
      updateData.executorId = getCurrentExecutorId('project_settlement', task);
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: updateData,
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 如果项目已完成，发送通知给负责人进行结算
    if (completed && task.responsiblePerson) {
      await createProjectNotification(
        Number(taskId),
        task.responsiblePerson.id,
        '项目需要结算',
        `项目"${task.projectName}"已完成，请跟进客户付款。`,
        'info'
      );
    }

    res.json({
      code: 0,
      message: completed ? '项目完成确认成功，已推进到项目结算阶段' : '项目继续进行中',
      data: updatedTask
    });
  } catch (error) {
    console.error('确认项目完成失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认项目完成失败',
      data: null
    });
  }
};

/**
 * 确认收款（项目结算阶段）
 */
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { taskId, received, amount, remark } = req.body;
    const { id: userId } = req.user as any;

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    if (task.currentStage !== 'project_settlement') {
      return res.status(400).json({
        code: 400,
        message: '当前阶段不允许确认收款',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';
    console.log('📝 保存操作历史 - 用户信息:', req.user);
    console.log('📝 操作人姓名:', operatorName);

    stageHistory.push({
      stage: 'project_settlement',
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: received ? '已收到客户款项' : '未收到客户款项',
      comment: remark,
      amount
    });

    let updateData: any = {
      paymentTime: new Date(),
      paymentComment: remark,
      paymentAmount: amount,
      stageHistory: JSON.stringify(stageHistory)
    };

    // 如果已收款，项目完成，准备归档
    if (received) {
      updateData.isCompleted = true;
      updateData.completionTime = new Date();
      updateData.isArchived = true;
      updateData.archiveTime = new Date();
      updateData.currentStage = 'completed'; // 设置为完成状态
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: updateData,
      include: {
        responsiblePerson: { select: { id: true, userName: true, nickName: true } },
        executor: { select: { id: true, userName: true, nickName: true } },
        consultant: { select: { id: true, userName: true, nickName: true } },
        marketManager: { select: { id: true, userName: true, nickName: true } }
      }
    });

    // 如果收款完成，发送通知给所有相关人员项目已结束
    if (received) {
      const notificationTargets = [
        task.responsiblePerson,
        task.consultant,
        task.marketManager,
        task.executor
      ].filter(person => person && person.id !== userId); // 过滤掉空值和当前操作人

      // 去重处理，避免同一人收到多条通知
      const uniqueTargets = notificationTargets.filter((person, index, arr) =>
        person && arr.findIndex(p => p && p.id === person.id) === index
      );

      for (const person of uniqueTargets) {
        if (person) {
          await createProjectNotification(
            Number(taskId),
            person.id,
            '项目已完成并归档',
            `项目"${task.projectName}"的款项已收到，项目正式完成并已归档到历史项目中。感谢您的参与！`,
            'success'
          );
        }
      }

      // 记录项目完成的操作日志
      await prisma.operationLog.create({
        data: {
          userId: userId,
          userName: operatorName,
          operation: `项目完成归档: ${task.projectName}`,
          method: 'POST',
          params: { taskId, amount, remark },
          result: { success: true, archivedAt: new Date() },
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          executionTime: 0,
          status: 200
        }
      });

      console.log(`✅ 项目 "${task.projectName}" 已完成并归档`);
    }

    res.json({
      code: 0,
      message: received ? '收款确认成功，项目已完成并归档' : '尚未收到客户款项',
      data: updatedTask
    });
  } catch (error) {
    console.error('确认收款失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认收款失败',
      data: null
    });
  }
};

/**
 * 获取项目统计信息
 */
export const getProjectStatistics = async (req: Request, res: Response) => {
  try {
    const stats = await Promise.all([
      // 各阶段项目数量统计
      prisma.task.groupBy({
        by: ['currentStage'],
        where: { isArchived: false },
        _count: { currentStage: true }
      }),
      // 优先级统计
      prisma.task.groupBy({
        by: ['priority'],
        where: { isArchived: false },
        _count: { priority: true }
      }),
      // 总体统计
      prisma.task.aggregate({
        where: { isArchived: false },
        _count: { id: true }
      }),
      // 已完成项目数
      prisma.task.count({
        where: { isCompleted: true, isArchived: false }
      }),
      // 历史项目数
      prisma.task.count({
        where: { isArchived: true }
      })
    ]);

    const [stageStats, priorityStats, totalStats, completedCount, archivedCount] = stats;

    // 转换数据格式
    const stageData: Record<string, number> = {};
    stageStats.forEach(stat => {
      stageData[stat.currentStage] = stat._count.currentStage;
    });

    const priorityData: Record<string, number> = {};
    priorityStats.forEach(stat => {
      priorityData[`priority_${stat.priority}`] = stat._count.priority;
    });

    res.json({
      code: 0,
      message: '获取统计信息成功',
      data: {
        total: totalStats._count.id,
        completed: completedCount,
        archived: archivedCount,
        stages: stageData,
        priorities: priorityData
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取统计信息失败',
      data: null
    });
  }
};
