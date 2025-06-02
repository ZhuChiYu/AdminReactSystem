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

    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
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

      const newToken = jwt.sign({ userId, userName }, jwtSecret, { expiresIn: config.jwt.expiresIn });

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
}

export const authController = new AuthController();
