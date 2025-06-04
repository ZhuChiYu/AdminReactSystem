import { Router } from 'express';

import { prisma } from '@/config/database';
import { ApiError } from '@/utils/errors';
import { logger } from '@/utils/logger';

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
    const { categoryId, courseName, current = 1, endDate, instructor, size = 10, startDate, status } = req.query;

    const where: any = {};

    // 构建查询条件
    if (courseName) {
      where.courseName = {
        contains: courseName as string,
        mode: 'insensitive'
      };
    }

    if (categoryId) {
      where.categoryId = Number.parseInt(categoryId as string);
    }

    if (instructor) {
      where.instructor = {
        contains: instructor as string,
        mode: 'insensitive'
      };
    }

    if (status !== undefined) {
      where.status = Number.parseInt(status as string);
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    // 获取课程列表
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            enrollments: true
          }
        },
        category: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      where
    });

    // 获取总数
    const total = await prisma.course.count({ where });

    const records = courses.map((course: any) => ({
      category: {
        id: course.category.id,
        name: course.category.name
      },
      courseCode: course.courseCode,
      courseName: course.courseName,
      createdAt: course.createdAt,
      currentStudents: course.currentStudents,
      description: course.description,
      duration: course.duration,
      endDate: course.endDate,
      enrollmentCount: course._count.enrollments,
      id: course.id,
      instructor: course.instructor,
      location: course.location,
      maxStudents: course.maxStudents,
      originalPrice: course.originalPrice,
      price: course.price,
      startDate: course.startDate,
      status: course.status,
      updatedAt: course.updatedAt
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
      message: '获取课程列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取课程列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取课程列表失败',
      path: req.path,
      timestamp: Date.now()
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
        data: null,
        message: '缺少班级ID参数',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const page = Number.parseInt(current as string);
    const pageSize = Number.parseInt(size as string);
    const skip = (page - 1) * pageSize;

    // 查询班级信息并包含关联的课程
    const classInfo = await prisma.class.findUnique({
      include: {
        course: {
          include: {
            category: true,
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        }
      },
      where: { id: Number.parseInt(classId as string) }
    });

    if (!classInfo) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '班级不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 如果班级有关联课程，返回该课程信息
    let courses: any[] = [];
    let total = 0;

    if (classInfo.course) {
      courses = [classInfo.course];
      total = 1;
    }

    const result = {
      current: page,
      pages: Math.ceil(total / pageSize),
      records: courses.map(course => ({
        courseCode: course.courseCode,
        courseName: course.courseName,
        createdAt: course.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        description: course.description,
        duration: course.duration,
        endDate: course.endDate.toISOString().split('T')[0],
        id: course.id,
        instructor: course.instructor,
        location: course.location,
        price: course.price,
        startDate: course.startDate.toISOString().split('T')[0],
        status: course.status,
        updatedAt: course.updatedAt.toISOString().replace('T', ' ').substring(0, 19)
      })),
      size: pageSize,
      total
    };

    res.json({
      code: 0,
      data: result,
      message: '获取班级课程列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('获取班级课程列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取班级课程列表失败',
      path: req.path,
      timestamp: Date.now()
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
      include: {
        _count: {
          select: {
            enrollments: true
          }
        },
        category: true,
        enrollments: {
          orderBy: {
            enrollTime: 'desc'
          },
          take: 10
        }
      },
      where: {
        id: Number.parseInt(id)
      }
    });

    if (!course) {
      throw new ApiError(404, '课程不存在');
    }

    res.json({
      code: 0,
      data: {
        ...course,
        enrollmentCount: course._count.enrollments
      },
      message: '获取课程详情成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取课程详情失败:', error);
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
        message: '获取课程详情失败',
        path: req.path,
        timestamp: Date.now()
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
      categoryId,
      classId,
      courseCode,
      courseName,
      description,
      duration,
      endDate,
      instructor,
      location,
      maxStudents,
      objectives,
      originalPrice,
      outline,
      price,
      startDate,
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

    // 如果提供了classId，检查班级是否存在
    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: Number.parseInt(classId.toString()) }
      });

      if (!classExists) {
        throw new ApiError(400, '班级不存在');
      }
    }

    const course = await prisma.course.create({
      data: {
        categoryId,
        courseCode,
        courseName,
        description,
        duration,
        endDate: new Date(endDate),
        instructor,
        location,
        maxStudents,
        objectives,
        originalPrice,
        outline,
        price,
        startDate: new Date(startDate),
        tags
      },
      include: {
        category: true
      }
    });

    // 如果提供了classId，更新班级的courseId
    if (classId) {
      await prisma.class.update({
        where: { id: Number.parseInt(classId.toString()) },
        data: { courseId: course.id }
      });

      logger.info(`班级${classId}关联课程成功: ${courseName}`);
    }

    logger.info(`课程创建成功: ${courseName}`);

    res.json({
      code: 0,
      data: course,
      message: '课程创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建课程失败:', error);
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
        message: '创建课程失败',
        path: req.path,
        timestamp: Date.now()
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
      where: { id: Number.parseInt(id) }
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
      data: updateData,
      include: {
        category: true
      },
      where: { id: Number.parseInt(id) }
    });

    logger.info(`课程更新成功: ${course.courseName}`);

    res.json({
      code: 0,
      data: course,
      message: '课程更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新课程失败:', error);
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
        message: '更新课程失败',
        path: req.path,
        timestamp: Date.now()
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
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    if (!course) {
      throw new ApiError(404, '课程不存在');
    }

    // 检查是否有学员报名
    if (course._count.enrollments > 0) {
      throw new ApiError(400, '该课程已有学员报名，无法删除');
    }

    await prisma.course.delete({
      where: { id: Number.parseInt(id) }
    });

    logger.info(`课程删除成功: ${course.courseName}`);

    res.json({
      code: 0,
      data: null,
      message: '课程删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除课程失败:', error);
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
        message: '删除课程失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 获取课程分类列表
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.courseCategory.findMany({
      include: {
        _count: {
          select: {
            courses: true
          }
        }
      },
      orderBy: { sort: 'asc' },
      where: { status: 1 }
    });

    res.json({
      code: 0,
      data: categories.map((cat: any) => ({
        code: cat.code,
        courseCount: cat._count.courses,
        description: cat.description,
        id: cat.id,
        name: cat.name,
        sort: cat.sort,
        status: cat.status
      })),
      message: '获取课程分类成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取课程分类失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取课程分类失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/courses/categories:
 *   post:
 *     summary: 创建课程分类
 *     tags: [课程管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 分类名称
 *               description:
 *                 type: string
 *                 description: 分类描述
 *               status:
 *                 type: integer
 *                 description: 状态 (0-禁用, 1-启用)
 *               sort:
 *                 type: integer
 *                 description: 排序
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 */
// 创建课程分类
router.post('/categories', async (req, res) => {
  try {
    const { description, name, sort = 0, status = 1 } = req.body;

    if (!name || name.trim() === '') {
      throw new ApiError(400, '分类名称不能为空');
    }

    // 检查分类名称是否已存在
    const existingCategory = await prisma.courseCategory.findFirst({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      throw new ApiError(400, '分类名称已存在');
    }

    // 生成分类编码
    const code = `CAT_${Date.now()}`;

    const category = await prisma.courseCategory.create({
      data: {
        code,
        description: description?.trim() || '',
        name: name.trim(),
        sort,
        status
      }
    });

    logger.info(`课程分类创建成功: ${name}`);

    res.json({
      code: 0,
      data: category,
      message: '课程分类创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建课程分类失败:', error);
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
        message: '创建课程分类失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

/**
 * @swagger
 * /api/courses/categories/{id}:
 *   put:
 *     summary: 更新课程分类
 *     tags: [课程管理]
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
 *               description:
 *                 type: string
 *                 description: 分类描述
 *               status:
 *                 type: integer
 *                 description: 状态 (0-禁用, 1-启用)
 *               sort:
 *                 type: integer
 *                 description: 排序
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 分类不存在
 */
// 更新课程分类
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, name, sort, status } = req.body;

    const categoryId = Number.parseInt(id);
    if (isNaN(categoryId)) {
      throw new ApiError(400, '无效的分类ID');
    }

    // 检查分类是否存在
    const existingCategory = await prisma.courseCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      throw new ApiError(404, '课程分类不存在');
    }

    // 如果更新名称，检查是否与其他分类重名
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory = await prisma.courseCategory.findFirst({
        where: {
          id: { not: categoryId },
          name: name.trim()
        }
      });

      if (duplicateCategory) {
        throw new ApiError(400, '分类名称已存在');
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (status !== undefined) updateData.status = status;
    if (sort !== undefined) updateData.sort = sort;

    const category = await prisma.courseCategory.update({
      data: updateData,
      where: { id: categoryId }
    });

    logger.info(`课程分类更新成功: ${category.name}`);

    res.json({
      code: 0,
      data: category,
      message: '课程分类更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新课程分类失败:', error);
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
        message: '更新课程分类失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

/**
 * @swagger
 * /api/courses/categories/{id}:
 *   delete:
 *     summary: 删除课程分类
 *     tags: [课程管理]
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
 *       400:
 *         description: 分类下有课程，无法删除
 *       404:
 *         description: 分类不存在
 */
// 删除课程分类
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const categoryId = Number.parseInt(id);
    if (isNaN(categoryId)) {
      throw new ApiError(400, '无效的分类ID');
    }

    // 检查分类是否存在
    const existingCategory = await prisma.courseCategory.findUnique({
      include: {
        _count: {
          select: { courses: true }
        }
      },
      where: { id: categoryId }
    });

    if (!existingCategory) {
      throw new ApiError(404, '课程分类不存在');
    }

    // 检查是否有关联的课程
    if (existingCategory._count.courses > 0) {
      throw new ApiError(400, '该分类下还有课程，无法删除');
    }

    await prisma.courseCategory.delete({
      where: { id: categoryId }
    });

    logger.info(`课程分类删除成功: ${existingCategory.name}`);

    res.json({
      code: 0,
      data: null,
      message: '课程分类删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除课程分类失败:', error);
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
        message: '删除课程分类失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
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
      data: {
        categoryStats: categoryStats.map((cat: any) => ({
          count: cat._count.courses,
          name: cat.name
        })),
        publishedCourses,
        recentEnrollments,
        totalCourses,
        totalEnrollments
      },
      message: '获取课程统计成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取课程统计失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取课程统计失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

export default router;
