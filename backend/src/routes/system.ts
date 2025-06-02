import { Router } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import bcrypt from 'bcryptjs';

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
    message: '系统运行正常',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    timestamp: Date.now(),
    path: req.path,
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
    const {
      current = 1,
      size = 10,
      userName,
      nickName,
      email,
      status,
      departmentId
    } = req.query;

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
      where.status = parseInt(status as string);
    }

    if (departmentId) {
      where.departmentId = parseInt(departmentId as string);
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    const users = await prisma.user.findMany({
      where,
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
                roleName: true,
                roleCode: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    const total = await prisma.user.count({ where });

    const records = users.map(user => ({
      id: user.id,
      userName: user.userName,
      nickName: user.nickName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      gender: user.gender,
      status: user.status,
      department: user.department,
      position: user.position,
      roles: user.userRoles.map(ur => ur.role),
      lastLoginTime: user.lastLoginTime,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      code: 0,
      message: '获取用户列表成功',
      data: {
        records,
        total,
        current: parseInt(current as string),
        size: parseInt(size as string),
        pages: Math.ceil(total / take)
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取用户列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 创建用户
router.post('/users', async (req, res) => {
  try {
    const {
      userName,
      nickName,
      email,
      phone,
      password,
      departmentId,
      position,
      gender,
      roleIds = []
    } = req.body;

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
        userName,
        nickName,
        email,
        phone,
        password: hashedPassword,
        departmentId,
        position,
        gender: gender || 0
      },
      include: {
        department: true
      }
    });

    // 分配角色
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: number) => ({
          userId: user.id,
          roleId
        }))
      });
    }

    logger.info(`用户创建成功: ${userName}`);

    // 返回时排除密码
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 0,
      message: '用户创建成功',
      data: userWithoutPassword,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('创建用户失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        message: error.message,
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '创建用户失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
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
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      throw new ApiError(404, '用户不存在');
    }

    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        department: true
      }
    });

    logger.info(`用户更新成功: ${user.userName}`);

    // 返回时排除密码
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 0,
      message: '用户更新成功',
      data: userWithoutPassword,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('更新用户失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        message: error.message,
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '更新用户失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
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
      where: { id: parseInt(id) }
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`用户删除成功: ${user.userName}`);

    res.json({
      code: 0,
      message: '用户删除成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('删除用户失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        message: error.message,
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '删除用户失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

// 获取角色列表
router.get('/roles', async (req, res) => {
  try {
    const {
      current = 1,
      size = 10,
      roleName,
      roleCode,
      status
    } = req.query;

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
      where.status = parseInt(status as string);
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    const roles = await prisma.role.findMany({
      where,
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true
          }
        }
      },
      orderBy: {
        sort: 'asc'
      },
      skip,
      take
    });

    const total = await prisma.role.count({ where });

    const records = roles.map(role => ({
      id: role.id,
      roleName: role.roleName,
      roleCode: role.roleCode,
      status: role.status,
      sort: role.sort,
      remark: role.remark,
      userCount: role._count.userRoles,
      permissionCount: role._count.rolePermissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }));

    res.json({
      code: 0,
      message: '获取角色列表成功',
      data: {
        records,
        total,
        current: parseInt(current as string),
        size: parseInt(size as string),
        pages: Math.ceil(total / take)
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取角色列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取角色列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 创建角色
router.post('/roles', async (req, res) => {
  try {
    const { roleName, roleCode, status, sort, remark } = req.body;

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { roleCode }
    });

    if (existingRole) {
      throw new ApiError(400, '角色代码已存在');
    }

    const role = await prisma.role.create({
      data: {
        roleName,
        roleCode,
        status: status || 1,
        sort: sort || 0,
        remark
      }
    });

    logger.info(`角色创建成功: ${roleName}`);

    res.json({
      code: 0,
      message: '角色创建成功',
      data: role,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('创建角色失败:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        code: error.statusCode,
        message: error.message,
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '创建角色失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

// 获取部门列表
router.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    res.json({
      code: 0,
      message: '获取部门列表成功',
      data: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        parentId: dept.parentId,
        level: dept.level,
        sort: dept.sort,
        status: dept.status,
        userCount: dept._count.users,
        remark: dept.remark
      })),
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取部门列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取部门列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
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
      message: '获取系统统计成功',
      data: {
        totalUsers,
        activeUsers,
        totalRoles,
        totalDepartments,
        todayLoginUsers
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取系统统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取系统统计失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router;
