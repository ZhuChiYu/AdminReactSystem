import { apiClient } from './client';
import type { ApiResponse, PageResponse, NotificationApi } from './types';

/**
 * 通知服务
 */
class NotificationService {
  private readonly baseURL = '/notifications';

  /**
   * 获取通知列表
   */
  async getNotificationList(params: NotificationApi.NotificationQueryParams) {
    const response = await apiClient.get<PageResponse<NotificationApi.NotificationListItem>>(`${this.baseURL}`, {
      params
    });
    return response.data;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: number) {
    const response = await apiClient.put<ApiResponse>(`${this.baseURL}/${notificationId}/read`);
    return response.data;
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead() {
    const response = await apiClient.put<ApiResponse>(`${this.baseURL}/read-all`);
    return response.data;
  }

  /**
   * 创建通知
   */
  async createNotification(data: NotificationApi.CreateNotificationRequest) {
    const response = await apiClient.post<ApiResponse<NotificationApi.NotificationListItem>>(`${this.baseURL}`, data);
    return response.data;
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: number) {
    const response = await apiClient.delete<ApiResponse>(`${this.baseURL}/${notificationId}`);
    return response.data;
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount() {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(`${this.baseURL}/unread-count`);
    return response.data;
  }

  /**
   * 批量标记通知为已读
   */
  async batchMarkAsRead(notificationIds: number[]) {
    const response = await apiClient.put<ApiResponse>(`${this.baseURL}/batch-read`, {
      notificationIds
    });
    return response.data;
  }
}

export const notificationService = new NotificationService(); 