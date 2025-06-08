import express from 'express';

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = express.Router();

// 获取任务列表
router.get('/', async (req, res) => {
  try {
    const {
      assigneeId,
      current = 1,
      dueDateEnd,
      dueDateStart,
      monthFilter,
      projectName,
      size = 10,
      taskName,
      taskStatus,
      weekFilter
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
      where.taskStatus = Number.parseInt(taskStatus as string);
    }

    if (assigneeId) {
      where.assigneeId = Number.parseInt(assigneeId as string);
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

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    // 获取任务列表
    const tasks = await prisma.task.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take,
      where
    });

    // 获取总数
    const total = await prisma.task.count({ where });

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / Number.parseInt(size as string)),
        records: tasks,
        size: Number.parseInt(size as string),
        total
      },
      message: '获取任务列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取任务列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取任务列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 获取任务详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    if (!task) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '任务不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    res.json({
      code: 0,
      data: task,
      message: '获取任务详情成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取任务详情失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取任务详情失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 创建任务
router.post('/', async (req, res) => {
  try {
    const {
      assigneeId,
      dueDate,
      priority = 1,
      projectName,
      targetCount,
      taskDesc,
      taskName,
      taskType = 'normal',
      taskStatus = 0
    } = req.body;

    // 验证必填字段
    if (!taskName || !projectName) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '任务名称和项目名称不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 验证负责人是否存在
    const assignee = await prisma.user.findUnique({
      where: { id: Number(assigneeId) }
    });

    if (!assigneeId || !assignee) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '负责人不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const task = await prisma.task.create({
      data: {
        actualCount: 0,
        assigneeId: Number(assigneeId),
        createTime: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        priority: Number(priority),
        projectName,
        targetCount: Number(targetCount) || 0,
        taskDesc: taskDesc || '',
        taskName,
        taskStatus: Number(taskStatus),
        taskType
      },
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      }
    });

    // 格式化返回数据
    const formattedTask = {
      ...task,
      assignee: {
        id: task.assignee.id,
        name: task.assignee.nickName || task.assignee.userName
      }
    };

    res.json({
      code: 0,
      data: formattedTask,
      message: '创建任务成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建任务失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: error.message || '创建任务失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 更新任务
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 验证任务是否存在
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTask) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '任务不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 处理日期字段
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // 处理assigneeId字段
    if (updateData.assigneeId !== undefined) {
      // 验证新负责人是否存在
      const newAssignee = await prisma.user.findUnique({
        where: { id: Number(updateData.assigneeId) }
      });

      if (!newAssignee) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '负责人不存在',
          path: req.path,
          timestamp: Date.now()
        });
      }
    }

    // 构建更新数据
    const taskData = {
      taskName: updateData.taskName,
      projectName: updateData.projectName,
      taskType: updateData.taskType,
      taskDesc: updateData.taskDesc || '',
      priority: Number(updateData.priority),
      targetCount: Number(updateData.targetCount) || 0,
      dueDate: updateData.dueDate,
      taskStatus: updateData.taskStatus === null ? existingTask.taskStatus : Number(updateData.taskStatus),
      updateTime: new Date()
    };

    // 如果有assigneeId，添加到更新数据中
    if (updateData.assigneeId !== undefined) {
      taskData.assignee = {
        connect: { id: Number(updateData.assigneeId) }
      };
    }

    const task = await prisma.task.update({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number(id) }
    });

    // 格式化返回数据
    const formattedTask = {
      ...task,
      assignee: {
        id: task.assignee.id,
        name: task.assignee.nickName || task.assignee.userName
      }
    };

    res.json({
      code: 0,
      data: formattedTask,
      message: '更新任务成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新任务失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: error.message || '更新任务失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id: Number.parseInt(id) }
    });

    res.json({
      code: 0,
      data: null,
      message: '删除任务成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除任务失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除任务失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 更新任务状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.update({
      data: {
        taskStatus: status,
        updateTime: new Date().toISOString()
      },
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    res.json({
      code: 0,
      data: task,
      message: '更新任务状态成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新任务状态失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新任务状态失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 分配任务
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await prisma.task.update({
      data: {
        assigneeId,
        updateTime: new Date().toISOString()
      },
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    res.json({
      code: 0,
      data: task,
      message: '分配任务成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('分配任务失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '分配任务失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 获取我的任务
router.get('/my', async (req, res) => {
  try {
    const { current = 1, size = 10, status } = req.query;

    // 这里需要从token中获取用户ID，暂时使用模拟数据
    const userId = 1; // 应该从认证中间件获取

    const where: any = {
      assigneeId: userId
    };

    if (status !== undefined) {
      where.taskStatus = Number.parseInt(status as string);
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    const tasks = await prisma.task.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      orderBy: {
        createTime: 'desc'
      },
      skip,
      take,
      where
    });

    const total = await prisma.task.count({ where });

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / Number.parseInt(size as string)),
        records: tasks,
        size: Number.parseInt(size as string),
        total
      },
      message: '获取我的任务成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取我的任务失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取我的任务失败',
      path: req.path,
      timestamp: Date.now()
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
      data: {
        completed,
        inProgress,
        overdue,
        pending,
        total
      },
      message: '获取任务统计成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取任务统计失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取任务统计失败',
      path: req.path,
      timestamp: Date.now()
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
      data: null,
      message: '导出功能开发中',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('导出任务数据失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '导出任务数据失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

export default router;
