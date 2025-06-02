import path from 'node:path';

import { Router } from 'express';
import multer from 'multer';

import { userController } from '@/controllers/userController';
import { permissionMiddleware, authMiddleware } from '@/middleware/auth';
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
router.get('/employees', permissionMiddleware('system:user:list'), asyncErrorHandler(userController.getEmployees));

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

// 导入员工数据
router.post(
  '/import',
  permissionMiddleware('system:user:import'),
  upload.single('file'),
  asyncErrorHandler(userController.importEmployees)
);

// 下载导入模板
router.get('/template', permissionMiddleware('system:user:import'), asyncErrorHandler(userController.downloadTemplate));

export default router;
