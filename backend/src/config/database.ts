import { PrismaClient } from '@prisma/client';

import { logger } from '@/utils/logger';

// 创建Prisma客户端实例
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event',
      level: 'error'
    },
    {
      emit: 'event',
      level: 'info'
    },
    {
      emit: 'event',
      level: 'warn'
    }
  ]
});

// 监听Prisma事件
prisma.$on('query', e => {
  logger.debug(`Query: ${e.query}`);
  logger.debug(`Params: ${e.params}`);
  logger.debug(`Duration: ${e.duration}ms`);
});

prisma.$on('error', e => {
  logger.error('Prisma Error:', e);
});

prisma.$on('info', e => {
  logger.info('Prisma Info:', e.message);
});

prisma.$on('warn', e => {
  logger.warn('Prisma Warning:', e.message);
});

// 数据库连接测试
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ 数据库连接成功');

    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ 数据库查询测试成功');
  } catch (error) {
    logger.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
};

// 数据库断开连接
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('✅ 数据库连接已断开');
  } catch (error) {
    logger.error('❌ 数据库断开连接失败:', error);
  }
};

// 数据库健康检查
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('数据库健康检查失败:', error);
    return false;
  }
};

export default prisma;
