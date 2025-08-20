import fs from 'node:fs';
import path from 'node:path';

import express from 'express';
import multer from 'multer';

import { prisma } from '@/config/database';
import { authMiddleware } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

const router = express.Router();

/**
 * 创建通知附件系统通知
 */
async function createNotificationAttachmentSystemNotification(title: string, content: string, relatedId?: number, relatedType?: string) {
  try {
    // 创建一条系统通知，所有用户都能看到
    await prisma.notification.create({
      data: {
        title,
        content,
        type: 'notification_attachment',
        userId: 0, // 系统通知
        readStatus: 0,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        createTime: new Date().toISOString()
      }
    });

    logger.info(`成功创建通知附件系统通知: ${title}`);
  } catch (error) {
    logger.error('创建通知附件系统通知失败:', error);
    // 不抛出错误，避免影响主要业务流程
  }
}

// 配置通知附件上传
const uploadsDir = 'uploads/notification-attachments';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `notification-attachment-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  fileFilter: (req, file, cb) => {
    // 允许常见的文档和媒体格式
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'audio/mpeg',
      'application/zip',
      'application/x-rar-compressed'
    ];

    // 修复中文文件名编码问题
    if (file.originalname) {
      try {
        const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
        file.originalname = decoded;
      } catch (error) {
        console.warn('文件名编码修复失败:', error);
      }
    }

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  storage
});

// 获取文件扩展名
function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext.substring(1); // 移除点号
}

// 获取通知列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { current = 1, readStatus, relatedId, relatedType, size = 10, title, type } = req.query;

    const where: any = {};

    // 用户隔离：只显示当前用户的通知或系统通知
    const currentUserId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    if (currentUserId) {
      if (isSuperAdmin) {
        // 超级管理员可以看到自己的通知、系统通知以及审批类通知，以及所有事项相关通知
        // 但排除具体的班级通知公告内容，它们应该在班级管理页面中显示
        where.OR = [
          { userId: currentUserId }, // 当前用户的通知
          { userId: 0 }, // 系统通知
          { type: 'expense' }, // 报销审批通知
          { type: 'meeting_approval' }, // 会议审批通知
          { type: 'info' }, // 事项通知
          { type: 'success' }, // 成功通知
          { type: 'warning' }, // 警告通知
          { type: 'task' }, // 任务通知
          { type: 'project_task' }, // 项目任务通知
          { type: 'class_announcement_system' }, // 班级通知公告系统通知
          { type: 'course_attachment' }, // 课程附件通知
          {
            AND: [
              { type: 'meeting' },
              { title: { contains: '审批' } } // 包含"审批"字样的会议通知
            ]
          }
        ];

        // 如果没有明确指定type，才排除某些类型的通知
        if (!type) {
          // 明确排除具体的班级通知公告内容（只在班级详情页面显示）
          where.AND = [
            ...(where.AND || []),
            { type: { not: 'class_announcement' } }
          ];
        }
      } else {
        // 普通用户只能看到自己的通知和系统通知，但排除审批类通知和具体的班级通知公告内容
        where.OR = [
          {
            AND: [
              { userId: currentUserId },
              {
                OR: [
                  { type: { notIn: ['expense', 'meeting', 'class_announcement'] } }, // 排除报销、会议和班级通知公告通知，但保留课程附件通知
                  {
                    AND: [
                      { type: 'meeting' },
                      { title: { not: { contains: '审批' } } } // 允许非审批的会议通知
                    ]
                  }
                ]
              }
            ]
          },
          {
            AND: [
              { userId: 0 }, // 系统通知
              {
                OR: [
                  { type: { notIn: ['expense', 'meeting', 'class_announcement'] } }, // 排除报销、会议和班级通知公告系统通知，但保留课程附件通知
                  {
                    AND: [
                      { type: 'meeting' },
                      { title: { not: { contains: '审批' } } } // 允许非审批的会议系统通知
                    ]
                  }
                ]
              }
            ]
          }
        ];

        // 如果明确指定了type（如班级详情页面指定class_announcement），则允许获取
        if (type === 'class_announcement') {
          // 重新构建查询条件，允许获取指定班级的通知公告
          where.OR = [
            {
              AND: [
                { userId: currentUserId },
                { type: type as string }
              ]
            },
            {
              AND: [
                { userId: 0 },
                { type: type as string }
              ]
            }
          ];
        }
      }
    } else {
      // 如果没有用户信息，只显示非审批类的系统通知，但排除具体的班级通知公告内容
      if (!type) {
        where.AND = [
          { userId: 0 },
          { type: { notIn: ['expense', 'meeting_approval', 'class_announcement'] } } // 保留课程附件通知
        ];
      } else {
        // 如果明确指定了type，允许获取
        where.AND = [
          { userId: 0 },
          { type: type as string }
        ];
      }
    }

    // 构建额外的查询条件，与权限条件进行AND组合
    const additionalConditions: any = {};

    if (type) {
      additionalConditions.type = type as string;
    }

    if (title) {
      additionalConditions.title = {
        contains: title as string,
        mode: 'insensitive'
      };
    }

    if (relatedId) {
      additionalConditions.relatedId = Number.parseInt(relatedId as string);
    }

    if (relatedType) {
      additionalConditions.relatedType = relatedType as string;
    }

    // 将额外条件与权限条件组合
    if (Object.keys(additionalConditions).length > 0) {
      where.AND = [
        ...(where.AND || []),
        additionalConditions
      ];
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    // 获取通知列表，同时获取当前用户的已读状态
    const notifications = await prisma.notification.findMany({
      include: {
        userReadStatuses: {
          where: {
            userId: currentUserId
          }
        }
      },
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take,
      where
    });

    // 获取总数
    const total = await prisma.notification.count({ where });

    // 转换数据格式，包含用户的已读状态
    const formattedNotifications = notifications.map(notification => {
      const userReadStatus = notification.userReadStatuses[0];
      return {
        ...notification,
        readStatus: userReadStatus ? userReadStatus.readStatus : 0,
        readTime: userReadStatus ? userReadStatus.readTime?.toISOString() : null
      };
    });

    // 如果指定了readStatus过滤条件，需要在这里进行过滤
    let finalNotifications = formattedNotifications;
    if (readStatus !== undefined) {
      const targetReadStatus = Number.parseInt(readStatus as string);
      finalNotifications = formattedNotifications.filter(notification =>
        notification.readStatus === targetReadStatus
      );
    }

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / Number.parseInt(size as string)),
        records: finalNotifications.map(({ userReadStatuses, ...notification }) => notification),
        size: Number.parseInt(size as string),
        total: finalNotifications.length
      },
      message: '获取通知列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取通知列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取通知列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 标记通知为已读
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '用户未认证',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查通知是否存在且用户有权访问
    const notification = await prisma.notification.findFirst({
      where: {
        id: Number.parseInt(id),
        OR: [
          { userId: currentUserId },
          { userId: 0 } // 系统通知也可以被标记为已读
        ]
      }
    });

    if (!notification) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '通知不存在或无权访问',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 使用upsert来创建或更新用户的已读状态
    await prisma.userNotificationReadStatus.upsert({
      where: {
        userId_notificationId: {
          userId: currentUserId,
          notificationId: Number.parseInt(id)
        }
      },
      update: {
        readStatus: 1,
        readTime: new Date()
      },
      create: {
        userId: currentUserId,
        notificationId: Number.parseInt(id),
        readStatus: 1,
        readTime: new Date()
      }
    });

    res.json({
      code: 0,
      data: null,
      message: '标记已读成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('标记通知已读失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '标记通知已读失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 标记所有通知为已读
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const currentUserId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    if (!currentUserId) {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '用户未认证',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 构建查询条件，与获取通知列表的逻辑保持一致
    const where: any = {};

    if (isSuperAdmin) {
      // 超级管理员可以标记的通知类型
      where.OR = [
        { userId: currentUserId },
        { userId: 0 },
        { type: 'expense' },
        { type: 'meeting_approval' },
        { type: 'info' },
        { type: 'success' },
        { type: 'warning' },
        { type: 'task' },
        { type: 'project_task' },
        { type: 'class_announcement_system' },
        { type: 'course_attachment' }, // 重新允许课程附件通知
        {
          AND: [
            { type: 'meeting' },
            { title: { contains: '审批' } }
          ]
        }
      ];

      // 排除具体的班级通知公告内容（在系统通知中心的情况）
      where.AND = [
        { type: { not: 'class_announcement' } }
      ];
    } else {
      // 普通用户的通知
      where.OR = [
        {
          AND: [
            { userId: currentUserId },
            {
              OR: [
                { type: { notIn: ['expense', 'meeting', 'class_announcement'] } }, // 重新允许课程附件通知
                {
                  AND: [
                    { type: 'meeting' },
                    { title: { not: { contains: '审批' } } }
                  ]
                }
              ]
            }
          ]
        },
        {
          AND: [
            { userId: 0 },
            {
              OR: [
                { type: { notIn: ['expense', 'meeting', 'class_announcement'] } }, // 重新允许课程附件通知
                {
                  AND: [
                    { type: 'meeting' },
                    { title: { not: { contains: '审批' } } }
                  ]
                }
              ]
            }
          ]
        }
      ];
    }

    // 获取所有符合条件的通知ID
    const notifications = await prisma.notification.findMany({
      select: { id: true },
      where
    });

    // 为这些通知创建或更新用户的已读状态
    const upsertPromises = notifications.map(notification =>
      prisma.userNotificationReadStatus.upsert({
        where: {
          userId_notificationId: {
            userId: currentUserId,
            notificationId: notification.id
          }
        },
        update: {
          readStatus: 1,
          readTime: new Date()
        },
        create: {
          userId: currentUserId,
          notificationId: notification.id,
          readStatus: 1,
          readTime: new Date()
        }
      })
    );

    await Promise.all(upsertPromises);

    res.json({
      code: 0,
      data: null,
      message: '全部标记已读成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('全部标记已读失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '全部标记已读失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 创建通知
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, relatedId, relatedType, targetUserIds = [], title, type } = req.body;
    const currentUserId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');
    const operatorName = (req as any).user?.nickName || (req as any).user?.userName || '管理员';

    const notifications = [];

    if (targetUserIds.length > 0) {
      // 为指定用户创建通知
      for (const userId of targetUserIds) {
        const notification = await prisma.notification.create({
          data: {
            content,
            createTime: new Date().toISOString(),
            readStatus: 0,
            relatedId,
            relatedType,
            title,
            type,
            userId
          }
        });
        notifications.push(notification);
      }
    } else {
      // 创建系统通知
      const notification = await prisma.notification.create({
        data: {
          content,
          createTime: new Date().toISOString(),
          readStatus: 0,
          // 系统通知
          relatedId,
          relatedType,
          title,
          type,
          userId: 0
        }
      });
      notifications.push(notification);
    }

    // 如果是超级管理员发布班级通知公告，创建系统通知
    if (isSuperAdmin && type === 'class_announcement' && relatedType === 'class' && relatedId) {
      try {
        // 获取班级信息
        const classInfo = await prisma.class.findUnique({
          where: { id: relatedId },
          select: { name: true }
        });

        if (classInfo) {
          // 创建系统通知
          await prisma.notification.create({
            data: {
              title: '班级通知公告更新',
              content: `${operatorName}在班级"${classInfo.name}"中发布了新的通知公告："${title}"，点击查看详情。`,
              type: 'class_announcement_system',
              userId: 0, // 系统通知
              readStatus: 0,
              relatedId: relatedId,
              relatedType: 'class',
              createTime: new Date().toISOString()
            }
          });

          logger.info(`已创建班级通知公告系统通知`, {
            classId: relatedId,
            className: classInfo.name,
            notificationTitle: title,
            operator: operatorName
          });
        }
      } catch (systemNotificationError) {
        logger.error('创建班级通知公告系统通知失败:', systemNotificationError);
        // 不影响主通知创建，继续执行
      }
    }

    res.json({
      code: 0,
      data: notifications[0],
      message: '创建通知成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建通知失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建通知失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 删除通知
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    if (!currentUserId) {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '用户未认证',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 构建权限查询条件
    let whereCondition: any;

    if (isSuperAdmin) {
      // 超级管理员可以删除：
      // 1. 自己的通知
      // 2. 系统通知（班级相关等）
      // 3. 会议相关通知（无论发送给谁）
      // 4. 课程附件通知（无论发送给谁）
      whereCondition = {
        id: Number.parseInt(id),
        OR: [
          { userId: currentUserId }, // 自己的通知
          {
            AND: [
              { userId: 0 }, // 系统通知
              { type: { in: ['class_announcement', 'class_announcement_system'] } } // 包含班级通知公告系统通知
            ]
          },
          {
            type: { in: ['meeting', 'meeting_approval'] } // 会议相关通知（超级管理员可删除任何会议通知）
          },
          {
            type: { in: ['course_attachment'] } // 课程附件通知（超级管理员可删除任何课程附件通知）
          }
        ]
      };
    } else {
      // 普通用户只能删除自己的通知
      whereCondition = {
        id: Number.parseInt(id),
        userId: currentUserId
      };
    }

    const notification = await prisma.notification.findFirst({
      where: whereCondition
    });

    if (!notification) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '通知不存在或无权删除',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 如果是超级管理员删除课程附件通知，删除所有相关的课程附件通知
    if (isSuperAdmin && notification.type === 'course_attachment' && notification.relatedId && notification.relatedType) {
      // 删除所有相同课程的附件通知
      await prisma.notification.deleteMany({
        where: {
          type: 'course_attachment',
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        }
      });

      logger.info(`超级管理员删除了课程附件通知，已删除所有相关通知`, {
        relatedId: notification.relatedId,
        relatedType: notification.relatedType
      });
    } else {
      // 普通删除
      await prisma.notification.delete({
        where: { id: Number.parseInt(id) }
      });
    }

    res.json({
      code: 0,
      data: null,
      message: '删除通知成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除通知失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除通知失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 批量删除通知
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const currentUserId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    if (!currentUserId) {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '用户未认证',
        path: req.path,
        timestamp: Date.now()
      });
    }

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '请选择要删除的通知',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 构建权限查询条件
    let whereCondition: any;

    if (isSuperAdmin) {
      // 超级管理员可以删除：
      // 1. 自己的通知
      // 2. 系统通知（班级相关等）
      // 3. 会议相关通知（无论发送给谁）
      // 4. 课程附件通知（无论发送给谁）
      whereCondition = {
        id: { in: notificationIds.map(id => Number.parseInt(id)) },
        OR: [
          { userId: currentUserId }, // 自己的通知
          {
            AND: [
              { userId: 0 }, // 系统通知
              { type: { in: ['class_announcement'] } }
            ]
          },
          {
            type: { in: ['meeting', 'meeting_approval'] } // 会议相关通知（超级管理员可删除任何会议通知）
          },
          {
            type: { in: ['course_attachment'] } // 课程附件通知（超级管理员可删除任何课程附件通知）
          }
        ]
      };
    } else {
      // 普通用户只能删除自己的通知
      whereCondition = {
        id: { in: notificationIds.map(id => Number.parseInt(id)) },
        userId: currentUserId
      };
    }

    // 查找可删除的通知
    const deletableNotifications = await prisma.notification.findMany({
      where: whereCondition,
      select: { id: true, title: true, type: true, relatedId: true, relatedType: true }
    });

    if (deletableNotifications.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '没有找到可删除的通知',
        path: req.path,
        timestamp: Date.now()
      });
    }

    let deleteResult;

    // 如果是超级管理员且包含课程附件通知，需要特殊处理
    if (isSuperAdmin) {
      const courseAttachmentNotifications = deletableNotifications.filter(
        n => n.type === 'course_attachment' && n.relatedId && n.relatedType
      );

      if (courseAttachmentNotifications.length > 0) {
        // 获取所有需要删除的课程附件通知的relatedId
        const relatedIds = [...new Set(courseAttachmentNotifications.map(n => n.relatedId).filter((id): id is number => id !== null))];

        // 删除所有相关的课程附件通知
        const courseAttachmentDeleteResult = await prisma.notification.deleteMany({
          where: {
            type: 'course_attachment',
            relatedId: { in: relatedIds },
            relatedType: 'course'
          }
        });

        // 删除其他非课程附件通知
        const otherNotificationIds = deletableNotifications
          .filter(n => n.type !== 'course_attachment')
          .map(n => n.id);

        let otherDeleteResult = { count: 0 };
        if (otherNotificationIds.length > 0) {
          otherDeleteResult = await prisma.notification.deleteMany({
            where: {
              id: { in: otherNotificationIds }
            }
          });
        }

        deleteResult = {
          count: courseAttachmentDeleteResult.count + otherDeleteResult.count
        };

        logger.info(`超级管理员批量删除通知，包含课程附件通知`, {
          totalDeleted: deleteResult.count,
          courseAttachmentDeleted: courseAttachmentDeleteResult.count,
          otherDeleted: otherDeleteResult.count,
          relatedIds
        });
      } else {
        // 没有课程附件通知，正常删除
        deleteResult = await prisma.notification.deleteMany({
          where: {
            id: { in: deletableNotifications.map(n => n.id) }
          }
        });
      }
    } else {
      // 普通用户批量删除
      deleteResult = await prisma.notification.deleteMany({
        where: {
          id: { in: deletableNotifications.map(n => n.id) }
        }
      });
    }

    res.json({
      code: 0,
      data: {
        deletedCount: deleteResult.count,
        deletedNotifications: deletableNotifications
      },
      message: `成功删除 ${deleteResult.count} 条通知`,
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('批量删除通知失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '批量删除通知失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 获取未读通知数量
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '用户未认证',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 获取用户角色信息
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    // 根据用户角色统计未读通知数量
    let whereCondition: any = {
      readStatus: 0
    };

    if (isSuperAdmin) {
      // 超级管理员可以看到自己的通知、系统通知以及审批类通知，以及所有事项相关通知
      whereCondition.OR = [
        { userId: currentUserId },
        { userId: 0 }, // 系统通知
        { type: 'expense' }, // 报销审批通知
        { type: 'meeting_approval' }, // 会议审批通知
        { type: 'info' }, // 事项通知
        { type: 'success' }, // 成功通知
        { type: 'warning' }, // 警告通知
        { type: 'task' }, // 任务通知
        { type: 'project_task' }, // 项目任务通知
        { type: 'class_announcement_system' }, // 班级通知公告系统通知
        {
          AND: [
            { type: 'meeting' },
            { title: { contains: '审批' } } // 包含"审批"字样的会议通知
          ]
        }
      ];
    } else {
      // 普通用户只能看到自己的非审批类通知和非审批类系统通知
      whereCondition.OR = [
        {
          AND: [
            { userId: currentUserId },
            {
              OR: [
                { type: { notIn: ['expense', 'meeting'] } }, // 排除报销和会议类通知
                {
                  AND: [
                    { type: 'meeting' },
                    { title: { not: { contains: '审批' } } } // 允许非审批的会议通知
                  ]
                }
              ]
            }
          ]
        },
        {
          AND: [
            { userId: 0 },
            {
              OR: [
                { type: { notIn: ['expense', 'meeting'] } }, // 排除报销和会议类系统通知
                {
                  AND: [
                    { type: 'meeting' },
                    { title: { not: { contains: '审批' } } } // 允许非审批的会议系统通知
                  ]
                }
              ]
            }
          ]
        }
      ];
    }

    const count = await prisma.notification.count({
      where: whereCondition
    });

    res.json({
      code: 0,
      data: { count },
      message: '获取未读数量成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取未读数量失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取未读数量失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 批量标记通知为已读
router.put('/batch-read', async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '用户未认证',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 获取用户角色
    const userRoles = (req as any).user?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    // 构建权限过滤条件
    let permissionFilter: any;
    if (isSuperAdmin) {
      // 超级管理员可以标记自己的通知、系统通知和审批类通知
      permissionFilter = {
        OR: [
          { userId: currentUserId },
          { userId: 0 }, // 系统通知
          { type: 'expense' }, // 报销审批通知
          {
            AND: [
              { type: 'meeting' },
              { title: { contains: '审批' } } // 包含"审批"字样的会议通知
            ]
          }
        ]
      };
    } else {
      // 普通用户只能标记自己的非审批类通知和非审批类系统通知
      permissionFilter = {
        OR: [
          {
            AND: [
              { userId: currentUserId },
              {
                OR: [
                  { type: { notIn: ['expense', 'meeting'] } }, // 排除报销和会议类通知
                  {
                    AND: [
                      { type: 'meeting' },
                      { title: { not: { contains: '审批' } } } // 允许非审批的会议通知
                    ]
                  }
                ]
              }
            ]
          },
          {
            AND: [
              { userId: 0 }, // 系统通知
              {
                OR: [
                  { type: { notIn: ['expense', 'meeting'] } }, // 排除报销和会议类系统通知
                  {
                    AND: [
                      { type: 'meeting' },
                      { title: { not: { contains: '审批' } } } // 允许非审批的会议系统通知
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    await prisma.notification.updateMany({
      data: {
        readStatus: 1,
        readTime: new Date().toISOString()
      },
      where: {
        id: {
          in: notificationIds
        },
        AND: [permissionFilter]
      }
    });

    res.json({
      code: 0,
      data: null,
      message: '批量标记已读成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('批量标记已读失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '批量标记已读失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 通知附件相关路由

// 上传通知附件
router.post('/:id/attachments/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json(createErrorResponse(400, '请选择要上传的文件', null, req.path));
    }

    // 检查通知是否存在
    const notification = await prisma.notification.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json(createErrorResponse(404, '通知不存在', null, req.path));
    }

    // 获取当前用户ID（从认证中间件）
    const uploaderId = (req as any).user?.id || 1; // 默认用户ID为1

    // 创建通知附件记录
    const attachment = await prisma.notificationAttachment.create({
      data: {
        fileName: req.file.filename,
        fileSize: req.file.size,
        fileType: getFileExtension(req.file.originalname),
        notificationId: Number.parseInt(id),
        originalName: req.file.originalname,
        status: 1,
        uploaderId
      },
      include: {
        uploader: {
          select: {
            id: true,
            userName: true
          }
        }
      }
    });

    const result = {
      downloadUrl: `/api/notifications/${id}/attachments/${attachment.id}/download`,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      id: attachment.id,
      notificationId: attachment.notificationId,
      originalName: attachment.originalName,
      uploader: attachment.uploader
        ? {
            id: attachment.uploader.id,
            name: attachment.uploader.userName
          }
        : null,
      uploadTime: attachment.uploadTime.toISOString()
    };

    // 获取上传者信息
    const uploader = await prisma.user.findUnique({
      where: { id: uploaderId },
      select: { nickName: true, userName: true }
    });
    const uploaderName = uploader?.nickName || uploader?.userName || '未知用户';

    logger.info(`通知附件上传成功: ${req.file.originalname}, 通知ID: ${id}`);

    // 发送通知给所有用户
    const notificationTitle = '通知附件新增提醒';
    const notificationContent = `${uploaderName} 在通知"${notification.title}"中上传了新附件："${req.file.originalname}"，请及时查看。`;

    // 异步发送通知，不阻塞响应
    createNotificationAttachmentSystemNotification(
      notificationTitle,
      notificationContent,
      notification.id,
      'notification'
    ).catch(error => {
      logger.error('发送通知附件上传通知失败:', error);
    });

    res.json(createSuccessResponse(result, '通知附件上传成功', req.path));
  } catch (error) {
    logger.error('上传通知附件失败:', error);
    res.status(500).json(createErrorResponse(500, '上传通知附件失败', null, req.path));
  }
});

// 获取通知附件列表
router.get('/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { current = 1, size = 10 } = req.query;

    const page = Number.parseInt(current as string);
    const pageSize = Number.parseInt(size as string);
    const skip = (page - 1) * pageSize;

    const whereClause = {
      notificationId: Number.parseInt(id),
      status: 1 // 只显示正常状态的附件
    };

    const [attachments, total] = await Promise.all([
      prisma.notificationAttachment.findMany({
        include: {
          uploader: {
            select: {
              id: true,
              userName: true
            }
          }
        },
        orderBy: { uploadTime: 'desc' },
        skip,
        take: pageSize,
        where: whereClause
      }),
      prisma.notificationAttachment.count({ where: whereClause })
    ]);

    const result = {
      current: page,
      pages: Math.ceil(total / pageSize),
      records: attachments.map((attachment: any) => ({
        downloadUrl: `/api/notifications/${id}/attachments/${attachment.id}/download`,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
        id: attachment.id,
        notificationId: attachment.notificationId,
        originalName: attachment.originalName,
        uploader: attachment.uploader
          ? {
              id: attachment.uploader.id,
              name: attachment.uploader.userName
            }
          : null,
        uploadTime: attachment.uploadTime.toISOString()
      })),
      size: pageSize,
      total
    };

    res.json(createSuccessResponse(result, '获取通知附件列表成功', req.path));
  } catch (error) {
    logger.error('获取通知附件列表失败:', error);
    res.status(500).json(createErrorResponse(500, '获取通知附件列表失败', null, req.path));
  }
});

// 下载通知附件
router.get('/:id/attachments/:attachmentId/download', async (req, res) => {
  try {
    const { attachmentId, id } = req.params;

    const attachment = await prisma.notificationAttachment.findFirst({
      where: {
        id: Number.parseInt(attachmentId),
        notificationId: Number.parseInt(id),
        status: 1
      }
    });

    if (!attachment) {
      return res.status(404).json(createErrorResponse(404, '附件不存在', null, req.path));
    }

    const filePath = path.join(uploadsDir, attachment.fileName);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(createErrorResponse(404, '文件不存在', null, req.path));
    }

    const originalName = attachment.originalName || attachment.fileName;

    // 设置响应头 - 正确处理中文文件名编码
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // 发送文件流
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // 更新下载次数
    await prisma.notificationAttachment.update({
      data: {
        downloadCount: {
          increment: 1
        }
      },
      where: { id: Number.parseInt(attachmentId) }
    });

    logger.info(`通知附件下载: ${originalName}, ID: ${attachmentId}`);
  } catch (error) {
    logger.error('下载通知附件失败:', error);
    res.status(500).json(createErrorResponse(500, '下载通知附件失败', null, req.path));
  }
});

// 删除通知附件
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { attachmentId, id } = req.params;

    const attachment = await prisma.notificationAttachment.findFirst({
      where: {
        id: Number.parseInt(attachmentId),
        notificationId: Number.parseInt(id),
        status: 1
      }
    });

    if (!attachment) {
      return res.status(404).json(createErrorResponse(404, '附件不存在', null, req.path));
    }

    // 软删除：将状态设置为2
    await prisma.notificationAttachment.update({
      data: {
        status: 2
      },
      where: { id: Number.parseInt(attachmentId) }
    });

    logger.info(`通知附件删除成功: ${attachment.originalName}, ID: ${attachmentId}`);

    res.json(createSuccessResponse(null, '删除通知附件成功', req.path));
  } catch (error) {
    logger.error('删除通知附件失败:', error);
    res.status(500).json(createErrorResponse(500, '删除通知附件失败', null, req.path));
  }
});

export default router;
