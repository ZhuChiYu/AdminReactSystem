import { apiClient, createMockPageResponse, createMockResponse } from './client';
import type { MeetingApi, PageResponse } from './types';

/** 会议管理相关API服务 */
export class MeetingService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 模拟会议数据
  private mockMeetings: MeetingApi.MeetingListItem[] = [
    {
      createTime: '2024-04-10 10:00:00',
      endTime: '2024-04-15 11:00:00',
      id: 1,
      isOnline: false,
      maxParticipants: 20,
      meetingRoom: '会议室A',
      meetingStatus: 1,
      meetingTitle: '数智化财务管理培训项目启动会',
      meetingType: '项目启动',
      organizer: { id: 1, name: '张经理' },
      participantCount: 15,
      startTime: '2024-04-15 09:00:00'
    },
    {
      createTime: '2024-04-12 15:30:00',
      endTime: '2024-04-16 16:00:00',
      id: 2,
      isOnline: true,
      maxParticipants: 30,
      meetingRoom: '会议室B',
      meetingStatus: 2,
      meetingTitle: '客户跟进情况汇报会',
      meetingType: '工作汇报',
      meetingUrl: 'https://meeting.example.com/room/123',
      organizer: { id: 2, name: '李主管' },
      participantCount: 25,
      startTime: '2024-04-16 14:00:00'
    },
    {
      createTime: '2024-04-13 09:20:00',
      endTime: '2024-04-17 12:00:00',
      id: 3,
      isOnline: false,
      maxParticipants: 15,
      meetingRoom: '会议室C',
      meetingStatus: 0,
      meetingTitle: '财务系统升级讨论会',
      meetingType: '技术讨论',
      organizer: { id: 3, name: '王总监' },
      participantCount: 12,
      startTime: '2024-04-17 10:00:00'
    }
  ];

  /** 获取会议列表 */
  async getMeetingList(
    params?: MeetingApi.MeetingQueryParams
  ): Promise<{ data: { current: number; records: MeetingApi.MeetingListItem[]; size: number; total: number } }> {
    await this.delay(500);

    let filteredMeetings = [...this.mockMeetings];

    if (params?.meetingTitle) {
      filteredMeetings = filteredMeetings.filter(meeting => meeting.meetingTitle.includes(params.meetingTitle!));
    }

    if (params?.meetingType) {
      filteredMeetings = filteredMeetings.filter(meeting => meeting.meetingType === params.meetingType);
    }

    if (params?.meetingStatus !== undefined) {
      filteredMeetings = filteredMeetings.filter(meeting => meeting.meetingStatus === params.meetingStatus);
    }

    if (params?.startTimeBegin && params?.startTimeEnd) {
      filteredMeetings = filteredMeetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime);
        return meetingDate >= new Date(params.startTimeBegin!) && meetingDate <= new Date(params.startTimeEnd!);
      });
    }

    const current = params?.current || 1;
    const size = params?.size || 10;
    const start = (current - 1) * size;
    const end = start + size;

    return {
      data: {
        current,
        records: filteredMeetings.slice(start, end),
        size,
        total: filteredMeetings.length
      }
    };
  }

  /** 获取会议详情 */
  async getMeetingDetail(id: number): Promise<MeetingApi.MeetingListItem> {
    await this.delay(300);

    return {
      createTime: '2024-04-10 10:00:00',
      endTime: '2024-04-15 11:00:00',
      id,
      isOnline: false,
      maxParticipants: 20,
      meetingRoom: '会议室A',
      meetingStatus: 1,
      meetingTitle: '数智化财务管理培训项目启动会',
      meetingType: '项目启动',
      organizer: { id: 1, name: '张经理' },
      participantCount: 15,
      startTime: '2024-04-15 09:00:00'
    };
  }

  /** 创建会议 */
  async createMeeting(params: MeetingApi.CreateMeetingRequest): Promise<{ id: number }> {
    await this.delay(800);
    return { id: Date.now() };
  }

  /** 更新会议 */
  async updateMeeting(id: number, params: Partial<MeetingApi.CreateMeetingRequest>): Promise<void> {
    await this.delay(600);
  }

  /** 删除会议 */
  async deleteMeeting(id: number): Promise<void> {
    await this.delay(400);
  }

  /** 取消会议 */
  async cancelMeeting(id: number, reason?: string): Promise<void> {
    // return apiClient.post(`/meetings/${id}/cancel`, { reason });

    return createMockResponse(undefined);
  }

  /** 参与者响应会议邀请 */
  async respondToMeeting(id: number, response: 'accepted' | 'declined' | 'tentative', comment?: string): Promise<void> {
    // return apiClient.post(`/meetings/${id}/respond`, { response, comment });

    return createMockResponse(undefined);
  }

  /** 获取会议统计数据 */
  async getMeetingStatistics(): Promise<Record<string, number>> {
    // return apiClient.get('/meetings/statistics');

    const mockStatistics = {
      cancelled: 12,
      completed: 89,
      pending_approval: 10,
      scheduled: 45,
      this_month: 32,
      this_week: 8,
      total: 156
    };

    return createMockResponse(mockStatistics);
  }

  /** 获取会议室列表 */
  async getMeetingRooms(): Promise<MeetingApi.MeetingRoom[]> {
    await this.delay(200);

    const mockRooms: MeetingApi.MeetingRoom[] = [
      {
        capacity: 20,
        equipment: ['投影仪', '音响', '白板'],
        id: 1,
        location: '1楼东侧',
        name: '会议室A',
        status: 'available'
      },
      {
        capacity: 30,
        equipment: ['投影仪', '音响', '白板', '视频会议设备'],
        id: 2,
        location: '2楼西侧',
        name: '会议室B',
        status: 'available'
      },
      {
        capacity: 15,
        equipment: ['投影仪', '白板'],
        id: 3,
        location: '3楼中央',
        name: '会议室C',
        status: 'occupied'
      }
    ];

    return mockRooms;
  }

  /** 检查会议室可用性 */
  async checkRoomAvailability(
    roomId: number,
    startTime: string,
    endTime: string
  ): Promise<{ available: boolean; conflicts?: MeetingApi.MeetingListItem[] }> {
    // return apiClient.get(`/meeting-rooms/${roomId}/availability`, {
    //   params: { startTime, endTime }
    // });

    // 模拟检查结果
    const available = Math.random() > 0.3; // 70%概率可用

    return createMockResponse({
      available,
      conflicts: available
        ? undefined
        : [
            {
              endTime: '2024-04-15 12:00:00',
              id: 999,
              startTime: '2024-04-15 10:00:00',
              title: '已有会议占用'
            } as MeetingApi.MeetingListItem
          ]
    });
  }

  /** 发送会议提醒 */
  async sendMeetingReminder(id: number): Promise<void> {
    // return apiClient.post(`/meetings/${id}/reminder`);

    return createMockResponse(undefined);
  }

  /** 获取我的会议日程 */
  async getMySchedule(date: string): Promise<MeetingApi.MeetingListItem[]> {
    // return apiClient.get('/meetings/my-schedule', { params: { date } });

    // 模拟当天的会议安排
    const mockSchedule: MeetingApi.MeetingListItem[] = [
      {
        agenda: [],
        approvalStatus: 'approved',
        attachments: [],
        createTime: '2024-04-01 08:00:00',
        endTime: `${date} 09:30:00`,
        id: 1,
        isRecurring: true,
        location: '会议室A',
        meetingType: 'daily',
        organizer: { id: 1, name: '部门经理' },
        participants: [],
        reminderTime: 5,
        startTime: `${date} 09:00:00`,
        status: 'scheduled',
        title: '晨会',
        updateTime: '2024-04-01 08:00:00'
      }
    ];

    return createMockResponse(mockSchedule);
  }

  /** 批量操作会议 */
  async batchOperateMeetings(meetingIds: number[], operation: 'cancel' | 'delete' | 'remind'): Promise<void> {
    // return apiClient.post('/meetings/batch-operate', { meetingIds, operation });

    return createMockResponse(undefined);
  }

  async getMyMeetings(): Promise<MeetingApi.MeetingListItem[]> {
    await this.delay(400);

    return [
      {
        createTime: '2024-04-14 16:00:00',
        endTime: '2024-04-15 12:00:00',
        id: 999,
        isOnline: true,
        meetingStatus: 1,
        meetingTitle: '个人日程会议',
        meetingType: '个人会议',
        meetingUrl: 'https://meeting.example.com/personal/123',
        organizer: { id: 1, name: '当前用户' },
        participantCount: 5,
        startTime: '2024-04-15 10:00:00'
      }
    ];
  }

  async getTodayMeetings(): Promise<MeetingApi.MeetingListItem[]> {
    await this.delay(300);

    return [
      {
        createTime: '2024-04-14 18:00:00',
        endTime: '2024-04-15 09:30:00',
        id: 1001,
        isOnline: false,
        meetingRoom: '会议室A',
        meetingStatus: 1,
        meetingTitle: '晨会',
        meetingType: '例会',
        organizer: { id: 1, name: '部门经理' },
        participantCount: 10,
        startTime: '2024-04-15 09:00:00'
      }
    ];
  }
}

export const meetingService = new MeetingService();

// 导出API函数
export const fetchGetMeetingList = meetingService.getMeetingList.bind(meetingService);
export const fetchGetMeetingDetail = meetingService.getMeetingDetail.bind(meetingService);
export const fetchCreateMeeting = meetingService.createMeeting.bind(meetingService);
export const fetchUpdateMeeting = meetingService.updateMeeting.bind(meetingService);
export const fetchDeleteMeeting = meetingService.deleteMeeting.bind(meetingService);
export const fetchGetMeetingRooms = meetingService.getMeetingRooms.bind(meetingService);
export const fetchGetMyMeetings = meetingService.getMyMeetings.bind(meetingService);
export const fetchGetTodayMeetings = meetingService.getTodayMeetings.bind(meetingService);
