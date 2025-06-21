import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

class EmployeeTargetController {
  /**
   * 获取员工目标列表
   */
  async getEmployeeTargets(req: Request, res: Response) {
    try {
      const { employeeId, year, month, current = 1, size = 10 } = req.query;
      const currentUserId = (req as any).user?.id;
      const userRoles = (req as any).user?.roles || [];

      // 构建查询条件
      let whereCondition: any = {
        status: 1
      };

      // 如果不是超级管理员，只能查看自己管理的员工目标
      if (!userRoles.includes('super_admin')) {
        if (userRoles.includes('admin')) {
          // 管理员只能查看自己管理的员工目标
          whereCondition.managerId = currentUserId;
        } else {
          // 普通员工只能查看自己的目标
          whereCondition.employeeId = currentUserId;
        }
      }

      // 按条件筛选
      if (employeeId) {
        whereCondition.employeeId = parseInt(employeeId as string);
      }
      if (year) {
        whereCondition.targetYear = parseInt(year as string);
      }
      if (month) {
        whereCondition.targetMonth = parseInt(month as string);
      }

      const offset = (parseInt(current as string) - 1) * parseInt(size as string);

      const [targets, total] = await Promise.all([
        prisma.employeeTarget.findMany({
          where: whereCondition,
          include: {
            employee: {
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
            },
            manager: {
              select: {
                id: true,
                userName: true,
                nickName: true
              }
            }
          },
          orderBy: [
            { targetYear: 'desc' },
            { targetMonth: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: parseInt(size as string)
        }),
        prisma.employeeTarget.count({
          where: whereCondition
        })
      ]);

      const formattedTargets = targets.map(target => ({
        id: target.id,
        employeeId: target.employeeId,
        employeeName: target.employee.nickName || target.employee.userName,
        departmentName: target.employee.department?.name || '未分配',
        targetYear: target.targetYear,
        targetMonth: target.targetMonth,
        targetAmount: Number(target.targetAmount),
        managerId: target.managerId,
        managerName: target.manager.nickName || target.manager.userName,
        remark: target.remark,
        status: target.status,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt
      }));

      res.json(createSuccessResponse({
        records: formattedTargets,
        total,
        current: parseInt(current as string),
        size: parseInt(size as string)
      }, '获取员工目标列表成功', req.path));
    } catch (error) {
      logger.error('获取员工目标列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取员工目标列表失败', null, req.path));
    }
  }

  /**
   * 创建或更新员工目标
   */
  async setEmployeeTarget(req: Request, res: Response) {
    try {
      const { employeeId, targetYear, targetMonth, targetAmount, remark } = req.body;
      const currentUserId = (req as any).user?.id;
      const userRoles = (req as any).user?.roles || [];

      // 验证必需字段
      if (!employeeId || !targetYear || !targetMonth || !targetAmount) {
        return res.status(400).json(createErrorResponse(400, '员工ID、年份、月份和目标金额不能为空', null, req.path));
      }

      // 权限检查
      if (!userRoles.includes('super_admin')) {
        if (!userRoles.includes('admin')) {
          return res.status(403).json(createErrorResponse(403, '没有权限设置员工目标', null, req.path));
        }

        // 管理员只能设置自己管理的员工目标
        const managedEmployee = await prisma.employeeManagerRelation.findFirst({
          where: {
            employeeId: parseInt(employeeId),
            managerId: currentUserId,
            status: 1
          }
        });

        if (!managedEmployee) {
          return res.status(403).json(createErrorResponse(403, '您只能设置自己管理的员工目标', null, req.path));
        }
      }

      // 检查员工是否存在
      const employee = await prisma.user.findUnique({
        where: { id: parseInt(employeeId) }
      });

      if (!employee) {
        return res.status(404).json(createErrorResponse(404, '员工不存在', null, req.path));
      }

      // 检查是否已存在该员工该月的目标
      const existingTarget = await prisma.employeeTarget.findUnique({
        where: {
          employeeId_targetYear_targetMonth: {
            employeeId: parseInt(employeeId),
            targetYear: parseInt(targetYear),
            targetMonth: parseInt(targetMonth)
          }
        }
      });

      let result;
      if (existingTarget) {
        // 更新现有目标
        result = await prisma.employeeTarget.update({
          where: { id: existingTarget.id },
          data: {
            targetAmount: parseFloat(targetAmount),
            managerId: currentUserId,
            remark,
            updatedAt: new Date()
          }
        });
      } else {
        // 创建新目标
        result = await prisma.employeeTarget.create({
          data: {
            employeeId: parseInt(employeeId),
            targetYear: parseInt(targetYear),
            targetMonth: parseInt(targetMonth),
            targetAmount: parseFloat(targetAmount),
            managerId: currentUserId,
            remark
          }
        });
      }

      res.json(createSuccessResponse(result, existingTarget ? '更新员工目标成功' : '设置员工目标成功', req.path));
    } catch (error) {
      logger.error('设置员工目标失败:', error);
      res.status(500).json(createErrorResponse(500, '设置员工目标失败', null, req.path));
    }
  }

  /**
   * 删除员工目标
   */
  async deleteEmployeeTarget(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const userRoles = (req as any).user?.roles || [];

      // 查找目标记录
      const target = await prisma.employeeTarget.findUnique({
        where: { id: parseInt(id) },
        include: {
          employee: true
        }
      });

      if (!target) {
        return res.status(404).json(createErrorResponse(404, '员工目标不存在', null, req.path));
      }

      // 权限检查
      if (!userRoles.includes('super_admin')) {
        if (!userRoles.includes('admin') || target.managerId !== currentUserId) {
          return res.status(403).json(createErrorResponse(403, '没有权限删除该员工目标', null, req.path));
        }
      }

      await prisma.employeeTarget.delete({
        where: { id: parseInt(id) }
      });

      res.json(createSuccessResponse(null, '删除员工目标成功', req.path));
    } catch (error) {
      logger.error('删除员工目标失败:', error);
      res.status(500).json(createErrorResponse(500, '删除员工目标失败', null, req.path));
    }
  }

  /**
   * 批量设置员工目标
   */
  async batchSetEmployeeTargets(req: Request, res: Response) {
    try {
      const { targets } = req.body; // targets: [{ employeeId, targetYear, targetMonth, targetAmount, remark }]
      const currentUserId = (req as any).user?.id;
      const userRoles = (req as any).user?.roles || [];

      if (!targets || !Array.isArray(targets) || targets.length === 0) {
        return res.status(400).json(createErrorResponse(400, '目标列表不能为空', null, req.path));
      }

      // 权限检查
      if (!userRoles.includes('super_admin') && !userRoles.includes('admin')) {
        return res.status(403).json(createErrorResponse(403, '没有权限批量设置员工目标', null, req.path));
      }

      const results = [];
      for (const targetData of targets) {
        const { employeeId, targetYear, targetMonth, targetAmount, remark } = targetData;

        // 管理员权限检查
        if (!userRoles.includes('super_admin')) {
          const managedEmployee = await prisma.employeeManagerRelation.findFirst({
            where: {
              employeeId: parseInt(employeeId),
              managerId: currentUserId,
              status: 1
            }
          });

          if (!managedEmployee) {
            results.push({
              employeeId,
              success: false,
              error: '您只能设置自己管理的员工目标'
            });
            continue;
          }
        }

        try {
          // 检查是否已存在该员工该月的目标
          const existingTarget = await prisma.employeeTarget.findUnique({
            where: {
              employeeId_targetYear_targetMonth: {
                employeeId: parseInt(employeeId),
                targetYear: parseInt(targetYear),
                targetMonth: parseInt(targetMonth)
              }
            }
          });

          let result;
          if (existingTarget) {
            // 更新现有目标
            result = await prisma.employeeTarget.update({
              where: { id: existingTarget.id },
              data: {
                targetAmount: parseFloat(targetAmount),
                managerId: currentUserId,
                remark,
                updatedAt: new Date()
              }
            });
          } else {
            // 创建新目标
            result = await prisma.employeeTarget.create({
              data: {
                employeeId: parseInt(employeeId),
                targetYear: parseInt(targetYear),
                targetMonth: parseInt(targetMonth),
                targetAmount: parseFloat(targetAmount),
                managerId: currentUserId,
                remark
              }
            });
          }

          results.push({
            employeeId,
            success: true,
            data: result
          });
        } catch (error) {
          results.push({
            employeeId,
            success: false,
            error: '设置失败'
          });
        }
      }

      res.json(createSuccessResponse(results, '批量设置员工目标完成', req.path));
    } catch (error) {
      logger.error('批量设置员工目标失败:', error);
      res.status(500).json(createErrorResponse(500, '批量设置员工目标失败', null, req.path));
    }
  }
}

export default new EmployeeTargetController();
