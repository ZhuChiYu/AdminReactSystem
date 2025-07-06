import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const prismaClient = new PrismaClient();

// 项目阶段枚举
enum ProjectStage {
  CUSTOMER_INQUIRY = 'customer_inquiry',
  PROPOSAL_SUBMISSION = 'proposal_submission',
  TEACHER_CONFIRMATION = 'teacher_confirmation',
  PROJECT_APPROVAL = 'project_approval',
  CONTRACT_SIGNING = 'contract_signing',
  PROJECT_EXECUTION = 'project_execution',
  PROJECT_SETTLEMENT = 'project_settlement'
}

// 阶段流程定义
const STAGE_FLOW = {
  [ProjectStage.CUSTOMER_INQUIRY]: ProjectStage.PROPOSAL_SUBMISSION,
  [ProjectStage.PROPOSAL_SUBMISSION]: ProjectStage.TEACHER_CONFIRMATION,
  [ProjectStage.TEACHER_CONFIRMATION]: ProjectStage.PROJECT_APPROVAL,
  [ProjectStage.PROJECT_APPROVAL]: ProjectStage.CONTRACT_SIGNING,
  [ProjectStage.CONTRACT_SIGNING]: ProjectStage.PROJECT_EXECUTION,
  [ProjectStage.PROJECT_EXECUTION]: ProjectStage.PROJECT_SETTLEMENT,
  [ProjectStage.PROJECT_SETTLEMENT]: null // 最后阶段
};

/**
 * 根据阶段获取当前办理人ID
 */
const getCurrentExecutorId = (stage: string, task: any): number | null => {
  switch (stage) {
    case ProjectStage.CUSTOMER_INQUIRY:
    case ProjectStage.PROJECT_SETTLEMENT:
      return task.responsiblePersonId;
    case ProjectStage.PROPOSAL_SUBMISSION:
    case ProjectStage.TEACHER_CONFIRMATION:
    case ProjectStage.CONTRACT_SIGNING:
    case ProjectStage.PROJECT_EXECUTION:
      return task.consultantId;
    case ProjectStage.PROJECT_APPROVAL:
      return task.marketManagerId;
    default:
      return null;
  }
};

/**
 * 获取项目事项列表
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const {
      current = 1,
      size = 10,
      keyword = '',
      currentStage,
      priority,
      responsiblePersonId,
      isArchived = 'false'
    } = req.query;

    const skip = (Number(current) - 1) * Number(size);

    // 构建查询条件
    const where: any = {
      isArchived: String(isArchived) === 'true'
    };

    if (keyword) {
      where.OR = [
        { projectName: { contains: String(keyword), mode: 'insensitive' } },
        { projectType: { contains: String(keyword), mode: 'insensitive' } },
        { remark: { contains: String(keyword), mode: 'insensitive' } }
      ];
    }

    if (currentStage) {
      where.currentStage = String(currentStage);
    }

    if (priority) {
      where.priority = Number(priority);
    }

    if (responsiblePersonId) {
      where.responsiblePersonId = Number(responsiblePersonId);
    }

    // 查询数据
    const [tasks, total] = await Promise.all([
      prismaClient.task.findMany({
        where,
        skip,
        take: Number(size),
        include: {
          responsiblePerson: {
            select: { id: true, userName: true, nickName: true }
          },
          executor: {
            select: { id: true, userName: true, nickName: true }
          },
          consultant: {
            select: { id: true, userName: true, nickName: true }
          },
          marketManager: {
            select: { id: true, userName: true, nickName: true }
          }
        },
        orderBy: { createTime: 'desc' }
      }),
      prismaClient.task.count({ where })
    ]);

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        records: tasks,
        total,
        current: Number(current),
        size: Number(size),
        pages: Math.ceil(total / Number(size))
      }
    });
  } catch (error) {
    console.error('获取项目事项列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取项目事项列表失败',
      data: null
    });
  }
};

/**
 * 获取项目事项详情
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prismaClient.task.findUnique({
      where: { id: Number(id) },
      include: {
        responsiblePerson: {
          select: { id: true, userName: true, nickName: true }
        },
        executor: {
          select: { id: true, userName: true, nickName: true }
        },
        consultant: {
          select: { id: true, userName: true, nickName: true }
        },
        marketManager: {
          select: { id: true, userName: true, nickName: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    res.json({
      code: 0,
      message: '获取成功',
      data: task
    });
  } catch (error) {
    console.error('获取项目事项详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取项目事项详情失败',
      data: null
    });
  }
};

/**
 * 创建项目事项
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: errors.array()
      });
    }

    const {
      projectType,
      projectName,
      responsiblePersonId,
      consultantId,
      marketManagerId,
      priority = 2,
      startTime,
      endTime,
      remark
    } = req.body;

    const { id: userId } = req.user as any;

    // 获取操作人姓名 - 优先使用nickName，其次userName
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';

    console.log('📝 保存创建项目操作历史 - 用户信息:', {
      user: req.user,
      operatorName,
      userId
    });

    // 构建任务数据对象
    const taskData: any = {
      projectType,
      projectName,
      currentStage: ProjectStage.CUSTOMER_INQUIRY,
      responsiblePersonId: Number(responsiblePersonId),
      consultantId: consultantId ? Number(consultantId) : null,
      marketManagerId: marketManagerId ? Number(marketManagerId) : null,
      priority: Number(priority),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      remark: remark || null,
      createTime: new Date(),
      updateTime: new Date(),
      isArchived: false,
      isCompleted: false,
      stageHistory: JSON.stringify([{
        stage: ProjectStage.CUSTOMER_INQUIRY,
        timestamp: new Date().toISOString(),
        operator: userId,
        operatorName,
        action: '创建项目',
        comment: remark || null
      }])
    };

    // 根据当前阶段自动设置办理人
    taskData.executorId = getCurrentExecutorId(ProjectStage.CUSTOMER_INQUIRY, taskData);

    // 创建项目事项
    const task = await prismaClient.task.create({
      data: taskData,
      include: {
        responsiblePerson: {
          select: { id: true, userName: true, nickName: true }
        },
        executor: {
          select: { id: true, userName: true, nickName: true }
        },
        consultant: {
          select: { id: true, userName: true, nickName: true }
        },
        marketManager: {
          select: { id: true, userName: true, nickName: true }
        }
      }
    });

    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: task
    });
  } catch (error) {
    console.error('创建项目事项失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建项目事项失败',
      data: null
    });
  }
};

/**
 * 更新项目事项
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      projectType,
      projectName,
      responsiblePersonId,
      executorId,
      consultantId,
      marketManagerId,
      priority,
      startTime,
      endTime,
      remark
    } = req.body;

    // 检查项目事项是否存在
    const existingTask = await prismaClient.task.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTask) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    const task = await prismaClient.task.update({
      where: { id: Number(id) },
      data: {
        projectType,
        projectName,
        responsiblePersonId: responsiblePersonId ? Number(responsiblePersonId) : undefined,
        executorId: executorId ? Number(executorId) : null,
        consultantId: consultantId ? Number(consultantId) : null,
        marketManagerId: marketManagerId ? Number(marketManagerId) : null,
        priority: priority ? Number(priority) : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        remark
      },
      include: {
        responsiblePerson: {
          select: { id: true, userName: true, nickName: true }
        },
        executor: {
          select: { id: true, userName: true, nickName: true }
        },
        consultant: {
          select: { id: true, userName: true, nickName: true }
        },
        marketManager: {
          select: { id: true, userName: true, nickName: true }
        }
      }
    });

    res.json({
      code: 0,
      message: '更新成功',
      data: task
    });
  } catch (error) {
    console.error('更新项目事项失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新项目事项失败',
      data: null
    });
  }
};

/**
 * 删除项目事项
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 检查项目事项是否存在
    const existingTask = await prismaClient.task.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTask) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    await prismaClient.task.delete({
      where: { id: Number(id) }
    });

    res.json({
      code: 0,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除项目事项失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除项目事项失败',
      data: null
    });
  }
};

/**
 * 推进项目到下一阶段
 */
export const advanceStage = async (req: Request, res: Response) => {
  try {
    const { taskId, remark } = req.body;
    const { id: userId } = req.user as any;

    const task = await prismaClient.task.findUnique({
      where: { id: Number(taskId) }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    const nextStage = STAGE_FLOW[task.currentStage as ProjectStage];

    if (!nextStage) {
      return res.status(400).json({
        code: 400,
        message: '当前阶段已是最后阶段',
        data: null
      });
    }

    // 更新阶段历史
    const stageHistory = task.stageHistory ? JSON.parse(task.stageHistory as string) : [];

    // 获取操作人姓名 - 优先使用nickName，其次userName
    const operatorName = req.user?.nickName || req.user?.userName || '未知用户';

    console.log('📝 保存操作历史 - 用户信息:', {
      user: req.user,
      operatorName,
      userId
    });

    stageHistory.push({
      stage: nextStage,
      timestamp: new Date().toISOString(),
      operator: userId,
      operatorName,
      action: '推进阶段',
      comment: remark
    });

    const updatedTask = await prismaClient.task.update({
      where: { id: Number(taskId) },
      data: {
        currentStage: nextStage,
        stageHistory: JSON.stringify(stageHistory)
      },
      include: {
        responsiblePerson: {
          select: { id: true, userName: true, nickName: true }
        },
        executor: {
          select: { id: true, userName: true, nickName: true }
        },
        consultant: {
          select: { id: true, userName: true, nickName: true }
        },
        marketManager: {
          select: { id: true, userName: true, nickName: true }
        }
      }
    });

    res.json({
      code: 0,
      message: '推进成功',
      data: updatedTask
    });
  } catch (error) {
    console.error('推进项目阶段失败:', error);
    res.status(500).json({
      code: 500,
      message: '推进项目阶段失败',
      data: null
    });
  }
};

/**
 * 归档项目到历史
 */
export const archiveTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prismaClient.task.findUnique({
      where: { id: Number(id) }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目事项不存在',
        data: null
      });
    }

    const updatedTask = await prismaClient.task.update({
      where: { id: Number(id) },
      data: {
        isArchived: true,
        archiveTime: new Date()
      },
      include: {
        responsiblePerson: {
          select: { id: true, userName: true, nickName: true }
        },
        executor: {
          select: { id: true, userName: true, nickName: true }
        },
        consultant: {
          select: { id: true, userName: true, nickName: true }
        },
        marketManager: {
          select: { id: true, userName: true, nickName: true }
        }
      }
    });

    res.json({
      code: 0,
      message: '归档成功',
      data: updatedTask
    });
  } catch (error) {
    console.error('归档项目失败:', error);
    res.status(500).json({
      code: 500,
      message: '归档项目失败',
      data: null
    });
  }
};

/**
 * 获取我的项目事项
 */
export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const { id: userId, roles } = req.user as any; // 从JWT中获取用户ID和角色
    const {
      current = 1,
      size = 10,
      currentStage,
      keyword = '',
      priority,
      responsiblePersonId
    } = req.query;

    const skip = (Number(current) - 1) * Number(size);

    // 检查是否是超级管理员
    const isSuperAdmin = roles.includes('super_admin');

    const where: any = {
      isArchived: false
    };

    // 超级管理员可以看到所有项目事项，普通用户只能看到相关的项目事项
    if (!isSuperAdmin) {
      where.OR = [
        { responsiblePersonId: userId },
        { executorId: userId },
        { consultantId: userId },
        { marketManagerId: userId }
      ];
    }

    // 添加搜索条件
    if (keyword) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { projectName: { contains: String(keyword), mode: 'insensitive' } },
            { projectType: { contains: String(keyword), mode: 'insensitive' } },
            { remark: { contains: String(keyword), mode: 'insensitive' } }
          ]
        }
      ];
    }

    if (currentStage) {
      where.currentStage = String(currentStage);
    }

    if (priority) {
      where.priority = Number(priority);
    }

    if (responsiblePersonId) {
      where.responsiblePersonId = Number(responsiblePersonId);
    }

    const [tasks, total] = await Promise.all([
      prismaClient.task.findMany({
        where,
        skip,
        take: Number(size),
        include: {
          responsiblePerson: {
            select: { id: true, userName: true, nickName: true }
          },
          executor: {
            select: { id: true, userName: true, nickName: true }
          },
          consultant: {
            select: { id: true, userName: true, nickName: true }
          },
          marketManager: {
            select: { id: true, userName: true, nickName: true }
          }
        },
        orderBy: { createTime: 'desc' }
      }),
      prismaClient.task.count({ where })
    ]);

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        records: tasks,
        total,
        current: Number(current),
        size: Number(size),
        pages: Math.ceil(total / Number(size))
      }
    });
  } catch (error) {
    console.error('获取我的项目事项失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取我的项目事项失败',
      data: null
    });
  }
};

/**
 * 获取历史项目列表（已完成和归档的项目）
 * 权限控制：只能显示与当前用户相关的项目
 * - 项目负责人
 * - 咨询部人员
 * - 市场部经理
 */
export const getArchivedTasks = async (req: Request, res: Response) => {
  try {
    const {
      current = 1,
      size = 10,
      keyword = '',
      projectType,
      priority,
      responsiblePersonId,
      completionTimeStart,
      completionTimeEnd
    } = req.query;

    const currentUserId = (req as any).user?.id;
    const skip = (Number(current) - 1) * Number(size);

    // 检查当前用户是否是超级管理员
    const currentUser = await prismaClient.user.findUnique({
      where: { id: currentUserId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const isSuperAdmin = currentUser?.userRoles.some(ur => ur.role.roleCode === 'super_admin');

    // 构建查询条件 - 只查询已完成且已归档的项目
    const where: any = {
      isCompleted: true,
      isArchived: true
    };

    // 处理关键词搜索和权限控制
    if (keyword) {
      const keywordConditions = [
        { projectName: { contains: String(keyword), mode: 'insensitive' } },
        { projectType: { contains: String(keyword), mode: 'insensitive' } },
        { remark: { contains: String(keyword), mode: 'insensitive' } }
      ];

      if (!isSuperAdmin) {
        // 普通用户：需要同时满足权限控制和关键词搜索
        where.AND = [
          {
            OR: [
              { responsiblePersonId: currentUserId }, // 项目负责人
              { consultantId: currentUserId },        // 咨询部人员
              { marketManagerId: currentUserId }      // 市场部经理
            ]
          },
          {
            OR: keywordConditions
          }
        ];
      } else {
        // 超级管理员：只需要关键词搜索
        where.OR = keywordConditions;
      }
    } else if (!isSuperAdmin) {
      // 没有关键词但不是超级管理员：只应用权限控制
      where.OR = [
        { responsiblePersonId: currentUserId }, // 项目负责人
        { consultantId: currentUserId },        // 咨询部人员
        { marketManagerId: currentUserId }      // 市场部经理
      ];
    }

    if (projectType) {
      where.projectType = String(projectType);
    }

    if (priority) {
      where.priority = Number(priority);
    }

    if (responsiblePersonId) {
      where.responsiblePersonId = Number(responsiblePersonId);
    }

    // 完成时间范围查询
    if (completionTimeStart || completionTimeEnd) {
      where.completionTime = {};
      if (completionTimeStart) {
        where.completionTime.gte = new Date(String(completionTimeStart));
      }
      if (completionTimeEnd) {
        where.completionTime.lte = new Date(String(completionTimeEnd));
      }
    }

    // 查询数据
    const [tasks, total] = await Promise.all([
      prismaClient.task.findMany({
        where,
        skip,
        take: Number(size),
        include: {
          responsiblePerson: {
            select: { id: true, userName: true, nickName: true }
          },
          executor: {
            select: { id: true, userName: true, nickName: true }
          },
          consultant: {
            select: { id: true, userName: true, nickName: true }
          },
          marketManager: {
            select: { id: true, userName: true, nickName: true }
          }
        },
        orderBy: { completionTime: 'desc' } // 按完成时间倒序
      }),
      prismaClient.task.count({ where })
    ]);

    res.json({
      code: 0,
      message: '获取历史项目成功',
      data: {
        records: tasks,
        total,
        current: Number(current),
        size: Number(size),
        pages: Math.ceil(total / Number(size))
      }
    });
  } catch (error) {
    console.error('获取历史项目失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取历史项目失败',
      data: null
    });
  }
};

/**
 * 获取项目统计信息（包括历史项目统计）
 */
export const getProjectStatistics = async (req: Request, res: Response) => {
  try {
    // 统计各种状态的项目数量
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      thisMonthCompleted,
      thisYearCompleted
    ] = await Promise.all([
      // 总项目数（包括已归档）
      prismaClient.task.count(),
      // 进行中的项目（未完成且未归档）
      prismaClient.task.count({
        where: {
          isCompleted: false,
          isArchived: false
        }
      }),
      // 已完成的项目
      prismaClient.task.count({
        where: {
          isCompleted: true
        }
      }),
      // 本月完成的项目
      prismaClient.task.count({
        where: {
          isCompleted: true,
          completionTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        }
      }),
      // 今年完成的项目
      prismaClient.task.count({
        where: {
          isCompleted: true,
          completionTime: {
            gte: new Date(new Date().getFullYear(), 0, 1),
            lt: new Date(new Date().getFullYear() + 1, 0, 1)
          }
        }
      })
    ]);

    // 按项目类型统计
    const projectTypeStats = await prismaClient.task.groupBy({
      by: ['projectType'],
      _count: {
        id: true
      },
      where: {
        isCompleted: true
      }
    });

    // 按月统计完成项目数量（近12个月）
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const count = await prismaClient.task.count({
        where: {
          isCompleted: true,
          completionTime: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      });

      monthlyStats.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        completed: count
      });
    }

    res.json({
      code: 0,
      message: '获取项目统计成功',
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          thisMonthCompleted,
          thisYearCompleted,
          completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
        },
        projectTypeStats: projectTypeStats.map(stat => ({
          type: stat.projectType,
          count: stat._count.id
        })),
        monthlyStats
      }
    });
  } catch (error) {
    console.error('获取项目统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取项目统计失败',
      data: null
    });
  }
};

class TaskController {
  /**
   * 获取用户任务统计和目标（重写版本）
   * 支持周/月统计和对应的目标
   */
  async getUserTaskStats(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      const { year, month, week, period = 'month' } = req.query;

      if (!currentUserId) {
        return res.status(401).json(createErrorResponse(401, '用户未登录', null, req.path));
      }

      console.log('👤 当前用户ID:', currentUserId);

      // 解析时间参数
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      let startDate: Date, endDate: Date;
      let targetMonth: number | null = null;
      let targetWeek: number | null = null;

      if (period === 'week') {
        // 周统计
        const weekNumber = week ? parseInt(week as string) : this.getCurrentWeekNumber();
        targetWeek = weekNumber;

        const { start, end } = this.getWeekDateRange(targetYear, weekNumber);
        startDate = start;
        endDate = end;
      } else {
        // 月统计
        const monthNumber = month ? parseInt(month as string) : new Date().getMonth() + 1;
        targetMonth = monthNumber;

        startDate = new Date(targetYear, monthNumber - 1, 1);
        endDate = new Date(targetYear, monthNumber, 0, 23, 59, 59, 999);
      }

      // 获取用户的任务目标
      let targetWhereCondition: any = {
        employeeId: currentUserId,
        targetYear,
        targetType: period as string,
        status: 1
      };

      if (period === 'month') {
        targetWhereCondition.targetMonth = targetMonth;
      } else {
        targetWhereCondition.targetWeek = targetWeek;
      }

      console.log('🔍 查询条件:', targetWhereCondition);

      const employeeTarget = await prisma.employeeTarget.findFirst({
        where: targetWhereCondition
      });

      console.log('📋 查询结果:', employeeTarget);

      // 获取项目任务完成情况
      const projectTaskCount = await this.getTaskCount(currentUserId, '', startDate, endDate);

      // 获取客户任务完成情况（基于客户状态变更）
      const customerTaskStats = await this.getCustomerTaskStats(currentUserId, startDate, endDate);

      // 构建返回数据
      const result = {
        period: {
          type: period,
          year: targetYear,
          month: targetMonth,
          week: targetWeek,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        targets: {
          consultTarget: employeeTarget?.consultTarget || 0,
          followUpTarget: employeeTarget?.followUpTarget || 0,
          developTarget: employeeTarget?.developTarget || 0,
          registerTarget: employeeTarget?.registerTarget || 0
        },
        completions: {
          consultCount: customerTaskStats.consultCount,
          followUpCount: customerTaskStats.followUpCount,
          developCount: customerTaskStats.developCount,
          registerCount: customerTaskStats.registerCount
        },
        progress: {
          consultProgress: employeeTarget?.consultTarget ?
            Math.round((customerTaskStats.consultCount / employeeTarget.consultTarget) * 100) : 0,
          followUpProgress: employeeTarget?.followUpTarget ?
            Math.round((customerTaskStats.followUpCount / employeeTarget.followUpTarget) * 100) : 0,
          developProgress: employeeTarget?.developTarget ?
            Math.round((customerTaskStats.developCount / employeeTarget.developTarget) * 100) : 0,
          registerProgress: employeeTarget?.registerTarget ?
            Math.round((customerTaskStats.registerCount / employeeTarget.registerTarget) * 100) : 0
        }
      };

      res.json(createSuccessResponse(result, '获取任务统计成功', req.path));
    } catch (error) {
      logger.error('获取任务统计失败:', error);
      res.status(500).json(createErrorResponse(500, '获取任务统计失败', null, req.path));
    }
  }

  /**
   * 获取管理员的下属员工任务统计（重写版本，支持周/月统计）
   */
  async getTeamTaskStats(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user;
      const { year, month, week, period = 'month', current = 1, size = 10, keyword = '' } = req.query;

      if (!currentUser) {
        return res.status(401).json(createErrorResponse(401, '用户未登录', null, req.path));
      }

      // 解析时间参数
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      let startDate: Date, endDate: Date;
      let targetMonth: number | null = null;
      let targetWeek: number | null = null;

      if (period === 'week') {
        // 周统计
        const weekNumber = week ? parseInt(week as string) : this.getCurrentWeekNumber();
        targetWeek = weekNumber;

        const { start, end } = this.getWeekDateRange(targetYear, weekNumber);
        startDate = start;
        endDate = end;
      } else {
        // 月统计
        const monthNumber = month ? parseInt(month as string) : new Date().getMonth() + 1;
        targetMonth = monthNumber;

        startDate = new Date(targetYear, monthNumber - 1, 1);
        endDate = new Date(targetYear, monthNumber, 0, 23, 59, 59, 999);
      }

      // 解析分页参数
      const page = parseInt(current as string);
      const pageSize = parseInt(size as string);
      const searchKeyword = keyword as string;

      let managedEmployees: any[] = [];

      // 构建搜索条件
      const searchCondition = searchKeyword ? {
        OR: [
          { nickName: { contains: searchKeyword, mode: 'insensitive' as const } },
          { userName: { contains: searchKeyword, mode: 'insensitive' as const } }
        ]
      } : {};

      // 根据用户角色获取管理的员工
      if (currentUser.roles?.includes('super_admin')) {
        // 超级管理员：获取所有员工总数
        const totalCount = await prisma.user.count({
          where: {
            status: 1,
            userRoles: {
              some: {
                role: {
                  roleCode: {
                    in: ['admin', 'consultant', 'hr_specialist', 'hr_bp', 'sales_manager', 'marketing_manager']
                  }
                }
              }
            },
            ...searchCondition
          }
        });

        // 获取分页数据
        managedEmployees = await prisma.user.findMany({
          where: {
            status: 1,
            userRoles: {
              some: {
                role: {
                  roleCode: {
                    in: ['admin', 'consultant', 'hr_specialist', 'hr_bp', 'sales_manager', 'marketing_manager']
                  }
                }
              }
            },
            ...searchCondition
          },
          select: {
            id: true,
            nickName: true,
            userName: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    roleCode: true,
                    roleName: true
                  }
                }
              }
            }
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { nickName: 'asc' }
        });

        // 保存总数用于分页计算
        (managedEmployees as any).totalCount = totalCount;
      } else if (currentUser.roles?.includes('admin')) {
        // 管理员：先获取所有管理关系
        const allManagedRelations = await prisma.employeeManagerRelation.findMany({
          where: { managerId: currentUser.id },
          include: {
            employee: {
              select: {
                id: true,
                nickName: true,
                userName: true,
                userRoles: {
                  select: {
                    role: {
                      select: {
                        roleCode: true,
                        roleName: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        let allManagedEmployees = allManagedRelations.map(rel => rel.employee);

        // 应用搜索过滤
        if (searchKeyword) {
          allManagedEmployees = allManagedEmployees.filter(emp =>
            emp.nickName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            emp.userName.toLowerCase().includes(searchKeyword.toLowerCase())
          );
        }

        // 计算分页
        const totalCount = allManagedEmployees.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        managedEmployees = allManagedEmployees
          .sort((a, b) => a.nickName.localeCompare(b.nickName))
          .slice(startIndex, endIndex);

        // 保存总数用于分页计算
        (managedEmployees as any).totalCount = totalCount;
      } else {
        return res.status(403).json(createErrorResponse(403, '权限不足', null, req.path));
      }

      // 获取每个员工的任务统计
      const teamStats = await Promise.all(
        managedEmployees.map(async (employee) => {
          // 获取员工的任务目标
          let targetWhereCondition: any = {
            employeeId: employee.id,
            targetYear,
            targetType: period as string,
            status: 1
          };

          if (period === 'month') {
            targetWhereCondition.targetMonth = targetMonth;
          } else {
            targetWhereCondition.targetWeek = targetWeek;
          }

          const employeeTarget = await prisma.employeeTarget.findFirst({
            where: targetWhereCondition
          });

          // 获取员工的客户任务完成情况（基于客户状态变更）
          const customerTaskStats = await this.getCustomerTaskStats(employee.id, startDate, endDate);

          return {
            employee: {
              id: employee.id,
              nickName: employee.nickName,
              userName: employee.userName,
              roleName: employee.userRoles?.[0]?.role?.roleName || '未知角色'
            },
            period: {
              type: period,
              year: targetYear,
              month: targetMonth,
              week: targetWeek,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            },
            targets: {
              consultTarget: employeeTarget?.consultTarget || 0,
              followUpTarget: employeeTarget?.followUpTarget || 0,
              developTarget: employeeTarget?.developTarget || 0,
              registerTarget: employeeTarget?.registerTarget || 0
            },
            completions: {
              consultCount: customerTaskStats.consultCount,
              followUpCount: customerTaskStats.followUpCount,
              developCount: customerTaskStats.developCount,
              registerCount: customerTaskStats.registerCount
            },
            progress: {
              consultProgress: employeeTarget?.consultTarget ?
                Math.round((customerTaskStats.consultCount / employeeTarget.consultTarget) * 100) : 0,
              followUpProgress: employeeTarget?.followUpTarget ?
                Math.round((customerTaskStats.followUpCount / employeeTarget.followUpTarget) * 100) : 0,
              developProgress: employeeTarget?.developTarget ?
                Math.round((customerTaskStats.developCount / employeeTarget.developTarget) * 100) : 0,
              registerProgress: employeeTarget?.registerTarget ?
                Math.round((customerTaskStats.registerCount / employeeTarget.registerTarget) * 100) : 0
            }
          };
        })
      );

      // 获取总数
      const totalCount = (managedEmployees as any).totalCount || managedEmployees.length;
      const pages = Math.ceil(totalCount / pageSize);

      res.json(createSuccessResponse({
        teamStats,
        period: {
          type: period,
          year: targetYear,
          month: targetMonth,
          week: targetWeek,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        pagination: {
          current: page,
          size: pageSize,
          total: totalCount,
          pages: pages
        },
        managedCount: managedEmployees.length
      }, '获取团队任务统计成功', req.path));

    } catch (error) {
      logger.error('获取团队任务统计失败:', error);
      res.status(500).json(createErrorResponse(500, '获取团队任务统计失败', null, req.path));
    }
  }

  /**
   * 获取基于客户状态的任务统计（重写版本）
   * 统计逻辑：基于客户跟进记录的修改时间，而不是创建时间
   */
  private async getCustomerTaskStats(userId: number, startDate: Date, endDate: Date) {
    try {
      // 方案1：基于客户表的updatedAt字段（客户信息更新时间）
      const customerUpdates = await prisma.customer.findMany({
        where: {
          assignedToId: userId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          followStatus: true,
          updatedAt: true
        }
      });

      // 方案2：基于跟进记录表的创建时间（更准确的跟进活动时间）
      const followRecords = await prisma.followRecord.findMany({
        where: {
          customer: {
            assignedToId: userId
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          customer: {
            select: {
              followStatus: true
            }
          }
        }
      });

      // 合并两种统计方式，优先使用跟进记录，补充客户更新
      const allActivities = new Map<string, string>();

      // 添加跟进记录活动
      followRecords.forEach(record => {
        const key = `${record.customerId}-${record.createdAt.toISOString()}`;
        allActivities.set(key, record.customer.followStatus);
      });

      // 添加客户更新活动（如果没有对应的跟进记录）
      customerUpdates.forEach(customer => {
        const key = `${customer.followStatus}-${customer.updatedAt.toISOString()}`;
        if (!allActivities.has(key)) {
          allActivities.set(key, customer.followStatus);
        }
      });

      // 根据状态统计任务完成情况
      const statusCounts = {
        consultCount: 0,
        followUpCount: 0,
        developCount: 0,
        registerCount: 0
      };

      Array.from(allActivities.values()).forEach(status => {
        switch (status) {
          case 'consult':
          case 'wechat_added':
            statusCounts.consultCount++;
            break;
          case 'effective_visit':
          case 'not_arrived':
          case 'rejected':
          case 'vip':
            statusCounts.followUpCount++;
            break;
          case 'new_develop':
          case 'early_25':
            statusCounts.developCount++;
            break;
          case 'registered':
          case 'arrived':
            statusCounts.registerCount++;
            break;
        }
      });

      return statusCounts;
    } catch (error) {
      logger.error('获取客户任务统计失败:', error);
      return {
        consultCount: 0,
        followUpCount: 0,
        developCount: 0,
        registerCount: 0
      };
    }
  }

  /**
   * 获取指定类型任务的完成数量
   */
  private async getTaskCount(userId: number, taskType: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      // 根据实际的数据库表结构查询任务数量
      // 这里需要根据实际的任务表结构进行调整
      const count = await prisma.task.count({
        where: {
          OR: [
            { responsiblePersonId: userId },
            { executorId: userId }
          ],
          projectType: taskType, // 假设 projectType 存储任务类型
          isCompleted: true,
          completionTime: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      return count;
    } catch (error) {
      logger.error(`获取${taskType}数量失败:`, error);
      return 0;
    }
  }

  /**
   * 获取当前周数（ISO周数）
   */
  private getCurrentWeekNumber(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  /**
   * 获取指定年份和周数的日期范围
   */
  private getWeekDateRange(year: number, weekNumber: number): { start: Date; end: Date } {
    // 获取该年第一天
    const firstDayOfYear = new Date(year, 0, 1);

    // 计算第一周的开始日期（周一）
    const firstMonday = new Date(firstDayOfYear);
    const dayOfWeek = firstDayOfYear.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // 如果是周日，加1天；否则加到下周一
    firstMonday.setDate(firstDayOfYear.getDate() + daysToAdd);

    // 计算目标周的开始日期
    const targetWeekStart = new Date(firstMonday);
    targetWeekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

    // 计算目标周的结束日期（周日 23:59:59）
    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
    targetWeekEnd.setHours(23, 59, 59, 999);

    return {
      start: targetWeekStart,
      end: targetWeekEnd
    };
  }
}

export default new TaskController();
