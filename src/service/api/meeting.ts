import { apiClient } from './client';
import type { ApiResponse, MeetingApi, PageResponse } from './types';

/** 会议管理相关API服务 */
export class MeetingService {
  /** 获取会议列表 */
  async getMeetingList(
    params?: MeetingApi.MeetingQueryParams
  ): Promise<PageResponse<MeetingApi.MeetingListItem>['data']> {
    try {
      const response = await apiClient.get('/meetings', { params });
      return response;
    } catch (error) {
      console.error('获取会议列表失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 获取会议详情 */
  async getMeetingDetail(id: number): Promise<MeetingApi.MeetingListItem> {
    try {
      const response = await apiClient.get(`/meetings/${id}`);
      return response;
    } catch (error) {
      console.error('获取会议详情失败:', error);
      throw error;
    }
  }

  /** 创建会议 */
  async createMeeting(data: MeetingApi.CreateMeetingRequest): Promise<MeetingApi.MeetingListItem> {
    try {
      const response = await apiClient.post('/meetings', data);
      return response;
    } catch (error) {
      console.error('创建会议失败:', error);
      throw error;
    }
  }

  /** 更新会议 */
  async updateMeeting(id: number, data: Partial<MeetingApi.CreateMeetingRequest>): Promise<MeetingApi.MeetingListItem> {
    try {
      const response = await apiClient.put(`/meetings/${id}`, data);
      return response;
    } catch (error) {
      console.error('更新会议失败:', error);
      throw error;
    }
  }

  /** 删除会议 */
  async deleteMeeting(id: number): Promise<void> {
    try {
      await apiClient.delete(`/meetings/${id}`);
    } catch (error) {
      console.error('删除会议失败:', error);
      throw error;
    }
  }

  /** 会议审批 */
  async approveMeeting(
    id: number,
    data: {
      approvalStatus: number;
      remark?: string;
    }
  ): Promise<MeetingApi.MeetingListItem> {
    try {
      const response = await apiClient.put(`/meetings/${id}/approval`, data);
      return response;
    } catch (error) {
      console.error('会议审批失败:', error);
      throw error;
    }
  }

  /** 获取会议统计数据 */
  async getMeetingStatistics(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get('/meetings/statistics/overview');
      return response;
    } catch (error) {
      console.error('获取会议统计失败:', error);
      return {
        cancelled: 0,
        completed: 0,
        pending_approval: 0,
        scheduled: 0,
        this_month: 0,
        this_week: 0,
        total: 0
      };
    }
  }

  /** 获取会议室列表 */
  async getMeetingRooms(): Promise<MeetingApi.MeetingRoom[]> {
    try {
      const response = await apiClient.get('/meetings/rooms/list');
      return response;
    } catch (error) {
      console.error('获取会议室列表失败:', error);
      return [];
    }
  }

  /** 检查会议室可用性 */
  async checkRoomAvailability(roomId: number, startTime: string, endTime: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/meetings/rooms/${roomId}/availability`, {
        params: { endTime, startTime }
      });
      return response.available;
    } catch (error) {
      console.error('检查会议室可用性失败:', error);
      return false;
    }
  }

  /** 导出会议数据 */
  async exportMeetings(params?: MeetingApi.MeetingQueryParams): Promise<void> {
    try {
      await apiClient.download('/meetings/export', 'meetings.xlsx');
    } catch (error) {
      console.error('导出会议数据失败:', error);
      throw error;
    }
  }

  /** 获取会议总结列表 */
  async getMeetingSummaryList(params: MeetingApi.MeetingQueryParams) {
    try {
      const response = await apiClient.get<PageResponse<any>>('/meetings/summaries', {
        params
      });
      return response;
    } catch (error) {
      console.error('获取会议总结列表失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 创建会议总结 */
  async createMeetingSummary(data: { content: string; meetingId: number; participants?: string[] }) {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/meetings/summaries', data);
      return response;
    } catch (error) {
      console.error('创建会议总结失败:', error);
      throw error;
    }
  }

  /** 更新会议总结 */
  async updateMeetingSummary(
    summaryId: number,
    data: {
      content?: string;
      participants?: string[];
      status?: number;
    }
  ) {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`/meetings/summaries/${summaryId}`, data);
      return response;
    } catch (error) {
      console.error('更新会议总结失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const meetingService = new MeetingService();
