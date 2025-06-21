import { apiClient } from './client';
import type { ApiResponse } from './types';

// 员工目标相关类型定义
export interface EmployeeTarget {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  targetYear: number;
  targetMonth: number;
  consultTarget: number;
  followUpTarget: number;
  developTarget: number;
  registerTarget: number;
  managerId: number;
  managerName: string;
  remark?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeTargetQueryParams {
  employeeId?: number;
  year?: number;
  month?: number;
  current?: number;
  size?: number;
}

export interface SetEmployeeTargetRequest {
  employeeId: number;
  targetYear: number;
  targetMonth: number;
  consultTarget?: number;
  followUpTarget?: number;
  developTarget?: number;
  registerTarget?: number;
  remark?: string;
}

export interface BatchSetTargetsRequest {
  targets: SetEmployeeTargetRequest[];
}

class EmployeeTargetService {
  private baseURL = '/employee-targets';

  /** 获取员工目标列表 */
  async getEmployeeTargets(params?: EmployeeTargetQueryParams): Promise<{
    records: EmployeeTarget[];
    total: number;
    current: number;
    size: number;
  }> {
    const response = await apiClient.get<{
      records: EmployeeTarget[];
      total: number;
      current: number;
      size: number;
    }>(`${this.baseURL}`, { params });
    return response;
  }

  /** 设置员工目标 */
  async setEmployeeTarget(data: SetEmployeeTargetRequest): Promise<EmployeeTarget> {
    const response = await apiClient.post<EmployeeTarget>(`${this.baseURL}`, data);
    return response;
  }

  /** 删除员工目标 */
  async deleteEmployeeTarget(id: number): Promise<void> {
    await apiClient.delete(`${this.baseURL}/${id}`);
  }

  /** 批量设置员工目标 */
  async batchSetEmployeeTargets(data: BatchSetTargetsRequest): Promise<any> {
    const response = await apiClient.post<any>(`${this.baseURL}/batch`, data);
    return response;
  }
}

export const employeeTargetService = new EmployeeTargetService();
export default employeeTargetService;
