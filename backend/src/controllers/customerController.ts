import type { Request, Response } from 'express';

import { prisma } from '@/config/database';
import { ErrorCode, NotFoundError, ValidationError, createErrorResponse, createSuccessResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';

class CustomerController {
  /** 获取客户列表 */
  async getCustomers(req: Request, res: Response) {
    const { company, current = 1, customerName, followStatus, industry, size = 10, source } = req.query;

    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};

    if (customerName) {
      where.customerName = {
        contains: customerName as string,
        mode: 'insensitive'
      };
    }

    if (company) {
      where.company = {
        contains: company as string,
        mode: 'insensitive'
      };
    }

    if (followStatus) {
      where.followStatus = followStatus as string;
    }

    if (industry) {
      where.industry = industry as string;
    }

    if (source) {
      where.source = source as string;
    }

    try {
      // 获取总数
      const total = await prisma.customer.count({ where });

      // 获取客户列表
      const customers = await prisma.customer.findMany({
        include: {
          assignedTo: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          },
          createdBy: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSize,
        where
      });

      // 格式化返回数据
      const records = customers.map(customer => ({
        assignedTime: customer.assignedTime,
        assignedTo: customer.assignedTo
          ? {
              id: customer.assignedTo.id,
              name: customer.assignedTo.nickName
            }
          : null,
        company: customer.company,
        createdAt: customer.createdAt,
        createdBy: customer.createdBy
          ? {
              id: customer.createdBy.id,
              name: customer.createdBy.nickName
            }
          : null,
        customerName: customer.customerName,
        email: customer.email,
        followStatus: customer.followStatus,
        id: customer.id,
        industry: customer.industry,
        level: customer.level,
        mobile: customer.mobile,
        nextFollowTime: customer.nextFollowTime,
        phone: customer.phone,
        position: customer.position,
        remark: customer.remark,
        source: customer.source,
        updatedAt: customer.updatedAt,
        wechat: customer.wechat
      }));

      const pages = Math.ceil(total / pageSize);

      res.json(
        createSuccessResponse(
          {
            current: page,
            pages,
            records,
            size: pageSize,
            total
          },
          '查询成功',
          req.path
        )
      );
    } catch (error) {
      logger.error('获取客户列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取客户列表失败', null, req.path));
    }
  }

  /** 获取客户详情 */
  async getCustomerById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const customer = await prisma.customer.findUnique({
        include: {
          assignedTo: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          },
          createdBy: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          },
          followRecords: {
            include: {
              followUser: {
                select: {
                  id: true,
                  nickName: true,
                  userName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        where: { id: Number(id) }
      });

      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      const result = {
        assignedTime: customer.assignedTime,
        assignedTo: customer.assignedTo
          ? {
              id: customer.assignedTo.id,
              name: customer.assignedTo.nickName
            }
          : null,
        company: customer.company,
        createdAt: customer.createdAt,
        createdBy: customer.createdBy
          ? {
              id: customer.createdBy.id,
              name: customer.createdBy.nickName
            }
          : null,
        customerName: customer.customerName,
        email: customer.email,
        followRecords: customer.followRecords.map(record => ({
          attachments: record.attachments,
          createdAt: record.createdAt,
          followContent: record.followContent,
          followResult: record.followResult,
          followType: record.followType,
          followUser: {
            id: record.followUser.id,
            name: record.followUser.nickName
          },
          id: record.id,
          nextFollowTime: record.nextFollowTime
        })),
        followStatus: customer.followStatus,
        id: customer.id,
        industry: customer.industry,
        level: customer.level,
        mobile: customer.mobile,
        nextFollowTime: customer.nextFollowTime,
        phone: customer.phone,
        position: customer.position,
        remark: customer.remark,
        source: customer.source,
        updatedAt: customer.updatedAt,
        wechat: customer.wechat
      };

      res.json(createSuccessResponse(result, '查询成功', req.path));
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json(createErrorResponse(404, error.message, null, req.path));
      } else {
        logger.error('获取客户详情失败:', error);
        res.status(500).json(createErrorResponse(500, '获取客户详情失败', null, req.path));
      }
    }
  }

  /** 创建客户 */
  async createCustomer(req: Request, res: Response) {
    const {
      company,
      customerName,
      email,
      followStatus = 'consult',
      industry,
      level = 1,
      mobile,
      phone,
      position,
      remark,
      source,
      wechat
    } = req.body;

    // 参数验证
    if (!customerName || !company) {
      throw new ValidationError('客户姓名和公司名称不能为空');
    }

    if (!req.user) {
      throw new ValidationError('用户未认证');
    }

    try {
      const customer = await prisma.customer.create({
        data: {
          company,
          createdById: req.user.id,
          customerName,
          email,
          followStatus,
          industry,
          level: Number(level),
          mobile,
          phone,
          position,
          remark,
          source,
          wechat
        },
        include: {
          createdBy: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          }
        }
      });

      logger.info(`用户 ${req.user.userName} 创建客户: ${customerName}`, {
        customerId: customer.id,
        userId: req.user.id
      });

      res.json(
        createSuccessResponse(
          {
            company: customer.company,
            createdAt: customer.createdAt,
            createdBy: customer.createdBy
              ? {
                  id: customer.createdBy.id,
                  name: customer.createdBy.nickName
                }
              : null,
            customerName: customer.customerName,
            email: customer.email,
            followStatus: customer.followStatus,
            id: customer.id,
            industry: customer.industry,
            level: customer.level,
            mobile: customer.mobile,
            phone: customer.phone,
            position: customer.position,
            remark: customer.remark,
            source: customer.source,
            updatedAt: customer.updatedAt,
            wechat: customer.wechat
          },
          '创建成功',
          req.path
        )
      );
    } catch (error) {
      logger.error('创建客户失败:', error);
      res.status(500).json(createErrorResponse(500, '创建客户失败', null, req.path));
    }
  }

  /** 更新客户 */
  async updateCustomer(req: Request, res: Response) {
    const { id } = req.params;
    const {
      company,
      customerName,
      email,
      followStatus,
      industry,
      level,
      mobile,
      phone,
      position,
      remark,
      source,
      wechat
    } = req.body;

    if (!req.user) {
      throw new ValidationError('用户未认证');
    }

    try {
      // 检查客户是否存在
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: Number(id) }
      });

      if (!existingCustomer) {
        throw new NotFoundError('客户不存在');
      }

      const customer = await prisma.customer.update({
        data: {
          company,
          customerName,
          email,
          followStatus,
          industry,
          level: level ? Number(level) : undefined,
          mobile,
          phone,
          position,
          remark,
          source,
          wechat
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          },
          createdBy: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          }
        },
        where: { id: Number(id) }
      });

      logger.info(`用户 ${req.user.userName} 更新客户: ${customer.customerName}`, {
        customerId: customer.id,
        userId: req.user.id
      });

      res.json(
        createSuccessResponse(
          {
            assignedTo: customer.assignedTo
              ? {
                  id: customer.assignedTo.id,
                  name: customer.assignedTo.nickName
                }
              : null,
            company: customer.company,
            createdAt: customer.createdAt,
            createdBy: customer.createdBy
              ? {
                  id: customer.createdBy.id,
                  name: customer.createdBy.nickName
                }
              : null,
            customerName: customer.customerName,
            email: customer.email,
            followStatus: customer.followStatus,
            id: customer.id,
            industry: customer.industry,
            level: customer.level,
            mobile: customer.mobile,
            phone: customer.phone,
            position: customer.position,
            remark: customer.remark,
            source: customer.source,
            updatedAt: customer.updatedAt,
            wechat: customer.wechat
          },
          '更新成功',
          req.path
        )
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json(createErrorResponse(404, error.message, null, req.path));
      } else {
        logger.error('更新客户失败:', error);
        res.status(500).json(createErrorResponse(500, '更新客户失败', null, req.path));
      }
    }
  }

  /** 删除客户 */
  async deleteCustomer(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.user) {
      throw new ValidationError('用户未认证');
    }

    try {
      // 检查客户是否存在
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: Number(id) }
      });

      if (!existingCustomer) {
        throw new NotFoundError('客户不存在');
      }

      await prisma.customer.delete({
        where: { id: Number(id) }
      });

      logger.info(`用户 ${req.user.userName} 删除客户: ${existingCustomer.customerName}`, {
        customerId: existingCustomer.id,
        userId: req.user.id
      });

      res.json(createSuccessResponse(null, '删除成功', req.path));
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json(createErrorResponse(404, error.message, null, req.path));
      } else {
        logger.error('删除客户失败:', error);
        res.status(500).json(createErrorResponse(500, '删除客户失败', null, req.path));
      }
    }
  }

  /** 获取客户统计数据 */
  async getCustomerStatistics(req: Request, res: Response) {
    try {
      // 获取各个状态的客户数量
      const statistics = await prisma.customer.groupBy({
        _count: {
          followStatus: true
        },
        by: ['followStatus']
      });

      // 获取总客户数
      const totalCount = await prisma.customer.count();

      // 格式化统计数据
      const result: Record<string, number> = {
        all: totalCount,
        arrived: 0,
        consult: 0,
        early_25: 0,
        effective_visit: 0,
        new_develop: 0,
        not_arrived: 0,
        registered: 0,
        rejected: 0,
        vip: 0,
        wechat_added: 0
      };

      // 填充实际统计数据
      statistics.forEach(stat => {
        if (result[stat.followStatus] !== undefined) {
          result[stat.followStatus] = stat._count.followStatus;
        }
      });

      res.json(createSuccessResponse(result, '查询成功', req.path));
    } catch (error) {
      logger.error('获取客户统计失败:', error);
      res.status(500).json(createErrorResponse(500, '获取客户统计失败', null, req.path));
    }
  }
}

export const customerController = new CustomerController();
