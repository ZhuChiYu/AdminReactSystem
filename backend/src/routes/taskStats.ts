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
  const today = new Date();
  // 获取年初第一天
  const firstDay = new Date(today.getFullYear(), 0, 1);
  // 计算今天是一年中的第几天
  const dayOfYear = Math.floor((today.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  // 计算周数
  return Math.ceil(dayOfYear / 7);
}

/**
 * 根据年份和周数获取日期范围
 */
function getWeekDateRange(year: number, weekNumber: number): { start: Date; end: Date } {
  // 获取指定年份的1月1日
  const firstDay = new Date(year, 0, 1);

  // 获取1月1日是星期几（0=周日，1=周一...）
  const firstDayOfWeek = firstDay.getDay();

  // 计算第一个完整周的开始日期（周一）
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() + (firstDayOfWeek === 0 ? 1 : 8 - firstDayOfWeek));

  // 计算指定周的开始日期
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  // 计算周结束日期（周日）
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
}

/**
 * 获取客户任务统计（基于客户跟进记录的修改时间）
 */
async function getCustomerTaskStats(userId: number, startDate: Date, endDate: Date) {
  try {

    // 方法1：基于客户的修改时间统计（主要逻辑）
    const customers = await prisma.customer.findMany({
      where: {
        responsiblePersonId: userId,
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    });

    // 按客户状态统计数量
    let consultCount = 0;    // 咨询
    let followUpCount = 0;   // 回访
    let developCount = 0;    // 开发
    let registerCount = 0;   // 报名

    for (const customer of customers) {

      switch (customer.status) {
        case 'consult':
          consultCount++;
          break;
        case 'effective_visit':
          followUpCount++;
          break;
        case 'new_develop':
          developCount++;
          break;
        case 'registered':
          registerCount++;
          break;
      }
    }

    return {
      consultCount,
      followUpCount,
      developCount,
      registerCount
    };
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
