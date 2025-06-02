import express from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 JPG, PNG, GIF 格式的图片'));
    }
  }
});

// 获取用户头像信息
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 从用户表获取头像信息
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        avatar: true,
        nickName: true
      }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    // 如果用户有头像URL，返回头像信息
    if (user.avatar) {
      return res.json({
        code: 0,
        message: '获取头像成功',
        data: {
          userId: user.id,
          avatarUrl: user.avatar,
          username: user.nickName
        },
        timestamp: Date.now(),
        path: req.path
      });
    }

    // 如果没有头像，返回默认信息
    res.json({
      code: 0,
      message: '获取头像成功',
      data: {
        userId: user.id,
        avatarUrl: null,
        username: user.nickName
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取用户头像失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户头像失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
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
        message: '请选择要上传的头像文件',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '用户ID不能为空',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    // 生成头像URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新用户头像
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { avatar: avatarUrl }
    });

    res.json({
      code: 0,
      message: '头像上传成功',
      data: {
        url: avatarUrl,
        filename: req.file.filename,
        size: req.file.size
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('上传头像失败:', error);
    res.status(500).json({
      code: 500,
      message: '上传头像失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
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
        message: '用户ID列表不能为空',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds.map(id => parseInt(id))
        }
      },
      select: {
        id: true,
        avatar: true,
        nickName: true
      }
    });

    const avatarInfo = users.map(user => ({
      userId: user.id,
      avatarUrl: user.avatar,
      username: user.nickName
    }));

    res.json({
      code: 0,
      message: '批量获取头像成功',
      data: avatarInfo,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('批量获取头像失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量获取头像失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router; 