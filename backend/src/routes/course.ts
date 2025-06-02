import { Router } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/errors';

const router = Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: 获取课程列表
 *     tags: [课程管理]
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
 *         name: courseName
 *         schema:
 *           type: string
 *         description: 课程名称
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 课程分类ID
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *         description: 讲师姓名
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 课程状态
 *     responses:
 *       200:
 *         description: 查询成功
 */
// 获取课程列表
router.get('/', async (req, res) => {
  try {
    const {
      current = 1,
      size = 10,
      courseName,
      categoryId,
      instructor,
      status,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    // 构建查询条件
    if (courseName) {
      where.courseName = {
        contains: courseName as string,
        mode: 'insensitive'
      };
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string);
    }

    if (instructor) {
      where.instructor = {
        contains: instructor as string,
        mode: 'insensitive'
      };
    }

    if (status !== undefined) {
      where.status = parseInt(status as string);
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    // 获取课程列表
    const courses = await prisma.course.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });

    // 获取总数
    const total = await prisma.course.count({ where });

    const records = courses.map(course => ({
      id: course.id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      category: {
        id: course.category.id,
        name: course.category.name
      },
      instructor: course.instructor,
      description: course.description,
      duration: course.duration,
      price: course.price,
      originalPrice: course.originalPrice,
      maxStudents: course.maxStudents,
      currentStudents: course.currentStudents,
      startDate: course.startDate,
      endDate: course.endDate,
      location: course.location,
      status: course.status,
      enrollmentCount: course._count.enrollments,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));

    res.json({
      code: 0,
      message: '获取课程列表成功',
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
    logger.error('获取课程列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取课程列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: 获取课程详情
 *     tags: [课程管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 课程ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: 课程不存在
 */
// 获取课程详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: {
        id: Number.parseInt(id)
      },
      include: {
        category: true,
        enrollments: {
          orderBy: {
            enrollTime: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!course) {
      throw new ApiError(404, '课程不存在');
    }

    res.json({
      code: 0,
      message: '获取课程详情成功',
      data: {
        ...course,
        enrollmentCount: course._count.enrollments
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取课程详情失败:', error);
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
        message: '获取课程详情失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: 创建课程
 *     tags: [课程管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseName
 *               - courseCode
 *               - categoryId
 *               - instructor
 *               - duration
 *               - price
 *               - maxStudents
 *               - startDate
 *               - endDate
 *               - location
 *             properties:
 *               courseName:
 *                 type: string
 *                 description: 课程名称
 *               courseCode:
 *                 type: string
 *                 description: 课程编码
 *               categoryId:
 *                 type: integer
 *                 description: 课程分类ID
 *               instructor:
 *                 type: string
 *                 description: 讲师姓名
 *               description:
 *                 type: string
 *                 description: 课程描述
 *               duration:
 *                 type: integer
 *                 description: 课程时长(天)
 *               price:
 *                 type: number
 *                 description: 课程价格
 *               originalPrice:
 *                 type: number
 *                 description: 原价
 *               maxStudents:
 *                 type: integer
 *                 description: 最大学员数
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: 开始日期
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: 结束日期
 *               location:
 *                 type: string
 *                 description: 上课地点
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 */
// 创建课程
router.post('/', async (req, res) => {
  try {
    const {
      courseName,
      courseCode,
      categoryId,
      instructor,
      description,
      objectives,
      outline,
      duration,
      price,
      originalPrice,
      maxStudents,
      startDate,
      endDate,
      location,
      tags
    } = req.body;

    // 检查课程代码是否已存在
    const existingCourse = await prisma.course.findUnique({
      where: { courseCode }
    });

    if (existingCourse) {
      throw new ApiError(400, '课程代码已存在');
    }

    // 检查分类是否存在
    const category = await prisma.courseCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new ApiError(400, '课程分类不存在');
    }

    const course = await prisma.course.create({
      data: {
        courseName,
        courseCode,
        categoryId,
        instructor,
        description,
        objectives,
        outline,
        duration,
        price,
        originalPrice,
        maxStudents,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        tags
      },
      include: {
        category: true
      }
    });

    logger.info(`课程创建成功: ${courseName}`);

    res.json({
      code: 0,
      message: '课程创建成功',
      data: course,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('创建课程失败:', error);
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
        message: '创建课程失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

// 更新课程
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查课程是否存在
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCourse) {
      throw new ApiError(404, '课程不存在');
    }

    // 如果更新课程代码，检查是否已存在
    if (updateData.courseCode && updateData.courseCode !== existingCourse.courseCode) {
      const codeExists = await prisma.course.findUnique({
        where: { courseCode: updateData.courseCode }
      });

      if (codeExists) {
        throw new ApiError(400, '课程代码已存在');
      }
    }

    // 处理日期字段
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: true
      }
    });

    logger.info(`课程更新成功: ${course.courseName}`);

    res.json({
      code: 0,
      message: '课程更新成功',
      data: course,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('更新课程失败:', error);
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
        message: '更新课程失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

// 删除课程
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!course) {
      throw new ApiError(404, '课程不存在');
    }

    // 检查是否有学员报名
    if (course._count.enrollments > 0) {
      throw new ApiError(400, '该课程已有学员报名，无法删除');
    }

    await prisma.course.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`课程删除成功: ${course.courseName}`);

    res.json({
      code: 0,
      message: '课程删除成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('删除课程失败:', error);
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
        message: '删除课程失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

// 获取课程分类列表
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.courseCategory.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      }
    });

    res.json({
      code: 0,
      message: '获取课程分类成功',
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        code: cat.code,
        description: cat.description,
        courseCount: cat._count.courses,
        sort: cat.sort,
        status: cat.status
      })),
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取课程分类失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取课程分类失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 课程统计
router.get('/statistics/overview', async (req, res) => {
  try {
    const totalCourses = await prisma.course.count();
    const publishedCourses = await prisma.course.count({
      where: { status: 1 }
    });
    const totalEnrollments = await prisma.courseEnrollment.count();

    // 按分类统计课程数量
    const categoryStats = await prisma.courseCategory.findMany({
      include: {
        _count: {
          select: { courses: true }
        }
      }
    });

    // 最近7天的报名统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = await prisma.courseEnrollment.count({
      where: {
        enrollTime: {
          gte: sevenDaysAgo
        }
      }
    });

    res.json({
      code: 0,
      message: '获取课程统计成功',
      data: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        recentEnrollments,
        categoryStats: categoryStats.map(cat => ({
          name: cat.name,
          count: cat._count.courses
        }))
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取课程统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取课程统计失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 获取班级课程列表
router.get('/class', async (req, res) => {
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

    // 查询该班级关联的课程
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: {
          // 这里可以根据实际业务逻辑调整查询条件
          // 暂时返回所有课程作为示例
        },
        include: {
          category: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.course.count()
    ]);

    const result = {
      records: courses.map(course => ({
        id: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        instructor: course.instructor,
        duration: course.duration,
        price: course.price,
        startDate: course.startDate?.toISOString().split('T')[0],
        endDate: course.endDate?.toISOString().split('T')[0],
        status: course.status,
        category: course.category
      })),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize)
    };

    res.json({
      code: 0,
      message: '获取班级课程列表成功',
      data: result,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error) {
    logger.error('获取班级课程列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取班级课程列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router;
