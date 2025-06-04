import express from 'express';

import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { createErrorResponse, createSuccessResponse } from '../utils/response';

const router = express.Router();

// 获取费用申请列表
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { applicantId, current = 1, expenseType, size = 10, status } = req.query;

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
        include: {
          applicant: {
            select: {
              department: {
                select: {
                  name: true
                }
              },
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
          },
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take,
        where
      }),
      prisma.expenseApplication.count({ where })
    ]);

    const records = applications.map(app => ({
      amount: Number(app.totalAmount),
      applicant: {
        id: app.applicant.id,
        name: app.applicant.nickName || app.applicant.userName
      },
      applicationNo: app.applicationNo,
      applicationTime: app.createdAt.toISOString(),
      approvalTime: app.approvalTime?.toISOString(),
      approver: app.approver
        ? {
            id: app.approver.id,
            name: app.approver.nickName || app.approver.userName
          }
        : null,
      attachments: app.attachments as any[],
      department: app.applicant.department?.name || '未知部门',
      description: app.applicationReason,
      expenseType: app.expenseType,
      id: app.id,
      remark: app.approvalComment,
      status: app.applicationStatus
    }));

    const responseData = {
      current: Number(current),
      pages: Math.ceil(total / Number(size)),
      records,
      size: Number(size),
      total
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
      include: {
        applicant: {
          select: {
            department: {
              select: {
                name: true
              }
            },
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
        },
        items: true
      },
      where: { id: Number(id) }
    });

    if (!application) {
      return res.status(404).json(createErrorResponse(404, '费用申请不存在', null, req.path));
    }

    const result = {
      amount: Number(application.totalAmount),
      applicant: {
        id: application.applicant.id,
        name: application.applicant.nickName || application.applicant.userName
      },
      applicationNo: application.applicationNo,
      applicationTime: application.createdAt.toISOString(),
      approvalTime: application.approvalTime?.toISOString(),
      approver: application.approver
        ? {
            id: application.approver.id,
            name: application.approver.nickName || application.approver.userName
          }
        : null,
      attachments: application.attachments as any[],
      department: application.applicant.department?.name || '未知部门',
      description: application.applicationReason,
      expenseType: application.expenseType,
      id: application.id,
      items: application.items.map(item => ({
        amount: Number(item.amount),
        description: item.description,
        expenseDate: item.expenseDate.toISOString(),
        id: item.id,
        itemName: item.itemName,
        itemType: item.itemType,
        receiptNo: item.receiptNo,
        vendor: item.vendor
      })),
      remark: application.approvalComment,
      status: application.applicationStatus
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
    const { applicationReason, expensePeriodEnd, expensePeriodStart, expenseType, items, remark } = req.body;
    const userId = (req as any).user.id;
    const userName = (req as any).user.userName || (req as any).user.nickName;

    // 生成申请编号
    const applicationNo = `EXP${Date.now()}`;

    // 计算总金额
    const totalAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const application = await prisma.expenseApplication.create({
      data: {
        applicantId: userId,
        applicationNo,
        applicationReason,
        expensePeriodEnd: expensePeriodEnd ? new Date(expensePeriodEnd) : null,
        expensePeriodStart: expensePeriodStart ? new Date(expensePeriodStart) : null,
        expenseType,
        items: {
          create: items.map((item: any) => ({
            amount: Number(item.amount),
            description: item.description,
            expenseDate: new Date(item.expenseDate),
            itemName: item.itemName,
            itemType: item.itemType,
            receiptNo: item.receiptNo,
            vendor: item.vendor
          }))
        },
        remark,
        totalAmount
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

    // 获取所有超级管理员并发送通知
    try {
      const superAdmins = await prisma.user.findMany({
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        },
        where: {
          userRoles: {
            some: {
              role: {
                roleCode: 'super_admin'
              }
            }
          }
        }
      });

      // 为每个超级管理员创建通知
      const notifications = superAdmins.map(admin => ({
        content: `${userName}提交了新的报销申请：${applicationReason || '无备注'}，申请金额：¥${totalAmount}，请及时审核处理。`,
        relatedId: application.id,
        relatedType: 'expense_application',
        userId: admin.id,
        title: '新报销申请待审核',
        type: 'expense',
        createTime: new Date().toISOString()
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });

        logger.info(`已为${notifications.length}个超级管理员创建报销申请通知`, {
          applicationId: application.id,
          applicationNo: application.applicationNo
        });
      }
    } catch (notificationError) {
      logger.error('创建审批通知失败:', notificationError);
      // 不影响主流程，继续执行
    }

    const result = {
      amount: Number(application.totalAmount),
      applicant: {
        id: application.applicant.id,
        name: application.applicant.nickName || application.applicant.userName
      },
      applicationNo: application.applicationNo,
      applicationTime: application.createdAt.toISOString(),
      description: application.applicationReason,
      expenseType: application.expenseType,
      id: application.id,
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
    const { remark, status } = req.body;
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
      data: {
        applicationStatus: Number(status),
        approvalComment: remark,
        approvalTime: new Date(),
        currentApproverId: userId
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
      },
      where: { id: Number(id) }
    });

    // 发送审批结果通知给申请人
    try {
      const statusText = Number(status) === 1 ? '通过' : '拒绝';
      const approverName = (req as any).user.nickName || (req as any).user.userName;

      await prisma.notification.create({
        data: {
          userId: updatedApplication.applicantId,
          title: `报销申请审批${statusText}`,
          content: `您的报销申请 (编号: ${updatedApplication.applicationNo}) 已被${approverName}${statusText}。${remark ? '审批意见：' + remark : ''}`,
          type: Number(status) === 1 ? 'success' : 'warning',
          relatedId: updatedApplication.id,
          relatedType: 'expense_application',
          createTime: new Date().toISOString()
        }
      });

      logger.info(`已为申请人创建审批结果通知`, {
        applicationId: updatedApplication.id,
        applicationNo: updatedApplication.applicationNo,
        approvalResult: statusText
      });
    } catch (notificationError) {
      logger.error('创建审批结果通知失败:', notificationError);
      // 不影响主流程，继续执行
    }

    const result = {
      amount: Number(updatedApplication.totalAmount),
      applicant: {
        id: updatedApplication.applicant.id,
        name: updatedApplication.applicant.nickName || updatedApplication.applicant.userName
      },
      applicationNo: updatedApplication.applicationNo,
      applicationTime: updatedApplication.createdAt.toISOString(),
      approvalTime: updatedApplication.approvalTime?.toISOString(),
      approver: updatedApplication.approver
        ? {
            id: updatedApplication.approver.id,
            name: updatedApplication.approver.nickName || updatedApplication.approver.userName
          }
        : null,
      description: updatedApplication.applicationReason,
      expenseType: updatedApplication.expenseType,
      id: updatedApplication.id,
      remark: updatedApplication.approvalComment,
      status: updatedApplication.applicationStatus
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
    const { applicationReason, expensePeriodEnd, expensePeriodStart, expenseType, items, remark } = req.body;
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
    const totalAmount = items
      ? items.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
      : application.totalAmount;

    const updatedApplication = await prisma.expenseApplication.update({
      data: {
        applicationReason: applicationReason || application.applicationReason,
        expensePeriodEnd: expensePeriodEnd ? new Date(expensePeriodEnd) : application.expensePeriodEnd,
        expensePeriodStart: expensePeriodStart ? new Date(expensePeriodStart) : application.expensePeriodStart,
        expenseType: expenseType || application.expenseType,
        remark: remark || application.remark,
        totalAmount
      },
      include: {
        applicant: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number(id) }
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
          amount: Number(item.amount),
          applicationId: Number(id),
          description: item.description,
          expenseDate: new Date(item.expenseDate),
          itemName: item.itemName,
          itemType: item.itemType,
          receiptNo: item.receiptNo,
          vendor: item.vendor
        }))
      });
    }

    const result = {
      amount: Number(updatedApplication.totalAmount),
      applicant: {
        id: updatedApplication.applicant.id,
        name: updatedApplication.applicant.nickName || updatedApplication.applicant.userName
      },
      applicationNo: updatedApplication.applicationNo,
      applicationTime: updatedApplication.createdAt.toISOString(),
      description: updatedApplication.applicationReason,
      expenseType: updatedApplication.expenseType,
      id: updatedApplication.id,
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
    const { month, status, year } = req.query;

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
        _sum: { totalAmount: true },
        where
      }),
      prisma.expenseApplication.count({ where: { ...where, applicationStatus: 0 } }),
      prisma.expenseApplication.aggregate({
        _sum: { totalAmount: true },
        where: { ...where, applicationStatus: 0 }
      }),
      prisma.expenseApplication.count({ where: { ...where, applicationStatus: 1 } }),
      prisma.expenseApplication.aggregate({
        _sum: { totalAmount: true },
        where: { ...where, applicationStatus: 1 }
      }),
      prisma.expenseApplication.count({ where: { ...where, applicationStatus: 2 } }),
      prisma.expenseApplication.aggregate({
        _sum: { totalAmount: true },
        where: { ...where, applicationStatus: 2 }
      })
    ]);

    const statistics = {
      approvedAmount: Number(approvedAmount._sum.totalAmount || 0),
      approvedCount,
      pendingAmount: Number(pendingAmount._sum.totalAmount || 0),
      pendingCount,
      rejectedAmount: Number(rejectedAmount._sum.totalAmount || 0),
      rejectedCount,
      totalAmount: Number(totalAmount._sum.totalAmount || 0),
      totalCount
    };

    res.json(createSuccessResponse(statistics, '获取费用统计成功', req.path));
  } catch (error) {
    logger.error('获取费用统计失败:', error);
    res.status(500).json(createErrorResponse(500, '获取费用统计失败', error, req.path));
  }
});

export default router;
