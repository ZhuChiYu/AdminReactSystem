import fs from 'node:fs';
import path from 'node:path';

import winston from 'winston';

import { config } from '@/config';

// 确保日志目录存在
const logDir = path.dirname(config.log.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, stack, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 如果有堆栈信息，添加到日志中
    if (stack) {
      log += `\n${stack}`;
    }

    // 如果有额外的元数据，添加到日志中
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ level, message, stack, timestamp }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// 创建logger实例
export const logger = winston.createLogger({
  defaultMeta: { service: 'soybean-admin' },
  format: logFormat,
  level: config.log.level,
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      // 5MB
      maxFiles: 5,
      maxsize: 5242880
    }),

    // 所有日志文件
    new winston.transports.File({
      filename: config.log.file,
      // 5MB
      maxFiles: 10,
      maxsize: 5242880
    })
  ]
});

// 在非生产环境下，同时输出到控制台
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// 处理未捕获的异常
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    maxFiles: 5,
    maxsize: 5242880
  })
);

// 处理未处理的Promise拒绝
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    maxFiles: 5,
    maxsize: 5242880
  })
);

// 扩展logger功能
export const loggerUtils = {
  // 记录业务操作
  logBusiness: (userId: number, action: string, resource: string, details?: any) => {
    logger.info('Business Operation', {
      action,
      details,
      resource,
      timestamp: new Date().toISOString(),
      userId
    });
  },

  // 记录数据库操作
  logDatabase: (operation: string, table: string, duration: number, error?: any) => {
    if (error) {
      logger.error('Database Error', {
        duration: `${duration}ms`,
        error: error.message,
        operation,
        stack: error.stack,
        table
      });
    } else {
      logger.debug('Database Operation', {
        duration: `${duration}ms`,
        operation,
        table
      });
    }
  },

  // 记录性能指标
  logPerformance: (metric: string, value: number, unit: string = 'ms') => {
    logger.info('Performance Metric', {
      metric,
      timestamp: new Date().toISOString(),
      unit,
      value
    });
  },

  // 记录API请求
  logRequest: (req: any, res: any, duration: number) => {
    const { headers, ip, method, originalUrl } = req;
    const { statusCode } = res;

    logger.info('API Request', {
      duration: `${duration}ms`,
      ip,
      method,
      statusCode,
      url: originalUrl,
      userAgent: headers['user-agent']
    });
  },

  // 记录安全事件
  logSecurity: (event: string, ip: string, details?: any) => {
    logger.warn('Security Event', {
      details,
      event,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;
