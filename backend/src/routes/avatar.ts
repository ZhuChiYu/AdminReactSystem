import fs from 'node:fs';
import path from 'node:path';

import express from 'express';
import multer from 'multer';

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// 确保上传目录存在
const avatarsDir = 'uploads/avatars';
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPG, PNG, GIF 格式的图片'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  storage
});

// 获取用户头像信息
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 从用户表获取头像信息
    const user = await prisma.user.findUnique({
      select: {
        avatar: true,
        id: true,
        nickName: true
      },
      where: { id: Number.parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '用户不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 如果用户有头像URL，返回头像信息
    if (user.avatar) {
      return res.json({
        code: 0,
        data: {
          avatarUrl: user.avatar,
          userId: user.id,
          username: user.nickName
        },
        message: '获取头像成功',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 如果没有头像，返回默认信息
    res.json({
      code: 0,
      data: {
        avatarUrl: null,
        userId: user.id,
        username: user.nickName
      },
      message: '获取头像成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取用户头像失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取用户头像失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 上传头像
router.post('/upload', upload.single('avatar'), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '请选择要上传的头像文件',
        path: req.path,
        timestamp: Date.now()
      });
    }

    if (!userId) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '用户ID不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 生成头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新用户头像
    await prisma.user.update({
      data: { avatar: avatarUrl },
      where: { id: Number.parseInt(userId) }
    });

    res.json({
      code: 0,
      data: {
        filename: req.file.filename,
        size: req.file.size,
        url: avatarUrl
      },
      message: '头像上传成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('上传头像失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '上传头像失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 批量获取用户头像
router.post('/batch', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '用户ID列表不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const users = await prisma.user.findMany({
      select: {
        avatar: true,
        id: true,
        nickName: true
      },
      where: {
        id: {
          in: userIds.map(id => Number.parseInt(id))
        }
      }
    });

    const avatarInfo = users.map((user: { avatar: string | null; id: number; nickName: string }) => ({
      avatarUrl: user.avatar,
      userId: user.id,
      username: user.nickName
    }));

    res.json({
      code: 0,
      data: avatarInfo,
      message: '批量获取头像成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('批量获取头像失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '批量获取头像失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

export default router;
