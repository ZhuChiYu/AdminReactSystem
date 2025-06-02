import { apiClient } from './client';
import type { ApiResponse, PageResponse, AttachmentApi } from './types';

/**
 * 附件服务
 */
class AttachmentService {
  private readonly baseURL = '/attachments';

  /**
   * 获取附件列表
   */
  async getAttachmentList(params: AttachmentApi.AttachmentQueryParams) {
    const response = await apiClient.get<PageResponse<AttachmentApi.AttachmentListItem>>(`${this.baseURL}`, {
      params
    });
    return response;
  }

  /**
   * 上传附件
   */
  async uploadAttachment(data: AttachmentApi.UploadAttachmentRequest & { onProgress?: (progress: number) => void }) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('courseId', data.courseId.toString());
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiClient.post<ApiResponse<AttachmentApi.AttachmentListItem>>(`${this.baseURL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
          if (data.onProgress) {
            data.onProgress(percentCompleted);
          }
        }
      }
    });
    return response;
  }

  /**
   * 删除附件
   */
  async deleteAttachment(attachmentId: number) {
    const response = await apiClient.delete<ApiResponse>(`${this.baseURL}/${attachmentId}`);
    return response;
  }

  /**
   * 获取附件详情
   */
  async getAttachmentDetail(attachmentId: number) {
    const response = await apiClient.get<ApiResponse<AttachmentApi.AttachmentListItem>>(`${this.baseURL}/${attachmentId}`);
    return response;
  }

  /**
   * 下载附件
   */
  async downloadAttachment(attachmentId: number) {
    const response = await apiClient.get(`${this.baseURL}/${attachmentId}/download`, {
      responseType: 'blob'
    });
    return response;
  }

  /**
   * 批量删除附件
   */
  async batchDeleteAttachments(attachmentIds: number[]) {
    const response = await apiClient.delete<ApiResponse>(`${this.baseURL}/batch`, {
      data: { attachmentIds }
    });
    return response;
  }

  /**
   * 更新附件信息
   */
  async updateAttachment(attachmentId: number, data: { fileName?: string; description?: string }) {
    const response = await apiClient.put<ApiResponse<AttachmentApi.AttachmentListItem>>(`${this.baseURL}/${attachmentId}`, data);
    return response;
  }

  /**
   * 获取课程的附件统计
   */
  async getCourseAttachmentStats(courseId: number) {
    const response = await apiClient.get<ApiResponse<{
      totalCount: number;
      totalSize: number;
      fileTypes: { type: string; count: number }[];
    }>>(`${this.baseURL}/course/${courseId}/stats`);
    return response;
  }
}

export const attachmentService = new AttachmentService(); 