import express from 'express';
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const router = express.Router();

/**
 * 获取用户任务统计和目标（支持周/月统计）
 */
router.get('/user-stats', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;
    const { year, month, week, period = 'month' } = req.query;

    if (!currentUserId) {
      return res.status(401).json(createErrorResponse(401, '用户未登录', null, req.path));
    }

    // 解析时间参数
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    let startDate: Date, endDate: Date;
    let targetMonth: number | null = null;
    let targetWeek: number | null = null;

    if (period === 'week') {
      // 周统计
      const weekNumber = week ? parseInt(week as string) : getCurrentWeekNumber();
      targetWeek = weekNumber;

      const { start, end } = getWeekDateRange(targetYear, weekNumber);
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

    const employeeTarget = await prisma.employeeTarget.findFirst({
      where: targetWhereCondition
    });


    // 获取客户任务完成情况（基于客户状态变更）
    const customerTaskStats = await getCustomerTaskStats(currentUserId, startDate, endDate);

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
    res.status(500).json(createErrorResponse(500, '获取任务统计失败', null, req.path));
  }
});

/**
 * 获取当前周数（ISO周数）
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  return getISOWeekNumber(now);
}

/**
 * 计算 ISO 周数
 */
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const dayDiff = (target.getTime() - jan4.getTime()) / 86400000;
  return Math.ceil(dayDiff / 7) + 1;
}

/**
 * 根据年份和周数获取日期范围（ISO周数）
 */
function getWeekDateRange(year: number, weekNumber: number): { start: Date; end: Date } {
  // 获取该年的1月4日（ISO周数计算的基准日期）
  const jan4 = new Date(year, 0, 4);

  // 计算1月4日所在周的周一
  const jan4WeekStart = new Date(jan4);
  jan4WeekStart.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7);

  // 计算目标周的开始日期（周一）
  const targetWeekStart = new Date(jan4WeekStart);
  targetWeekStart.setDate(jan4WeekStart.getDate() + (weekNumber - 1) * 7);

  // 计算目标周的结束日期（周日 23:59:59）
  const targetWeekEnd = new Date(targetWeekStart);
  targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
  targetWeekEnd.setHours(23, 59, 59, 999);

  return {
    start: targetWeekStart,
    end: targetWeekEnd
  };
}

/**
 * 获取客户任务统计（基于客户跟进记录的修改时间）
 */
async function getCustomerTaskStats(userId: number, startDate: Date, endDate: Date) {
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
          statusCounts.consultCount++;
          break;
        case 'effective_visit':
          statusCounts.followUpCount++;
          break;
        case 'new_develop':
          statusCounts.developCount++;
          break;
        case 'registered':
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
 * 获取指定类型任务的完成数量（已废弃，保留作为备用）
 */
async function getTaskCount(userId: number, taskType: string, startDate: Date, endDate: Date): Promise<number> {
  try {
    // 根据实际的数据库表结构查询任务数量
    const count = await prisma.task.count({
      where: {
        OR: [
          { responsiblePersonId: userId },
          { executorId: userId },
          { consultantId: userId }
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

export default router;
