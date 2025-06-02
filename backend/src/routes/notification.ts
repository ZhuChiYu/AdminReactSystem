import express from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// 获取通知列表
router.get('/', async (req, res) => {
  try {
    const {
      current = 1,
      size = 10,
      type,
      readStatus,
      title,
      relatedId,
      relatedType
    } = req.query;

    const where: any = {};

    // 构建查询条件
    if (type) {
      where.type = type as string;
    }

    if (readStatus !== undefined) {
      where.readStatus = parseInt(readStatus as string);
    }

    if (title) {
      where.title = {
        contains: title as string,
        mode: 'insensitive'
      };
    }

    if (relatedId) {
      where.relatedId = parseInt(relatedId as string);
    }

    if (relatedType) {
      where.relatedType = relatedType as string;
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    // 获取通知列表
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take
    });

    // 获取总数
    const total = await prisma.notification.count({ where });

    res.json({
      code: 0,
      message: '获取通知列表成功',
      data: {
        records: notifications,
        total,
        size: parseInt(size as string),
        current: parseInt(current as string),
        pages: Math.ceil(total / parseInt(size as string))
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取通知列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取通知列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 标记通知为已读
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        readStatus: 1,
        readTime: new Date().toISOString()
      }
    });

    res.json({
      code: 0,
      message: '标记已读成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('标记通知已读失败:', error);
    res.status(500).json({
      code: 500,
      message: '标记通知已读失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
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
      message: '全部标记已读成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('全部标记已读失败:', error);
    res.status(500).json({
      code: 500,
      message: '全部标记已读失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 创建通知
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      targetUserIds = [],
      relatedId,
      relatedType
    } = req.body;

    const notifications = [];

    if (targetUserIds.length > 0) {
      // 为指定用户创建通知
      for (const userId of targetUserIds) {
        const notification = await prisma.notification.create({
          data: {
            title,
            content,
            type,
            userId,
            relatedId,
            relatedType,
            readStatus: 0,
            createTime: new Date().toISOString()
          }
        });
        notifications.push(notification);
      }
    } else {
      // 创建系统通知
      const notification = await prisma.notification.create({
        data: {
          title,
          content,
          type,
          userId: 0, // 系统通知
          relatedId,
          relatedType,
          readStatus: 0,
          createTime: new Date().toISOString()
        }
      });
      notifications.push(notification);
    }

    res.json({
      code: 0,
      message: '创建通知成功',
      data: notifications[0],
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('创建通知失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建通知失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 删除通知
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      code: 0,
      message: '删除通知成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('删除通知失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除通知失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
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
      message: '获取未读数量成功',
      data: { count },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取未读数量失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取未读数量失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 批量标记通知为已读
router.put('/batch-read', async (req, res) => {
  try {
    const { notificationIds } = req.body;

    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        }
      },
      data: {
        readStatus: 1,
        readTime: new Date().toISOString()
      }
    });

    res.json({
      code: 0,
      message: '批量标记已读成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('批量标记已读失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量标记已读失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router; 