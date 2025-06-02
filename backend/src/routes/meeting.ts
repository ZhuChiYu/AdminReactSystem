import { Router } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import { authMiddleware } from '@/middleware/auth';

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
      current = 1,
      size = 10,
      title,
      organizerId,
      status,
      meetingType,
      startDate,
      endDate,
      approvalStatus
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
      where.organizerId = parseInt(organizerId as string);
    }

    if (status !== undefined) {
      where.status = parseInt(status as string);
    }

    if (meetingType) {
      where.meetingType = meetingType as string;
    }

    if (approvalStatus !== undefined) {
      where.approvalStatus = parseInt(approvalStatus as string);
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const skip = (parseInt(current as string) - 1) * parseInt(size as string);
    const take = parseInt(size as string);

    // 获取会议列表
    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                nickName: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    // 获取总数
    const total = await prisma.meeting.count({ where });

    const records = meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location,
      meetingType: meeting.meetingType,
      status: meeting.status,
      organizer: meeting.organizer,
      room: meeting.room,
      participantCount: meeting._count.participants,
      participants: meeting.participants.map(p => ({
        id: p.id,
        role: p.role,
        status: p.status,
        user: p.user
      })),
      approvalStatus: meeting.approvalStatus,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt
    }));

    res.json({
      code: 0,
      message: '获取会议列表成功',
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
    logger.error('获取会议列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取会议列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 获取会议详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(id) },
      include: {
        organizer: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            email: true
          }
        },
        room: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                nickName: true,
                email: true,
                department: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!meeting) {
      throw new ApiError(404, '会议不存在');
    }

    res.json({
      code: 0,
      message: '获取会议详情成功',
      data: meeting,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取会议详情失败:', error);
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
        message: '获取会议详情失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }
  }
});

// 创建会议
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      meetingTitle, // 兼容前端字段名
      description,
      meetingDesc, // 兼容前端字段名
      startTime,
      endTime,
      roomId,
      location,
      meetingRoom, // 兼容前端字段名
      meetingType,
      organizerId,
      agenda,
      meetingAgenda, // 兼容前端字段名
      participants = [],
      participantIds = [], // 兼容前端字段名
      isRecurring = false,
      recurringRule,
      reminderTime = 15
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
        message: '会议标题不能为空',
        data: null,
        timestamp: Date.now(),
        path: req.path
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        code: 400,
        message: '会议时间不能为空',
        data: null,
        timestamp: Date.now(),
        path: req.path
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
          roomId,
          status: { in: [1, 2] }, // 已安排或进行中
          OR: [
            {
              startTime: { lte: new Date(startTime) },
              endTime: { gt: new Date(startTime) }
            },
            {
              startTime: { lt: new Date(endTime) },
              endTime: { gte: new Date(endTime) }
            }
          ]
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
        title: actualTitle,
        description: actualDescription,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomId,
        location: actualLocation,
        meetingType: actualMeetingType,
        organizerId: actualOrganizerId,
        agenda,
        isRecurring,
        recurringRule,
        reminderTime
      }
    });

    // 添加参与者
    if (actualParticipants.length > 0) {
      await prisma.meetingParticipant.createMany({
        data: actualParticipants.map((participantId: number) => ({
          meetingId: meeting.id,
          userId: participantId,
          role: 'participant',
          status: 1 // 待确认
        }))
      });

      // 添加组织者为参与者
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId: actualOrganizerId,
          role: 'organizer',
          status: 2 // 已接受
        }
      });
    }

    logger.info(`会议创建成功: ${actualTitle}`);

    res.json({
      code: 0,
      message: '会议创建成功',
      data: meeting,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('创建会议失败:', error);
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
        message: '创建会议失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
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
      where: { id: parseInt(id) }
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
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        organizer: {
          select: {
            id: true,
            userName: true,
            nickName: true
          }
        },
        room: true
      }
    });

    logger.info(`会议更新成功: ${meeting.title}`);

    res.json({
      code: 0,
      message: '会议更新成功',
      data: meeting,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('更新会议失败:', error);
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
        message: '更新会议失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
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
      where: { id: parseInt(id) }
    });

    if (!meeting) {
      throw new ApiError(404, '会议不存在');
    }

    // 检查会议状态
    if (meeting.status === 2) {
      throw new ApiError(400, '进行中的会议无法删除');
    }

    await prisma.meeting.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`会议删除成功: ${meeting.title}`);

    res.json({
      code: 0,
      message: '会议删除成功',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('删除会议失败:', error);
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
        message: '删除会议失败',
        data: null,
        timestamp: Date.now(),
        path: req.path
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
      where: { id: parseInt(id) },
      data: {
        approvalStatus,
        approverId,
        approvalTime: approvalStatus !== 1 ? new Date() : null
      },
      include: {
        organizer: {
          select: {
            userName: true,
            nickName: true
          }
        }
      }
    });

    const statusText = approvalStatus === 2 ? '通过' : '拒绝';
    logger.info(`会议审批${statusText}: ${meeting.title}`);

    res.json({
      code: 0,
      message: `会议审批${statusText}`,
      data: meeting,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('会议审批失败:', error);
    res.status(500).json({
      code: 500,
      message: '会议审批失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

// 获取会议室列表
router.get('/rooms/list', async (req, res) => {
  try {
    const rooms = await prisma.meetingRoom.findMany({
      where: { status: 1 },
      orderBy: { name: 'asc' }
    });

    res.json({
      code: 0,
      message: '获取会议室列表成功',
      data: rooms,
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取会议室列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取会议室列表失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
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
      by: ['meetingType'],
      _count: true
    });

    res.json({
      code: 0,
      message: '获取会议统计成功',
      data: {
        totalMeetings,
        todayMeetings,
        ongoingMeetings,
        pendingApproval,
        typeStats: typeStats.map(stat => ({
          type: stat.meetingType,
          count: stat._count
        }))
      },
      timestamp: Date.now(),
      path: req.path
    });
  } catch (error: any) {
    logger.error('获取会议统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取会议统计失败',
      data: null,
      timestamp: Date.now(),
      path: req.path
    });
  }
});

export default router;
