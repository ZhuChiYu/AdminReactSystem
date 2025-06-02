import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '@/config';
import { prisma } from '@/config/database';
import { redisUtils } from '@/config/redis';
import { AuthError, createErrorResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';

// 扩展Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        nickName: string;
        permissions: string[];
        roles: string[];
        userName: string;
      };
    }
  }
}

// JWT Token验证中间件
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('未提供认证令牌');
    }

    const token = authHeader.substring(7);

    // 检查token是否在黑名单中
    const isBlacklisted = await redisUtils.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthError('令牌已失效');
    }

    // 验证JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const { userId, userName } = decoded;

    // 从缓存获取用户信息
    let userInfo = (await redisUtils.get(`user:${userId}`)) as {
      id: number;
      nickName: string;
      permissions: string[];
      roles: string[];
      userName: string;
    } | null;

    if (!userInfo) {
      // 缓存中没有，从数据库获取
      const user = await prisma.user.findUnique({
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        },
        where: { id: userId }
      });

      if (!user || user.status !== 1) {
        throw new AuthError('用户不存在或已被禁用');
      }

      // 提取角色和权限
      const roles = user.userRoles.map(ur => ur.role.roleCode);
      const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code));

      userInfo = {
        id: user.id,
        nickName: user.nickName,
        permissions,
        roles,
        userName: user.userName
      };

      // 缓存用户信息
      await redisUtils.set(`user:${userId}`, userInfo, config.cache.userInfoTtl);
    }

    // 将用户信息添加到请求对象
    req.user = userInfo;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(createErrorResponse(401, '令牌已过期', null, req.path));
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(createErrorResponse(401, '令牌无效', null, req.path));
    } else if (error instanceof AuthError) {
      res.status(401).json(createErrorResponse(401, error.message, null, req.path));
    } else {
      res.status(500).json(createErrorResponse(500, '服务器内部错误', null, req.path));
    }
  }
};

// 权限验证中间件
export const permissionMiddleware = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthError('用户未认证');
      }

      if (!req.user.permissions.includes(permission)) {
        throw new AuthError('权限不足');
      }

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(403).json(createErrorResponse(403, error.message, null, req.path));
      } else {
        res.status(500).json(createErrorResponse(500, '服务器内部错误', null, req.path));
      }
    }
  };
};

// 角色验证中间件
export const roleMiddleware = (role: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthError('用户未认证');
      }

      if (!req.user.roles.includes(role)) {
        throw new AuthError('角色权限不足');
      }

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(403).json(createErrorResponse(403, error.message, null, req.path));
      } else {
        res.status(500).json(createErrorResponse(500, '服务器内部错误', null, req.path));
      }
    }
  };
};

// 可选认证中间件（不强制要求认证）
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    if (!token) {
      return next();
    }

    try {
      const decoded: any = jwt.verify(token, config.jwt.secret);
      const { userId } = decoded;

      // 检查token是否在黑名单中
      const isBlacklisted = await redisUtils.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return next();
      }

      // 获取用户信息
      const userInfo = await redisUtils.get<any>(`user:${userId}`);
      if (userInfo) {
        req.user = userInfo;
      }
    } catch (error) {
      // 忽略token验证错误，继续处理请求
    }

    next();
  } catch (error) {
    logger.error('可选认证中间件错误:', error);
    next();
  }
};
