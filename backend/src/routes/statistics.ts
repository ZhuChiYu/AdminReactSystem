import express from 'express';
import { authMiddleware } from '@/middleware/auth';
import statisticsController from '@/controllers/statisticsController';

const router = express.Router();

/**
 * @swagger
 * /api/statistics/employee-performance:
 *   get:
 *     summary: 获取员工业绩统计
 *     tags: [统计分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *         description: 时间范围
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 用户ID（可选，不传则获取所有用户）
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 年份（配合month使用）
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: 月份（配合year使用）
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 message:
 *                   type: string
 *                   example: 获取员工业绩统计成功
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       department:
 *                         type: string
 *                       trainingFeeAmount:
 *                         type: number
 *                       taskAmount:
 *                         type: number
 *                       totalPerformance:
 *                         type: number
 *                       target:
 *                         type: number
 *                       ratio:
 *                         type: number
 */
router.get('/employee-performance', authMiddleware, statisticsController.getEmployeePerformance);

/**
 * @swagger
 * /api/statistics/performance-trend:
 *   get:
 *     summary: 获取业绩趋势统计
 *     tags: [统计分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *         description: 统计周期
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 年份（默认当前年份）
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/performance-trend', authMiddleware, statisticsController.getPerformanceTrend);

export default router;
