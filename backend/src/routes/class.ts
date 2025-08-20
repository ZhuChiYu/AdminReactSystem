import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';

import { classController } from '@/controllers/classController';
import { asyncErrorHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
// import { permissionMiddleware } from '@/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // 有时Excel文件会被识别为这个类型
    ];

    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const isExcel = /\.(xlsx?|xls)$/i.test(originalName);

    if (allowedMimes.includes(file.mimetype) || isExcel) {
      cb(null, true);
    } else {
      cb(new Error('只支持 .xlsx 和 .xls 格式的文件'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  storage
});

// 配置multer用于头像上传
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const avatarUpload = multer({
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(originalName);

    if (allowedMimes.includes(file.mimetype) || isImage) {
      cb(null, true);
    } else {
      cb(new Error('只支持 jpg、png、gif、webp 格式的图片文件'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  storage: avatarStorage
});

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
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词（支持姓名、单位和导入人搜索）
 *     responses:
 *       200:
 *         description: 查询成功
 */
router.get('/students', async (req, res) => {
  try {
    const { classId, current = 1, size = 10, keyword } = req.query;
    const user = req.user;

    // 检查用户是否为超级管理员
    const isSuperAdmin = user?.roles?.includes('super_admin');

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

    // 构建搜索条件
    const where: any = { classId: Number.parseInt(classId as string) };

    // 如果有搜索关键词，添加搜索条件
    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      const searchKeyword = keyword.trim();
      where.OR = [
        {
          name: {
            contains: searchKeyword,
            mode: 'insensitive'
          }
        },
        {
          company: {
            contains: searchKeyword,
            mode: 'insensitive'
          }
        },
        {
          createdBy: {
            OR: [
              {
                nickName: {
                  contains: searchKeyword,
                  mode: 'insensitive'
                }
              },
              {
                userName: {
                  contains: searchKeyword,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ];
    }

    const [students, total] = await Promise.all([
      prisma.classStudent.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        where
      }),
      prisma.classStudent.count({
        where
      })
    ]);

    const result = {
      current: page,
      pages: Math.ceil(total / pageSize),
      records: students.map(student => {
        // 基础信息（所有用户都能看到）
        const basicInfo = {
          attendanceRate: student.attendanceRate,
          avatar: student.avatar,
          createdAt: student.createdAt.toISOString(),
          createdBy: student.createdBy ? {
            id: student.createdBy.id,
            nickName: student.createdBy.nickName,
            userName: student.createdBy.userName
          } : null,
          gender: student.gender,
          id: student.id,
          joinDate: student.joinDate.toISOString().split('T')[0],
          name: student.name,
          status: student.status,
          trainingFee: student.trainingFee ? student.trainingFee.toString() : null
        };

        // 如果是超级管理员，返回完整信息
        if (isSuperAdmin) {
          return {
            ...basicInfo,
            company: student.company,
            email: student.email,
            landline: student.landline,
            phone: student.phone,
            position: student.position
          };
        }

        // 普通用户只返回基础信息
        return basicInfo;
      }),
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
 * /api/classes/students/import:
 *   post:
 *     summary: 批量导入学员
 *     tags: [班级管理]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Excel文件
 *       - in: formData
 *         name: classId
 *         type: integer
 *         required: true
 *         description: 班级ID
 *     responses:
 *       200:
 *         description: 导入成功
 *       400:
 *         description: 参数错误或文件格式错误
 */
router.post('/students/import', upload.single('file'), async (req, res) => {
  let tempFilePath: string | null = null;

  try {
    const { classId } = req.body;
    const file = req.file;

    if (!classId) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '缺少班级ID参数',
        path: req.path,
        timestamp: Date.now()
      });
    }

    if (!file) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '请选择要上传的Excel文件',
        path: req.path,
        timestamp: Date.now()
      });
    }

    tempFilePath = file.path;

    // 验证班级是否存在
    const classExists = await prisma.class.findUnique({
      where: { id: Number.parseInt(classId) }
    });

    if (!classExists) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '班级不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 读取Excel文件
    const workbook = XLSX.readFile(tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: 'Excel文件为空或格式不正确',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 验证和转换数据
    const students = [];
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      const rowNumber = i + 2; // Excel行号（从第2行开始，因为第1行是标题）

      // 支持多种字段名称映射
      const name = row['姓名'] || row.name || row.Name;
      const company = row['公司'] || row.company || row['单位名称'] || row['单位'] || row.Company;
      const position = row['职位'] || row.position || row['职务'] || row.Position;
      const phone = row['电话'] || row.phone || row['手机'] || row['联系电话'] || row.Phone;
      const email = row['邮箱'] || row.email || row.Email || row['电子邮箱'];

      // 验证必填字段
      if (!name) {
        errors.push(`第${rowNumber}行：缺少姓名字段`);
        continue;
      }

      if (!company) {
        errors.push(`第${rowNumber}行：缺少公司/单位名称字段`);
        continue;
      }

      const student = {
        attendanceRate: 100,
        avatar: null,
        classId: Number.parseInt(classId),
        company: String(company).trim(),
        email: email ? String(email).trim() : '',
        gender: row['性别'] || row.gender || '',
        joinDate: new Date(),
        name: String(name).trim(),
        phone: phone ? String(phone).replace(/\D/g, '') : '',
        position: position ? String(position).trim() : '',
        status: 1,
        trainingFee: row['培训费'] ? Number(row['培训费']) : (row.trainingFee ? Number(row.trainingFee) : 0),
        createdById: req.user?.id // 记录创建者
      };

      // 验证邮箱格式（如果提供了邮箱）
      if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
        errors.push(`第${rowNumber}行：邮箱格式不正确`);
        continue;
      }

      // 验证手机号格式（如果提供了手机号）
      if (student.phone && !/^1[3-9]\d{9}$/.test(student.phone)) {
        // 不是必须的，只是警告
        logger.warn(`第${rowNumber}行：手机号格式可能不正确: ${student.phone}`);
      }

      students.push(student);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        code: 400,
        data: { errors },
        message: `数据验证失败，共${errors.length}个错误`,
        path: req.path,
        timestamp: Date.now()
      });
    }

    if (students.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '没有有效的学员数据',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 批量插入学员数据
    const createdStudents = await prisma.classStudent.createMany({
      data: students,
      skipDuplicates: true
    });

    // 更新班级学员数量
    const totalStudents = await prisma.classStudent.count({
      where: { classId: Number.parseInt(classId) }
    });

    await prisma.class.update({
      data: { studentCount: totalStudents },
      where: { id: Number.parseInt(classId) }
    });

    logger.info(`班级${classId}批量导入学员成功: ${createdStudents.count}名学员`);

    res.json({
      code: 0,
      data: {
        classId: Number.parseInt(classId),
        importedCount: createdStudents.count,
        totalCount: students.length
      },
      message: `成功导入${createdStudents.count}名学员`,
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('批量导入学员失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '批量导入学员失败',
      path: req.path,
      timestamp: Date.now()
    });
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        logger.info(`已清理临时文件: ${tempFilePath}`);
      } catch (err) {
        logger.error('清理临时文件失败:', err);
      }
    }
  }
});

/**
 * @swagger
 * /api/classes/students:
 *   post:
 *     summary: 添加学员
 *     tags: [班级管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - name
 *               - company
 *               - phone
 *             properties:
 *               classId:
 *                 type: integer
 *                 description: 班级ID
 *               name:
 *                 type: string
 *                 description: 学员姓名
 *               gender:
 *                 type: string
 *                 description: 性别
 *               company:
 *                 type: string
 *                 description: 单位名称
 *               position:
 *                 type: string
 *                 description: 职务
 *               phone:
 *                 type: string
 *                 description: 电话
 *               landline:
 *                 type: string
 *                 description: 座机号
 *               email:
 *                 type: string
 *                 description: 邮箱
 *               joinDate:
 *                 type: string
 *                 format: date
 *                 description: 加入日期
 *               trainingFee:
 *                 type: number
 *                 description: 培训费
 *     responses:
 *       200:
 *         description: 添加成功
 *       400:
 *         description: 参数错误
 */
router.post('/students', async (req, res) => {
  try {
    const { classId, name, gender, company, position, phone, landline, email, joinDate, trainingFee } = req.body;

    // 验证必填字段
    if (!classId || !name || !company || !phone) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '缺少必填字段：班级ID、姓名、单位、电话',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 验证班级是否存在
    const classExists = await prisma.class.findUnique({
      where: { id: Number.parseInt(classId) }
    });

    if (!classExists) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '班级不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 创建学员
    const newStudent = await prisma.classStudent.create({
      data: {
        classId: Number.parseInt(classId),
        name: name.trim(),
        gender: gender || '',
        company: company.trim(),
        position: position ? position.trim() : '',
        phone: phone.trim(),
        landline: landline ? landline.trim() : '',
        email: email ? email.trim() : '',
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        trainingFee: trainingFee ? Number.parseFloat(trainingFee) : null,
        attendanceRate: 100,
        status: 1,
        createdById: req.user?.id // 记录创建者
      },
      include: {
        createdBy: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      }
    });

    // 更新班级学员数量
    const totalStudents = await prisma.classStudent.count({
      where: { classId: Number.parseInt(classId) }
    });

    await prisma.class.update({
      data: { studentCount: totalStudents },
      where: { id: Number.parseInt(classId) }
    });

    logger.info(`班级${classId}添加学员成功: ${newStudent.name}`);

    res.json({
      code: 0,
      data: {
        attendanceRate: newStudent.attendanceRate,
        avatar: newStudent.avatar,
        company: newStudent.company,
        createdAt: newStudent.createdAt.toISOString(),
        createdBy: newStudent.createdBy ? {
          id: newStudent.createdBy.id,
          nickName: newStudent.createdBy.nickName,
          userName: newStudent.createdBy.userName
        } : null,
        email: newStudent.email,
        gender: newStudent.gender,
        id: newStudent.id,
        joinDate: newStudent.joinDate.toISOString().split('T')[0],
        landline: newStudent.landline,
        name: newStudent.name,
        phone: newStudent.phone,
        position: newStudent.position,
        status: newStudent.status,
        trainingFee: newStudent.trainingFee ? newStudent.trainingFee.toString() : null
      },
      message: '学员添加成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('添加学员失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '添加学员失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/students/template:
 *   get:
 *     summary: 下载学员导入模板
 *     tags: [班级管理]
 *     responses:
 *       200:
 *         description: 下载成功
 */
router.get('/students/template', (req, res) => {
  try {
    // 创建模板数据
    const templateData = [
      {
        单位名称: '示例公司',
        姓名: '张三',
        电话: '13800138000',
        职务: '财务经理',
        邮箱: 'zhangsan@example.com'
      },
      {
        单位名称: '测试企业',
        姓名: '李四',
        电话: '13900139000',
        职务: '会计主管',
        邮箱: 'lisi@test.com'
      }
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, // 姓名
      { wch: 30 }, // 单位名称
      { wch: 15 }, // 职务
      { wch: 15 }, // 电话
      { wch: 25 } // 邮箱
    ];

    XLSX.utils.book_append_sheet(wb, ws, '学员名单');

    // 生成Excel文件缓冲区
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      "attachment; filename*=UTF-8''%E5%AD%A6%E5%91%98%E5%AF%BC%E5%85%A5%E6%A8%A1%E6%9D%BF.xlsx"
    );
    res.setHeader('Content-Length', excelBuffer.length);

    // 发送文件
    res.send(excelBuffer);

    logger.info('学员导入模板下载成功');
  } catch (error) {
    logger.error('下载学员导入模板失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '下载模板失败',
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
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
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
    const { code, description, name, sort = 0, status = 1 } = req.body;

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
    const { code, description, name, sort, status } = req.body;

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

/**
 * @swagger
 * /api/classes/students/{id}:
 *   put:
 *     summary: 更新学员信息
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 学员ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               trainingFee:
 *                 type: number
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/students/:id', async (req, res) => {
  try {
    const studentId = Number.parseInt(req.params.id);
    const { avatar, company, email, gender, joinDate, landline, name, phone, position, trainingFee } = req.body;

    logger.info('更新学员信息请求:', {
      hasAvatar: Boolean(avatar),
      requestBody: req.body,
      studentId
    });

    if (Number.isNaN(studentId)) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '无效的学员ID',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查学员是否存在
    const existingStudent = await prisma.classStudent.findUnique({
      where: { id: studentId }
    });

    if (!existingStudent) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '学员不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 更新学员信息
    const updatedStudent = await prisma.classStudent.update({
      data: {
        ...(name && { name }),
        ...(gender && { gender }),
        ...(company && { company }),
        ...(position !== undefined && { position }),
        ...(phone !== undefined && { phone }),
        ...(landline !== undefined && { landline }),
        ...(email !== undefined && { email }),
        ...(joinDate && { joinDate: new Date(joinDate) }),
        ...(trainingFee !== undefined && { trainingFee: trainingFee ? Number.parseFloat(trainingFee) : null }),
        // 只有当请求明确包含头像信息时才更新头像字段
        ...(avatar !== undefined && { avatar })
      },
      where: { id: studentId }
    });

    logger.info(`学员信息更新成功: ${updatedStudent.name}, 头像: ${updatedStudent.avatar}`);

    res.json({
      code: 0,
      data: {
        attendanceRate: updatedStudent.attendanceRate,
        avatar: updatedStudent.avatar,
        company: updatedStudent.company,
        createdAt: updatedStudent.createdAt.toISOString(),
        email: updatedStudent.email,
        gender: updatedStudent.gender,
        id: updatedStudent.id,
        joinDate: updatedStudent.joinDate.toISOString().split('T')[0],
        landline: updatedStudent.landline,
        name: updatedStudent.name,
        phone: updatedStudent.phone,
        position: updatedStudent.position,
        status: updatedStudent.status,
        trainingFee: updatedStudent.trainingFee ? updatedStudent.trainingFee.toString() : null
      },
      message: '学员信息更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('更新学员信息失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新学员信息失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/students/batch:
 *   delete:
 *     summary: 批量删除学员
 *     tags: [班级管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentIds
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 学员ID列表
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 参数错误
 */
router.delete('/students/batch', async (req, res) => {
  try {

    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '请提供要删除的学员ID列表',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 验证并转换所有ID为有效数字
    const validIds: number[] = [];
    for (const id of studentIds) {
      const numId = typeof id === 'string' ? Number.parseInt(id, 10) : Number(id);
      if (Number.isInteger(numId) && numId > 0) {
        validIds.push(numId);
      }
    }

    if (validIds.length !== studentIds.length) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '学员ID列表包含无效值',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查学员是否存在
    const existingStudents = await prisma.classStudent.findMany({
      where: { id: { in: validIds } },
      select: { id: true, name: true }
    });

    if (existingStudents.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '未找到要删除的学员',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 批量删除学员
    const deleteResult = await prisma.classStudent.deleteMany({
      where: { id: { in: validIds } }
    });

    logger.info(`批量删除学员成功，共删除 ${deleteResult.count} 名学员:`,
      existingStudents.map(s => `${s.name}(ID:${s.id})`).join(', ')
    );

    res.json({
      code: 0,
      data: {
        deletedCount: deleteResult.count,
        requestedCount: validIds.length
      },
      message: `成功删除 ${deleteResult.count} 名学员`,
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('批量删除学员失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '批量删除学员失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/students/{id}:
 *   delete:
 *     summary: 删除学员
 *     tags: [班级管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 学员ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 学员不存在
 */
router.delete('/students/:id', async (req, res) => {
  try {
    const studentId = Number.parseInt(req.params.id);

    if (Number.isNaN(studentId)) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '无效的学员ID',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查学员是否存在
    const existingStudent = await prisma.classStudent.findUnique({
      where: { id: studentId }
    });

    if (!existingStudent) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '学员不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 删除学员
    await prisma.classStudent.delete({
      where: { id: studentId }
    });

    logger.info(`学员删除成功: ${existingStudent.name} (ID: ${studentId})`);

    res.json({
      code: 0,
      data: null,
      message: '学员删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('删除学员失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除学员失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

/**
 * @swagger
 * /api/classes/students/:id/avatar:
 *   post:
 *     summary: 上传学员头像
 *     tags: [班级管理]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 学员ID
 *       - in: formData
 *         name: avatar
 *         type: file
 *         required: true
 *         description: 头像文件
 *     responses:
 *       200:
 *         description: 上传成功
 */
router.post('/students/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
  let tempFilePath: string | null = null;

  try {
    logger.info('开始处理学员头像上传请求');

    const studentId = Number.parseInt(req.params.id);
    const file = req.file;

    logger.info('请求参数:', {
      file: file
        ? {
            destination: file.destination,
            encoding: file.encoding,
            fieldname: file.fieldname,
            filename: file.filename,
            mimetype: file.mimetype,
            originalname: file.originalname,
            path: file.path,
            size: file.size
          }
        : null,
      studentId
    });

    if (Number.isNaN(studentId)) {
      logger.warn('无效的学员ID:', req.params.id);
      return res.status(400).json({
        code: 400,
        data: null,
        message: '无效的学员ID',
        path: req.path,
        timestamp: Date.now()
      });
    }

    if (!file) {
      logger.warn('未接收到文件');
      return res.status(400).json({
        code: 400,
        data: null,
        message: '请选择要上传的头像文件',
        path: req.path,
        timestamp: Date.now()
      });
    }

    tempFilePath = file.path;
    logger.info('临时文件路径:', tempFilePath);

    // 检查学员是否存在
    logger.info('查询学员是否存在, studentId:', studentId);
    const existingStudent = await prisma.classStudent.findUnique({
      where: { id: studentId }
    });

    if (!existingStudent) {
      logger.warn('学员不存在, studentId:', studentId);
      return res.status(404).json({
        code: 404,
        data: null,
        message: '学员不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    logger.info('找到学员:', { id: existingStudent.id, name: existingStudent.name });

    // 创建头像存储目录
    const avatarDir = path.join(__dirname, '../../uploads/avatars');
    logger.info('头像存储目录:', avatarDir);

    if (!fs.existsSync(avatarDir)) {
      logger.info('创建头像存储目录');
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    // 生成新的文件名
    const fileExtension = path.extname(file.originalname);
    const fileName = `student_${studentId}_${Date.now()}${fileExtension}`;
    const avatarPath = path.join(avatarDir, fileName);

    logger.info('文件处理信息:', {
      avatarPath,
      fileExtension,
      fileName,
      tempFilePath
    });

    // 移动文件到目标位置
    logger.info('开始移动文件');
    fs.renameSync(tempFilePath, avatarPath);
    tempFilePath = null; // 标记为已处理，避免在finally中删除
    logger.info('文件移动成功');

    // 生成头像URL
    const avatarUrl = `/uploads/avatars/${fileName}`;
    logger.info('生成头像URL:', avatarUrl);

    // 更新学员头像
    logger.info('开始更新数据库');
    const updatedStudent = await prisma.classStudent.update({
      data: { avatar: avatarUrl },
      where: { id: studentId }
    });

    logger.info(`学员头像上传成功: ${updatedStudent.name}, 头像URL: ${updatedStudent.avatar}`);

    res.json({
      code: 0,
      data: {
        avatar: updatedStudent.avatar,
        studentId: updatedStudent.id
      },
      message: '头像上传成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('上传学员头像失败，详细错误信息:');
    if (error instanceof Error) {
      logger.error('错误类型:', error.constructor.name);
      logger.error('错误消息:', error.message);
      logger.error('错误堆栈:', error.stack);
    } else {
      logger.error('未知错误:', error);
    }
    logger.error('请求信息:', {
      body: req.body,
      files: req.file
        ? {
            fieldname: req.file.fieldname,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size
          }
        : null,
      method: req.method,
      params: req.params,
      url: req.url
    });

    res.status(500).json({
      code: 500,
      data: null,
      message: '上传头像失败',
      path: req.path,
      timestamp: Date.now()
    });
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        logger.info(`已清理临时文件: ${tempFilePath}`);
      } catch (err) {
        logger.error('清理临时文件失败:', err);
      }
    }
  }
});
export default router;
