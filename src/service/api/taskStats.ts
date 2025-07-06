import { apiClient } from './client';

// 任务统计相关类型定义
export interface TaskTargets {
  consultTarget: number;
  followUpTarget: number;
  developTarget: number;
  registerTarget: number;
}

// 员工任务统计信息
export interface EmployeeTaskStats {
  employee: {
    id: number;
    nickName: string;
    userName: string;
    roleName: string;
  };
  targets: {
    consultTarget: number;
    followUpTarget: number;
    developTarget: number;
    registerTarget: number;
  };
  completions: {
    consultCount: number;
    followUpCount: number;
    developCount: number;
    registerCount: number;
  };
  progress: {
    consultProgress: number;
    followUpProgress: number;
    developProgress: number;
    registerProgress: number;
  };
}

// 团队任务统计响应
export interface TeamTaskStatsResponse {
  teamStats: EmployeeTaskStats[];
  period: string;
  managedCount: number;
  pagination: {
    current: number;
    size: number;
    total: number;
    pages: number;
  };
}

export interface TaskCompletions {
  consultCount: number;
  followUpCount: number;
  developCount: number;
  registerCount: number;
}

export interface TaskProgress {
  consultProgress: number;
  followUpProgress: number;
  developProgress: number;
  registerProgress: number;
}

export interface UserTaskStats {
  targets: TaskTargets;
  completions: TaskCompletions;
  progress: TaskProgress;
}

class TaskStatsService {
  private baseURL = '/task-stats';

  /** 获取用户任务统计和目标 */
  async getUserTaskStats(year?: number, month?: number): Promise<UserTaskStats> {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;

    const response = await apiClient.get<UserTaskStats>(`${this.baseURL}/user-stats`, { params });
    return response;
  }

  /** 获取团队任务统计（管理员和超级管理员） */
  async getTeamTaskStats(
    year?: number,
    month?: number,
    current?: number,
    size?: number,
    keyword?: string
  ): Promise<TeamTaskStatsResponse> {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (current) params.current = current;
    if (size) params.size = size;
    if (keyword) params.keyword = keyword;

    const response = await apiClient.get<TeamTaskStatsResponse>('/tasks/team-stats', { params });
    return response;
  }
}

export const taskStatsService = new TaskStatsService();
export default taskStatsService;
