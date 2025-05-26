import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';

import { config } from '@/config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';
import { logMiddleware } from '@/middleware/log';
import { setupSwagger } from '@/config/swagger';
import { prisma } from '@/config/database';
import { redis, connectRedis } from '@/config/redis';

// 路由导入
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import customerRoutes from '@/routes/customer';
import courseRoutes from '@/routes/course';
import classRoutes from '@/routes/class';
import meetingRoutes from '@/routes/meeting';
import systemRoutes from '@/routes/system';

// 加载环境变量
dotenv.config();

const app = express();

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
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

    // 允许ngrok域名
    if (origin.includes('.ngrok-free.app') || origin.includes('.ngrok.io')) {
      return callback(null, true);
    }

    // 允许frp相关域名和端口
    if (origin.includes("englishpartner.cn") ||
        origin.includes("111.230.110.95") ||
        origin.match(/http:\/\/111\.230\.110\.95:\d+/)) {
      return callback(null, true);
    }

    // 检查是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // 开发环境允许所有localhost域名
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    callback(new Error('不允许的跨域请求'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 限制每个IP每15分钟最多100次请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null,
    timestamp: Date.now(),
    path: '',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// 自定义中间件
app.use(logMiddleware);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'OK',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    timestamp: Date.now(),
    path: req.path,
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/courses', authMiddleware, courseRoutes);
app.use('/api/classes', authMiddleware, classRoutes);
app.use('/api/meetings', authMiddleware, meetingRoutes);
app.use('/api/system', authMiddleware, systemRoutes);

// API文档
if (process.env.API_DOC_ENABLED === 'true') {
  setupSwagger(app);
}

// 静态文件服务
app.use('/uploads', express.static(config.uploadPath));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: Date.now(),
    path: req.originalUrl,
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
