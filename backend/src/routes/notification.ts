import express from 'express';

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// 获取通知列表
router.get('/', async (req, res) => {
  try {
    const { current = 1, readStatus, relatedId, relatedType, size = 10, title, type } = req.query;

    const where: any = {};

    // 构建查询条件
    if (type) {
      where.type = type as string;
    }

    if (readStatus !== undefined) {
      where.readStatus = Number.parseInt(readStatus as string);
    }

    if (title) {
      where.title = {
        contains: title as string,
        mode: 'insensitive'
      };
    }

    if (relatedId) {
      where.relatedId = Number.parseInt(relatedId as string);
    }

    if (relatedType) {
      where.relatedType = relatedType as string;
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    // 获取通知列表
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take,
      where
    });

    // 获取总数
    const total = await prisma.notification.count({ where });

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / Number.parseInt(size as string)),
        records: notifications,
        size: Number.parseInt(size as string),
        total
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
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      data: {
        readStatus: 1,
        readTime: new Date().toISOString()
      },
      where: { id: Number.parseInt(id) }
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
router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      data: {
        readStatus: 1,
        readTime: new Date().toISOString()
      }
    });

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
router.post('/', async (req, res) => {
  try {
    const { content, relatedId, relatedType, targetUserIds = [], title, type } = req.body;

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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id: Number.parseInt(id) }
    });

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

// 获取未读通知数量
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        readStatus: 0
      }
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

    await prisma.notification.updateMany({
      data: {
        readStatus: 1,
        readTime: new Date().toISOString()
      },
      where: {
        id: {
          in: notificationIds
        }
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

export default router;
