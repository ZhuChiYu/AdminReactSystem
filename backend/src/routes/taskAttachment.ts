import fs from 'node:fs';
import path from 'node:path';

import express from 'express';
import multer from 'multer';

import { prisma } from '@/config/database';
import { authMiddleware } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

const router = express.Router();

// 配置项目事项附件上传
const uploadsDir = 'uploads/task-attachments';
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
    cb(null, `task-attachment-${uniqueSuffix}${ext}`);
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
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  storage
});

// 获取文件扩展名
function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext.substring(1); // 移除点号
}

// 上传项目事项附件
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { taskId, description, stage } = req.body;

    console.log('📤 项目事项附件上传请求:', {
      taskId,
      description,
      stage,
      user: req.user,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });

    if (!req.file) {
      console.error('❌ 附件上传失败: 未选择文件');
      return res.status(400).json(createErrorResponse(400, '请选择要上传的文件', null, req.path));
    }

    if (!taskId) {
      console.error('❌ 附件上传失败: 项目事项ID为空');
      return res.status(400).json(createErrorResponse(400, '项目事项ID不能为空', null, req.path));
    }

    // 验证用户认证信息
    if (!req.user || !req.user.id) {
      console.error('❌ 附件上传失败: 用户认证信息缺失', req.user);
      return res.status(401).json(createErrorResponse(401, '用户认证信息缺失', null, req.path));
    }

    // 检查项目事项是否存在
    const task = await prisma.task.findUnique({
      where: { id: Number.parseInt(taskId) }
    });

    if (!task) {
      console.error('❌ 附件上传失败: 项目事项不存在', { taskId });
      return res.status(404).json(createErrorResponse(404, '项目事项不存在', null, req.path));
    }

    // 获取当前用户ID
    const uploaderId = req.user.id;
    console.log('📋 上传用户信息:', {
      uploaderId,
      userName: req.user.userName,
      nickName: req.user.nickName
    });

    // 创建附件记录
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: Number.parseInt(taskId),
        fileName: req.file.filename,
        fileSize: req.file.size,
        fileType: getFileExtension(req.file.originalname),
        originalName: req.file.originalname,
        status: 1,
        uploaderId,
        description: description || null,
        stage: stage || null
      },
      include: {
        uploader: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      }
    });

    const result = {
      taskId: attachment.taskId,
      downloadUrl: `/api/task-attachments/${attachment.id}/download`,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      id: attachment.id,
      originalName: attachment.originalName,
      description: attachment.description,
      stage: attachment.stage,
      uploader: attachment.uploader
        ? {
            id: attachment.uploader.id,
            name: attachment.uploader.nickName || attachment.uploader.userName
          }
        : null,
      uploadTime: attachment.uploadTime.toISOString()
    };

    console.log('✅ 项目事项附件上传成功:', {
      fileName: req.file.originalname,
      taskId,
      attachmentId: attachment.id,
      uploader: result.uploader
    });

    logger.info(`项目事项附件上传成功: ${req.file.originalname}, 项目事项ID: ${taskId}`);

    res.json(createSuccessResponse(result, '文件上传成功', req.path));
  } catch (error) {
    console.error('❌ 上传项目事项附件失败:', error);
    logger.error('上传项目事项附件失败:', error);
    res.status(500).json(createErrorResponse(500, '上传项目事项附件失败', error, req.path));
  }
});

// 获取项目事项附件列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { taskId, current = 1, size = 10 } = req.query;

    const page = Number.parseInt(current as string);
    const pageSize = Number.parseInt(size as string);
    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      status: 1 // 只显示正常状态的附件
    };

    if (taskId) {
      whereClause.taskId = Number.parseInt(taskId as string);
    }

    const [attachments, total] = await Promise.all([
      prisma.taskAttachment.findMany({
        include: {
          uploader: {
            select: {
              id: true,
              userName: true,
              nickName: true
            }
          }
        },
        orderBy: { uploadTime: 'desc' },
        skip,
        take: pageSize,
        where: whereClause
      }),
      prisma.taskAttachment.count({ where: whereClause })
    ]);

    const result = {
      current: page,
      pages: Math.ceil(total / pageSize),
      records: attachments.map((attachment: any) => ({
        taskId: attachment.taskId,
        downloadUrl: `/api/task-attachments/${attachment.id}/download`,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
        id: attachment.id,
        originalName: attachment.originalName,
        description: attachment.description,
        stage: attachment.stage,
        uploader: attachment.uploader
          ? {
              id: attachment.uploader.id,
              name: attachment.uploader.nickName || attachment.uploader.userName
            }
          : null,
        uploadTime: attachment.uploadTime.toISOString()
      })),
      size: pageSize,
      total
    };

    res.json(createSuccessResponse(result, '获取项目事项附件列表成功', req.path));
  } catch (error) {
    logger.error('获取项目事项附件列表失败:', error);
    res.status(500).json(createErrorResponse(500, '获取项目事项附件列表失败', null, req.path));
  }
});

// 下载项目事项附件
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: Number.parseInt(id),
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
    await prisma.taskAttachment.update({
      data: {
        downloadCount: {
          increment: 1
        }
      },
      where: { id: Number.parseInt(id) }
    });

    logger.info(`项目事项附件下载: ${originalName}, ID: ${id}`);
  } catch (error) {
    logger.error('下载项目事项附件失败:', error);
    res.status(500).json(createErrorResponse(500, '下载项目事项附件失败', null, req.path));
  }
});

// 删除项目事项附件
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: Number.parseInt(id),
        status: 1
      }
    });

    if (!attachment) {
      return res.status(404).json(createErrorResponse(404, '附件不存在', null, req.path));
    }

    // 软删除：将状态设置为2
    await prisma.taskAttachment.update({
      data: {
        status: 2
      },
      where: { id: Number.parseInt(id) }
    });

    logger.info(`项目事项附件删除成功: ${attachment.originalName}, ID: ${id}`);

    res.json(createSuccessResponse(null, '删除项目事项附件成功', req.path));
  } catch (error) {
    logger.error('删除项目事项附件失败:', error);
    res.status(500).json(createErrorResponse(500, '删除项目事项附件失败', null, req.path));
  }
});

// 获取项目事项的附件统计
router.get('/task/:taskId/stats', authMiddleware, async (req, res) => {
  try {
    const taskId = Number.parseInt(req.params.taskId);

    // 验证项目事项是否存在
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json(createErrorResponse(404, '项目事项不存在', null, req.path));
    }

    // 获取附件统计信息
    const attachments = await prisma.taskAttachment.findMany({
      select: {
        fileSize: true,
        fileType: true,
        stage: true
      },
      where: {
        taskId,
        status: 1 // 只统计正常状态的附件
      }
    });

    // 计算统计数据
    const totalCount = attachments.length;
    const totalSize = attachments.reduce((sum: number, attachment: any) => sum + attachment.fileSize, 0);

    // 按文件类型统计
    const fileTypeMap = new Map<string, number>();
    attachments.forEach((attachment: any) => {
      const count = fileTypeMap.get(attachment.fileType) || 0;
      fileTypeMap.set(attachment.fileType, count + 1);
    });

    const fileTypes = Array.from(fileTypeMap.entries()).map(([type, count]) => ({
      count,
      type
    }));

    // 按阶段统计
    const stageMap = new Map<string, number>();
    attachments.forEach((attachment: any) => {
      if (attachment.stage) {
        const count = stageMap.get(attachment.stage) || 0;
        stageMap.set(attachment.stage, count + 1);
      }
    });

    const stages = Array.from(stageMap.entries()).map(([stage, count]) => ({
      count,
      stage
    }));

    res.json(
      createSuccessResponse(
        {
          fileTypes,
          stages,
          totalCount,
          totalSize
        },
        '获取项目事项附件统计成功',
        req.path
      )
    );
  } catch (error) {
    logger.error('获取项目事项附件统计失败:', error);
    res.status(500).json(createErrorResponse(500, '获取项目事项附件统计失败', null, req.path));
  }
});

export default router;
