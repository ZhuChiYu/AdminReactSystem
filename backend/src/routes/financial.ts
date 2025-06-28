import express from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { createErrorResponse, createSuccessResponse } from '../utils/response';

const router = express.Router();

// 支出类型映射
const expenseTypes = [
  { value: 'travel', label: '差旅费', color: '#5470c6' },
  { value: 'accommodation', label: '住宿费', color: '#fac858' },
  { value: 'office_supplies', label: '办公费', color: '#ee6666' },
  { value: 'meal', label: '餐费', color: '#73c0de' },
  { value: 'entertainment', label: '招待费', color: '#3ba272' },
  { value: 'training', label: '培训费', color: '#fc8452' },
  { value: 'phone', label: '话费', color: '#9a60b4' },
  { value: 'property', label: '物业费', color: '#ea7ccc' },
  { value: 'other', label: '其他', color: '#5d6c8c' },
  // 新增支出类型
  { value: 'rent', label: '房租', color: '#f5222d' },
  { value: 'utilities', label: '水电费', color: '#faad14' },
  { value: 'team_building', label: '团建', color: '#52c41a' },
  { value: 'salary', label: '工资', color: '#1890ff' },
  { value: 'social_insurance', label: '社保', color: '#722ed1' },
  { value: 'training_supplement', label: '补培训费', color: '#13c2c2' },
  // 兼容数据库中已存在的中文分类
  { value: '设备采购', label: '设备采购', color: '#eb2f96' },
  { value: '办公费用', label: '办公费', color: '#ee6666' },
  { value: '员工工资', label: '工资', color: '#1890ff' }
];

// 收入类型映射
const incomeTypes = [
  { value: 'training_income', label: '培训收入', color: '#52c41a' },
  { value: 'project_income', label: '项目收入', color: '#1890ff' },
  { value: 'consulting_income', label: '咨询收入', color: '#722ed1' },
  { value: 'other_income', label: '其他收入', color: '#faad14' },
  // 新增收入类型
  { value: 'commission_income', label: '返佣费', color: '#eb2f96' },
  // 兼容数据库中已存在的中文分类
  { value: '培训收入', label: '培训收入', color: '#52c41a' },
  { value: '项目收入', label: '项目收入', color: '#1890ff' }
];

// 获取财务记录列表
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { current = 1, size = 10, type, category, startDate, endDate, createdById } = req.query;

    const skip = (Number(current) - 1) * Number(size);
    const take = Number(size);

    const where: any = {};

    if (type) {
      where.type = Number(type);
    }

    if (category) {
      where.category = category as string;
    }

    if (startDate || endDate) {
      where.recordDate = {};
      if (startDate) {
        where.recordDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.recordDate.lte = new Date(endDate as string);
      }
    }

    if (createdById) {
      where.createdById = Number(createdById);
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              nickName: true,
              userName: true
            }
          }
        },
        orderBy: {
          recordDate: 'desc'
        },
        skip,
        take,
        where
      }),
      prisma.financialRecord.count({ where })
    ]);

    const responseData = {
      current: Number(current),
      pages: Math.ceil(total / Number(size)),
      records: records.map(record => ({
        id: record.id,
        type: record.type,
        category: record.category,
        amount: Number(record.amount),
        description: record.description,
        relatedId: record.relatedId,
        relatedType: record.relatedType,
        recordDate: record.recordDate.toISOString(),
        createdById: record.createdById,
        status: record.status,
        attachments: record.attachments || [],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        createdBy: record.createdBy
      })),
      size: Number(size),
      total
    };

    res.json(createSuccessResponse(responseData, '获取财务记录列表成功', req.path));
  } catch (error) {
    logger.error('获取财务记录列表失败:', error);
    res.status(500).json(createErrorResponse(500, '获取财务记录列表失败', error, req.path));
  }
});

// 创建财务记录
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { type, category, amount, description, relatedId, relatedType, recordDate, attachments } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json(createErrorResponse(401, '用户未认证', null, req.path));
    }

    const record = await prisma.financialRecord.create({
      data: {
        type: Number(type),
        category,
        amount: Number(amount),
        description,
        relatedId: relatedId ? Number(relatedId) : null,
        relatedType,
        recordDate: new Date(recordDate),
        createdById: userId,
        attachments: attachments || [],
        status: 1
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

    const responseData = {
      id: record.id,
      type: record.type,
      category: record.category,
      amount: Number(record.amount),
      description: record.description,
      relatedId: record.relatedId,
      relatedType: record.relatedType,
      recordDate: record.recordDate.toISOString(),
      createdById: record.createdById,
      status: record.status,
      attachments: record.attachments || [],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      createdBy: record.createdBy
    };

    res.json(createSuccessResponse(responseData, '创建财务记录成功', req.path));
  } catch (error) {
    logger.error('创建财务记录失败:', error);
    res.status(500).json(createErrorResponse(500, '创建财务记录失败', error, req.path));
  }
});

// 获取财务统计数据
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else {
      startDate = new Date(Number(year), 0, 1);
      endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    }

    const where = {
      recordDate: {
        gte: startDate,
        lte: endDate
      }
    };

    const [incomeStats, expenseStats] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...where, type: 1 },
        _sum: { amount: true },
        _count: true
      }),
      prisma.financialRecord.aggregate({
        where: { ...where, type: 2 },
        _sum: { amount: true },
        _count: true
      })
    ]);

    const monthlyTrend = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(Number(year), i, 1);
      const monthEnd = new Date(Number(year), i + 1, 0, 23, 59, 59);

      const [monthIncome, monthExpense] = await Promise.all([
        prisma.financialRecord.aggregate({
          where: {
            type: 1,
            recordDate: { gte: monthStart, lte: monthEnd }
          },
          _sum: { amount: true }
        }),
        prisma.financialRecord.aggregate({
          where: {
            type: 2,
            recordDate: { gte: monthStart, lte: monthEnd }
          },
          _sum: { amount: true }
        })
      ]);

      const income = Number(monthIncome._sum.amount) || 0;
      const expense = Number(monthExpense._sum.amount) || 0;

      monthlyTrend.push({
        month: `${i + 1}月`,
        income,
        expense,
        profit: income - expense
      });
    }

    const responseData = {
      totalIncome: Number(incomeStats._sum.amount) || 0,
      totalExpense: Number(expenseStats._sum.amount) || 0,
      monthlyIncome: Number(incomeStats._sum.amount) || 0,
      monthlyExpense: Number(expenseStats._sum.amount) || 0,
      monthlyTrend
    };

    res.json(createSuccessResponse(responseData, '获取财务统计数据成功', req.path));
  } catch (error) {
    logger.error('获取财务统计数据失败:', error);
    res.status(500).json(createErrorResponse(500, '获取财务统计数据失败', error, req.path));
  }
});

// 获取支出类型分布
router.get('/expense-distribution', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else {
      startDate = new Date(Number(year), 0, 1);
      endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    }

    const expenseData = await prisma.financialRecord.groupBy({
      by: ['category'],
      where: {
        type: 2,
        recordDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    });

    const totalAmount = expenseData.reduce((sum, item) => sum + (Number(item._sum.amount) || 0), 0);

    const responseData = expenseData.map((item, index) => {
      const amount = Number(item._sum.amount) || 0;
      const expenseType = expenseTypes.find(type => type.value === item.category);

      return {
        category: expenseType?.label || item.category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: expenseType?.color || expenseTypes[index % expenseTypes.length].color
      };
    });

    res.json(createSuccessResponse(responseData, '获取支出类型分布成功', req.path));
  } catch (error) {
    logger.error('获取支出类型分布失败:', error);
    res.status(500).json(createErrorResponse(500, '获取支出类型分布失败', error, req.path));
  }
});

// 获取收入类型分布
router.get('/income-distribution', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(Number(year), Number(month) - 1, 1);
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    } else {
      startDate = new Date(Number(year), 0, 1);
      endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    }

    const incomeData = await prisma.financialRecord.groupBy({
      by: ['category'],
      where: {
        type: 1,
        recordDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    });

    const totalAmount = incomeData.reduce((sum, item) => sum + (Number(item._sum.amount) || 0), 0);

    const responseData = incomeData.map((item, index) => {
      const amount = Number(item._sum.amount) || 0;
      const incomeType = incomeTypes.find(type => type.value === item.category);

      return {
        category: incomeType?.label || item.category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: incomeType?.color || incomeTypes[index % incomeTypes.length].color
      };
    });

    res.json(createSuccessResponse(responseData, '获取收入类型分布成功', req.path));
  } catch (error) {
    logger.error('获取收入类型分布失败:', error);
    res.status(500).json(createErrorResponse(500, '获取收入类型分布失败', error, req.path));
  }
});

// 获取月度趋势数据
router.get('/monthly-trend', authMiddleware, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(Number(year), i, 1);
      const monthEnd = new Date(Number(year), i + 1, 0, 23, 59, 59);

      const [incomeData, expenseData] = await Promise.all([
        prisma.financialRecord.aggregate({
          where: {
            type: 1,
            recordDate: { gte: monthStart, lte: monthEnd }
          },
          _sum: { amount: true }
        }),
        prisma.financialRecord.groupBy({
          by: ['category'],
          where: {
            type: 2,
            recordDate: { gte: monthStart, lte: monthEnd }
          },
          _sum: { amount: true }
        })
      ]);

      const income = Number(incomeData._sum.amount) || 0;
      const totalExpense = expenseData.reduce((sum, item) => sum + (Number(item._sum.amount) || 0), 0);

      const monthData: any = {
        month: `${i + 1}月`,
        income,
        expense: totalExpense,
        profit: income - totalExpense
      };

      expenseTypes.forEach(type => {
        const categoryData = expenseData.find(item => item.category === type.value);
        monthData[type.value] = Number(categoryData?._sum.amount) || 0;
      });

      monthlyData.push(monthData);
    }

    res.json(createSuccessResponse(monthlyData, '获取月度趋势数据成功', req.path));
  } catch (error) {
    logger.error('获取月度趋势数据失败:', error);
    res.status(500).json(createErrorResponse(500, '获取月度趋势数据失败', error, req.path));
  }
});

// 更新财务记录
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, description, relatedId, relatedType, recordDate, attachments } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json(createErrorResponse(401, '用户未认证', null, req.path));
    }

    const record = await prisma.financialRecord.update({
      where: { id: Number(id) },
      data: {
        type: Number(type),
        category,
        amount: Number(amount),
        description,
        relatedId: relatedId ? Number(relatedId) : null,
        relatedType,
        recordDate: new Date(recordDate),
        attachments: attachments || [],
        updatedAt: new Date()
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

    const responseData = {
      id: record.id,
      type: record.type,
      category: record.category,
      amount: Number(record.amount),
      description: record.description,
      relatedId: record.relatedId,
      relatedType: record.relatedType,
      recordDate: record.recordDate.toISOString(),
      createdById: record.createdById,
      status: record.status,
      attachments: record.attachments || [],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      createdBy: record.createdBy
    };

    res.json(createSuccessResponse(responseData, '更新财务记录成功', req.path));
  } catch (error) {
    logger.error('更新财务记录失败:', error);
    res.status(500).json(createErrorResponse(500, '更新财务记录失败', error, req.path));
  }
});

// 删除财务记录
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json(createErrorResponse(401, '用户未认证', null, req.path));
    }

    await prisma.financialRecord.delete({
      where: { id: Number(id) }
    });

    res.json(createSuccessResponse(null, '删除财务记录成功', req.path));
  } catch (error) {
    logger.error('删除财务记录失败:', error);
    res.status(500).json(createErrorResponse(500, '删除财务记录失败', error, req.path));
  }
});

export default router;
