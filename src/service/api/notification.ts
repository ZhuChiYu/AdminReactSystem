import { apiClient } from './client';
import type { ApiResponse, NotificationApi, PageResponse } from './types';

/** 通知服务 */
class NotificationService {
  private readonly baseURL = '/notifications';

  /** 获取通知列表 */
  async getNotificationList(
    params: NotificationApi.NotificationQueryParams
  ): Promise<PageResponse<NotificationApi.NotificationListItem>['data']> {
    try {
      const response = await apiClient.get(`${this.baseURL}`, {
        params
      });
      // apiClient 已经处理了响应格式，直接返回 data 部分
      return response;
    } catch (error) {
      // 如果API调用失败，返回空数据
      return {
        current: params.current || 1,
        pages: 0,
        records: [],
        size: params.size || 10,
        total: 0
      };
    }
  }

  /** 标记通知为已读 */
  async markAsRead(notificationId: number) {
    const response = await apiClient.put<ApiResponse>(`${this.baseURL}/${notificationId}/read`);
    return response;
  }

  /** 标记所有通知为已读 */
  async markAllAsRead() {
    const response = await apiClient.put<ApiResponse>(`${this.baseURL}/read-all`);
    return response;
  }

  /** 创建通知 */
  async createNotification(data: NotificationApi.CreateNotificationRequest) {
    const response = await apiClient.post<ApiResponse<NotificationApi.NotificationListItem>>(`${this.baseURL}`, data);
    return response;
  }

  /** 删除通知 */
  async deleteNotification(notificationId: number) {
    const response = await apiClient.delete<ApiResponse>(`${this.baseURL}/${notificationId}`);
    return response;
  }

  /** 获取未读通知数量 */
  async getUnreadCount() {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(`${this.baseURL}/unread-count`);
    return response;
  }

  /** 批量标记通知为已读 */
  async batchMarkAsRead(notificationIds: number[]) {
    const response = await apiClient.put<ApiResponse>(`${this.baseURL}/batch-read`, {
      notificationIds
    });
    return response;
  }

  // 通知附件相关方法

  /** 获取通知附件列表 */
  async getNotificationAttachments(
    notificationId: number,
    params: { current?: number; size?: number } = {}
  ): Promise<PageResponse<NotificationApi.NotificationAttachmentListItem>['data']> {
    try {
      const response = await apiClient.get(`${this.baseURL}/${notificationId}/attachments`, {
        params: {
          current: params.current || 1,
          size: params.size || 10
        }
      });
      return response;
    } catch (error) {
      return {
        current: params.current || 1,
        pages: 0,
        records: [],
        size: params.size || 10,
        total: 0
      };
    }
  }

  /** 上传通知附件 */
  async uploadNotificationAttachment(
    data: NotificationApi.UploadNotificationAttachmentRequest & { onProgress?: (progress: number) => void }
  ) {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post<ApiResponse<NotificationApi.NotificationAttachmentListItem>>(
      `${this.baseURL}/${data.notificationId}/attachments/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // 上传进度
            if (data.onProgress) {
              data.onProgress(percentCompleted);
            }
          }
        }
      }
    );
    return response;
  }

  /** 下载通知附件 */
  async downloadNotificationAttachment(notificationId: number, attachmentId: number) {
    const response = await apiClient.get(`${this.baseURL}/${notificationId}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });
    return response;
  }

  /** 删除通知附件 */
  async deleteNotificationAttachment(notificationId: number, attachmentId: number) {
    const response = await apiClient.delete<ApiResponse>(
      `${this.baseURL}/${notificationId}/attachments/${attachmentId}`
    );
    return response;
  }
}

export const notificationService = new NotificationService();
