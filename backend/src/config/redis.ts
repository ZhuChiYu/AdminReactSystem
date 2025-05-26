import { createClient } from 'redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// 创建Redis客户端
export const redis = createClient({
  url: config.redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis重连次数超过限制，停止重连');
        return false;
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Redis事件监听
redis.on('connect', () => {
  logger.info('✅ Redis连接成功');
});

redis.on('ready', () => {
  logger.info('✅ Redis准备就绪');
});

redis.on('error', (error) => {
  logger.error('❌ Redis连接错误:', error);
});

redis.on('end', () => {
  logger.info('Redis连接已断开');
});

redis.on('reconnecting', () => {
  logger.info('Redis正在重连...');
});

// 连接Redis
export const connectRedis = async () => {
  try {
    await redis.connect();
    logger.info('✅ Redis连接初始化成功');
  } catch (error) {
    logger.error('❌ Redis连接失败:', error);
    // 在开发环境下，Redis连接失败不应该导致应用退出
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

// 断开Redis连接
export const disconnectRedis = async () => {
  try {
    await redis.quit();
    logger.info('✅ Redis连接已断开');
  } catch (error) {
    logger.error('❌ Redis断开连接失败:', error);
  }
};

// Redis健康检查
export const checkRedisHealth = async () => {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis健康检查失败:', error);
    return false;
  }
};

// Redis工具函数
export const redisUtils = {
  // 设置缓存
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await redis.setEx(key, ttl, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Redis设置缓存失败 [${key}]:`, error);
    }
  },

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis获取缓存失败 [${key}]:`, error);
      return null;
    }
  },

  // 删除缓存
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Redis删除缓存失败 [${key}]:`, error);
    }
  },

  // 批量删除缓存
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.error(`Redis批量删除缓存失败 [${pattern}]:`, error);
    }
  },

  // 检查键是否存在
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis检查键存在失败 [${key}]:`, error);
      return false;
    }
  },

  // 设置过期时间
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl);
    } catch (error) {
      logger.error(`Redis设置过期时间失败 [${key}]:`, error);
    }
  },

  // 获取剩余过期时间
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Redis获取过期时间失败 [${key}]:`, error);
      return -1;
    }
  },
};

export default redis;
