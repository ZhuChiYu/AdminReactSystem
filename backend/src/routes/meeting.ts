import { Router } from 'express';

import { prisma } from '@/config/database';
import { authMiddleware } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: 获取会议列表
 *     tags: [会议管理]
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
 *         name: title
 *         schema:
 *           type: string
 *         description: 会议标题
 *       - in: query
 *         name: organizerId
 *         schema:
 *           type: integer
 *         description: 组织者ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 会议状态
 *       - in: query
 *         name: meetingType
 *         schema:
 *           type: string
 *         description: 会议类型
 *     responses:
 *       200:
 *         description: 查询成功
 */
// 获取会议列表
router.get('/', async (req, res) => {
  try {
    const {
      approvalStatus,
      current = 1,
      endDate,
      meetingType,
      organizerId,
      size = 10,
      startDate,
      status,
      title
    } = req.query;

    const where: any = {};

    // 构建查询条件
    if (title) {
      where.title = {
        contains: title as string,
        mode: 'insensitive'
      };
    }

    if (organizerId) {
      where.organizerId = Number.parseInt(organizerId as string);
    }

    if (status !== undefined) {
      where.status = Number.parseInt(status as string);
    }

    if (meetingType) {
      where.meetingType = meetingType as string;
    }

    if (approvalStatus !== undefined) {
      where.approvalStatus = Number.parseInt(approvalStatus as string);
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    // 获取会议列表
    const meetings = await prisma.meeting.findMany({
      include: {
        _count: {
          select: {
            participants: true
          }
        },
        organizer: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickName: true,
                userName: true
              }
            }
          }
        },
        room: {
          select: {
            id: true,
            location: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take,
      where
    });

    // 获取总数
    const total = await prisma.meeting.count({ where });

    const records = meetings.map(meeting => ({
      approvalStatus: meeting.approvalStatus,
      createdAt: meeting.createdAt,
      description: meeting.description,
      endTime: meeting.endTime,
      id: meeting.id,
      location: meeting.location,
      meetingType: meeting.meetingType,
      organizer: meeting.organizer,
      participantCount: meeting._count.participants,
      participants: meeting.participants.map(p => ({
        id: p.id,
        role: p.role,
        status: p.status,
        user: p.user
      })),
      room: meeting.room,
      startTime: meeting.startTime,
      status: meeting.status,
      title: meeting.title,
      updatedAt: meeting.updatedAt
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
      message: '获取会议列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取会议列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取会议列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 获取会议总结列表
router.get('/summaries', async (req, res) => {
  try {
    const { creator, current = 1, meetingId, size = 10 } = req.query;

    const where: any = {};

    // 构建查询条件
    if (meetingId) {
      where.meetingId = Number.parseInt(meetingId as string);
    }

    if (creator) {
      where.creator = {
        nickName: {
          contains: creator as string,
          mode: 'insensitive'
        }
      };
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    // 由于我们还没有meeting_summaries表，暂时返回空数据
    // 后续可以创建该表并实现完整功能
    const records: any[] = [];
    const total = 0;

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / take),
        records,
        size: Number.parseInt(size as string),
        total
      },
      message: '获取会议总结列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取会议总结列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取会议总结列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 获取会议详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      include: {
        organizer: {
          select: {
            email: true,
            id: true,
            nickName: true,
            userName: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                department: {
                  select: {
                    name: true
                  }
                },
                email: true,
                id: true,
                nickName: true,
                userName: true
              }
            }
          }
        },
        room: true
      },
      where: { id: Number.parseInt(id) }
    });

    if (!meeting) {
      throw new ApiError(404, '会议不存在');
    }

    res.json({
      code: 0,
      data: meeting,
      message: '获取会议详情成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取会议详情失败:', error);
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
        message: '获取会议详情失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 创建会议
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      agenda,
      // 兼容前端字段名
      description,
      endTime,
      // 兼容前端字段名
      isRecurring = false,
      location,
      meetingAgenda,
      meetingDesc,
      meetingRoom,
      meetingTitle, // 兼容前端字段名
      meetingType,
      organizerId,
      participantIds = [],
      // 兼容前端字段名
      participants = [],
      recurringRule,
      reminderTime = 15,
      roomId,
      // 兼容前端字段名
      startTime,
      title
    } = req.body;

    // 字段映射处理
    const actualTitle = title || meetingTitle;
    const actualDescription = description || meetingDesc || meetingAgenda;
    const actualLocation = location || meetingRoom;
    const actualParticipants = participants.length > 0 ? participants : participantIds;
    const actualMeetingType = meetingType || 'meeting';

    // 验证必需字段
    if (!actualTitle) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '会议标题不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '会议时间不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查会议室是否存在且可用
    if (roomId) {
      const room = await prisma.meetingRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        throw new ApiError(400, '会议室不存在');
      }

      if (room.status !== 1) {
        throw new ApiError(400, '会议室不可用');
      }

      // 检查时间冲突
      const conflictMeeting = await prisma.meeting.findFirst({
        where: {
          // 已安排或进行中
          OR: [
            {
              endTime: { gt: new Date(startTime) },
              startTime: { lte: new Date(startTime) }
            },
            {
              endTime: { gte: new Date(endTime) },
              startTime: { lt: new Date(endTime) }
            }
          ],
          roomId,
          status: { in: [1, 2] }
        }
      });

      if (conflictMeeting) {
        throw new ApiError(400, '会议室在该时间段已被占用');
      }
    }

    // 设置默认组织者为当前用户
    const actualOrganizerId = organizerId || (req.user ? req.user.id : 1);

    // 创建会议
    const meeting = await prisma.meeting.create({
      data: {
        agenda,
        description: actualDescription,
        endTime: new Date(endTime),
        isRecurring,
        location: actualLocation,
        meetingType: actualMeetingType,
        organizerId: actualOrganizerId,
        recurringRule,
        reminderTime,
        roomId,
        startTime: new Date(startTime),
        title: actualTitle
      }
    });

    // 添加参与者
    if (actualParticipants.length > 0) {
      await prisma.meetingParticipant.createMany({
        data: actualParticipants.map((participantId: number) => ({
          meetingId: meeting.id,
          role: 'participant',
          status: 1,
          userId: participantId // 待确认
        }))
      });

      // 添加组织者为参与者
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          role: 'organizer',
          status: 2,
          userId: actualOrganizerId // 已接受
        }
      });
    }

    logger.info(`会议创建成功: ${actualTitle}`);

    res.json({
      code: 0,
      data: meeting,
      message: '会议创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建会议失败:', error);
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
        message: '创建会议失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 更新会议
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查会议是否存在
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!existingMeeting) {
      throw new ApiError(404, '会议不存在');
    }

    // 处理日期字段
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    const meeting = await prisma.meeting.update({
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        },
        room: true
      },
      where: { id: Number.parseInt(id) }
    });

    logger.info(`会议更新成功: ${meeting.title}`);

    res.json({
      code: 0,
      data: meeting,
      message: '会议更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新会议失败:', error);
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
        message: '更新会议失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 删除会议
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查会议是否存在
    const meeting = await prisma.meeting.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!meeting) {
      throw new ApiError(404, '会议不存在');
    }

    // 检查会议状态
    if (meeting.status === 2) {
      throw new ApiError(400, '进行中的会议无法删除');
    }

    await prisma.meeting.delete({
      where: { id: Number.parseInt(id) }
    });

    logger.info(`会议删除成功: ${meeting.title}`);

    res.json({
      code: 0,
      data: null,
      message: '会议删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除会议失败:', error);
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
        message: '删除会议失败',
        path: req.path,
        timestamp: Date.now()
      });
    }
  }
});

// 会议审批
router.put('/:id/approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, approverId, remark } = req.body;

    const meeting = await prisma.meeting.update({
      data: {
        approvalStatus,
        approvalTime: approvalStatus !== 1 ? new Date() : null,
        approverId
      },
      include: {
        organizer: {
          select: {
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    const statusText = approvalStatus === 2 ? '通过' : '拒绝';
    logger.info(`会议审批${statusText}: ${meeting.title}`);

    res.json({
      code: 0,
      data: meeting,
      message: `会议审批${statusText}`,
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('会议审批失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '会议审批失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 获取会议室列表
router.get('/rooms/list', async (req, res) => {
  try {
    const rooms = await prisma.meetingRoom.findMany({
      orderBy: { name: 'asc' },
      where: { status: 1 }
    });

    res.json({
      code: 0,
      data: rooms,
      message: '获取会议室列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取会议室列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取会议室列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 会议统计
router.get('/statistics/overview', async (req, res) => {
  try {
    const totalMeetings = await prisma.meeting.count();
    const todayMeetings = await prisma.meeting.count({
      where: {
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });

    const ongoingMeetings = await prisma.meeting.count({
      where: { status: 2 }
    });

    const pendingApproval = await prisma.meeting.count({
      where: { approvalStatus: 1 }
    });

    // 会议类型统计
    const typeStats = await prisma.meeting.groupBy({
      _count: true,
      by: ['meetingType']
    });

    res.json({
      code: 0,
      data: {
        ongoingMeetings,
        pendingApproval,
        todayMeetings,
        totalMeetings,
        typeStats: typeStats.map(stat => ({
          count: stat._count,
          type: stat.meetingType
        }))
      },
      message: '获取会议统计成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取会议统计失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取会议统计失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

export default router;
