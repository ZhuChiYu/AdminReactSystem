import { Router } from 'express';
import { asyncErrorHandler } from '@/middleware/errorHandler';
import { permissionMiddleware } from '@/middleware/auth';
import { userController } from '@/controllers/userController';
import multer from 'multer';
import path from 'path';

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
    message: '用户管理功能开发中...',
    data: {
      records: [],
      total: 0,
      current: 1,
      size: 10,
      pages: 0,
    },
    timestamp: Date.now(),
    path: req.path,
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

// 导入员工数据
router.post('/import',
  permissionMiddleware('system:user:import'),
  upload.single('file'),
  asyncErrorHandler(userController.importEmployees)
);

// 下载导入模板
router.get('/template',
  permissionMiddleware('system:user:import'),
  asyncErrorHandler(userController.downloadTemplate)
);

export default router;
