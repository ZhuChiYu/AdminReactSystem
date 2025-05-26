import { apiClient, createMockResponse, createMockPageResponse } from './client';
import { MeetingApi, PageResponse } from './types';

/**
 * 会议管理相关API服务
 */
export class MeetingService {
  /**
   * 获取会议列表
   */
  async getMeetingList(params: MeetingApi.MeetingQueryParams): Promise<PageResponse<MeetingApi.MeetingListItem>['data']> {
    // 目前使用模拟数据，实际项目中替换为真实API调用
    // return apiClient.get('/meetings', { params });

    // 模拟会议数据
    const mockMeetings: MeetingApi.MeetingListItem[] = [
      {
        id: 1,
        title: '数智化财务管理培训项目启动会',
        description: '讨论数智化财务管理培训项目的具体实施方案和时间安排',
        startTime: '2024-04-15 09:00:00',
        endTime: '2024-04-15 11:00:00',
        location: '会议室A',
        meetingType: 'project',
        status: 'scheduled',
        organizer: { id: 1, name: '张经理' },
        participants: [
          { id: 1, name: '张经理', role: 'organizer', status: 'accepted' },
          { id: 2, name: '李主管', role: 'participant', status: 'accepted' },
          { id: 3, name: '王老师', role: 'participant', status: 'pending' },
          { id: 4, name: '陈助理', role: 'participant', status: 'accepted' },
        ],
        agenda: [
          { order: 1, title: '项目背景介绍', duration: 30, speaker: '张经理' },
          { order: 2, title: '培训方案讨论', duration: 60, speaker: '李主管' },
          { order: 3, title: '时间安排确认', duration: 30, speaker: '王老师' },
        ],
        attachments: [
          { id: 1, name: '项目方案.pdf', url: '/files/project-plan.pdf', size: 2048 },
          { id: 2, name: '培训大纲.docx', url: '/files/training-outline.docx', size: 1024 },
        ],
        isRecurring: false,
        reminderTime: 15,
        approvalStatus: 'approved',
        approver: { id: 1, name: '总经理' },
        approvalTime: '2024-04-10 14:30:00',
        createTime: '2024-04-08 10:00:00',
        updateTime: '2024-04-10 14:30:00',
      },
      {
        id: 2,
        title: '客户跟进情况汇报会',
        description: '各销售团队汇报本月客户跟进情况和下月计划',
        startTime: '2024-04-16 14:00:00',
        endTime: '2024-04-16 16:00:00',
        location: '大会议室',
        meetingType: 'review',
        status: 'scheduled',
        organizer: { id: 2, name: '销售总监' },
        participants: [
          { id: 2, name: '销售总监', role: 'organizer', status: 'accepted' },
          { id: 5, name: '华东区经理', role: 'participant', status: 'accepted' },
          { id: 6, name: '华南区经理', role: 'participant', status: 'accepted' },
          { id: 7, name: '华北区经理', role: 'participant', status: 'pending' },
        ],
        agenda: [
          { order: 1, title: '华东区汇报', duration: 30, speaker: '华东区经理' },
          { order: 2, title: '华南区汇报', duration: 30, speaker: '华南区经理' },
          { order: 3, title: '华北区汇报', duration: 30, speaker: '华北区经理' },
          { order: 4, title: '总结与下月计划', duration: 30, speaker: '销售总监' },
        ],
        attachments: [],
        isRecurring: true,
        recurringRule: 'monthly',
        reminderTime: 30,
        approvalStatus: 'pending',
        createTime: '2024-04-12 09:15:00',
        updateTime: '2024-04-12 09:15:00',
      },
      {
        id: 3,
        title: '财务系统升级讨论会',
        description: '讨论财务系统升级的技术方案和实施计划',
        startTime: '2024-04-18 10:00:00',
        endTime: '2024-04-18 12:00:00',
        location: '技术部会议室',
        meetingType: 'technical',
        status: 'completed',
        organizer: { id: 3, name: '技术总监' },
        participants: [
          { id: 3, name: '技术总监', role: 'organizer', status: 'accepted' },
          { id: 8, name: '系统架构师', role: 'participant', status: 'accepted' },
          { id: 9, name: '前端开发', role: 'participant', status: 'accepted' },
          { id: 10, name: '后端开发', role: 'participant', status: 'accepted' },
        ],
        agenda: [
          { order: 1, title: '现有系统分析', duration: 30, speaker: '系统架构师' },
          { order: 2, title: '升级方案讨论', duration: 60, speaker: '技术总监' },
          { order: 3, title: '实施计划制定', duration: 30, speaker: '项目经理' },
        ],
        attachments: [
          { id: 3, name: '系统架构图.png', url: '/files/system-arch.png', size: 512 },
        ],
        isRecurring: false,
        reminderTime: 15,
        approvalStatus: 'approved',
        approver: { id: 1, name: '总经理' },
        approvalTime: '2024-04-15 16:20:00',
        meetingNotes: '会议决定采用微服务架构进行系统升级，预计6月完成',
        createTime: '2024-04-14 11:30:00',
        updateTime: '2024-04-18 12:00:00',
      },
    ];

    // 根据查询参数过滤数据
    let filteredMeetings = mockMeetings;

    if (params.title) {
      filteredMeetings = filteredMeetings.filter(meeting =>
        meeting.title.includes(params.title!)
      );
    }

    if (params.meetingType) {
      filteredMeetings = filteredMeetings.filter(meeting =>
        meeting.meetingType === params.meetingType
      );
    }

    if (params.status) {
      filteredMeetings = filteredMeetings.filter(meeting =>
        meeting.status === params.status
      );
    }

    if (params.organizerId) {
      filteredMeetings = filteredMeetings.filter(meeting =>
        meeting.organizer.id === params.organizerId
      );
    }

    if (params.startDate && params.endDate) {
      filteredMeetings = filteredMeetings.filter(meeting => {
        const meetingDate = new Date(meeting.startTime).toISOString().split('T')[0];
        return meetingDate >= params.startDate! && meetingDate <= params.endDate!;
      });
    }

    return createMockPageResponse(
      filteredMeetings,
      params.current || 1,
      params.size || 10
    );
  }

  /**
   * 获取会议详情
   */
  async getMeetingDetail(id: number): Promise<MeetingApi.MeetingListItem> {
    // return apiClient.get(`/meetings/${id}`);

    const mockMeeting: MeetingApi.MeetingListItem = {
      id,
      title: '数智化财务管理培训项目启动会',
      description: '讨论数智化财务管理培训项目的具体实施方案和时间安排',
      startTime: '2024-04-15 09:00:00',
      endTime: '2024-04-15 11:00:00',
      location: '会议室A',
      meetingType: 'project',
      status: 'scheduled',
      organizer: { id: 1, name: '张经理' },
      participants: [
        { id: 1, name: '张经理', role: 'organizer', status: 'accepted' },
        { id: 2, name: '李主管', role: 'participant', status: 'accepted' },
        { id: 3, name: '王老师', role: 'participant', status: 'pending' },
        { id: 4, name: '陈助理', role: 'participant', status: 'accepted' },
      ],
      agenda: [
        { order: 1, title: '项目背景介绍', duration: 30, speaker: '张经理' },
        { order: 2, title: '培训方案讨论', duration: 60, speaker: '李主管' },
        { order: 3, title: '时间安排确认', duration: 30, speaker: '王老师' },
      ],
      attachments: [
        { id: 1, name: '项目方案.pdf', url: '/files/project-plan.pdf', size: 2048 },
        { id: 2, name: '培训大纲.docx', url: '/files/training-outline.docx', size: 1024 },
      ],
      isRecurring: false,
      reminderTime: 15,
      approvalStatus: 'approved',
      approver: { id: 1, name: '总经理' },
      approvalTime: '2024-04-10 14:30:00',
      createTime: '2024-04-08 10:00:00',
      updateTime: '2024-04-10 14:30:00',
    };

    return createMockResponse(mockMeeting);
  }

  /**
   * 创建会议
   */
  async createMeeting(params: MeetingApi.CreateMeetingRequest): Promise<{ id: number }> {
    // return apiClient.post('/meetings', params);

    return createMockResponse({ id: Date.now() });
  }

  /**
   * 更新会议
   */
  async updateMeeting(id: number, params: Partial<MeetingApi.CreateMeetingRequest>): Promise<void> {
    // return apiClient.put(`/meetings/${id}`, params);

    return createMockResponse(undefined);
  }

  /**
   * 删除会议
   */
  async deleteMeeting(id: number): Promise<void> {
    // return apiClient.delete(`/meetings/${id}`);

    return createMockResponse(undefined);
  }

  /**
   * 取消会议
   */
  async cancelMeeting(id: number, reason?: string): Promise<void> {
    // return apiClient.post(`/meetings/${id}/cancel`, { reason });

    return createMockResponse(undefined);
  }

  /**
   * 参与者响应会议邀请
   */
  async respondToMeeting(
    id: number,
    response: 'accepted' | 'declined' | 'tentative',
    comment?: string
  ): Promise<void> {
    // return apiClient.post(`/meetings/${id}/respond`, { response, comment });

    return createMockResponse(undefined);
  }

  /**
   * 获取会议统计数据
   */
  async getMeetingStatistics(): Promise<Record<string, number>> {
    // return apiClient.get('/meetings/statistics');

    const mockStatistics = {
      total: 156,
      scheduled: 45,
      completed: 89,
      cancelled: 12,
      pending_approval: 10,
      this_week: 8,
      this_month: 32,
    };

    return createMockResponse(mockStatistics);
  }

  /**
   * 获取会议室列表
   */
  async getMeetingRooms(): Promise<MeetingApi.MeetingRoom[]> {
    // return apiClient.get('/meeting-rooms');

    const mockRooms: MeetingApi.MeetingRoom[] = [
      {
        id: 1,
        name: '会议室A',
        capacity: 10,
        location: '2楼',
        equipment: ['投影仪', '白板', '音响'],
        status: 'available',
      },
      {
        id: 2,
        name: '大会议室',
        capacity: 30,
        location: '3楼',
        equipment: ['投影仪', '音响', '视频会议设备'],
        status: 'available',
      },
      {
        id: 3,
        name: '技术部会议室',
        capacity: 8,
        location: '4楼',
        equipment: ['大屏显示器', '白板'],
        status: 'occupied',
      },
    ];

    return createMockResponse(mockRooms);
  }

  /**
   * 检查会议室可用性
   */
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
      conflicts: available ? undefined : [
        {
          id: 999,
          title: '已有会议占用',
          startTime: '2024-04-15 10:00:00',
          endTime: '2024-04-15 12:00:00',
        } as MeetingApi.MeetingListItem,
      ],
    });
  }

  /**
   * 发送会议提醒
   */
  async sendMeetingReminder(id: number): Promise<void> {
    // return apiClient.post(`/meetings/${id}/reminder`);

    return createMockResponse(undefined);
  }

  /**
   * 获取我的会议日程
   */
  async getMySchedule(date: string): Promise<MeetingApi.MeetingListItem[]> {
    // return apiClient.get('/meetings/my-schedule', { params: { date } });

    // 模拟当天的会议安排
    const mockSchedule: MeetingApi.MeetingListItem[] = [
      {
        id: 1,
        title: '晨会',
        startTime: `${date} 09:00:00`,
        endTime: `${date} 09:30:00`,
        location: '会议室A',
        meetingType: 'daily',
        status: 'scheduled',
        organizer: { id: 1, name: '部门经理' },
        participants: [],
        agenda: [],
        attachments: [],
        isRecurring: true,
        reminderTime: 5,
        approvalStatus: 'approved',
        createTime: '2024-04-01 08:00:00',
        updateTime: '2024-04-01 08:00:00',
      },
    ];

    return createMockResponse(mockSchedule);
  }

  /**
   * 批量操作会议
   */
  async batchOperateMeetings(
    meetingIds: number[],
    operation: 'cancel' | 'delete' | 'remind'
  ): Promise<void> {
    // return apiClient.post('/meetings/batch-operate', { meetingIds, operation });

    return createMockResponse(undefined);
  }
}

// 导出会议服务实例
export const meetingService = new MeetingService();
