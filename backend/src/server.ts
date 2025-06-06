import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';

import { config } from '@/config';
import { prisma } from '@/config/database';
import { connectRedis, redis } from '@/config/redis';
import { setupSwagger } from '@/config/swagger';
import { authMiddleware } from '@/middleware/auth';
import { errorHandler } from '@/middleware/errorHandler';
import { logMiddleware } from '@/middleware/log';

// 路由导入
import attachmentRoutes from '@/routes/attachment';
import authRoutes from '@/routes/auth';
import avatarRoutes from '@/routes/avatar';
import classRoutes from '@/routes/class';
import courseRoutes from '@/routes/course';
import customerRoutes from '@/routes/customer';
import expenseRoutes from '@/routes/expense';
import meetingRoutes from '@/routes/meeting';
import notificationRoutes from '@/routes/notification';
import systemRoutes from '@/routes/system';
import taskRoutes from '@/routes/task';
import userRoutes from '@/routes/user';
import { logger } from '@/utils/logger';

// 加载环境变量
dotenv.config();

const app = express();

// 基础中间件
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    origin(origin, callback) {
      // 允许没有origin的请求（比如移动应用）
      if (!origin) return callback(null, true);

      // 开发环境允许的域名
      const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:9527',
        'http://localhost:9528',
        'http://localhost:9529',
        'http://localhost:9530',
        'http://localhost:9531',
        'http://localhost:9532',
        'http://localhost:9533'
      ];

      // 生产环境允许的域名
      if (process.env.NODE_ENV === 'production') {
        allowedOrigins.push('https://your-domain.com');
      }

      // 检查是否在允许列表中
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 开发环境允许所有localhost域名
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      callback(new Error('不允许的跨域请求'));
    }
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 设置响应编码为UTF-8，但只针对API路由
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 请求日志
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  })
);

// 速率限制
// const limiter = rateLimit({
//   max: Number.parseInt(process.env.RATE_LIMIT_MAX || '100'), // 限制每个IP每15分钟最多100次请求
//   message: {
//     code: 429,
//     data: null,
//     message: '请求过于频繁，请稍后再试',
//     path: '',
//     timestamp: Date.now()
//   },
//   standardHeaders: true,
//   windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000')
// });

// app.use(limiter);

// 自定义中间件
app.use(logMiddleware);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    data: {
      environment: process.env.NODE_ENV,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    message: 'OK',
    path: req.path,
    timestamp: Date.now()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/avatar', authMiddleware, avatarRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/courses', authMiddleware, courseRoutes);
app.use('/api/classes', authMiddleware, classRoutes);
app.use('/api/meetings', authMiddleware, meetingRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/attachments', authMiddleware, attachmentRoutes);
app.use('/api/expense', authMiddleware, expenseRoutes);

// API文档
if (process.env.API_DOC_ENABLED === 'true') {
  setupSwagger(app);
}

// 静态文件服务 - 添加CORS支持
app.use(
  '/uploads',
  (req, res, next) => {
    // 设置CORS头部
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  },
  express.static(config.uploadPath)
);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    data: null,
    message: '接口不存在',
    path: req.originalUrl,
    timestamp: Date.now()
  });
});

// 错误处理中间件
app.use(errorHandler);

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');

  // 关闭数据库连接
  await prisma.$disconnect();

  // 关闭Redis连接
  await redis.quit();

  logger.info('应用已优雅关闭');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');

  await prisma.$disconnect();
  await redis.quit();

  logger.info('应用已优雅关闭');
  process.exit(0);
});

// 启动服务器
const PORT = config.port;
const HOST = config.host;

async function startServer() {
  try {
    // 连接Redis
    await connectRedis();

    app.listen(PORT, HOST, () => {
      logger.info(`🚀 服务器启动成功！`);
      logger.info(`📍 地址: http://${HOST}:${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV}`);
      logger.info(`📚 API文档: http://${HOST}:${PORT}${config.apiDocPath}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;
