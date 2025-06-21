import { apiClient } from './client';

// 任务统计相关类型定义
export interface TaskTargets {
  consultTarget: number;
  followUpTarget: number;
  developTarget: number;
  registerTarget: number;
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
}

export const taskStatsService = new TaskStatsService();
export default taskStatsService;
