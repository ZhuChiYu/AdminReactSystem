import type { Request, Response } from 'express';

import { prisma } from '@/config/database';
import { ErrorCode, NotFoundError, ValidationError, createErrorResponse, createSuccessResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';

class CustomerController {
  /** 获取客户列表 */
  async getCustomers(req: Request, res: Response) {
    const { company, current = 1, customerName, followStatus, industry, scope, size = 10, source } = req.query;

    const user = (req as any).user; // 获取当前登录用户
    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};

    // 权限控制：根据scope参数决定数据范围
    // scope = 'all' 表示客户资料管理页面，显示所有数据
    // scope = 'own' 表示客户跟进页面，只显示自己创建的数据
    // 默认为 'own'
    const dataScope = (scope as string) || 'own';

    if (dataScope === 'own' && !user?.roles?.includes('super_admin')) {
      // 客户跟进页面：普通用户只能查看自己创建的客户
      where.createdById = user?.id;
    }
    // 客户资料管理页面：所有用户都能查看所有数据（scope = 'all'）

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
        canDelete: user?.roles?.includes('super_admin') || customer.createdById === user?.id,
        // 添加权限字段
        canEdit: user?.roles?.includes('super_admin') || customer.createdById === user?.id,
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
    const user = (req as any).user; // 获取当前登录用户

    try {
      // 构建查询条件，添加权限控制
      const where: any = { id: Number(id) };

      // 权限控制：超级管理员可以查看所有客户，其他用户只能查看自己创建的客户
      if (!user?.roles?.includes('super_admin')) {
        where.createdById = user?.id;
      }

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
        where
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
      // 检查客户是否存在并且用户有权限修改
      const whereCondition: any = { id: Number(id) };

      // 权限控制：超级管理员可以修改所有客户，其他用户只能修改自己创建的客户
      if (!req.user.roles?.includes('super_admin')) {
        whereCondition.createdById = req.user.id;
      }

      const existingCustomer = await prisma.customer.findFirst({
        where: whereCondition
      });

      if (!existingCustomer) {
        throw new NotFoundError('客户不存在或您没有权限修改此客户');
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
      // 检查客户是否存在并且用户有权限删除
      const whereCondition: any = { id: Number(id) };

      // 权限控制：超级管理员可以删除所有客户，其他用户只能删除自己创建的客户
      if (!req.user.roles?.includes('super_admin')) {
        whereCondition.createdById = req.user.id;
      }

      const existingCustomer = await prisma.customer.findUnique({
        where: whereCondition
      });

      if (!existingCustomer) {
        throw new NotFoundError('客户不存在或您没有权限删除此客户');
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
    const { scope } = req.query;
    const user = (req as any).user; // 获取当前登录用户

    try {
      // 构建查询条件，添加权限控制
      const where: any = {};

      // 权限控制：根据scope参数决定数据范围
      const dataScope = (scope as string) || 'own';

      if (dataScope === 'own' && !user?.roles?.includes('super_admin')) {
        // 客户跟进页面：普通用户只能查看自己创建的客户统计
        where.createdById = user?.id;
      }
      // 客户资料管理页面：所有用户都能查看所有数据统计（scope = 'all'）

      // 获取各个状态的客户数量
      const statistics = await prisma.customer.groupBy({
        _count: {
          followStatus: true
        },
        by: ['followStatus'],
        where
      });

      // 获取总客户数
      const totalCount = await prisma.customer.count({ where });

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

  /** 导入客户Excel文件 */
  async importCustomers(req: Request, res: Response) {
    if (!req.user) {
      throw new ValidationError('用户未认证');
    }

    if (!req.file) {
      throw new ValidationError('请上传Excel文件');
    }

    try {
      const xlsx = require('xlsx');

      // 读取上传的文件（multer已将文件保存到磁盘）
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 将Excel数据转换为JSON
      const excelData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (excelData.length <= 1) {
        throw new ValidationError('Excel文件无有效数据');
      }

      // 跳过标题行，处理数据行
      const dataRows = excelData.slice(1);
      const customers = [];
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
          continue; // 跳过空行
        }

        try {
          // Excel列顺序：A=姓名, B=单位, C=职务, D=电话, E=手机, F=跟进, G=状态
          const rawStatus = row[6]?.toString().trim() || 'consult';

          // 状态映射：中文 -> 英文枚举
          const statusMap: Record<string, string> = {
            咨询: 'consult',
            大客户: 'vip',
            已加微信: 'wechat_added',
            已实到: 'arrived',
            已报名: 'registered',
            新开发: 'new_develop',
            早25: 'early_25',
            早25客户: 'early_25',
            有效回访: 'effective_visit',
            未实到: 'not_arrived',
            未通过: 'rejected'
          };

          const customerData = {
            // A列：姓名
            company: row[1]?.toString().trim() || '',
            createdById: req.user.id,
            customerName: row[0]?.toString().trim() || '',
            email: '', // F列：跟进内容
            followStatus: statusMap[rawStatus] || rawStatus || 'consult', // G列：状态
            industry: 'other',
            level: 1, // D列：电话
            mobile: row[4]?.toString().trim() || '',
            // C列：职务
            phone: row[3]?.toString().trim() || '',
            // B列：单位
            position: row[2]?.toString().trim() || '',
            // E列：手机
            remark: row[5]?.toString().trim() || '',
            source: 'import'
          };

          // 验证必填字段
          if (!customerData.customerName || !customerData.company) {
            errors.push(`第${i + 2}行：客户姓名和公司名称不能为空`);
            failureCount++;
            continue;
          }

          // 检查是否已存在相同的客户（根据姓名和公司）
          const existingCustomer = await prisma.customer.findFirst({
            where: {
              company: customerData.company,
              customerName: customerData.customerName
            }
          });

          if (existingCustomer) {
            errors.push(`第${i + 2}行：客户 ${customerData.customerName}(${customerData.company}) 已存在`);
            failureCount++;
            continue;
          }

          // 创建客户记录
          await prisma.customer.create({
            data: customerData
          });

          customers.push(customerData);
          successCount++;
        } catch (error) {
          errors.push(`第${i + 2}行：${(error as Error).message || '导入失败'}`);
          failureCount++;
        }
      }

      // 删除临时文件
      const fs = require('node:fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      logger.info(`用户 ${req.user.userName} 导入客户文件: ${req.file.originalname}`, {
        failureCount,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        successCount,
        totalCount: successCount + failureCount,
        userId: req.user.id
      });

      const importResult = {
        errors: errors.slice(0, 10),
        failureCount,
        // 最多返回前10个错误
        hasMoreErrors: errors.length > 10,
        successCount,
        totalCount: successCount + failureCount
      };

      res.json(
        createSuccessResponse(importResult, `导入完成：成功 ${successCount} 条，失败 ${failureCount} 条`, req.path)
      );
    } catch (error) {
      // 清理临时文件
      if (req.file && req.file.path) {
        const fs = require('node:fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }

      logger.error('导入客户文件失败:', error);
      res.status(500).json(createErrorResponse(500, '导入客户文件失败', null, req.path));
    }
  }

  /** 获取客户分配列表 */
  async getCustomerAssignments(req: Request, res: Response) {
    const { current = 1, size = 10 } = req.query;

    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    try {
      // 获取总数
      const total = await prisma.customerAssignment.count();

      // 获取分配列表
      const assignments = await prisma.customerAssignment.findMany({
        include: {
          assignedBy: {
            select: {
              id: true,
              nickName: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              nickName: true
            }
          },
          customer: {
            select: {
              company: true,
              customerName: true,
              id: true
            }
          }
        },
        orderBy: {
          assignedTime: 'desc'
        },
        skip,
        take: pageSize
      });

      // 格式化返回数据
      const records = assignments.map(assignment => ({
        assignedById: assignment.assignedById,
        assignedByName: assignment.assignedBy.nickName,
        assignedTime: assignment.assignedTime.toISOString().split('T')[0],
        assignedToId: assignment.assignedToId,
        assignedToName: assignment.assignedTo.nickName,
        customerCompany: assignment.customer.company,
        customerId: assignment.customerId,
        customerName: assignment.customer.customerName,
        id: assignment.id,
        remark: assignment.remark,
        status: assignment.status
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
      logger.error('获取客户分配列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取分配列表失败', null, req.path));
    }
  }

  /** 分配客户给员工 */
  async assignCustomers(req: Request, res: Response) {
    const { assignedToId, customerIds, remark } = req.body;
    const assignedById = (req as any).user!.id;

    try {
      // 验证输入
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json(createErrorResponse(400, '请选择要分配的客户', null, req.path));
      }

      if (!assignedToId) {
        return res.status(400).json(createErrorResponse(400, '请选择分配给的员工', null, req.path));
      }

      // 验证员工是否存在
      const employee = await prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!employee) {
        return res.status(400).json(createErrorResponse(400, '员工不存在', null, req.path));
      }

      // 验证客户是否存在
      const customers = await prisma.customer.findMany({
        where: {
          id: {
            in: customerIds.map(Number)
          }
        }
      });

      if (customers.length !== customerIds.length) {
        return res.status(400).json(createErrorResponse(400, '部分客户不存在', null, req.path));
      }

      // 检查是否已经存在分配关系
      const existingAssignments = await prisma.customerAssignment.findMany({
        where: {
          assignedToId,
          customerId: {
            in: customerIds.map(Number)
          }
        }
      });

      if (existingAssignments.length > 0) {
        const existingCustomerIds = existingAssignments.map(a => a.customerId);
        const existingCustomers = customers.filter(customer => existingCustomerIds.includes(customer.id));
        const names = existingCustomers.map(customer => customer.customerName).join(', ');
        return res.status(400).json(createErrorResponse(400, `客户 ${names} 已经分配给该员工`, null, req.path));
      }

      // 创建分配关系
      const assignments = await Promise.all(
        customerIds.map(customerId =>
          prisma.customerAssignment.create({
            data: {
              assignedById,
              assignedToId,
              customerId: Number(customerId),
              remark: remark || null
            }
          })
        )
      );

      // 同时更新customer表的assignedToId和assignedTime
      await Promise.all(
        customerIds.map(customerId =>
          prisma.customer.update({
            data: {
              assignedTime: new Date(),
              assignedToId
            },
            where: { id: Number(customerId) }
          })
        )
      );

      res.json(createSuccessResponse(assignments, '分配成功', req.path));
    } catch (error) {
      logger.error('分配客户给员工失败:', error);
      res.status(500).json(createErrorResponse(500, '分配失败', null, req.path));
    }
  }

  /** 取消客户分配 */
  async removeCustomerAssignment(req: Request, res: Response) {
    const { id } = req.params;

    try {
      // 验证分配关系是否存在
      const assignment = await prisma.customerAssignment.findUnique({
        include: {
          customer: true
        },
        where: {
          id: Number(id)
        }
      });

      if (!assignment) {
        return res.status(404).json(createErrorResponse(404, '分配关系不存在', null, req.path));
      }

      // 删除分配关系
      await prisma.customerAssignment.delete({
        where: {
          id: Number(id)
        }
      });

      // 同时清除customer表的assignedToId和assignedTime
      await prisma.customer.update({
        data: {
          assignedTime: null,
          assignedToId: null
        },
        where: { id: assignment.customerId }
      });

      res.json(createSuccessResponse(null, '取消分配成功', req.path));
    } catch (error) {
      logger.error('取消客户分配失败:', error);
      res.status(500).json(createErrorResponse(500, '取消分配失败', null, req.path));
    }
  }
}

export const customerController = new CustomerController();
