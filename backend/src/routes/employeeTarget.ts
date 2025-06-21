import express from 'express';
import { authMiddleware } from '@/middleware/auth';
import employeeTargetController from '@/controllers/employeeTargetController';

const router = express.Router();

/**
 * @swagger
 * /api/employee-targets:
 *   get:
 *     summary: 获取员工目标列表
 *     tags: [员工目标管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: 员工ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 年份
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: 月份
 *       - in: query
 *         name: current
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 当前页
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', authMiddleware, employeeTargetController.getEmployeeTargets);

/**
 * @swagger
 * /api/employee-targets:
 *   post:
 *     summary: 设置员工目标
 *     tags: [员工目标管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: integer
 *               targetYear:
 *                 type: integer
 *               targetMonth:
 *                 type: integer
 *               targetAmount:
 *                 type: number
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 设置成功
 */
router.post('/', authMiddleware, employeeTargetController.setEmployeeTarget);

/**
 * @swagger
 * /api/employee-targets/{id}:
 *   delete:
 *     summary: 删除员工目标
 *     tags: [员工目标管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 目标ID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:id', authMiddleware, employeeTargetController.deleteEmployeeTarget);

/**
 * @swagger
 * /api/employee-targets/batch:
 *   post:
 *     summary: 批量设置员工目标
 *     tags: [员工目标管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     employeeId:
 *                       type: integer
 *                     targetYear:
 *                       type: integer
 *                     targetMonth:
 *                       type: integer
 *                     targetAmount:
 *                       type: number
 *                     remark:
 *                       type: string
 *     responses:
 *       200:
 *         description: 批量设置成功
 */
router.post('/batch', authMiddleware, employeeTargetController.batchSetEmployeeTargets);

export default router;
