import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  ErrorCode
} from '@/utils/errors';

class CustomerController {
  /**
   * 获取客户列表
   */
  async getCustomers(req: Request, res: Response) {
    const {
      current = 1,
      size = 10,
      customerName,
      company,
      followStatus,
      industry,
      source
    } = req.query;

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
        where,
        skip,
        take: pageSize,
        include: {
          assignedTo: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          },
          createdBy: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 格式化返回数据
      const records = customers.map(customer => ({
        id: customer.id,
        customerName: customer.customerName,
        company: customer.company,
        position: customer.position,
        phone: customer.phone,
        mobile: customer.mobile,
        email: customer.email,
        wechat: customer.wechat,
        industry: customer.industry,
        source: customer.source,
        level: customer.level,
        followStatus: customer.followStatus,
        nextFollowTime: customer.nextFollowTime,
        assignedTo: customer.assignedTo ? {
          id: customer.assignedTo.id,
          name: customer.assignedTo.nickName
        } : null,
        assignedTime: customer.assignedTime,
        createdBy: customer.createdBy ? {
          id: customer.createdBy.id,
          name: customer.createdBy.nickName
        } : null,
        remark: customer.remark,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }));

      const pages = Math.ceil(total / pageSize);

      res.json(createSuccessResponse({
        records,
        total,
        current: page,
        size: pageSize,
        pages
      }, '查询成功', req.path));

    } catch (error) {
      logger.error('获取客户列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取客户列表失败', null, req.path));
    }
  }

  /**
   * 获取客户详情
   */
  async getCustomerById(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const customer = await prisma.customer.findUnique({
        where: { id: Number(id) },
        include: {
          assignedTo: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          },
          createdBy: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          },
          followRecords: {
            include: {
              followUser: {
                select: {
                  id: true,
                  userName: true,
                  nickName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      const result = {
        id: customer.id,
        customerName: customer.customerName,
        company: customer.company,
        position: customer.position,
        phone: customer.phone,
        mobile: customer.mobile,
        email: customer.email,
        wechat: customer.wechat,
        industry: customer.industry,
        source: customer.source,
        level: customer.level,
        followStatus: customer.followStatus,
        nextFollowTime: customer.nextFollowTime,
        assignedTo: customer.assignedTo ? {
          id: customer.assignedTo.id,
          name: customer.assignedTo.nickName
        } : null,
        assignedTime: customer.assignedTime,
        createdBy: customer.createdBy ? {
          id: customer.createdBy.id,
          name: customer.createdBy.nickName
        } : null,
        remark: customer.remark,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        followRecords: customer.followRecords.map(record => ({
          id: record.id,
          followType: record.followType,
          followContent: record.followContent,
          followResult: record.followResult,
          nextFollowTime: record.nextFollowTime,
          followUser: {
            id: record.followUser.id,
            name: record.followUser.nickName
          },
          attachments: record.attachments,
          createdAt: record.createdAt
        }))
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

  /**
   * 创建客户
   */
  async createCustomer(req: Request, res: Response) {
    const {
      customerName,
      company,
      position,
      phone,
      mobile,
      email,
      wechat,
      industry,
      source,
      level = 1,
      followStatus = 'consult',
      remark
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
          customerName,
          company,
          position,
          phone,
          mobile,
          email,
          wechat,
          industry,
          source,
          level: Number(level),
          followStatus,
          createdById: req.user.id,
          remark
        },
        include: {
          createdBy: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          }
        }
      });

      logger.info(`用户 ${req.user.userName} 创建客户: ${customerName}`, {
        userId: req.user.id,
        customerId: customer.id
      });

      res.json(createSuccessResponse({
        id: customer.id,
        customerName: customer.customerName,
        company: customer.company,
        position: customer.position,
        phone: customer.phone,
        mobile: customer.mobile,
        email: customer.email,
        wechat: customer.wechat,
        industry: customer.industry,
        source: customer.source,
        level: customer.level,
        followStatus: customer.followStatus,
        createdBy: customer.createdBy ? {
          id: customer.createdBy.id,
          name: customer.createdBy.nickName
        } : null,
        remark: customer.remark,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }, '创建成功', req.path));

    } catch (error) {
      logger.error('创建客户失败:', error);
      res.status(500).json(createErrorResponse(500, '创建客户失败', null, req.path));
    }
  }

  /**
   * 更新客户
   */
  async updateCustomer(req: Request, res: Response) {
    const { id } = req.params;
    const {
      customerName,
      company,
      position,
      phone,
      mobile,
      email,
      wechat,
      industry,
      source,
      level,
      followStatus,
      remark
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
        where: { id: Number(id) },
        data: {
          customerName,
          company,
          position,
          phone,
          mobile,
          email,
          wechat,
          industry,
          source,
          level: level ? Number(level) : undefined,
          followStatus,
          remark
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          },
          createdBy: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          }
        }
      });

      logger.info(`用户 ${req.user.userName} 更新客户: ${customer.customerName}`, {
        userId: req.user.id,
        customerId: customer.id
      });

      res.json(createSuccessResponse({
        id: customer.id,
        customerName: customer.customerName,
        company: customer.company,
        position: customer.position,
        phone: customer.phone,
        mobile: customer.mobile,
        email: customer.email,
        wechat: customer.wechat,
        industry: customer.industry,
        source: customer.source,
        level: customer.level,
        followStatus: customer.followStatus,
        assignedTo: customer.assignedTo ? {
          id: customer.assignedTo.id,
          name: customer.assignedTo.nickName
        } : null,
        createdBy: customer.createdBy ? {
          id: customer.createdBy.id,
          name: customer.createdBy.nickName
        } : null,
        remark: customer.remark,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }, '更新成功', req.path));

    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json(createErrorResponse(404, error.message, null, req.path));
      } else {
        logger.error('更新客户失败:', error);
        res.status(500).json(createErrorResponse(500, '更新客户失败', null, req.path));
      }
    }
  }

  /**
   * 删除客户
   */
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
        userId: req.user.id,
        customerId: existingCustomer.id
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

  /**
   * 获取客户统计数据
   */
  async getCustomerStatistics(req: Request, res: Response) {
    try {
      // 获取各个状态的客户数量
      const statistics = await prisma.customer.groupBy({
        by: ['followStatus'],
        _count: {
          followStatus: true
        }
      });

      // 获取总客户数
      const totalCount = await prisma.customer.count();

      // 格式化统计数据
      const result: Record<string, number> = {
        all: totalCount,
        consult: 0,
        wechat_added: 0,
        registered: 0,
        arrived: 0,
        new_develop: 0,
        early_25: 0,
        effective_visit: 0,
        not_arrived: 0,
        rejected: 0,
        vip: 0
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
