import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '@/config';
import { prisma } from '@/config/database';
import { redisUtils } from '@/config/redis';
import { authService } from '@/services/authService';
import {
  AuthError,
  ErrorCode,
  NotFoundError,
  ValidationError,
  createErrorResponse,
  createSuccessResponse
} from '@/utils/errors';
import { logger, loggerUtils } from '@/utils/logger';

class AuthController {
  /** 用户登录 */
  async login(req: Request, res: Response) {
    const { captcha, password, userName } = req.body;

    // 参数验证
    if (!userName || !password) {
      throw new ValidationError('用户名和密码不能为空');
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      include: {
        department: true,
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
      where: { userName }
    });

    if (!user) {
      throw new AuthError('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 1) {
      throw new AuthError('用户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthError('用户名或密码错误');
    }

    // 生成JWT token
    const tokenPayload = {
      userId: user.id,
      userName: user.userName
    };

    const jwtSecret = config.jwt.secret;
    const jwtRefreshSecret = config.jwt.refreshSecret;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT密钥未配置');
    }

    const token = jwt.sign(tokenPayload, jwtSecret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
    });

    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret as jwt.Secret, {
      expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn']
    });

    // 计算过期时间
    const expiresIn = jwt.decode(token) as any;
    const expires = expiresIn.exp * 1000;

    // 提取用户角色和权限
    const roles = user.userRoles.map(ur => ur.role.roleCode);
    const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code));

    // 构建用户信息
    const userInfo = {
      avatar: user.avatar,
      buttons: permissions,
      contractStartDate: user.contractStartDate ? user.contractStartDate.toISOString() : null,
      department: user.department?.name || '',
      email: user.email,
      gender: user.gender,
      nickName: user.nickName,
      permissions,
      phone: user.phone,
      position: user.position || '',
      roles,
      userId: user.id.toString(),
      userName: user.userName
    };

    // 缓存用户信息（中间件需要的格式）
    const cacheUserInfo = {
      id: user.id,
      nickName: user.nickName,
      permissions,
      roles,
      userName: user.userName
    };
    await redisUtils.set(`user:${user.id}`, cacheUserInfo, config.cache.userInfoTtl);

    // 更新最后登录信息
    await prisma.user.update({
      data: {
        lastLoginIp: req.ip,
        lastLoginTime: new Date()
      },
      where: { id: user.id }
    });

    // 记录登录历史
    await prisma.loginRecord.create({
      data: {
        userId: user.id,
        userName: user.userName,
        loginIp: req.ip || 'unknown',
        userAgent: req.get('User-Agent'),
        loginResult: 'success'
      }
    });

    // 记录登录日志
    loggerUtils.logBusiness(user.id, '用户登录', 'auth', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`用户 ${userName} 登录成功`, {
      ip: req.ip,
      userId: user.id
    });

    res.json(
      createSuccessResponse(
        {
          expires,
          refreshToken,
          token,
          userInfo
        },
        '登录成功',
        req.path
      )
    );
  }

  /** 用户登出 */
  async logout(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      // 将token加入黑名单
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redisUtils.set(`blacklist:${token}`, true, ttl);
        }
      }

      // 清除用户缓存
      if (req.user) {
        await redisUtils.del(`user:${req.user.id}`);

        // 记录登出日志
        loggerUtils.logBusiness(req.user.id, '用户登出', 'auth', {
          ip: req.ip
        });
      }
    }

    res.json(createSuccessResponse(null, '登出成功', req.path));
  }

  /** 刷新token */
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('刷新令牌不能为空');
    }

    try {
      // 验证刷新令牌
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      const { userId, userName } = decoded;

      // 检查用户是否存在且有效
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.status !== 1) {
        throw new AuthError('用户不存在或已被禁用');
      }

      // 生成新的访问令牌
      const jwtSecret = config.jwt.secret;
      if (!jwtSecret) {
        throw new Error('JWT密钥未配置');
      }

      const newToken = jwt.sign({ userId, userName }, jwtSecret as jwt.Secret, {
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
      });

      const tokenDecoded = jwt.decode(newToken) as any;
      const expires = tokenDecoded.exp * 1000;

      res.json(
        createSuccessResponse(
          {
            expires,
            token: newToken
          },
          '刷新成功',
          req.path
        )
      );
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('刷新令牌已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('刷新令牌无效');
      } else {
        throw error;
      }
    }
  }

  /** 获取当前用户信息 */
  async getCurrentUser(req: Request, res: Response) {
    if (!req.user) {
      throw new AuthError('用户未认证');
    }

    // 从数据库获取最新的用户信息
    const user = await prisma.user.findUnique({
      include: {
        department: true,
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
      where: { id: req.user.id }
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 提取角色和权限
    const roles = user.userRoles.map(ur => ur.role.roleCode);
    const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.code));

    const userInfo = {
      avatar: user.avatar,
      buttons: permissions,
      contractStartDate: user.contractStartDate ? user.contractStartDate.toISOString() : null,
      department: user.department?.name || '',
      email: user.email,
      gender: user.gender,
      nickName: user.nickName,
      permissions,
      phone: user.phone,
      position: user.position || '',
      roles,
      userId: user.id.toString(),
      userName: user.userName
    };

    // 更新缓存（中间件需要的格式）
    const cacheUserInfo = {
      id: user.id,
      nickName: user.nickName,
      permissions,
      roles,
      userName: user.userName
    };
    await redisUtils.set(`user:${user.id}`, cacheUserInfo, config.cache.userInfoTtl);

    res.json(createSuccessResponse(userInfo, '获取成功', req.path));
  }

  /** 获取验证码 */
  async getCaptcha(req: Request, res: Response) {
    const captchaData = await authService.generateCaptcha();

    res.json(createSuccessResponse(captchaData, '获取成功', req.path));
  }

  /** 获取登录记录（仅超级管理员） */
  async getLoginRecords(req: Request, res: Response) {
    try {
      // 检查用户权限
      const user = req.user;
      if (!user?.roles?.includes('super_admin')) {
        return res.status(403).json(createErrorResponse(403, '权限不足，仅超级管理员可访问', null, req.path));
      }

      const { current = 1, size = 10 } = req.query;
      const skip = (Number(current) - 1) * Number(size);
      const take = Number(size);

      // 获取登录记录
      const [loginRecords, total] = await Promise.all([
        prisma.loginRecord.findMany({
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                nickName: true,
                avatar: true
              }
            }
          },
          orderBy: {
            loginTime: 'desc'
          },
          skip,
          take
        }),
        prisma.loginRecord.count()
      ]);

      const records = loginRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        userName: record.userName,
        nickName: record.user.nickName,
        avatar: record.user.avatar,
        loginIp: record.loginIp,
        userAgent: record.userAgent,
        loginTime: record.loginTime,
        loginResult: record.loginResult,
        location: record.location
      }));

      const result = {
        current: Number(current),
        pages: Math.ceil(total / take),
        records,
        size: take,
        total
      };

      res.json(createSuccessResponse(result, '获取登录记录成功', req.path));
    } catch (error: any) {
      res.status(500).json(createErrorResponse(500, '获取登录记录失败', null, req.path));
    }
  }

  // 清除用户缓存（调试用）
  async clearUserCache(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (userId) {
        // 清除特定用户缓存
        await redisUtils.del(`user:${userId}`);
        res.json(createSuccessResponse(null, '用户缓存已清除', req.path));
      } else {
        // 清除所有用户缓存
        await redisUtils.delPattern('user:*');
        res.json(createSuccessResponse(null, '所有用户缓存已清除', req.path));
      }
    } catch (error) {
      logger.error('清除用户缓存失败:', error);
      res.status(500).json(createErrorResponse(500, '清除缓存失败', null, req.path));
    }
  }
}

export const authController = new AuthController();
