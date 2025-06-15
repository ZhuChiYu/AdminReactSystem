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

/**
 * @swagger
 * /api/system/users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [系统管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: 用户不存在
 */
// 获取用户详情
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
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
                roleName: true,
                roleType: true
              }
            }
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    // 转换角色数据结构
    const roles = user.userRoles.map(ur => ({
      code: ur.role.roleCode,
      name: ur.role.roleName,
      type: ur.role.roleType
    }));

    // 返回用户信息（排除敏感信息）
    const { password: _, userRoles: __, ...userInfo } = user;
    const userData = {
      ...userInfo,
      roles
    };

    res.json({
      code: 0,
      data: userData,
      message: '获取用户详情成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取用户详情失败:', error);
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
        message: '获取用户详情失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 创建用户
router.post('/users', async (req, res) => {
  try {
    const {
      address,
      bankCard,
      departmentId,
      email,
      gender,
      idCard,
      nickName,
      password,
      phone,
      position,
      roleIds = [],
      status,
      tim,
      userName,
      wechat
    } = req.body;

    // 检查必需字段
    if (!userName || !nickName || !password) {
      throw new ApiError(400, '用户名、昵称和密码为必填项');
    }

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

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingPhone) {
        throw new ApiError(400, '手机号已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 转换状态值
    let statusValue = 1; // 默认启用
    if (status !== undefined) {
      if (typeof status === 'string') {
        statusValue = status === 'active' ? 1 : 0;
      } else {
        statusValue = Number(status) || 1;
      }
    }

    // 转换性别值
    let genderValue = 0; // 默认未知
    if (gender !== undefined) {
      if (typeof gender === 'string') {
        if (gender === 'male') genderValue = 1;
        else if (gender === 'female') genderValue = 2;
        else genderValue = 0;
      } else {
        genderValue = Number(gender) || 0;
      }
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        address,
        bankCard,
        departmentId,
        email,
        gender: genderValue,
        idCard,
        nickName,
        password: hashedPassword,
        phone,
        position,
        status: statusValue,
        tim,
        userName,
        wechat
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

/**
 * @swagger
 * /api/system/roles:
 *   get:
 *     summary: 获取角色列表
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
 *         name: roleCode
 *         schema:
 *           type: string
 *         description: 角色代码
 *       - in: query
 *         name: roleName
 *         schema:
 *           type: string
 *         description: 角色名
 *       - in: query
 *         name: roleType
 *         schema:
 *           type: string
 *         description: 角色类型
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 角色状态
 *     responses:
 *       200:
 *         description: 查询成功
 */
// 获取角色列表
router.get('/roles', async (req, res) => {
  try {
    const { current = 1, roleCode, roleName, roleType = 'position', size = 10, status } = req.query;

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

    // Add roleType filter
    if (roleType) {
      where.roleType = roleType;
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
      roleType: role.roleType,
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

// 更新角色
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { department, remark, roleCode, roleName, status } = req.body;

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!existingRole) {
      throw new ApiError(404, '角色不存在');
    }

    // 如果要更新roleCode，检查新的roleCode是否已存在（排除当前角色）
    if (roleCode && roleCode !== existingRole.roleCode) {
      const roleWithSameCode = await prisma.role.findFirst({
        where: {
          AND: [
            { roleCode },
            { id: { not: Number.parseInt(id) } }
          ]
        }
      });

      if (roleWithSameCode) {
        throw new ApiError(400, '角色代码已存在');
      }
    }

    // 不允许更新超级管理员角色
    if (existingRole.roleCode === 'super_admin') {
      throw new ApiError(403, '不允许修改超级管理员角色');
    }

    const role = await prisma.role.update({
      data: {
        department,
        remark,
        roleCode,
        roleName,
        status: status !== undefined ? Number(status) : undefined
      },
      where: { id: Number.parseInt(id) }
    });

    logger.info(`角色更新成功: ${roleName}`);

    res.json({
      code: 0,
      data: role,
      message: '角色更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新角色失败:', error);
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
        message: '更新角色失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 删除角色
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!existingRole) {
      throw new ApiError(404, '角色不存在');
    }

    // 不允许删除超级管理员角色
    if (existingRole.roleCode === 'super_admin') {
      throw new ApiError(403, '不允许删除超级管理员角色');
    }

    // 删除角色（关联的用户角色会自动删除，因为设置了级联删除）
    await prisma.role.delete({
      where: { id: Number.parseInt(id) }
    });

    logger.info(`角色删除成功: ${existingRole.roleName}`);

    res.json({
      code: 0,
      data: null,
      message: '角色删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除角色失败:', error);
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
        message: '删除角色失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 批量删除角色
router.post('/roles/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, '角色ID列表不能为空');
    }

    // 检查是否包含超级管理员角色
    const roles = await prisma.role.findMany({
      where: { id: { in: ids.map(id => Number(id)) } }
    });

    const hasSuperAdmin = roles.some(role => role.roleCode === 'super_admin');
    if (hasSuperAdmin) {
      throw new ApiError(403, '不允许删除超级管理员角色');
    }

    // 批量删除角色（关联的用户角色会自动删除，因为设置了级联删除）
    await prisma.role.deleteMany({
      where: { id: { in: ids.map(id => Number(id)) } }
    });

    logger.info(`批量删除角色成功: ${roles.map(r => r.roleName).join(', ')}`);

    res.json({
      code: 0,
      data: null,
      message: '批量删除角色成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('批量删除角色失败:', error);
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
        message: '批量删除角色失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 创建角色
router.post('/roles', async (req, res) => {
  try {
    const { department, remark, roleCode, roleName, sort, status } = req.body;

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { roleCode }
    });

    if (existingRole) {
      throw new ApiError(400, '角色代码已存在');
    }

    const role = await prisma.role.create({
      data: {
        department,
        remark,
        roleCode,
        roleName,
        roleType: 'position', // 默认创建职务角色
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

// 更新员工权限角色
router.put('/users/:userId/permission-role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleCode } = req.body;

    // 验证角色是否为权限角色
    const role = await prisma.role.findFirst({
      where: {
        roleCode,
        roleType: 'permission'
      }
    });

    if (!role) {
      throw new ApiError(400, '无效的权限角色');
    }

    // 查找用户当前的权限角色
    const currentPermissionRole = await prisma.userRole.findFirst({
      include: {
        role: true
      },
      where: {
        role: {
          roleType: 'permission'
        },
        userId: Number(userId)
      }
    });

    // 开启事务处理角色更新
    await prisma.$transaction(async tx => {
      // 如果存在旧的权限角色，先删除
      if (currentPermissionRole) {
        await tx.userRole.delete({
          where: {
            id: currentPermissionRole.id
          }
        });
      }

      // 创建新的权限角色关联
      await tx.userRole.create({
        data: {
          roleId: role.id,
          userId: Number(userId)
        }
      });
    });

    res.json({
      code: 0,
      data: null,
      message: '权限角色更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新权限角色失败:', error);
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
        message: '更新权限角色失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

export default router;
