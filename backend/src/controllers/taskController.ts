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
        operator: responsiblePersonId,
        action: '创建项目'
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
    const { taskId, comment, operatorId } = req.body;

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
    stageHistory.push({
      stage: nextStage,
      timestamp: new Date().toISOString(),
      operator: operatorId,
      action: '推进阶段',
      comment
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
   * 获取用户任务统计和目标
   */
  async getUserTaskStats(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      const { year, month } = req.query;

      if (!currentUserId) {
        return res.status(401).json(createErrorResponse(401, '用户未登录', null, req.path));
      }

      // 解析年月参数
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

      // 获取用户的任务目标
      const employeeTarget = await prisma.employeeTarget.findFirst({
        where: {
          employeeId: currentUserId,
          targetYear,
          targetMonth,
          status: 1
        }
      });

      // 获取用户任务完成情况统计（这里需要根据实际的任务统计逻辑）
      // 假设任务表有 taskType 字段来区分任务类型
      const currentDate = new Date();
      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      // 获取各类型任务的完成数量
      const consultCount = await this.getTaskCount(currentUserId, '咨询任务', startOfMonth, endOfMonth);
      const followUpCount = await this.getTaskCount(currentUserId, '回访任务', startOfMonth, endOfMonth);
      const developCount = await this.getTaskCount(currentUserId, '开发任务', startOfMonth, endOfMonth);
      const registerCount = await this.getTaskCount(currentUserId, '报名任务', startOfMonth, endOfMonth);

      // 构建返回数据
      const result = {
        targets: {
          consultTarget: employeeTarget?.consultTarget || 50,
          followUpTarget: employeeTarget?.followUpTarget || 50,
          developTarget: employeeTarget?.developTarget || 50,
          registerTarget: employeeTarget?.registerTarget || 50
        },
        completions: {
          consultCount,
          followUpCount,
          developCount,
          registerCount
        },
        progress: {
          consultProgress: employeeTarget?.consultTarget ? Math.round((consultCount / employeeTarget.consultTarget) * 100) : 0,
          followUpProgress: employeeTarget?.followUpTarget ? Math.round((followUpCount / employeeTarget.followUpTarget) * 100) : 0,
          developProgress: employeeTarget?.developTarget ? Math.round((developCount / employeeTarget.developTarget) * 100) : 0,
          registerProgress: employeeTarget?.registerTarget ? Math.round((registerCount / employeeTarget.registerTarget) * 100) : 0
        }
      };

      res.json(createSuccessResponse(result, '获取任务统计成功', req.path));
    } catch (error) {
      logger.error('获取任务统计失败:', error);
      res.status(500).json(createErrorResponse(500, '获取任务统计失败', null, req.path));
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
}

export default new TaskController();
