import type { NextFunction, Request, Response } from 'express';

import { ApiError, ErrorCode, ValidationError, createErrorResponse, errorUtils } from '@/utils/errors';
import { logger } from '@/utils/logger';

// 全局错误处理中间件
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let errorCode = ErrorCode.SYSTEM_ERROR;
  let message = '服务器内部错误';
  let details: any = null;

  // 处理不同类型的错误
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;

    if (error instanceof ValidationError) {
      details = error.details;
    }
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Prisma数据库错误
    const prismaError = errorUtils.formatPrismaError(error);
    statusCode = prismaError.statusCode;
    errorCode = prismaError.code;
    message = prismaError.message;
  } else if (error.name === 'ValidationError') {
    // Joi验证错误
    const validationError = errorUtils.formatJoiError(error);
    statusCode = validationError.statusCode;
    errorCode = validationError.code;
    message = validationError.message;
    details = validationError.details;
  } else if (error.name === 'JsonWebTokenError') {
    // JWT错误
    statusCode = 401;
    errorCode = ErrorCode.TOKEN_INVALID;
    message = '认证令牌无效';
  } else if (error.name === 'TokenExpiredError') {
    // JWT过期错误
    statusCode = 401;
    errorCode = ErrorCode.TOKEN_EXPIRED;
    message = '认证令牌已过期';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON解析错误
    statusCode = 400;
    errorCode = ErrorCode.PARAM_ERROR;
    message = '请求体格式错误';
  } else if (error.name === 'MulterError') {
    // 文件上传错误
    statusCode = 400;
    errorCode = ErrorCode.PARAM_ERROR;

    if (error.message.includes('File too large')) {
      message = '文件大小超出限制';
    } else if (error.message.includes('Unexpected field')) {
      message = '不支持的文件字段';
    } else {
      message = '文件上传失败';
    }
  }

  // 记录错误日志
  if (statusCode >= 500) {
    // 服务器错误，记录详细信息
    logger.error('服务器错误:', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      request: {
        body: req.body,
        ip: req.ip,
        method: req.method,
        params: req.params,
        query: req.query,
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      },
      user: req.user
    });
  } else if (statusCode >= 400) {
    // 客户端错误，记录基本信息
    logger.warn('客户端错误:', {
      error: {
        message: error.message,
        name: error.name
      },
      request: {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl
      },
      user: req.user
    });
  }

  // 构建错误响应
  const errorResponse = createErrorResponse(errorCode, message, details, req.originalUrl);

  // 在开发环境下，添加错误堆栈信息
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    (errorResponse as any).stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// 处理未捕获的异步错误
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404错误处理
export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse = createErrorResponse(ErrorCode.NOT_FOUND, '接口不存在', null, req.originalUrl);

  logger.warn('404错误:', {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json(errorResponse);
};
