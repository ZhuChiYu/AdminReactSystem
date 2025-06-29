import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

class StatisticsController {
  /**
   * 获取员工业绩统计
   * 业绩 = 用户添加的班级学员培训费总和 + 用户负责的已完成事项金额总和
   */
  async getEmployeePerformance(req: Request, res: Response) {
    try {
      const { timeRange, userId, year, month } = req.query;
      const currentUserId = (req as any).user?.id;

      // 构建时间范围条件
      let trainingFeeTimeCondition: any = {};
      let projectTimeCondition: any = {};

      if (timeRange && year && month) {
        const targetYear = parseInt(year as string);
        const targetMonth = parseInt(month as string);

        // 构建月份时间范围
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // 培训费收入按照班级学员的加入日期来算
        trainingFeeTimeCondition = {
          joinDate: {
            gte: startDate,
            lte: endDate
          }
        };

        // 项目收入按照项目的完成时间来算
        projectTimeCondition = {
          completionTime: {
            gte: startDate,
            lte: endDate
          }
        };
      } else if (timeRange) {
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            trainingFeeTimeCondition = {
              joinDate: {
                gte: startDate,
                lte: now
              }
            };
            projectTimeCondition = {
              completionTime: {
                gte: startDate,
                lte: now
              }
            };
            break;
          case 'quarter':
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            trainingFeeTimeCondition = {
              joinDate: {
                gte: startDate,
                lte: now
              }
            };
            projectTimeCondition = {
              completionTime: {
                gte: startDate,
                lte: now
              }
            };
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            trainingFeeTimeCondition = {
              joinDate: {
                gte: startDate,
                lte: now
              }
            };
            projectTimeCondition = {
              completionTime: {
                gte: startDate,
                lte: now
              }
            };
            break;
          default:
            startDate = new Date(now.getFullYear(), 0, 1); // 默认年度
            trainingFeeTimeCondition = {
              joinDate: {
                gte: startDate,
                lte: now
              }
            };
            projectTimeCondition = {
              completionTime: {
                gte: startDate,
                lte: now
              }
            };
        }
      }

      // 如果指定了用户ID，只获取该用户的数据
      let userCondition: any = {};
      if (userId) {
        userCondition = { id: parseInt(userId as string) };
      }

      // 获取所有用户
      const users = await prisma.user.findMany({
        where: userCondition,
        select: {
          id: true,
          userName: true,
          nickName: true,
          department: {
            select: {
              name: true
            }
          }
        }
      });

      // 计算每个用户的业绩
      const performanceData = await Promise.all(
        users.map(async (user) => {
          // 1. 计算用户添加的班级学员培训费总和
          const studentTrainingFees = await prisma.classStudent.aggregate({
            where: {
              createdById: user.id,
              ...trainingFeeTimeCondition
            },
            _sum: {
              trainingFee: true
            }
          });

          // 2. 计算用户负责的已完成事项金额总和
          const completedTasksAmount = await prisma.task.aggregate({
            where: {
              responsiblePersonId: user.id,
              isCompleted: true,
              paymentAmount: {
                not: null
              },
              ...projectTimeCondition
            },
            _sum: {
              paymentAmount: true
            }
          });

          // 计算总业绩
          const trainingFeeTotal = studentTrainingFees._sum.trainingFee || 0;
          const taskAmountTotal = completedTasksAmount._sum.paymentAmount || 0;
          const totalPerformance = Number(trainingFeeTotal) + Number(taskAmountTotal);

          // 获取用户的目标 - 如果指定了时间范围，获取对应时间的目标，否则获取当前月的目标
          let targetYear, targetMonth;
          if (timeRange) {
            const now = new Date();
            targetYear = now.getFullYear();
            targetMonth = now.getMonth() + 1;
            if (timeRange === 'quarter') {
              targetMonth = Math.floor(now.getMonth() / 3) * 3 + 1; // 季度第一个月
            } else if (timeRange === 'year') {
              targetMonth = 1; // 年度目标用1月的目标
            }
          } else {
            const now = new Date();
            targetYear = now.getFullYear();
            targetMonth = now.getMonth() + 1;
          }

          const employeeTarget = await prisma.employeeTarget.findFirst({
            where: {
              employeeId: user.id,
              targetYear,
              targetMonth,
              status: 1
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          // 计算目标任务总数（各类型任务目标之和）
          const totalTaskTarget = (employeeTarget?.consultTarget || 0) +
                                  (employeeTarget?.followUpTarget || 0) +
                                  (employeeTarget?.developTarget || 0) +
                                  (employeeTarget?.registerTarget || 0);

          // 以20万作为默认业绩目标，或者基于任务目标计算（假设平均每个任务5000元）
          const targetAmount = totalTaskTarget > 0 ? totalTaskTarget * 5000 : 200000;

          return {
            id: user.id,
            name: user.nickName || user.userName,
            department: user.department?.name || '未分配',
            trainingFeeAmount: Number(trainingFeeTotal),
            taskAmount: Number(taskAmountTotal),
            totalPerformance: totalPerformance,
            target: targetAmount,
            ratio: targetAmount > 0 ? Math.round((totalPerformance / targetAmount) * 100) : 0
          };
        })
      );

      // 按总业绩从高到低排序
      performanceData.sort((a, b) => b.totalPerformance - a.totalPerformance);

      res.json(createSuccessResponse(performanceData, '获取员工业绩统计成功', req.path));
    } catch (error) {
      logger.error('获取员工业绩统计失败:', error);
      res.status(500).json(createErrorResponse(500, '获取员工业绩统计失败', null, req.path));
    }
  }

  /**
   * 获取业绩趋势统计（月度/季度/年度）
   */
  async getPerformanceTrend(req: Request, res: Response) {
    try {
      const { period = 'month', year = new Date().getFullYear() } = req.query;
      const currentUserId = (req as any).user?.id;

      let periods: any[] = [];
      const targetYear = parseInt(year as string);

      // 根据周期类型生成时间段
      if (period === 'month') {
        // 生成12个月的数据
        for (let i = 0; i < 12; i++) {
          const startDate = new Date(targetYear, i, 1);
          const endDate = new Date(targetYear, i + 1, 0, 23, 59, 59);
          periods.push({
            label: `${i + 1}月`,
            startDate,
            endDate
          });
        }
      } else if (period === 'quarter') {
        // 生成4个季度的数据
        for (let i = 0; i < 4; i++) {
          const startDate = new Date(targetYear, i * 3, 1);
          const endDate = new Date(targetYear, (i + 1) * 3, 0, 23, 59, 59);
          periods.push({
            label: `Q${i + 1}`,
            startDate,
            endDate
          });
        }
      } else if (period === 'year') {
        // 生成最近5年的数据
        for (let i = 4; i >= 0; i--) {
          const year = targetYear - i;
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59);
          periods.push({
            label: `${year}年`,
            startDate,
            endDate
          });
        }
      }

      // 计算每个时间段的业绩数据
      const trendData = await Promise.all(
        periods.map(async (period) => {
          // 获取该时间段内的培训费收入
          const trainingFeeIncome = await prisma.classStudent.aggregate({
            where: {
              createdAt: {
                gte: period.startDate,
                lte: period.endDate
              }
            },
            _sum: {
              trainingFee: true
            }
          });

          // 获取该时间段内的项目收入
          const projectIncome = await prisma.task.aggregate({
            where: {
              completionTime: {
                gte: period.startDate,
                lte: period.endDate
              },
              isCompleted: true,
              paymentAmount: {
                not: null
              }
            },
            _sum: {
              paymentAmount: true
            }
          });

          const trainingTotal = Number(trainingFeeIncome._sum.trainingFee || 0);
          const projectTotal = Number(projectIncome._sum.paymentAmount || 0);
          const totalActual = trainingTotal + projectTotal;

          return {
            period: period.label,
            targetPerformance: 300000, // 目标业绩，可以后续配置化
            actualPerformance: totalActual,
            trainingFeeIncome: trainingTotal,
            projectIncome: projectTotal
          };
        })
      );

      res.json(createSuccessResponse(trendData, '获取业绩趋势统计成功', req.path));
    } catch (error) {
      logger.error('获取业绩趋势统计失败:', error);
      res.status(500).json(createErrorResponse(500, '获取业绩趋势统计失败', null, req.path));
    }
  }
}

export default new StatisticsController();
