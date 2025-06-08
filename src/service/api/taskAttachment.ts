import { apiClient } from './client';
import type { ApiResponse, PageResponse } from './types';

/** 项目事项附件相关类型 */
export namespace TaskAttachmentApi {
  export interface TaskAttachmentQueryParams {
    taskId?: number;
    current?: number;
    size?: number;
  }

  export interface TaskAttachmentListItem {
    id: number;
    taskId: number;
    fileName: string;
    originalName?: string;
    fileType: string;
    fileSize: number;
    description?: string;
    stage?: string;
    uploader?: {
      id: number;
      name: string;
    };
    uploadTime: string;
    downloadUrl: string;
  }

  export interface UploadTaskAttachmentRequest {
    taskId: number;
    description?: string;
    stage?: string;
    file: File;
    onProgress?: (progress: number) => void;
  }

  export interface TaskAttachmentStats {
    totalCount: number;
    totalSize: number;
    fileTypes: { type: string; count: number }[];
    stages: { stage: string; count: number }[];
  }
}

/** 项目事项附件服务 */
class TaskAttachmentService {
  private readonly baseURL = '/task-attachments';

  /** 获取项目事项附件列表 */
  async getTaskAttachmentList(params: TaskAttachmentApi.TaskAttachmentQueryParams) {
    const response = await apiClient.get<PageResponse<TaskAttachmentApi.TaskAttachmentListItem>>(
      `${this.baseURL}`,
      {
        params
      }
    );
    return response;
  }

  /** 上传项目事项附件 */
  async uploadTaskAttachment(data: TaskAttachmentApi.UploadTaskAttachmentRequest) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('taskId', data.taskId.toString());
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.stage) {
      formData.append('stage', data.stage);
    }

    const response = await apiClient.post<ApiResponse<TaskAttachmentApi.TaskAttachmentListItem>>(
      `${this.baseURL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
            if (data.onProgress) {
              data.onProgress(percentCompleted);
            }
          }
        }
      }
    );
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
      responseType: 'blob'
    });
    return response;
  }

  /** 获取项目事项的附件统计 */
  async getTaskAttachmentStats(taskId: number): Promise<TaskAttachmentApi.TaskAttachmentStats> {
    const response = await apiClient.get<ApiResponse<TaskAttachmentApi.TaskAttachmentStats>>(
      `${this.baseURL}/task/${taskId}/stats`
    );
    return response;
  }
}

export const taskAttachmentService = new TaskAttachmentService(); 