import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// 确保上传目录存在
const uploadsDir = 'uploads/attachments';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'attachment-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
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
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  }
});

// 获取文件扩展名
function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext.substring(1); // 移除点号
}

// 上传附件（放在动态路由之前）
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { courseId, description } = req.body;

    if (!req.file) {
      return res.status(400).json(createErrorResponse(400, '请选择要上传的文件', null, req.path));
    }

    if (!courseId) {
      return res.status(400).json(createErrorResponse(400, '课程ID不能为空', null, req.path));
    }

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return res.status(404).json(createErrorResponse(404, '课程不存在', null, req.path));
    }

    // 获取当前用户ID（从认证中间件）
    const uploaderId = (req as any).user?.id || 1; // 默认用户ID为1

    // 创建附件记录
    const attachment = await prisma.attachment.create({
      data: {
        courseId: parseInt(courseId),
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: getFileExtension(req.file.originalname),
        fileSize: req.file.size,
        uploaderId: uploaderId,
        status: 1
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
      id: attachment.id,
      courseId: attachment.courseId,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      downloadUrl: `/api/attachments/${attachment.id}/download`,
      uploadTime: attachment.uploadTime.toISOString(),
      uploader: attachment.uploader ? {
        id: attachment.uploader.id,
        name: attachment.uploader.userName
      } : null
    };

    logger.info(`附件上传成功: ${req.file.originalname}, 课程ID: ${courseId}`);

    res.json(createSuccessResponse(result, '文件上传成功', req.path));
  } catch (error) {
    logger.error('上传附件失败:', error);
    res.status(500).json(createErrorResponse(500, '上传附件失败', null, req.path));
  }
});

// 获取附件列表
router.get('/', async (req, res) => {
  try {
    const { courseId, current = 1, size = 10 } = req.query;

    const page = parseInt(current as string);
    const pageSize = parseInt(size as string);
    const skip = (page - 1) * pageSize;

    let whereClause: any = {};
    if (courseId) {
      whereClause.courseId = parseInt(courseId as string);
    }

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({
        where: whereClause,
        orderBy: { uploadTime: 'desc' },
        skip,
        take: pageSize,
        include: {
          uploader: {
            select: {
              id: true,
              userName: true
            }
          }
        }
      }),
      prisma.attachment.count({ where: whereClause })
    ]);

    const result = {
      records: attachments.map(attachment => ({
        id: attachment.id,
        courseId: attachment.courseId,
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        downloadUrl: `/api/attachments/${attachment.id}/download`,
        uploadTime: attachment.uploadTime.toISOString(),
        uploader: attachment.uploader ? {
          id: attachment.uploader.id,
          name: attachment.uploader.userName
        } : null
      })),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize)
    };

    res.json(createSuccessResponse(result, '获取附件列表成功', req.path));
  } catch (error) {
    logger.error('获取附件列表失败:', error);
    res.status(500).json(createErrorResponse(500, '获取附件列表失败', null, req.path));
  }
});

// 下载附件（放在:id路由之前）
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!attachment) {
      return res.status(404).json(createErrorResponse(404, '附件不存在', null, req.path));
    }

    const filePath = path.join(uploadsDir, attachment.fileName);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(createErrorResponse(404, '文件不存在', null, req.path));
    }

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName || attachment.fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件流
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // 更新下载次数
    await prisma.attachment.update({
      where: { id: parseInt(id) },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    });

    logger.info(`文件下载: ${attachment.originalName}, ID: ${id}`);
  } catch (error) {
    logger.error('下载附件失败:', error);
    res.status(500).json(createErrorResponse(500, '下载附件失败', null, req.path));
  }
});

// 获取附件详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) },
      include: {
        uploader: {
          select: {
            id: true,
            userName: true
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json(createErrorResponse(404, '附件不存在', null, req.path));
    }

    const result = {
      id: attachment.id,
      courseId: attachment.courseId,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      downloadUrl: `/api/attachments/${attachment.id}/download`,
      uploadTime: attachment.uploadTime.toISOString(),
      uploader: attachment.uploader ? {
        id: attachment.uploader.id,
        name: attachment.uploader.userName
      } : null
    };

    res.json(createSuccessResponse(result, '获取附件详情成功', req.path));
  } catch (error) {
    logger.error('获取附件详情失败:', error);
    res.status(500).json(createErrorResponse(500, '获取附件详情失败', null, req.path));
  }
});

// 删除附件
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!attachment) {
      return res.status(404).json(createErrorResponse(404, '附件不存在', null, req.path));
    }

    await prisma.attachment.delete({
      where: { id: parseInt(id) }
    });

    res.json(createSuccessResponse(null, '删除附件成功', req.path));
  } catch (error) {
    logger.error('删除附件失败:', error);
    res.status(500).json(createErrorResponse(500, '删除附件失败', null, req.path));
  }
});

// 获取课程附件统计
router.get('/course/:courseId/stats', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);

    // 验证课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json(createErrorResponse(404, '课程不存在', null, req.path));
    }

    // 获取附件统计信息
    const attachments = await prisma.attachment.findMany({
      where: {
        courseId,
        status: 1 // 只统计正常状态的附件
      },
      select: {
        fileType: true,
        fileSize: true
      }
    });

    // 计算统计数据
    const totalCount = attachments.length;
    const totalSize = attachments.reduce((sum, attachment) => sum + attachment.fileSize, 0);
    
    // 按文件类型统计
    const fileTypeMap = new Map<string, number>();
    attachments.forEach(attachment => {
      const count = fileTypeMap.get(attachment.fileType) || 0;
      fileTypeMap.set(attachment.fileType, count + 1);
    });

    const fileTypes = Array.from(fileTypeMap.entries()).map(([type, count]) => ({
      type,
      count
    }));

    res.json(createSuccessResponse({
      totalCount,
      totalSize,
      fileTypes
    }, '获取课程附件统计成功', req.path));

  } catch (error) {
    logger.error('获取课程附件统计失败:', error);
    res.status(500).json(createErrorResponse(500, '获取课程附件统计失败', null, req.path));
  }
});

export default router; 