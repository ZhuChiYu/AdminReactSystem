import { Router } from 'express';
import { customerController } from '@/controllers/customerController';
import { asyncErrorHandler } from '@/middleware/errorHandler';
import { permissionMiddleware } from '@/middleware/auth';

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
router.get('/statistics', permissionMiddleware('customer:list'), asyncErrorHandler(customerController.getCustomerStatistics));

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
