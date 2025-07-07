import { apiClient } from './client';
import type { ApiResponse, PageResponse } from './types';

/** 项目事项附件查询参数 */
export interface TaskAttachmentQueryParams {
  current?: number;
  size?: number;
  taskId?: number;
}

/** 项目事项附件列表项 */
export interface TaskAttachmentListItem {
  description?: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  id: number;
  originalName?: string;
  stage?: string;
  taskId: number;
  uploader?: {
    id: number;
    name: string;
  };
  uploadTime: string;
}

/** 上传项目事项附件请求 */
export interface UploadTaskAttachmentRequest {
  description?: string;
  file: File;
  onProgress?: (progress: number) => void;
  stage?: string;
  taskId: number;
}

/** 项目事项附件统计 */
export interface TaskAttachmentStats {
  fileTypes: { count: number; type: string }[];
  stages: { count: number; stage: string }[];
  totalCount: number;
  totalSize: number;
}

/** 项目事项附件服务 */
class TaskAttachmentService {
  private readonly baseURL = '/task-attachments';

  /** 获取项目事项附件列表 */
  async getTaskAttachmentList(params: TaskAttachmentQueryParams) {
    const response = await apiClient.get<PageResponse<TaskAttachmentListItem>>(`${this.baseURL}`, {
      params
    });
    return response;
  }

  /** 上传项目事项附件 */
  async uploadTaskAttachment(data: UploadTaskAttachmentRequest) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('taskId', data.taskId.toString());
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.stage) {
      formData.append('stage', data.stage);
    }

    const response = await apiClient.post<ApiResponse<TaskAttachmentListItem>>(`${this.baseURL}/upload`, formData, {
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
    });
    return response;
  }

  /** 删除项目事项附件 */
  async deleteTaskAttachment(attachmentId: number) {
    const response = await apiClient.delete<ApiResponse>(`${this.baseURL}/${attachmentId}`);
    return response;
  }

  /** 下载项目事项附件 */
  async downloadTaskAttachment(attachmentId: number) {
    const response = await apiClient.get(`${this.baseURL}/${attachmentId}/download`, {
      responseType: 'blob',
      timeout: 600000 // 设置下载超时时间为60秒
    });
    return response;
  }

  /** 获取项目事项的附件统计 */
  async getTaskAttachmentStats(taskId: number): Promise<ApiResponse<TaskAttachmentStats>> {
    const response = await apiClient.get<ApiResponse<TaskAttachmentStats>>(`${this.baseURL}/task/${taskId}/stats`);
    return response;
  }
}

export const taskAttachmentService = new TaskAttachmentService();
