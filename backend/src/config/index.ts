import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'postgresql://soybean:soybean123@localhost:5432/soybean_admin',

  // Redis配置
  redisUrl: process.env.REDIS_URL || 'redis://:redis123@localhost:6379',

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // 文件上传配置
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB

  // 邮件配置
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  // 安全配置
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),

  // API文档配置
  apiDocEnabled: process.env.API_DOC_ENABLED === 'true',
  apiDocPath: process.env.API_DOC_PATH || '/api-docs',

  // 业务配置
  pagination: {
    defaultPage: 1,
    defaultSize: 10,
    maxSize: 100,
  },

  // 缓存配置
  cache: {
    ttl: 3600, // 1小时
    userInfoTtl: 1800, // 30分钟
    permissionTtl: 3600, // 1小时
  },
};

export default config;
