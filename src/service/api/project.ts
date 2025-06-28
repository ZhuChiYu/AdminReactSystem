import { apiClient } from './client';
import type { PageResponse, TaskApi } from './types';

/** 项目管理相关API服务 */
export const projectService = {
  /** 推进项目到下一阶段 */
  async advanceStage(data: TaskApi.StageActionRequest): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post('/tasks/advance-stage', data);
      return response;
    } catch (error) {
      console.error('推进项目阶段失败:', error);
      throw error;
    }
  },

  /** 项目审批 */
  async approveProject(taskId: number, approved: boolean, comment?: string): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/approve`, { approved, comment });
      return response;
    } catch (error) {
      console.error('项目审批失败:', error);
      throw error;
    }
  },

  /** 归档项目到历史 */
  async archiveTask(taskId: number): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/archive`);
      return response;
    } catch (error) {
      console.error('归档项目失败:', error);
      throw error;
    }
  },

  /** 确认方案（客户同意方案） */
  async confirmProposal(data: { taskId: number; approved?: boolean; remark?: string }): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post('/tasks/confirm-proposal', {
        ...data,
        approved: data.approved !== false // 默认为true，除非明确传false
      });
      return response;
    } catch (error) {
      console.error('确认方案失败:', error);
      throw error;
    }
  },

  /** 确认合同签订 */
  async confirmContract(taskId: number, signed: boolean, comment?: string): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/confirm-contract`, { comment, signed });
      return response;
    } catch (error) {
      console.error('确认合同失败:', error);
      throw error;
    }
  },

  /** 确认收款 */
  async confirmPayment(taskId: number, received: boolean, amount?: number, comment?: string): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/confirm-payment`, {
        comment,
        received,
        amount
      });
      return response;
    } catch (error) {
      console.error('确认收款失败:', error);
      throw error;
    }
  },

  /** 确认项目完成 */
  async confirmProjectCompletion(taskId: number, completed: boolean, comment?: string): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/confirm-completion`, { comment, completed });
      return response;
    } catch (error) {
      console.error('确认项目完成失败:', error);
      throw error;
    }
  },

  /** 确定师资信息 */
  async confirmTeacher(data: TaskApi.ConfirmTeacherRequest): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post('/tasks/confirm-teacher', data);
      return response;
    } catch (error) {
      console.error('确定师资失败:', error);
      throw error;
    }
  },

  /** 创建项目事项 */
  async createTask(data: TaskApi.CreateTaskRequest): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post('/tasks', data);
      return response;
    } catch (error) {
      console.error('创建项目事项失败:', error);
      throw error;
    }
  },

  /** 删除项目事项 */
  async deleteTask(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error) {
      console.error('删除项目事项失败:', error);
      throw error;
    }
  },

  /** 导出项目数据 */
  async exportTasks(): Promise<void> {
    try {
      await apiClient.download('/tasks/export', 'project-tasks.xlsx');
    } catch (error) {
      console.error('导出项目数据失败:', error);
      throw error;
    }
  },

  /** 获取历史项目列表 */
  async getArchivedTaskList(params: {
    current?: number;
    size?: number;
    keyword?: string;
    projectType?: string;
    priority?: number;
    responsiblePersonId?: number;
    completionTimeStart?: string;
    completionTimeEnd?: string;
  }): Promise<PageResponse<TaskApi.TaskListItem>['data']> {
    try {
      const response = await apiClient.get('/tasks/archived', { params });
      return response;
    } catch (error) {
      console.error('获取历史项目列表失败:', error);
      throw error;
    }
  },

  /** 获取我的项目事项 */
  async getMyTasks(params?: {
    current?: number;
    currentStage?: TaskApi.ProjectStage;
    size?: number;
    keyword?: string;
    priority?: number;
    responsiblePersonId?: number;
  }): Promise<PageResponse<TaskApi.TaskListItem>['data']> {
    try {
      const response = await apiClient.get('/tasks/my', { params });
      return response;
    } catch (error) {
      console.error('获取我的项目事项失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  },

  /** 获取项目统计信息 */
  async getProjectStatistics(): Promise<{
    overview: {
      totalProjects: number;
      activeProjects: number;
      completedProjects: number;
      thisMonthCompleted: number;
      thisYearCompleted: number;
      completionRate: number;
    };
    projectTypeStats: Array<{
      type: string;
      count: number;
    }>;
    monthlyStats: Array<{
      month: string;
      completed: number;
    }>;
  }> {
    try {
      const response = await apiClient.get('/tasks/statistics');
      return response;
    } catch (error) {
      console.error('获取项目统计失败:', error);
      throw error;
    }
  },

  /** 获取项目事项详情 */
  async getTaskDetail(id: number): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return response;
    } catch (error) {
      console.error('获取项目事项详情失败:', error);
      throw error;
    }
  },

  /** 获取项目事项列表 */
  async getTaskList(params?: TaskApi.TaskQueryParams): Promise<PageResponse<TaskApi.TaskListItem>['data']> {
    try {
      const response = await apiClient.get('/tasks', { params });
      return response;
    } catch (error) {
      console.error('获取项目事项列表失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  },

  /** 更新项目事项 */
  async updateTask(id: number, data: TaskApi.UpdateTaskRequest): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.put(`/tasks/${id}`, data);
      return response;
    } catch (error) {
      console.error('更新项目事项失败:', error);
      throw error;
    }
  },

  /** 上传方案附件 */
  async uploadProposal(data: TaskApi.UploadProposalRequest): Promise<TaskApi.TaskListItem> {
    try {
      const response = await apiClient.post('/tasks/upload-proposal', data);
      return response;
    } catch (error) {
      console.error('上传方案失败:', error);
      throw error;
    }
  }
};
