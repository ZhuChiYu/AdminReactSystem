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

    // 根据用户角色过滤会议
    const user = (req as any).user;
    if (user) {
      if (user.roles && user.roles.includes('super_admin')) {
        // 超级管理员可以看到所有会议
        // 不添加额外过滤条件
      } else {
        // 普通用户只能看到：
        // 1. 自己创建的会议
        // 2. 自己参与的已审批通过的会议
        where.OR = [
          { organizerId: user.id }, // 自己创建的会议
          {
            AND: [
              { approvalStatus: 2 }, // 已审批通过
              {
                participants: {
                  some: {
                    userId: user.id
                  }
                }
              }
            ]
          }
        ];
      }
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

    const records = meetings.map(meeting => {
      // 动态计算会议状态
      const now = new Date();
      const startTime = new Date(meeting.startTime);
      const endTime = new Date(meeting.endTime);
      let currentStatus = meeting.status;

      // 只对非取消状态的会议进行动态计算
      if (meeting.status !== -1) {
        if (now < startTime) {
          currentStatus = 0; // 待开始
        } else if (now >= startTime && now <= endTime) {
          currentStatus = 1; // 进行中
        } else if (now > endTime) {
          currentStatus = 2; // 已结束
        }
      }

      return {
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
        status: currentStatus,
      title: meeting.title,
      updatedAt: meeting.updatedAt
      };
    });

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

    // 获取会议总结列表
    const summaries = await prisma.meetingSummary.findMany({
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        creator: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      where
    });

    const total = await prisma.meetingSummary.count({ where });

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / take),
        records: summaries,
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

// 注意：动态路由 /:id 必须放在所有静态路由之后

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
    const actualDescription = description || meetingDesc || meetingAgenda || agenda;
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

    // 检查用户角色，决定是否需要审批
    const user = req.user;
    let approvalStatus = 1; // 默认待审批

    // 如果是超级管理员，直接通过审批
    if (user && user.roles && user.roles.includes('super_admin')) {
      approvalStatus = 2; // 已通过
    }

    // 创建会议
    const meeting = await prisma.meeting.create({
      data: {
        agenda: actualDescription ? JSON.stringify({ content: actualDescription }) : null,
        approvalStatus,
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

    // 添加参与者（过滤掉组织者，避免重复插入）
    if (actualParticipants.length > 0) {
      // 过滤掉组织者，避免唯一约束冲突
      const filteredParticipants = actualParticipants.filter((participantId: number) => participantId !== actualOrganizerId);

      if (filteredParticipants.length > 0) {
        await prisma.meetingParticipant.createMany({
          data: filteredParticipants.map((participantId: number) => ({
            meetingId: meeting.id,
            role: 'participant',
            status: 1,
            userId: participantId // 待确认
          }))
        });
      }

      // 添加组织者为参与者
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          role: 'organizer',
          status: 2,
          userId: actualOrganizerId // 已接受
        }
      });

      // 如果是超级管理员创建的会议（已通过审批），直接通知参会人员
      if (approvalStatus === 2) {
        try {
          // 获取组织者信息
          const organizer = await prisma.user.findUnique({
            where: { id: actualOrganizerId },
            select: { nickName: true, userName: true }
          });

          const organizerName = organizer?.nickName || organizer?.userName || '未知';

          // 为每个参会人员创建通知
          for (const participantId of actualParticipants) {
            await prisma.notification.create({
              data: {
                title: '会议通知',
                content: `您被邀请参加会议"${actualTitle}"，会议时间：${startTime} - ${endTime}，地点：${actualLocation || '待定'}，组织者：${organizerName}`,
                type: 'meeting',
                userId: participantId,
                readStatus: 0,
                relatedId: meeting.id,
                relatedType: 'meeting',
                createTime: new Date().toISOString()
              }
            });
          }
        } catch (notificationError) {
          logger.error('创建会议通知失败:', notificationError);
          // 不影响会议创建，只记录错误
        }
      }
    }

    // 如果会议需要审批，通知超级管理员
    if (approvalStatus === 1) {
      try {
        // 获取所有超级管理员
        const superAdmins = await prisma.user.findMany({
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          },
          where: {
            userRoles: {
              some: {
                role: {
                  roleCode: 'super_admin'
                }
              }
            }
          }
        });

        // 获取申请人信息
        const applicant = await prisma.user.findUnique({
          where: { id: actualOrganizerId },
          select: { nickName: true, userName: true }
        });

        const applicantName = applicant?.nickName || applicant?.userName || '未知用户';

        // 为每个超级管理员创建通知
        const notifications = superAdmins.map(admin => ({
          content: `${applicantName}申请创建会议"${actualTitle}"，会议时间：${startTime} - ${endTime}，地点：${actualLocation || '待定'}，请及时审核处理。`,
          createTime: new Date().toISOString(),
          relatedId: meeting.id,
          relatedType: 'meeting',
          title: '新会议申请待审批',
          type: 'meeting_approval',
          userId: admin.id,
          readStatus: 0
        }));

        if (notifications.length > 0) {
          await prisma.notification.createMany({
            data: notifications
          });

          logger.info(`已为${notifications.length}个超级管理员创建会议审批通知`, {
            meetingId: meeting.id,
            meetingTitle: actualTitle
          });
        }
      } catch (notificationError) {
        logger.error('创建会议审批通知失败:', notificationError);
        // 不影响主流程，继续执行
      }
    }

    logger.info(`会议创建成功: ${actualTitle}`);

    const message = approvalStatus === 2 ? '会议创建成功，已通知参会人员' : '会议创建成功，等待审批';

    res.json({
      code: 0,
      data: meeting,
      message,
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
        approverId: req.user?.id || approverId
      },
      include: {
        organizer: {
          select: {
            nickName: true,
            userName: true
          }
        },
        participants: {
          select: {
            userId: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    const statusText = approvalStatus === 2 ? '通过' : '拒绝';
    logger.info(`会议审批${statusText}: ${meeting.title}`);

    // 如果审批通过，通知参会人员
    if (approvalStatus === 2) {
      try {
        const organizerName = meeting.organizer?.nickName || meeting.organizer?.userName || '未知';

        // 为每个参会人员创建通知
        for (const participant of meeting.participants) {
          await prisma.notification.create({
            data: {
              title: '会议审批通过通知',
              content: `您参与的会议"${meeting.title}"已审批通过，会议时间：${meeting.startTime.toLocaleString()} - ${meeting.endTime.toLocaleString()}，地点：${meeting.location || '待定'}，组织者：${organizerName}`,
              type: 'meeting',
              userId: participant.userId,
              readStatus: 0,
              relatedId: meeting.id,
              relatedType: 'meeting',
              createTime: new Date().toISOString()
            }
          });
        }

        // 通知组织者
        await prisma.notification.create({
          data: {
            title: '会议审批结果',
            content: `您申请的会议"${meeting.title}"已审批通过`,
            type: 'meeting',
            userId: meeting.organizerId,
            readStatus: 0,
            relatedId: meeting.id,
            relatedType: 'meeting',
            createTime: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        logger.error('创建审批通知失败:', notificationError);
        // 不影响审批结果，只记录错误
      }
    } else if (approvalStatus === -1) {
      // 审批拒绝，只通知组织者
      try {
        await prisma.notification.create({
          data: {
            title: '会议审批结果',
            content: `您申请的会议"${meeting.title}"审批被拒绝${remark ? `，原因：${remark}` : ''}`,
            type: 'meeting',
            userId: meeting.organizerId,
            readStatus: 0,
            relatedId: meeting.id,
            relatedType: 'meeting',
            createTime: new Date().toISOString()
          }
        });
      } catch (notificationError) {
        logger.error('创建审批拒绝通知失败:', notificationError);
      }
    }

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

// ==================== 会议记录相关API ====================

// 获取会议记录列表
router.get('/records', async (req, res) => {
  try {
    const { current = 1, size = 10, meetingId, recorderId } = req.query;

    const where: any = {};
    if (meetingId) {
      where.meetingId = Number.parseInt(meetingId as string);
    }
    if (recorderId) {
      where.recorderId = Number.parseInt(recorderId as string);
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    const records = await prisma.meetingRecord.findMany({
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        recorder: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      where
    });

    const total = await prisma.meetingRecord.count({ where });

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / take),
        records,
        size: Number.parseInt(size as string),
        total
      },
      message: '获取会议记录列表成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('获取会议记录列表失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '获取会议记录列表失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 创建会议记录
router.post('/records', authMiddleware, async (req, res) => {
  try {
    const { meetingId, title, content, keyPoints, actionItems, decisions, nextSteps } = req.body;

    if (!meetingId || !content) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '会议ID和记录内容不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查会议是否存在
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '会议不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const record = await prisma.meetingRecord.create({
      data: {
        meetingId,
        title: title || `${meeting.title} - 会议记录`,
        content,
        keyPoints,
        actionItems,
        decisions,
        nextSteps,
        recorderId: req.user?.id || 1
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        recorder: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      }
    });

    res.json({
      code: 0,
      data: record,
      message: '会议记录创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建会议记录失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建会议记录失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 更新会议记录
router.put('/records/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, keyPoints, actionItems, decisions, nextSteps } = req.body;

    const record = await prisma.meetingRecord.update({
      data: {
        title,
        content,
        keyPoints,
        actionItems,
        decisions,
        nextSteps
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        recorder: {
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
      data: record,
      message: '会议记录更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新会议记录失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新会议记录失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 删除会议记录
router.delete('/records/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查会议记录是否存在
    const existingRecord = await prisma.meetingRecord.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!existingRecord) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '会议记录不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    await prisma.meetingRecord.delete({
      where: { id: Number.parseInt(id) }
    });

    res.json({
      code: 0,
      data: null,
      message: '会议记录删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除会议记录失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除会议记录失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 导出会议记录
router.get('/records/:id/export', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.meetingRecord.findUnique({
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        recorder: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    if (!record) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '会议记录不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

        // 格式化日期
    const formatDate = (date: Date | string) => {
      try {
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      } catch {
        return '未知日期';
      }
    };

    // 这里可以集成实际的文档生成库（如 docx 或其他）
    // 暂时返回一个简单的文本文件
    const content = `
会议记录

会议标题：${record.meeting.title}
会议时间：${formatDate(record.meeting.startTime)} - ${formatDate(record.meeting.endTime)}
会议地点：${record.meeting.location || '未指定'}
记录人：${record.recorder.nickName || record.recorder.userName}
记录日期：${formatDate(record.createdAt)}

记录内容：
${record.content}

${record.keyPoints ? `关键要点：\n${record.keyPoints}\n` : ''}
${record.actionItems ? `行动项目：\n${record.actionItems}\n` : ''}
${record.decisions ? `决策内容：\n${record.decisions}\n` : ''}
${record.nextSteps ? `下一步行动：\n${record.nextSteps}` : ''}
    `;

    const fileName = `会议记录-${record.meeting.title.replace(/[<>:"/\\|?*]/g, '-')}-${formatDate(record.createdAt)}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // 返回文本内容
    res.send(content);

  } catch (error: any) {
    logger.error('导出会议记录失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '导出会议记录失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// ==================== 会议总结相关API ====================

// 获取会议总结列表
router.get('/summaries', async (req, res) => {
  try {
    const { current = 1, size = 10, meetingId, creatorId } = req.query;

    const where: any = {};
    if (meetingId) {
      where.meetingId = Number.parseInt(meetingId as string);
    }
    if (creatorId) {
      where.creatorId = Number.parseInt(creatorId as string);
    }

    const skip = (Number.parseInt(current as string) - 1) * Number.parseInt(size as string);
    const take = Number.parseInt(size as string);

    const summaries = await prisma.meetingSummary.findMany({
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        creator: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      where
    });

    const total = await prisma.meetingSummary.count({ where });

    res.json({
      code: 0,
      data: {
        current: Number.parseInt(current as string),
        pages: Math.ceil(total / take),
        records: summaries,
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

// 创建会议总结
router.post('/summaries', authMiddleware, async (req, res) => {
  try {
    const { meetingId, title, content, conclusion, nextSteps, participants, tags } = req.body;

    if (!meetingId || !content) {
      return res.status(400).json({
        code: 400,
        data: null,
        message: '会议ID和总结内容不能为空',
        path: req.path,
        timestamp: Date.now()
      });
    }

    // 检查会议是否存在
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '会议不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    const summary = await prisma.meetingSummary.create({
      data: {
        meetingId,
        title: title || `${meeting.title} - 会议总结`,
        content,
        conclusion,
        nextSteps,
        participants: participants ? JSON.stringify(participants) : null,
        tags: tags ? JSON.stringify(tags) : null,
        creatorId: req.user?.id || 1
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        creator: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      }
    });

    res.json({
      code: 0,
      data: summary,
      message: '会议总结创建成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('创建会议总结失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '创建会议总结失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 更新会议总结
router.put('/summaries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, conclusion, nextSteps, participants, tags, status } = req.body;

    const summary = await prisma.meetingSummary.update({
      data: {
        title,
        content,
        conclusion,
        nextSteps,
        participants: participants ? JSON.stringify(participants) : undefined,
        tags: tags ? JSON.stringify(tags) : undefined,
        status
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        creator: {
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
      data: summary,
      message: '会议总结更新成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('更新会议总结失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '更新会议总结失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 删除会议总结
router.delete('/summaries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查会议总结是否存在
    const existingSummary = await prisma.meetingSummary.findUnique({
      where: { id: Number.parseInt(id) }
    });

    if (!existingSummary) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '会议总结不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

    await prisma.meetingSummary.delete({
      where: { id: Number.parseInt(id) }
    });

    res.json({
      code: 0,
      data: null,
      message: '会议总结删除成功',
      path: req.path,
      timestamp: Date.now()
    });
  } catch (error: any) {
    logger.error('删除会议总结失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '删除会议总结失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// 导出会议总结
router.get('/summaries/:id/export', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const summary = await prisma.meetingSummary.findUnique({
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true
          }
        },
        creator: {
          select: {
            id: true,
            nickName: true,
            userName: true
          }
        }
      },
      where: { id: Number.parseInt(id) }
    });

    if (!summary) {
      return res.status(404).json({
        code: 404,
        data: null,
        message: '会议总结不存在',
        path: req.path,
        timestamp: Date.now()
      });
    }

        // 格式化日期
    const formatDate = (date: Date | string) => {
      try {
        const d = new Date(date);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      } catch {
        return '未知日期';
      }
    };

    // 这里可以集成实际的文档生成库（如 docx 或其他）
    // 暂时返回一个简单的文本文件
    const content = `
会议总结

会议标题：${summary.meeting.title}
会议时间：${formatDate(summary.meeting.startTime)} - ${formatDate(summary.meeting.endTime)}
会议地点：${summary.meeting.location || '未指定'}
总结人：${summary.creator.nickName || summary.creator.userName}
总结日期：${formatDate(summary.createdAt)}

总结内容：
${summary.content}

${summary.conclusion ? `会议结论：\n${summary.conclusion}\n` : ''}
${summary.nextSteps ? `下一步行动：\n${summary.nextSteps}` : ''}
    `;

    const fileName = `会议总结-${summary.meeting.title.replace(/[<>:"/\\|?*]/g, '-')}-${formatDate(summary.createdAt)}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // 返回文本内容
    res.send(content);

  } catch (error: any) {
    logger.error('导出会议总结失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      message: '导出会议总结失败',
      path: req.path,
      timestamp: Date.now()
    });
  }
});

// ==================== 动态路由（必须放在最后） ====================

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

export default router;
