import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';

import { userController } from '@/controllers/userController';
import { authMiddleware, permissionMiddleware } from '@/middleware/auth';
import { asyncErrorHandler } from '@/middleware/errorHandler';

const router = Router();

// 配置multer用于文件上传
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式(.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [用户管理]
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
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PageResponse'
 */
router.get('/', permissionMiddleware('system:user:list'), (req, res) => {
  res.json({
    code: 0,
    data: {
      current: 1,
      pages: 0,
      records: [],
      size: 10,
      total: 0
    },
    message: '用户管理功能开发中...',
    path: req.path,
    timestamp: Date.now()
  });
});

/**
 * @swagger
 * /api/users/employees:
 *   get:
 *     summary: 获取员工列表
 *     tags: [用户管理]
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
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/employees', authMiddleware, asyncErrorHandler(userController.getEmployees));

/**
 * @swagger
 * /api/users/managed-employees:
 *   get:
 *     summary: 获取当前管理员管理的员工列表
 *     tags: [用户管理]
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
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/managed-employees', authMiddleware, asyncErrorHandler(userController.getManagedEmployees));

/**
 * @swagger
 * /api/users/{id}/profile:
 *   put:
 *     summary: 更新用户个人资料
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               phone:
 *                 type: string
 *                 description: 手机号
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *               department:
 *                 type: string
 *                 description: 部门
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id/profile', authMiddleware, asyncErrorHandler(userController.updateProfile));

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: 修改用户密码
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: 旧密码
 *               newPassword:
 *                 type: string
 *                 description: 新密码
 *     responses:
 *       200:
 *         description: 修改成功
 */
router.put('/:id/password', authMiddleware, asyncErrorHandler(userController.changePassword));

/**
 * @swagger
 * /api/users/employee-manager-relations:
 *   get:
 *     summary: 获取员工-管理员关系列表
 *     tags: [员工管理]
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
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get(
  '/employee-manager-relations',
  permissionMiddleware('system:user:list'),
  asyncErrorHandler(userController.getEmployeeManagerRelations)
);

/**
 * @swagger
 * /api/users/employee-manager-relations:
 *   post:
 *     summary: 分配员工给管理员
 *     tags: [员工管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 员工ID列表
 *               managerId:
 *                 type: integer
 *                 description: 管理员ID
 *               remark:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.post(
  '/employee-manager-relations',
  permissionMiddleware('system:user:manage'),
  asyncErrorHandler(userController.assignEmployeesToManager)
);

/**
 * @swagger
 * /api/users/employee-manager-relations/{id}:
 *   delete:
 *     summary: 取消员工管理关系
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 关系ID
 *     responses:
 *       200:
 *         description: 取消成功
 */
router.delete(
  '/employee-manager-relations/:id',
  permissionMiddleware('system:user:manage'),
  asyncErrorHandler(userController.removeEmployeeManagerRelation)
);

// 导入员工数据
router.post(
  '/import',
  permissionMiddleware('system:user:import'),
  upload.single('file'),
  asyncErrorHandler(userController.importEmployees)
);

// 下载导入模板
router.get('/template', permissionMiddleware('system:user:import'), asyncErrorHandler(userController.downloadTemplate));

// 调试：检查导入用户状态
router.get(
  '/debug/imported',
  permissionMiddleware('system:user:list'),
  asyncErrorHandler(userController.debugImportedUsers)
);

// 修复没有角色的用户
router.post(
  '/fix/roles',
  permissionMiddleware('system:user:import'),
  asyncErrorHandler(userController.fixUsersWithoutRoles)
);

// 为用户分配角色
router.post(
  '/assign-role',
  permissionMiddleware('system:user:edit'),
  asyncErrorHandler(userController.assignRoleToUser)
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [用户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       403:
 *         description: 不允许删除超级管理员或权限不足
 *       404:
 *         description: 用户不存在
 */
router.delete('/:id', permissionMiddleware('system:user:delete'), asyncErrorHandler(userController.deleteUser));

/**
 * @swagger
 * /api/users/batch-delete:
 *   post:
 *     summary: 批量删除用户
 *     tags: [用户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 要删除的用户ID数组
 *                 example: [2, 3, 4]
 *     responses:
 *       200:
 *         description: 批量删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       description: 成功删除的用户数量
 *                     deletedUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           userName:
 *                             type: string
 *                           nickName:
 *                             type: string
 *                     skippedSuperAdmins:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           userName:
 *                             type: string
 *                           nickName:
 *                             type: string
 *                       description: 跳过的超级管理员列表
 *                 message:
 *                   type: string
 *       403:
 *         description: 权限不足或尝试删除超级管理员
 */
router.post(
  '/batch-delete',
  permissionMiddleware('system:user:delete'),
  asyncErrorHandler(userController.batchDeleteUsers)
);

export default router;
