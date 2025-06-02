import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

import { classController } from '@/controllers/classController';
import { asyncErrorHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
// import { permissionMiddleware } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: 获取班级列表
 *     tags: [班级管理]
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
 *         name: name
 *         schema:
 *           type: string
 *         description: 班级名称
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 班级类型ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 班级状态
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/', asyncErrorHandler(classController.getClasses));

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: 获取班级详情
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 班级ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: 班级不存在
 */
router.get('/:id', asyncErrorHandler(classController.getClassById));

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: 创建班级
 *     tags: [班级管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - categoryName
 *               - teacher
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: 班级名称
 *               categoryId:
 *                 type: integer
 *                 description: 班级类型ID
 *               categoryName:
 *                 type: string
 *                 description: 班级类型名称
 *               teacher:
 *                 type: string
 *                 description: 讲师
 *               description:
 *                 type: string
 *                 description: 班级描述
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 开始日期
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 结束日期
 *               students:
 *                 type: array
 *                 description: 学员列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     company:
 *                       type: string
 *                     position:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 */
router.post('/', asyncErrorHandler(classController.createClass));

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: 更新班级
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 班级ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               categoryName:
 *                 type: string
 *               teacher:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 班级不存在
 */
router.put('/:id', asyncErrorHandler(classController.updateClass));

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: 删除班级
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 班级ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 班级不存在
 */
router.delete('/:id', asyncErrorHandler(classController.deleteClass));

/**
 * @swagger
 * /api/classes/students:
 *   get:
 *     summary: 获取班级学生列表
 *     tags: [班级管理]
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 班级ID
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
router.get('/students', async (req, res) => {
  try {
    const { classId, current = 1, size = 10 } = req.query;

    if (!classId) {
      return res.status(400).json({
        code: 400,
        message: '缺少班级ID参数',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    const page = parseInt(current as string);
    const pageSize = parseInt(size as string);
    const skip = (page - 1) * pageSize;

    const [students, total] = await Promise.all([
      prisma.classStudent.findMany({
        where: { classId: parseInt(classId as string) },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.classStudent.count({ 
        where: { classId: parseInt(classId as string) } 
      })
    ]);

    const result = {
      records: students.map(student => ({
        id: student.id,
        name: student.name,
        company: student.company,
        position: student.position,
        phone: student.phone,
        email: student.email,
        joinDate: student.joinDate.toISOString().split('T')[0],
        attendanceRate: student.attendanceRate,
        status: student.status,
        createdAt: student.createdAt.toISOString()
      })),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize)
    };

    res.json({
      code: 0,
      message: '获取班级学生列表成功',
      data: result,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error) {
    logger.error('获取班级学生列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取班级学生列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router;
