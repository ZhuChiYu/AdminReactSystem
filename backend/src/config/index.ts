import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // API文档配置
  apiDocEnabled: process.env.API_DOC_ENABLED === 'true',
  apiDocPath: process.env.API_DOC_PATH || '/api-docs',
  // 安全配置
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS || '12'),

  // 缓存配置
  cache: {
    // 30分钟
    permissionTtl: 3600,
    ttl: 3600, // 1小时
    userInfoTtl: 1800 // 1小时
  },

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'postgresql://soybean:soybean123@localhost:5432/soybean_admin',

  host: process.env.HOST || '0.0.0.0',

  // JWT配置
  jwt: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
  },
  // 日志配置
  log: {
    file: process.env.LOG_FILE || './logs/app.log',
    level: process.env.LOG_LEVEL || 'info'
  },
  maxFileSize: Number.parseInt(process.env.MAX_FILE_SIZE || '10485760'),

  nodeEnv: process.env.NODE_ENV || 'development',

  // 业务配置
  pagination: {
    defaultPage: 1,
    defaultSize: 10,
    maxSize: 100
  },
  // 服务器配置
  port: Number.parseInt(process.env.PORT || '3000'),
  rateLimitMax: Number.parseInt(process.env.RATE_LIMIT_MAX || '100'),

  rateLimitWindowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  // Redis配置
  redisUrl: process.env.REDIS_URL || 'redis://:redis123@localhost:6379',

  // 10MB

  // 邮件配置
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    pass: process.env.SMTP_PASS || '',
    port: Number.parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || ''
  },

  // 文件上传配置
  uploadPath: process.env.UPLOAD_PATH || './uploads'
};

export default config;
