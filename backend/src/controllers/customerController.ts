import type { Request, Response } from 'express';

import { prisma } from '@/config/database';
import { ErrorCode, NotFoundError, ValidationError, createErrorResponse, createSuccessResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';

class CustomerController {
  /** 获取客户列表 */
  async getCustomers(req: Request, res: Response) {
    const { company, current = 1, customerName, followStatus, industry, scope, size = 10, source, phone, mobile, assignedToName } = req.query;

    const user = (req as any).user; // 获取当前登录用户
    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {};

        // 权限控制：根据权限角色决定数据范围
    let permissionConditions: any = {};
    if (user?.roles?.includes('super_admin')) {
      // 超级管理员：可以看到所有客户数据
      // 不添加任何限制条件
    } else if (user?.roles?.includes('admin')) {
      // 管理员：可以看到自己创建的客户 + 其管理的员工创建的客户 + 分配给自己的客户
      const managedEmployeeIds = await prisma.employeeManagerRelation.findMany({
        where: { managerId: user.id },
        select: { employeeId: true }
      });

      const allowedCreatorIds = [user.id, ...managedEmployeeIds.map(rel => rel.employeeId)];
      permissionConditions.OR = [
        { createdById: { in: allowedCreatorIds } },
        { assignedToId: user.id }
      ];
    } else {
      // 普通员工：只能看到分配给自己的客户
      permissionConditions.assignedToId = user?.id;
    }

    // 合并权限条件到where中
    Object.assign(where, permissionConditions);

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

    // 添加手机和电话搜索条件
    if (phone || mobile) {
      const phoneConditions = [];
      if (phone) {
        phoneConditions.push(
          { phone: { contains: phone as string, mode: 'insensitive' } },
          { mobile: { contains: phone as string, mode: 'insensitive' } }
        );
      }
      if (mobile && mobile !== phone) {
        phoneConditions.push(
          { phone: { contains: mobile as string, mode: 'insensitive' } },
          { mobile: { contains: mobile as string, mode: 'insensitive' } }
        );
      }
      // 将手机号搜索条件作为单独的AND条件
      where.AND = [
        ...(where.AND || []),
        { OR: phoneConditions }
      ];
    }

    // 添加负责人姓名搜索条件
    if (assignedToName) {
      where.assignedTo = {
        nickName: {
          contains: assignedToName as string,
          mode: 'insensitive'
        }
      };
    }

    try {
      // 获取总数
      const total = await prisma.customer.count({ where });

      // 获取客户列表 - 被分配的客户排在前面，按修改时间排序
      const customers = await prisma.customer.findMany({
        include: {
          assignedTo: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          },
          assignedBy: {
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
        orderBy: [
          // 被分配的客户排在前面
          {
            assignedToId: {
              sort: 'desc',
              nulls: 'last'
            }
          },
          // 按修改时间排序，最近修改的在前面
          {
            updatedAt: 'desc'
          }
        ],
        skip,
        take: pageSize,
        where
      });

      // 格式化返回数据
      const records = customers.map(customer => {
        // 判断是否需要脱敏处理和编辑权限
        const isOwnCustomer = customer.createdById === user?.id;
        const isAssignedToUser = customer.assignedToId === user?.id;
        const isSuperAdmin = user?.roles?.includes('super_admin');
        const isAdmin = user?.roles?.includes('admin');

        // 脱敏规则：超级管理员、创建者、分配给的员工都可以看到完整信息
        const shouldMaskSensitiveInfo = !isSuperAdmin && !isOwnCustomer && !isAssignedToUser;

        // 编辑权限：超级管理员、创建者、分配给的员工都可以编辑
        const canEdit = isSuperAdmin || isOwnCustomer || isAssignedToUser;

        // 删除权限：超级管理员或创建者可以删除
        const canDelete = isSuperAdmin || isOwnCustomer;

        return {
          assignedTime: customer.assignedTime,
          assignedTo: customer.assignedTo
            ? {
                id: customer.assignedTo.id,
                name: customer.assignedTo.nickName
              }
            : null,
          assignedBy: customer.assignedBy
            ? {
                id: customer.assignedBy.id,
                name: customer.assignedBy.nickName
              }
            : null,
          canDelete,
          canEdit,
          company: customer.company,
          createdAt: customer.createdAt,
          createdBy: customer.createdBy
            ? {
                id: customer.createdBy.id,
                name: customer.createdBy.nickName
              }
            : null,
          customerName: shouldMaskSensitiveInfo ? '***' : customer.customerName,
          gender: customer.gender,
          email: shouldMaskSensitiveInfo ? '***' : customer.email,
          followStatus: customer.followStatus,
          id: customer.id,
          industry: customer.industry,
          level: customer.level,
          mobile: shouldMaskSensitiveInfo ? '***' : customer.mobile,
          nextFollowTime: customer.nextFollowTime,
          phone: shouldMaskSensitiveInfo ? '***' : customer.phone,
          position: customer.position,
          remark: customer.remark,
          source: customer.source,
          updatedAt: customer.updatedAt,
          wechat: shouldMaskSensitiveInfo ? '***' : customer.wechat
        };
      });

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

            // 权限控制：根据角色决定可访问的客户范围
      if (user?.roles?.includes('super_admin')) {
        // 超级管理员：可以查看所有客户
        // 不添加任何限制条件
      } else if (user?.roles?.includes('admin')) {
        // 管理员：可以查看自己创建的客户 + 其管理的员工创建的客户 + 分配给自己的客户
        const managedEmployeeIds = await prisma.employeeManagerRelation.findMany({
          where: { managerId: user.id },
          select: { employeeId: true }
        });

        const allowedCreatorIds = [user.id, ...managedEmployeeIds.map(rel => rel.employeeId)];
        where.OR = [
          { createdById: { in: allowedCreatorIds } },
          { assignedToId: user.id }
        ];
      } else {
        // 普通员工：只能查看分配给自己的客户
        where.assignedToId = user?.id;
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
          assignedBy: {
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

      // 判断是否需要脱敏处理
      const isOwnCustomer = customer.createdById === user?.id;
      const isAssignedToUser = customer.assignedToId === user?.id;
      const isSuperAdmin = user?.roles?.includes('super_admin');
      const shouldMaskSensitiveInfo = !isSuperAdmin && !isOwnCustomer && !isAssignedToUser;

      const result = {
        assignedTime: customer.assignedTime,
        assignedTo: customer.assignedTo
          ? {
              id: customer.assignedTo.id,
              name: customer.assignedTo.nickName
            }
          : null,
        assignedBy: customer.assignedBy
          ? {
              id: customer.assignedBy.id,
              name: customer.assignedBy.nickName
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
        // 对管理员查看其管理员工创建的客户进行脱敏
        customerName: shouldMaskSensitiveInfo ? '***' : customer.customerName,
        email: shouldMaskSensitiveInfo ? '***' : customer.email,
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
        mobile: shouldMaskSensitiveInfo ? '***' : customer.mobile,
        nextFollowTime: customer.nextFollowTime,
        phone: shouldMaskSensitiveInfo ? '***' : customer.phone,
        position: customer.position,
        remark: customer.remark,
        source: customer.source,
        updatedAt: customer.updatedAt,
        wechat: shouldMaskSensitiveInfo ? '***' : customer.wechat
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
      gender,
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

    if (!mobile && !phone) {
      throw new ValidationError('手机号不能为空');
    }

    if (!req.user) {
      throw new ValidationError('用户未认证');
    }

    try {
      // 检查是否已存在相同的客户（根据单位名称和手机号）
      // 只在当前用户权限范围内的客户中查找重复
      const duplicateCheckWhere: any = {};

      // 添加手机号检查条件（手机号或电话号码任一匹配即视为重复）
      if (mobile || phone) {
        const phoneConditions = [];
        if (mobile) {
          phoneConditions.push(
            { mobile: mobile },
            { phone: mobile }
          );
        }
        if (phone) {
          phoneConditions.push(
            { mobile: phone },
            { phone: phone }
          );
        }
        duplicateCheckWhere.AND = [
          { company: company },
          { OR: phoneConditions }
        ];
      }

      // 应用权限控制：只检查用户权限范围内的客户
      if (req.user?.roles?.includes('super_admin')) {
        // 超级管理员：可以看到所有客户数据，不添加限制
      } else if (req.user?.roles?.includes('admin')) {
        // 管理员：可以看到自己创建的客户 + 其管理的员工创建的客户 + 分配给自己的客户
        const managedEmployeeIds = await prisma.employeeManagerRelation.findMany({
          where: { managerId: req.user.id },
          select: { employeeId: true }
        });

        const allowedCreatorIds = [req.user.id, ...managedEmployeeIds.map(rel => rel.employeeId)];
        const permissionConditions = [
          { createdById: { in: allowedCreatorIds } },
          { assignedToId: req.user.id }
        ];

        if (duplicateCheckWhere.AND) {
          duplicateCheckWhere.AND.push({ OR: permissionConditions });
        } else {
          duplicateCheckWhere.OR = permissionConditions;
        }
      } else {
        // 普通员工：只能看到分配给自己的客户
        if (duplicateCheckWhere.AND) {
          duplicateCheckWhere.AND.push({ assignedToId: req.user.id });
        } else {
          duplicateCheckWhere.assignedToId = req.user.id;
        }
      }

      const existingCustomer = await prisma.customer.findFirst({
        where: duplicateCheckWhere
      });

      if (existingCustomer) {
        const phoneNumber = mobile || phone;
        throw new ValidationError(`单位 ${company} 的手机号 ${phoneNumber} 已存在`);
      }
      const customer = await prisma.customer.create({
        data: {
          assignedToId: req.user.id, // 创建者默认成为负责人
          assignedById: req.user.id, // 创建者也是分配者
          assignedTime: new Date(), // 设置分配时间
          company,
          createdById: req.user.id,
          customerName,
          gender,
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
            gender: customer.gender,
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
      gender,
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
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: Number(id) }
      });

      if (!existingCustomer) {
        throw new NotFoundError('客户不存在');
      }

      // 权限控制：超级管理员可以修改所有客户，创建者可以修改自己创建的客户，分配给的员工也可以修改
      const isSuperAdmin = req.user.roles?.includes('super_admin');
      const isCreator = existingCustomer.createdById === req.user.id;
      const isAssignedUser = existingCustomer.assignedToId === req.user.id;

      if (!isSuperAdmin && !isCreator && !isAssignedUser) {
        throw new NotFoundError('您没有权限修改此客户');
      }

      const customer = await prisma.customer.update({
        data: {
          company,
          customerName,
          gender,
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
            gender: customer.gender,
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

      // 权限控制：根据权限角色决定数据范围
      if (user?.roles?.includes('super_admin')) {
        // 超级管理员：可以看到所有客户数据
        // 不添加任何限制条件
      } else if (user?.roles?.includes('admin')) {
        // 管理员：可以看到自己创建的客户 + 其管理的员工创建的客户 + 分配给自己的客户
        const managedEmployeeIds = await prisma.employeeManagerRelation.findMany({
          where: { managerId: user.id },
          select: { employeeId: true }
        });

        const allowedCreatorIds = [user.id, ...managedEmployeeIds.map(rel => rel.employeeId)];
        where.OR = [
          { createdById: { in: allowedCreatorIds } },
          { assignedToId: user.id }
        ];
      } else {
        // 普通员工：只能看到分配给自己的客户
        where.assignedToId = user?.id;
      }

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
          // Excel列顺序：A=姓名, B=性别, C=单位, D=职位, E=电话, F=手机, G=跟进, H=状态
          const rawStatus = row[7]?.toString().trim() || '';

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

          // 处理状态：如果状态为空，设置为 'empty'；如果有值但无效，使用 'consult' 作为兜底
          let followStatus = 'empty'; // 默认为空状态
          if (rawStatus) {
            followStatus = statusMap[rawStatus] || 'consult';
          }

          const customerData = {
            customerName: row[0]?.toString().trim() || '',        // A列：姓名
            gender: row[1]?.toString().trim() || '',              // B列：性别
            company: row[2]?.toString().trim() || '',             // C列：单位
            position: row[3]?.toString().trim() || '',            // D列：职位
            phone: row[4]?.toString().trim() || '',               // E列：电话
            mobile: row[5]?.toString().trim() || '',              // F列：手机
            remark: row[6]?.toString().trim() || '',              // G列：跟进
            followStatus,                                         // H列：状态
            assignedToId: req.user.id, // 导入者默认成为负责人
            assignedById: req.user.id, // 导入者也是分配者
            assignedTime: new Date(), // 设置分配时间
            createdById: req.user.id,
            email: '', // 邮箱暂时为空，可后续补充
            industry: 'other',
            level: 1,
            source: 'import'
          };

          // 验证必填字段
          if (!customerData.customerName || !customerData.company) {
            errors.push(`第${i + 2}行：客户姓名和公司名称不能为空`);
            failureCount++;
            continue;
          }

          // 检查是否已存在相同的客户（根据单位名称和手机号）
          // 只在当前用户权限范围内的客户中查找重复
          const duplicateCheckWhere: any = {
            company: customerData.company
          };

          // 添加手机号检查条件（手机号或电话号码任一匹配即视为重复）
          if (customerData.mobile || customerData.phone) {
            const phoneConditions = [];
            if (customerData.mobile) {
              phoneConditions.push(
                { mobile: customerData.mobile },
                { phone: customerData.mobile }
              );
            }
            if (customerData.phone) {
              phoneConditions.push(
                { mobile: customerData.phone },
                { phone: customerData.phone }
              );
            }
            duplicateCheckWhere.AND = [
              { company: customerData.company },
              { OR: phoneConditions }
            ];
            // 重置company条件，因为已经在AND中包含了
            delete duplicateCheckWhere.company;
          } else {
            // 如果没有手机号，跳过重复检查（或者可以设置为必须提供手机号）
            errors.push(`第${i + 2}行：手机号不能为空`);
            failureCount++;
            continue;
          }

          // 应用权限控制：只检查用户权限范围内的客户
          if (req.user?.roles?.includes('super_admin')) {
            // 超级管理员：可以看到所有客户数据，不添加限制
          } else if (req.user?.roles?.includes('admin')) {
            // 管理员：可以看到自己创建的客户 + 其管理的员工创建的客户 + 分配给自己的客户
            const managedEmployeeIds = await prisma.employeeManagerRelation.findMany({
              where: { managerId: req.user.id },
              select: { employeeId: true }
            });

            const allowedCreatorIds = [req.user.id, ...managedEmployeeIds.map(rel => rel.employeeId)];
            duplicateCheckWhere.OR = [
              { createdById: { in: allowedCreatorIds } },
              { assignedToId: req.user.id }
            ];
          } else {
            // 普通员工：只能看到分配给自己的客户
            duplicateCheckWhere.assignedToId = req.user.id;
          }

          const existingCustomer = await prisma.customer.findFirst({
            where: duplicateCheckWhere
          });

          if (existingCustomer) {
            const phoneNumber = customerData.mobile || customerData.phone;
            errors.push(`第${i + 2}行：单位 ${customerData.company} 的手机号 ${phoneNumber} 已存在`);
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
        errors: errors, // 返回所有错误信息，不做限制
        failureCount,
        hasMoreErrors: false, // 不再限制错误数量
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
    const user = (req as any).user!;

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

      // 权限控制：检查是否有权限分配给指定员工
      const isSuperAdmin = user.roles?.includes('super_admin');
      if (!isSuperAdmin) {
        const isAdmin = user.roles?.includes('admin');
        if (!isAdmin) {
          return res.status(403).json(createErrorResponse(403, '没有权限分配客户', null, req.path));
        }

        // 管理员只能分配给自己管理的员工
        const managedEmployee = await prisma.employeeManagerRelation.findFirst({
          where: {
            employeeId: assignedToId,
            managerId: user.id,
            status: 1
          }
        });

        if (!managedEmployee && assignedToId !== user.id) {
          return res.status(403).json(createErrorResponse(403, '您只能分配客户给自己管理的员工', null, req.path));
        }
      }

      // 验证客户是否存在且当前用户有权限操作这些客户
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

      // 权限控制：检查用户是否有权限操作这些客户
      if (!isSuperAdmin) {
        const managedEmployeeIds = await prisma.employeeManagerRelation.findMany({
          where: { managerId: user.id },
          select: { employeeId: true }
        });

        const allowedCreatorIds = [user.id, ...managedEmployeeIds.map(rel => rel.employeeId)];

        for (const customer of customers) {
          // 管理员只能分配：自己创建的客户、下属创建的客户、分配给自己的客户
          const canOperate = allowedCreatorIds.includes(customer.createdById!) ||
                           customer.assignedToId === user.id ||
                           customer.assignedById === user.id;

          if (!canOperate) {
            return res.status(403).json(createErrorResponse(403, `没有权限操作客户 ${customer.customerName}`, null, req.path));
          }
        }
      }

      // 检查是否已经存在分配关系（如果是重新分配，先删除旧的分配关系）
      const existingAssignments = await prisma.customerAssignment.findMany({
        where: {
          customerId: {
            in: customerIds.map(Number)
          }
        }
      });

      // 如果存在分配关系，检查是否需要更新
      const customersToReassign = existingAssignments.filter(assignment => assignment.assignedToId !== assignedToId);

      if (customersToReassign.length > 0) {
        // 删除旧的分配关系（重新分配）
        await prisma.customerAssignment.deleteMany({
          where: {
            id: {
              in: customersToReassign.map(a => a.id)
            }
          }
        });
      }

      // 检查是否有客户已经分配给目标员工
      const alreadyAssigned = existingAssignments.filter(assignment => assignment.assignedToId === assignedToId);
      if (alreadyAssigned.length > 0) {
        const assignedCustomerIds = alreadyAssigned.map(a => a.customerId);
        const assignedCustomers = customers.filter(customer => assignedCustomerIds.includes(customer.id));
        const names = assignedCustomers.map(customer => customer.customerName).join(', ');
        return res.status(400).json(createErrorResponse(400, `客户 ${names} 已经分配给该员工`, null, req.path));
      }

      // 创建分配关系（只为需要新分配的客户）
      const customersNeedNewAssignment = customerIds.filter(customerId =>
        !alreadyAssigned.some(a => a.customerId === Number(customerId))
      );

      const assignments = await Promise.all(
        customersNeedNewAssignment.map(customerId =>
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

      // 同时更新customer表的assignedToId、assignedById和assignedTime，触发updatedAt更新
      await Promise.all(
        customerIds.map(customerId =>
          prisma.customer.update({
            data: {
              assignedTime: new Date(),
              assignedToId,
              assignedById,
              // 通过更新updatedAt确保排序时被分配的客户排在前面
              updatedAt: new Date()
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

      // 同时清除customer表的assignedToId、assignedById和assignedTime
      await prisma.customer.update({
        data: {
          assignedTime: null,
          assignedToId: null,
          assignedById: null
        },
        where: { id: assignment.customerId }
      });

      res.json(createSuccessResponse(null, '取消分配成功', req.path));
    } catch (error) {
      logger.error('取消客户分配失败:', error);
      res.status(500).json(createErrorResponse(500, '取消分配失败', null, req.path));
    }
  }

  /** 更新客户分配关系 */
  async updateCustomerAssignment(req: Request, res: Response) {
    const { id, customerId, employeeId, remark } = req.body;
    const user = (req as any).user;

    try {
      // 验证参数
      if (!id || !customerId || !employeeId) {
        throw new ValidationError('缺少必要参数');
      }

      // 检查分配关系是否存在
      const existingAssignment = await prisma.customerAssignment.findUnique({
        where: { id: Number(id) }
      });

      if (!existingAssignment) {
        throw new NotFoundError('客户分配关系不存在');
      }

      // 权限控制：只有超级管理员或创建者可以修改分配关系
      if (!user.roles?.includes('super_admin') && existingAssignment.assignedById !== user.id) {
        return res.status(403).json(createErrorResponse(403, '无权修改此分配关系', null, req.path));
      }

      // 检查客户是否存在
      const customer = await prisma.customer.findUnique({
        where: { id: Number(customerId) }
      });

      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      // 检查员工是否存在
      const employee = await prisma.user.findUnique({
        where: { id: Number(employeeId) }
      });

      if (!employee) {
        throw new NotFoundError('员工不存在');
      }

      // 更新分配关系
      const updatedAssignment = await prisma.customerAssignment.update({
        data: {
          customerId: Number(customerId),
          assignedToId: Number(employeeId),
          remark: remark || null
        },
        where: { id: Number(id) }
      });

      // 更新客户表中的分配信息
      await prisma.customer.update({
        data: {
          assignedTime: new Date(),
          assignedToId: Number(employeeId),
          assignedById: user.id,
          updatedAt: new Date()
        },
        where: { id: Number(customerId) }
      });

      res.json(createSuccessResponse(updatedAssignment, '更新成功', req.path));
    } catch (error) {
      logger.error('更新客户分配关系失败:', error);

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        res.status(error.code).json(createErrorResponse(error.code, error.message, null, req.path));
      } else {
        res.status(500).json(createErrorResponse(500, '更新客户分配关系失败', null, req.path));
      }
    }
  }
}

export const customerController = new CustomerController();
