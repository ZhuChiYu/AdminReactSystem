import { apiClient } from './client';
import type { ApiResponse, PageResponse } from './types';

// 班级相关类型定义
export namespace ClassApi {
  /** 班级查询参数 */
  export interface ClassQueryParams {
    current?: number;
    size?: number;
    name?: string;
    categoryId?: number;
    status?: number;
  }

  /** 班级列表项 */
  export interface ClassListItem {
    id: number;
    name: string;
    categoryId: number;
    categoryName: string;
    teacher: string;
    description?: string;
    startDate: string;
    endDate: string;
    status: number;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
  }

  /** 班级详情 */
  export interface ClassDetail extends ClassListItem {
    students: ClassStudent[];
  }

  /** 班级学员 */
  export interface ClassStudent {
    id: number;
    name: string;
    company: string;
    position?: string;
    phone?: string;
    email?: string;
    joinDate: string;
    attendanceRate: number;
    status: number;
    createdAt: string;
  }

  /** 创建班级参数 */
  export interface CreateClassParams {
    name: string;
    categoryId: number;
    categoryName: string;
    teacher: string;
    description?: string;
    startDate: string;
    endDate: string;
    students?: Omit<ClassStudent, 'id' | 'createdAt'>[];
  }

  /** 更新班级参数 */
  export interface UpdateClassParams {
    name?: string;
    categoryId?: number;
    categoryName?: string;
    teacher?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
}

class ClassService {
  /**
   * 获取班级列表
   */
  async getClassList(params: ClassApi.ClassQueryParams = {}): Promise<PageResponse<ClassApi.ClassListItem>> {
    const response = await apiClient.get<PageResponse<ClassApi.ClassListItem>>('/classes', {
      params: {
        current: 1,
        size: 10,
        ...params
      }
    });
    return response;
  }

  /**
   * 获取班级详情
   */
  async getClassDetail(id: number): Promise<ClassApi.ClassDetail> {
    const response = await apiClient.get<ClassApi.ClassDetail>(`/classes/${id}`);
    return response;
  }

  /**
   * 创建班级
   */
  async createClass(params: ClassApi.CreateClassParams): Promise<ClassApi.ClassDetail> {
    const response = await apiClient.post<ClassApi.ClassDetail>('/classes', params);
    return response;
  }

  /**
   * 更新班级
   */
  async updateClass(id: number, params: ClassApi.UpdateClassParams): Promise<ClassApi.ClassDetail> {
    const response = await apiClient.put<ClassApi.ClassDetail>(`/classes/${id}`, params);
    return response;
  }

  /**
   * 删除班级
   */
  async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  }
}

export const classService = new ClassService();
