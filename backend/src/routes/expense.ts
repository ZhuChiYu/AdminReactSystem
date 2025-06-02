import express from 'express';
import { prisma } from '../config/database';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// 获取费用申请列表
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { current = 1, size = 10, status, applicantId, expenseType } = req.query;
    
    const skip = (Number(current) - 1) * Number(size);
    const take = Number(size);

    const where: any = {};
    
    if (status !== undefined) {
      where.applicationStatus = Number(status);
    }
    
    if (applicantId) {
      where.applicantId = Number(applicantId);
    }
    
    if (expenseType) {
      where.expenseType = expenseType as string;
    }

    const [applications, total] = await Promise.all([
      prisma.expenseApplication.findMany({
        where,
        skip,
        take,
        include: {
          applicant: {
            select: {
              id: true,
              nickName: true,
              userName: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          approver: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          },
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.expenseApplication.count({ where })
    ]);

    const records = applications.map(app => ({
      id: app.id,
      applicationNo: app.applicationNo,
      applicant: {
        id: app.applicant.id,
        name: app.applicant.nickName || app.applicant.userName
      },
      department: app.applicant.department?.name || '未知部门',
      expenseType: app.expenseType,
      amount: Number(app.totalAmount),
      description: app.applicationReason,
      applicationTime: app.createdAt.toISOString(),
      status: app.applicationStatus,
      approver: app.approver ? {
        id: app.approver.id,
        name: app.approver.nickName || app.approver.userName
      } : null,
      approvalTime: app.approvalTime?.toISOString(),
      remark: app.approvalComment,
      attachments: app.attachments as any[]
    }));

    const responseData = {
      records,
      total,
      current: Number(current),
      size: Number(size),
      pages: Math.ceil(total / Number(size))
    };

    res.json(createSuccessResponse(responseData, '获取费用申请列表成功', req.path));
  } catch (error) {
    logger.error('获取费用申请列表失败:', error);
    res.status(500).json(createErrorResponse(500, '获取费用申请列表失败', error, req.path));
  }
});

// 获取费用申请详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await prisma.expenseApplication.findUnique({
      where: { id: Number(id) },
      include: {
        applicant: {
          select: {
            id: true,
            nickName: true,
            userName: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        approver: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        },
        items: true
      }
    });

    if (!application) {
      return res.status(404).json(createErrorResponse(404, '费用申请不存在', null, req.path));
    }

    const result = {
      id: application.id,
      applicationNo: application.applicationNo,
      applicant: {
        id: application.applicant.id,
        name: application.applicant.nickName || application.applicant.userName
      },
      department: application.applicant.department?.name || '未知部门',
      expenseType: application.expenseType,
      amount: Number(application.totalAmount),
      description: application.applicationReason,
      applicationTime: application.createdAt.toISOString(),
      status: application.applicationStatus,
      approver: application.approver ? {
        id: application.approver.id,
        name: application.approver.nickName || application.approver.userName
      } : null,
      approvalTime: application.approvalTime?.toISOString(),
      remark: application.approvalComment,
      attachments: application.attachments as any[],
      items: application.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        itemType: item.itemType,
        expenseDate: item.expenseDate.toISOString(),
        amount: Number(item.amount),
        description: item.description,
        receiptNo: item.receiptNo,
        vendor: item.vendor
      }))
    };

    res.json(createSuccessResponse(result, '获取费用申请详情成功', req.path));
  } catch (error) {
    logger.error('获取费用申请详情失败:', error);
    res.status(500).json(createErrorResponse(500, '获取费用申请详情失败', error, req.path));
  }
});

// 创建费用申请
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { expenseType, applicationReason, expensePeriodStart, expensePeriodEnd, remark, items } = req.body;
    const userId = (req as any).user.id;

    // 生成申请编号
    const applicationNo = `EXP${Date.now()}`;
    
    // 计算总金额
    const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const application = await prisma.expenseApplication.create({
      data: {
        applicationNo,
        applicantId: userId,
        expenseType,
        totalAmount,
        applicationReason,
        expensePeriodStart: expensePeriodStart ? new Date(expensePeriodStart) : null,
        expensePeriodEnd: expensePeriodEnd ? new Date(expensePeriodEnd) : null,
        remark,
        items: {
          create: items.map((item: any) => ({
            itemName: item.itemName,
            itemType: item.itemType,
            expenseDate: new Date(item.expenseDate),
            amount: Number(item.amount),
            description: item.description,
            receiptNo: item.receiptNo,
            vendor: item.vendor
          }))
        }
      },
      include: {
        applicant: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        },
        items: true
      }
    });

    const result = {
      id: application.id,
      applicationNo: application.applicationNo,
      applicant: {
        id: application.applicant.id,
        name: application.applicant.nickName || application.applicant.userName
      },
      expenseType: application.expenseType,
      amount: Number(application.totalAmount),
      description: application.applicationReason,
      applicationTime: application.createdAt.toISOString(),
      status: application.applicationStatus
    };

    res.status(201).json(createSuccessResponse(result, '费用申请创建成功', req.path));
  } catch (error) {
    logger.error('创建费用申请失败:', error);
    res.status(500).json(createErrorResponse(500, '创建费用申请失败', error, req.path));
  }
});

// 审批费用申请
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    const userId = (req as any).user.id;

    const application = await prisma.expenseApplication.findUnique({
      where: { id: Number(id) }
    });

    if (!application) {
      return res.status(404).json(createErrorResponse(404, '费用申请不存在', null, req.path));
    }

    if (application.applicationStatus !== 0) {
      return res.status(400).json(createErrorResponse(400, '该申请已被处理', null, req.path));
    }

    const updatedApplication = await prisma.expenseApplication.update({
      where: { id: Number(id) },
      data: {
        applicationStatus: Number(status),
        currentApproverId: userId,
        approvalTime: new Date(),
        approvalComment: remark
      },
      include: {
        applicant: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        },
        approver: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      }
    });

    const result = {
      id: updatedApplication.id,
      applicationNo: updatedApplication.applicationNo,
      applicant: {
        id: updatedApplication.applicant.id,
        name: updatedApplication.applicant.nickName || updatedApplication.applicant.userName
      },
      expenseType: updatedApplication.expenseType,
      amount: Number(updatedApplication.totalAmount),
      description: updatedApplication.applicationReason,
      applicationTime: updatedApplication.createdAt.toISOString(),
      status: updatedApplication.applicationStatus,
      approver: updatedApplication.approver ? {
        id: updatedApplication.approver.id,
        name: updatedApplication.approver.nickName || updatedApplication.approver.userName
      } : null,
      approvalTime: updatedApplication.approvalTime?.toISOString(),
      remark: updatedApplication.approvalComment
    };

    res.json(createSuccessResponse(result, '费用申请审批成功', req.path));
  } catch (error) {
    logger.error('审批费用申请失败:', error);
    res.status(500).json(createErrorResponse(500, '审批费用申请失败', error, req.path));
  }
});

// 更新费用申请
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseType, applicationReason, expensePeriodStart, expensePeriodEnd, remark, items } = req.body;
    const userId = (req as any).user.id;

    const application = await prisma.expenseApplication.findUnique({
      where: { id: Number(id) }
    });

    if (!application) {
      return res.status(404).json(createErrorResponse(404, '费用申请不存在', null, req.path));
    }

    if (application.applicantId !== userId) {
      return res.status(403).json(createErrorResponse(403, '无权限修改此申请', null, req.path));
    }

    if (application.applicationStatus !== 0) {
      return res.status(400).json(createErrorResponse(400, '已审批的申请无法修改', null, req.path));
    }

    // 计算总金额
    const totalAmount = items ? items.reduce((sum: number, item: any) => sum + Number(item.amount), 0) : application.totalAmount;

    const updatedApplication = await prisma.expenseApplication.update({
      where: { id: Number(id) },
      data: {
        expenseType: expenseType || application.expenseType,
        totalAmount: totalAmount,
        applicationReason: applicationReason || application.applicationReason,
        expensePeriodStart: expensePeriodStart ? new Date(expensePeriodStart) : application.expensePeriodStart,
        expensePeriodEnd: expensePeriodEnd ? new Date(expensePeriodEnd) : application.expensePeriodEnd,
        remark: remark || application.remark
      },
      include: {
        applicant: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      }
    });

    // 如果提供了items，更新费用项目
    if (items) {
      // 删除原有项目
      await prisma.expenseItem.deleteMany({
        where: { applicationId: Number(id) }
      });

      // 创建新项目
      await prisma.expenseItem.createMany({
        data: items.map((item: any) => ({
          applicationId: Number(id),
          itemName: item.itemName,
          itemType: item.itemType,
          expenseDate: new Date(item.expenseDate),
          amount: Number(item.amount),
          description: item.description,
          receiptNo: item.receiptNo,
          vendor: item.vendor
        }))
      });
    }

    const result = {
      id: updatedApplication.id,
      applicationNo: updatedApplication.applicationNo,
      applicant: {
        id: updatedApplication.applicant.id,
        name: updatedApplication.applicant.nickName || updatedApplication.applicant.userName
      },
      expenseType: updatedApplication.expenseType,
      amount: Number(updatedApplication.totalAmount),
      description: updatedApplication.applicationReason,
      applicationTime: updatedApplication.createdAt.toISOString(),
      status: updatedApplication.applicationStatus
    };

    res.json(createSuccessResponse(result, '费用申请更新成功', req.path));
  } catch (error) {
    logger.error('更新费用申请失败:', error);
    res.status(500).json(createErrorResponse(500, '更新费用申请失败', error, req.path));
  }
});

// 删除费用申请
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const application = await prisma.expenseApplication.findUnique({
      where: { id: Number(id) }
    });

    if (!application) {
      return res.status(404).json(createErrorResponse(404, '费用申请不存在', null, req.path));
    }

    if (application.applicantId !== userId) {
      return res.status(403).json(createErrorResponse(403, '无权限删除此申请', null, req.path));
    }

    if (application.applicationStatus !== 0) {
      return res.status(400).json(createErrorResponse(400, '已审批的申请无法删除', null, req.path));
    }

    await prisma.expenseApplication.delete({
      where: { id: Number(id) }
    });

    res.json(createSuccessResponse(null, '费用申请删除成功', req.path));
  } catch (error) {
    logger.error('删除费用申请失败:', error);
    res.status(500).json(createErrorResponse(500, '删除费用申请失败', error, req.path));
  }
});

// 获取费用统计
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const { year, month, status } = req.query;
    
    const where: any = {};
    
    if (year && month) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }
    
    if (status !== undefined) {
      where.applicationStatus = Number(status);
    }

    const [
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      rejectedCount,
      rejectedAmount
    ] = await Promise.all([
      prisma.expenseApplication.count({ where }),
      prisma.expenseApplication.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.expenseApplication.count({ where: { ...where, applicationStatus: 0 } }),
      prisma.expenseApplication.aggregate({
        where: { ...where, applicationStatus: 0 },
        _sum: { totalAmount: true }
      }),
      prisma.expenseApplication.count({ where: { ...where, applicationStatus: 1 } }),
      prisma.expenseApplication.aggregate({
        where: { ...where, applicationStatus: 1 },
        _sum: { totalAmount: true }
      }),
      prisma.expenseApplication.count({ where: { ...where, applicationStatus: 2 } }),
      prisma.expenseApplication.aggregate({
        where: { ...where, applicationStatus: 2 },
        _sum: { totalAmount: true }
      })
    ]);

    const statistics = {
      totalCount,
      totalAmount: Number(totalAmount._sum.totalAmount || 0),
      pendingCount,
      pendingAmount: Number(pendingAmount._sum.totalAmount || 0),
      approvedCount,
      approvedAmount: Number(approvedAmount._sum.totalAmount || 0),
      rejectedCount,
      rejectedAmount: Number(rejectedAmount._sum.totalAmount || 0)
    };

    res.json(createSuccessResponse(statistics, '获取费用统计成功', req.path));
  } catch (error) {
    logger.error('获取费用统计失败:', error);
    res.status(500).json(createErrorResponse(500, '获取费用统计失败', error, req.path));
  }
});

export default router; 