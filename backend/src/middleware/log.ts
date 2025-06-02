import type { NextFunction, Request, Response } from 'express';

import { logger, loggerUtils } from '@/utils/logger';

// 请求日志中间件
export const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // 记录请求开始
  logger.info(`🔵 ${req.method} ${req.originalUrl} - 开始处理`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // 根据状态码使用不同的日志级别
    if (statusCode >= 500) {
      logger.error(`🔴 ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(`🟡 ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`);
    } else {
      logger.info(`🟢 ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`);
    }

    // 使用日志工具记录详细信息
    loggerUtils.logRequest(req, res, duration);
  });

  next();
};
