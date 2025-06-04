import { Router } from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';

import { customerController } from '@/controllers/customerController';
import { permissionMiddleware } from '@/middleware/auth';
import { asyncErrorHandler } from '@/middleware/errorHandler';

// 确保上传目录存在
const uploadsDir = 'uploads/customer-imports';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于Excel文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/customer-imports');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `customers-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 Excel 文件 (.xlsx, .xls)'));
    }
  }
});

const router = Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: 获取客户列表
 *     tags: [客户管理]
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
 *         name: customerName
 *         schema:
 *           type: string
 *         description: 客户姓名
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: 公司名称
 *       - in: query
 *         name: followStatus
 *         schema:
 *           type: string
 *         description: 跟进状态
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/', permissionMiddleware('customer:list'), asyncErrorHandler(customerController.getCustomers));

/**
 * @swagger
 * /api/customers/statistics:
 *   get:
 *     summary: 获取客户统计数据
 *     tags: [客户管理]
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get(
  '/statistics',
  permissionMiddleware('customer:list'),
  asyncErrorHandler(customerController.getCustomerStatistics)
);

/**
 * @swagger
 * /api/customers/assignments:
 *   get:
 *     summary: 获取客户分配列表
 *     tags: [客户管理]
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
router.get('/assignments', permissionMiddleware('customer:assign'), asyncErrorHandler(customerController.getCustomerAssignments));

/**
 * @swagger
 * /api/customers/assignments:
 *   post:
 *     summary: 分配客户给员工
 *     tags: [客户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 客户ID列表
 *               assignedToId:
 *                 type: integer
 *                 description: 分配给的员工ID
 *               remark:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.post('/assignments', permissionMiddleware('customer:assign'), asyncErrorHandler(customerController.assignCustomers));

/**
 * @swagger
 * /api/customers/assignments/{id}:
 *   delete:
 *     summary: 取消客户分配
 *     tags: [客户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 分配ID
 *     responses:
 *       200:
 *         description: 取消成功
 */
router.delete('/assignments/:id', permissionMiddleware('customer:assign'), asyncErrorHandler(customerController.removeCustomerAssignment));

/**
 * @swagger
 * /api/customers/import:
 *   post:
 *     summary: 导入客户Excel文件
 *     tags: [客户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel文件
 *     responses:
 *       200:
 *         description: 导入成功
 */
router.post('/import', upload.single('file'), permissionMiddleware('customer:create'), asyncErrorHandler(customerController.importCustomers));

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: 获取客户详情
 *     tags: [客户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/:id', permissionMiddleware('customer:list'), asyncErrorHandler(customerController.getCustomerById));

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: 创建客户
 *     tags: [客户管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - company
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: 客户姓名
 *               company:
 *                 type: string
 *                 description: 公司名称
 *               position:
 *                 type: string
 *                 description: 职位
 *               phone:
 *                 type: string
 *                 description: 电话
 *               mobile:
 *                 type: string
 *                 description: 手机
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               industry:
 *                 type: string
 *                 description: 行业
 *               source:
 *                 type: string
 *                 description: 来源
 *               followStatus:
 *                 type: string
 *                 description: 跟进状态
 *               remark:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', permissionMiddleware('customer:create'), asyncErrorHandler(customerController.createCustomer));

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: 更新客户
 *     tags: [客户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: 客户姓名
 *               company:
 *                 type: string
 *                 description: 公司名称
 *               position:
 *                 type: string
 *                 description: 职位
 *               phone:
 *                 type: string
 *                 description: 电话
 *               mobile:
 *                 type: string
 *                 description: 手机
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               industry:
 *                 type: string
 *                 description: 行业
 *               source:
 *                 type: string
 *                 description: 来源
 *               followStatus:
 *                 type: string
 *                 description: 跟进状态
 *               remark:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:id', permissionMiddleware('customer:update'), asyncErrorHandler(customerController.updateCustomer));

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: 删除客户
 *     tags: [客户管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 客户ID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', permissionMiddleware('customer:delete'), asyncErrorHandler(customerController.deleteCustomer));

export default router;
