import { apiClient } from './client';
import type { PageResponse, TaskApi } from './types';

/** 项目管理相关API服务 */
export class ProjectService {
  /** 获取任务列表 */
  async getTaskList(params?: TaskApi.TaskQueryParams): Promise<PageResponse<TaskApi.TaskListItem>['data']> {
    try {
      const response = await apiClient.get('/tasks', { params });
      return response;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 获取任务详情 */
  async getTaskDetail(id: number): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return response;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      throw error;
    }
  }

  /** 创建任务 */
  async createTask(data: TaskApi.CreateTaskRequest): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post('/tasks', data);
      return response;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  }

  /** 更新任务 */
  async updateTask(id: number, data: Partial<TaskApi.CreateTaskRequest>): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.put(`/tasks/${id}`, data);
      return response;
    } catch (error) {
      console.error('更新任务失败:', error);
      throw error;
    }
  }

  /** 删除任务 */
  async deleteTask(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  }

  /** 更新任务状态 */
  async updateTaskStatus(id: number, status: number): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.patch(`/tasks/${id}/status`, { status });
      return response;
    } catch (error) {
      console.error('更新任务状态失败:', error);
      throw error;
    }
  }

  /** 分配任务 */
  async assignTask(id: number, assigneeId: number): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.patch(`/tasks/${id}/assign`, { assigneeId });
      return response;
    } catch (error) {
      console.error('分配任务失败:', error);
      throw error;
    }
  }

  /** 获取任务统计 */
  async getTaskStatistics(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get('/tasks/statistics');
      return response;
    } catch (error) {
      console.error('获取任务统计失败:', error);
      return {
        completed: 0,
        inProgress: 0,
        overdue: 0,
        pending: 0,
        total: 0
      };
    }
  }

  /** 获取我的任务 */
  async getMyTasks(params?: {
    current?: number;
    size?: number;
    status?: number;
  }): Promise<PageResponse<TaskApi.TaskListItem>['data']> {
    try {
      const response = await apiClient.get('/tasks/my', { params });
      return response;
    } catch (error) {
      console.error('获取我的任务失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 导出任务数据 */
  async exportTasks(params?: TaskApi.TaskQueryParams): Promise<void> {
    try {
      await apiClient.download('/tasks/export', 'tasks.xlsx');
    } catch (error) {
      console.error('导出任务数据失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const projectService = new ProjectService();
