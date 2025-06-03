import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

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
        data: null,
        message: '缺少班级ID参数',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const page = Number.parseInt(current as string);
    const pageSize = Number.parseInt(size as string);
    const skip = (page - 1) * pageSize;

    const [students, total] = await Promise.all([
      prisma.classStudent.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        where: { classId: Number.parseInt(classId as string) }
      }),
      prisma.classStudent.count({
        where: { classId: Number.parseInt(classId as string) }
      })
    ]);

    const result = {
      current: page,
      pages: Math.ceil(total / pageSize),
      records: students.map(student => ({
        attendanceRate: student.attendanceRate,
        company: student.company,
        createdAt: student.createdAt.toISOString(),
        email: student.email,
        id: student.id,
        joinDate: student.joinDate.toISOString().split('T')[0],
        name: student.name,
        phone: student.phone,
        position: student.position,
        status: student.status
      })),
      size: pageSize,
      total
    };

    res.json({
      code: 0,
      data: result,
      message: '获取班级学生列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('获取班级学生列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取班级学生列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/categories/list:
 *   get:
 *     summary: 获取班级分类列表
 *     tags: [班级管理]
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/categories/list', async (req, res) => {
  try {
    logger.info('🔵 GET /api/classes/categories/list - 开始处理');

    const categories = await prisma.classCategory.findMany({
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'desc' }
      ],
      where: {
        status: 1 // 只返回启用的分类
      }
    });

    const result = categories.map(category => ({
      code: category.code,
      createdAt: category.createdAt.toISOString(),
      description: category.description,
      id: category.id,
      name: category.name,
      sort: category.sort,
      status: category.status,
      updatedAt: category.updatedAt.toISOString()
    }));

    res.json({
      code: 0,
      data: result,
      message: '获取班级分类列表成功',
      path: req.path,
      timestamp: Date.now()
    });

    logger.info('🟢 GET /api/classes/categories/list - 获取班级分类列表成功');
  } catch (error) {
    logger.error('获取班级分类列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取班级分类列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/categories:
 *   post:
 *     summary: 创建班级分类
 *     tags: [班级管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分类名称
 *               code:
 *                 type: string
 *                 description: 分类编码
 *               description:
 *                 type: string
 *                 description: 分类描述
 *               status:
 *                 type: integer
 *                 description: 状态(0-禁用, 1-启用)
 *               sort:
 *                 type: integer
 *                 description: 排序值
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/categories', async (req, res) => {
  try {
    logger.info('🔵 POST /api/classes/categories - 开始处理');
    const { name, code, description, status = 1, sort = 0 } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '分类名称和编码不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查编码是否已存在
    const existingCategory = await prisma.classCategory.findUnique({
      where: { code }
    });

    if (existingCategory) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '分类编码已存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查名称是否已存在
    const existingName = await prisma.classCategory.findFirst({
      where: { name }
    });

    if (existingName) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '分类名称已存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const category = await prisma.classCategory.create({
      data: {
        code,
        description,
        name,
        sort,
        status
      }
    });

    logger.info(`班级分类创建成功: ${name}`);

    res.json({
      code: 0,
      data: {
        code: category.code,
        createdAt: category.createdAt.toISOString(),
        description: category.description,
        id: category.id,
        name: category.name,
        sort: category.sort,
        status: category.status,
        updatedAt: category.updatedAt.toISOString()
      },
      message: '班级分类创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('创建班级分类失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建班级分类失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/categories/{id}:
 *   put:
 *     summary: 更新班级分类
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 分类ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分类名称
 *               code:
 *                 type: string
 *                 description: 分类编码
 *               description:
 *                 type: string
 *                 description: 分类描述
 *               status:
 *                 type: integer
 *                 description: 状态
 *               sort:
 *                 type: integer
 *                 description: 排序值
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/categories/:id', async (req, res) => {
  try {
    logger.info(`🔵 PUT /api/classes/categories/${req.params.id} - 开始处理`);
    const categoryId = Number.parseInt(req.params.id);
    const { name, code, description, status, sort } = req.body;

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '无效的分类ID',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查分类是否存在
    const existingCategory = await prisma.classCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '班级分类不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查编码冲突（排除自己）
    if (code && code !== existingCategory.code) {
      const codeConflict = await prisma.classCategory.findUnique({
        where: { code }
      });
      if (codeConflict) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '分类编码已存在',
          path: req.path,
          timestamp: Date.now()
        });
      }
    }

    // 检查名称冲突（排除自己）
    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.classCategory.findFirst({
        where: {
          name,
          NOT: { id: categoryId }
        }
      });
      if (nameConflict) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '分类名称已存在',
          path: req.path,
          timestamp: Date.now()
        });
      }
    }

    const updatedCategory = await prisma.classCategory.update({
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(sort !== undefined && { sort })
      },
      where: { id: categoryId }
    });

    logger.info(`班级分类更新成功: ${updatedCategory.name}`);

    res.json({
      code: 0,
      data: {
        code: updatedCategory.code,
        createdAt: updatedCategory.createdAt.toISOString(),
        description: updatedCategory.description,
        id: updatedCategory.id,
        name: updatedCategory.name,
        sort: updatedCategory.sort,
        status: updatedCategory.status,
        updatedAt: updatedCategory.updatedAt.toISOString()
      },
      message: '班级分类更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('更新班级分类失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新班级分类失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/categories/{id}:
 *   delete:
 *     summary: 删除班级分类
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    logger.info(`🔵 DELETE /api/classes/categories/${req.params.id} - 开始处理`);
    const categoryId = Number.parseInt(req.params.id);

    if (Number.isNaN(categoryId)) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '无效的分类ID',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查分类是否存在
    const existingCategory = await prisma.classCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '班级分类不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查是否有关联的班级
    const relatedClasses = await prisma.class.count({
      where: { categoryId }
    });

    if (relatedClasses > 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: `该分类下还有 ${relatedClasses} 个班级，无法删除`,
        path: req.path,
        timestamp: Date.now()
      });
    }

    await prisma.classCategory.delete({
      where: { id: categoryId }
    });

    logger.info(`班级分类删除成功: ${existingCategory.name}`);

    res.json({
      code: 0,
      data: null,
      message: '班级分类删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('删除班级分类失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除班级分类失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

export default router;
