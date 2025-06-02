import express from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// 获取任务列表
router.get('/', async (req, res) => {
  try {
    const {
      current = 1,
      size = 10,
      taskName,
      projectName,
      taskStatus,
      assigneeId,
      dueDateStart,
      dueDateEnd,
      weekFilter,
      monthFilter
    } = req.query;

    const where: any = {};

    // 构建查询条件
    if (taskName) {
      where.taskName = {
        contains: taskName as string,
        mode: 'insensitive'
      };
    }

    if (projectName) {
      where.projectName = {
        contains: projectName as string,
        mode: 'insensitive'
      };
    }

    if (taskStatus !== undefined) {
      where.taskStatus = parseInt(taskStatus as string);
    }

    if (assigneeId) {
      where.assigneeId = parseInt(assigneeId as string);
    }

    if (dueDateStart && dueDateEnd) {
      where.dueDate = {
        gte: new Date(dueDateStart as string),
        lte: new Date(dueDateEnd as string)
      };
    }

    // 周过滤器
    if (weekFilter === 'true') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      
      where.dueDate = {
        gte: startOfWeek,
        lte: endOfWeek
      };
    }

    // 月过滤器
    if (monthFilter === 'true') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      where.dueDate = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    // 获取任务列表
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      },
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take
    });

    // 获取总数
    const total = await prisma.task.count({ where });

    res.json({
      code: 0,
      message: '获取任务列表成功',
      data: {
        records: tasks,
        total,
        size: parseInt(size as string),
        current: parseInt(current as string),
        pages: Math.ceil(total / parseInt(size as string))
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取任务列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取任务列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 获取任务详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    res.json({
      code: 0,
      message: '获取任务详情成功',
      data: task,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取任务详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取任务详情失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    const {
      taskName,
      taskDesc,
      projectName,
      dueDate,
      targetCount,
      assigneeId,
      taskType = 'normal',
      priority = 1
    } = req.body;

    const task = await prisma.task.create({
      data: {
        taskName,
        taskDesc,
        projectName,
        dueDate: new Date(dueDate),
        targetCount,
        actualCount: 0,
        assigneeId,
        taskType,
        priority,
        taskStatus: 0, // 未开始
        createTime: new Date().toISOString()
      },
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      }
    });

    res.json({
      code: 0,
      message: '创建任务成功',
      data: task,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('创建任务失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建任务失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 更新任务
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updateTime: new Date().toISOString()
      },
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      }
    });

    res.json({
      code: 0,
      message: '更新任务成功',
      data: task,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('更新任务失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新任务失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      code: 0,
      message: '删除任务成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('删除任务失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除任务失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 更新任务状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        taskStatus: status,
        updateTime: new Date().toISOString()
      },
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      }
    });

    res.json({
      code: 0,
      message: '更新任务状态成功',
      data: task,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('更新任务状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新任务状态失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 分配任务
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        assigneeId,
        updateTime: new Date().toISOString()
      },
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      }
    });

    res.json({
      code: 0,
      message: '分配任务成功',
      data: task,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('分配任务失败:', error);
    res.status(500).json({
      code: 500,
      message: '分配任务失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 获取我的任务
router.get('/my', async (req, res) => {
  try {
    const {
      current = 1,
      size = 10,
      status
    } = req.query;

    // 这里需要从token中获取用户ID，暂时使用模拟数据
    const userId = 1; // 应该从认证中间件获取

    const where: any = {
      assigneeId: userId
    };

    if (status !== undefined) {
      where.taskStatus = parseInt(status as string);
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        }
      },
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take
    });

    const total = await prisma.task.count({ where });

    res.json({
      code: 0,
      message: '获取我的任务成功',
      data: {
        records: tasks,
        total,
        size: parseInt(size as string),
        current: parseInt(current as string),
        pages: Math.ceil(total / parseInt(size as string))
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取我的任务失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取我的任务失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 获取任务统计
router.get('/statistics', async (req, res) => {
  try {
    const total = await prisma.task.count();
    const pending = await prisma.task.count({ where: { taskStatus: 0 } });
    const inProgress = await prisma.task.count({ where: { taskStatus: 1 } });
    const completed = await prisma.task.count({ where: { taskStatus: 2 } });
    
    // 获取过期任务数量
    const overdue = await prisma.task.count({
      where: {
        dueDate: {
          lt: new Date()
        },
        taskStatus: {
          not: 2 // 不是已完成状态
        }
      }
    });

    res.json({
      code: 0,
      message: '获取任务统计成功',
      data: {
        total,
        pending,
        inProgress,
        completed,
        overdue
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取任务统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取任务统计失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 导出任务数据
router.get('/export', async (req, res) => {
  try {
    // 这里应该实现Excel导出功能
    // 暂时返回成功响应
    res.json({
      code: 0,
      message: '导出功能开发中',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('导出任务数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '导出任务数据失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router; 