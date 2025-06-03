import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { prisma } from '@/config/database';
import { ApiError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * /api/system/health:
 *   get:
 *     summary: 系统健康检查
 *     tags: [系统管理]
 *     responses:
 *       200:
 *         description: 系统运行正常
 */
// 系统健康检查
router.get('/health', (req, res) => {
  res.json({
    code: 0,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    message: '系统运行正常',
    path: req.path,
    timestamp: Date.now()
  });
});

/**
 * @swagger
 * /api/system/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [系统管理]
 *     parameters:
 *       - in: query
 *         name: current
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 当前页码
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页大小
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         description: 用户名
 *       - in: query
 *         name: nickName
 *         schema:
 *           type: string
 *         description: 昵称
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: 邮箱
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 用户状态
 *     responses:
 *       200:
 *         description: 查询成功
 */
// 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const { current = 1, departmentId, email, nickName, size = 10, status, userName } = req.query;

    const where: any = {};

    if (userName) {
      where.userName = {
        contains: userName as string,
        mode: 'insensitive'
      };
    }

    if (nickName) {
      where.nickName = {
        contains: nickName as string,
        mode: 'insensitive'
      };
    }

    if (email) {
      where.email = {
        contains: email as string,
        mode: 'insensitive'
      };
    }

    if (status !== undefined) {
      where.status = Number.parseInt(status as string);
    }

    if (departmentId) {
      where.departmentId = Number.parseInt(departmentId as string);
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    const users = await prisma.user.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleCode: true,
                roleName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take,
      where
    });

    const total = await prisma.user.count({ where });

    const records = users.map(user => ({
      avatar: user.avatar,
      createdAt: user.createdAt,
      department: user.department,
      email: user.email,
      gender: user.gender,
      id: user.id,
      lastLoginTime: user.lastLoginTime,
      nickName: user.nickName,
      phone: user.phone,
      position: user.position,
      roles: user.userRoles.map(ur => ur.role),
      status: user.status,
      updatedAt: user.updatedAt,
      userName: user.userName
    }));

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / take),
        records,
        size: Number.parseInt(size as string),
        total
      },
      message: '获取用户列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取用户列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取用户列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 创建用户
router.post('/users', async (req, res) => {
  try {
    const { departmentId, email, gender, nickName, password, phone, position, roleIds = [], userName } = req.body;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { userName }
    });

    if (existingUser) {
      throw new ApiError(400, '用户名已存在');
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        throw new ApiError(400, '邮箱已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        departmentId,
        email,
        gender: gender || 0,
        nickName,
        password: hashedPassword,
        phone,
        position,
        userName
      },
      include: {
        department: true
      }
    });

    // 分配角色
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: number) => ({
          roleId,
          userId: user.id
        }))
      });
    }

    logger.info(`用户创建成功: ${userName}`);

    // 返回时排除密码
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 0,
      data: userWithoutPassword,
      message: '用户创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建用户失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        data: null,
        message: error.message,
        path: req.path,
        timestamp: Date.now()
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: '创建用户失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 更新用户
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!existingUser) {
      throw new ApiError(404, '用户不存在');
    }

    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await prisma.user.update({
      data: updateData,
      include: {
        department: true
      },
      where: { id: Number.parseInt(id) }
    });

    logger.info(`用户更新成功: ${user.userName}`);

    // 返回时排除密码
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 0,
      data: userWithoutPassword,
      message: '用户更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新用户失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        data: null,
        message: error.message,
        path: req.path,
        timestamp: Date.now()
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: '更新用户失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    await prisma.user.delete({
      where: { id: Number.parseInt(id) }
    });

    logger.info(`用户删除成功: ${user.userName}`);

    res.json({
      code: 0,
      data: null,
      message: '用户删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除用户失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        data: null,
        message: error.message,
        path: req.path,
        timestamp: Date.now()
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: '删除用户失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 获取角色列表
router.get('/roles', async (req, res) => {
  try {
    const { current = 1, roleCode, roleName, size = 10, status } = req.query;

    const where: any = {};

    if (roleName) {
      where.roleName = {
        contains: roleName as string,
        mode: 'insensitive'
      };
    }

    if (roleCode) {
      where.roleCode = {
        contains: roleCode as string,
        mode: 'insensitive'
      };
    }

    if (status !== undefined) {
      where.status = Number.parseInt(status as string);
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
            userRoles: true
          }
        }
      },
      orderBy: {
        sort: 'asc'
      },
      skip,
      take,
      where
    });

    const total = await prisma.role.count({ where });

    const records = roles.map(role => ({
      createdAt: role.createdAt,
      id: role.id,
      permissionCount: role._count.rolePermissions,
      remark: role.remark,
      roleCode: role.roleCode,
      roleName: role.roleName,
      sort: role.sort,
      status: role.status,
      updatedAt: role.updatedAt,
      userCount: role._count.userRoles
    }));

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / take),
        records,
        size: Number.parseInt(size as string),
        total
      },
      message: '获取角色列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取角色列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取角色列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 创建角色
router.post('/roles', async (req, res) => {
  try {
    const { remark, roleCode, roleName, sort, status } = req.body;

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { roleCode }
    });

    if (existingRole) {
      throw new ApiError(400, '角色代码已存在');
    }

    const role = await prisma.role.create({
      data: {
        remark,
        roleCode,
        roleName,
        sort: sort || 0,
        status: status || 1
      }
    });

    logger.info(`角色创建成功: ${roleName}`);

    res.json({
      code: 0,
      data: role,
      message: '角色创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建角色失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        data: null,
        message: error.message,
        path: req.path,
        timestamp: Date.now()
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        message: '创建角色失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 获取部门列表
router.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { sort: 'asc' },
      where: { status: 1 }
    });

    res.json({
      code: 0,
      data: departments.map(dept => ({
        code: dept.code,
        id: dept.id,
        level: dept.level,
        name: dept.name,
        parentId: dept.parentId,
        remark: dept.remark,
        sort: dept.sort,
        status: dept.status,
        userCount: dept._count.users
      })),
      message: '获取部门列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取部门列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取部门列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 系统统计
router.get('/statistics', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 1 }
    });
    const totalRoles = await prisma.role.count();
    const totalDepartments = await prisma.department.count();

    // 今日登录用户数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLoginUsers = await prisma.user.count({
      where: {
        lastLoginTime: {
          gte: today
        }
      }
    });

    res.json({
      code: 0,
      data: {
        activeUsers,
        todayLoginUsers,
        totalDepartments,
        totalRoles,
        totalUsers
      },
      message: '获取系统统计成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取系统统计失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取系统统计失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

export default router;
