import express from 'express';
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const router = express.Router();

/**
 * 获取用户任务统计和目标
 */
router.get('/user-stats', async (req: Request, res: Response) => {
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

    // 获取用户任务完成情况统计
    const currentDate = new Date();
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // 获取各类型任务的完成数量
    const consultCount = await getTaskCount(currentUserId, '咨询任务', startOfMonth, endOfMonth);
    const followUpCount = await getTaskCount(currentUserId, '回访任务', startOfMonth, endOfMonth);
    const developCount = await getTaskCount(currentUserId, '开发任务', startOfMonth, endOfMonth);
    const registerCount = await getTaskCount(currentUserId, '报名任务', startOfMonth, endOfMonth);

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
});

/**
 * 获取指定类型任务的完成数量
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
