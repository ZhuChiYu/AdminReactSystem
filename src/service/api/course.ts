import { apiClient } from './client';
import type { CourseApi, PageResponse } from './types';

/** 课程管理相关API服务 */
export class CourseService {
  /** 获取课程列表 */
  async getCourseList(params?: CourseApi.CourseQueryParams): Promise<PageResponse<CourseApi.CourseListItem>['data']> {
    try {
      const response = await apiClient.get('/courses', { params });
      return response;
    } catch (error) {
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 获取课程详情 */
  async getCourseDetail(id: number): Promise<CourseApi.CourseListItem> {
    try {
      const response = await apiClient.get(`/courses/${id}`);
      return response;
      } catch (error) {
    throw error;
  }
  }

  /** 创建课程 */
  async createCourse(data: CourseApi.CreateCourseRequest): Promise<CourseApi.CourseListItem> {
    try {
      const response = await apiClient.post('/courses', data);
      return response;
      } catch (error) {
    throw error;
  }
  }

  /** 更新课程 */
  async updateCourse(id: number, data: Partial<CourseApi.CreateCourseRequest>): Promise<CourseApi.CourseListItem> {
    try {
      const response = await apiClient.put(`/courses/${id}`, data);
      return response;
      } catch (error) {
    throw error;
  }
  }

  /** 删除课程 */
  async deleteCourse(courseId: number) {
    try {
      const response = await apiClient.delete(`/courses/${courseId}`);
      return response;
      } catch (error) {
    throw error;
  }
  }

  /** 批量删除课程 */
  async batchDeleteCourses(courseIds: number[]) {
    try {
      const response = await apiClient.delete('/courses/batch', {
        data: { courseIds }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /** 获取课程分类列表 */
  async getCourseCategories(): Promise<CourseApi.CourseCategory[]> {
    try {
      const response = await apiClient.get('/courses/categories/list');
      return response;
    } catch (error) {
      return [];
    }
  }

  /** 获取课程统计数据 */
  async getCourseStatistics(): Promise<Record<string, number>> {
    try {
      const response = await apiClient.get('/courses/statistics/overview');
      return response;
    } catch (error) {
      return {
        archived: 0,
        draft: 0,
        published: 0,
        total: 0,
        totalRevenue: 0,
        totalStudents: 0
      };
    }
  }

  /** 批量操作课程 */
  async batchOperateCourses(courseIds: number[], operation: 'delete' | 'publish' | 'unpublish'): Promise<void> {
    try {
      await apiClient.post('/courses/batch-operate', { courseIds, operation });
    } catch (error) {
      throw error;
    }
  }

  /** 获取课程评价列表 */
  async getCourseReviews(courseId: number): Promise<CourseApi.CourseReview[]> {
    try {
      const response = await apiClient.get(`/courses/${courseId}/reviews`);
      return response;
    } catch (error) {
      return [];
    }
  }

  /** 添加课程评价 */
  async addCourseReview(data: { comment: string; courseId: number; rating: number }): Promise<CourseApi.CourseReview> {
    try {
      const response = await apiClient.post(`/courses/${data.courseId}/reviews`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /** 获取班级课程列表 */
  async getClassCourseList(params: { classId: number; current?: number; size?: number }) {
    try {
      const response = await apiClient.get('/courses/class', {
        params
      });
      return response;
    } catch (error) {
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 创建课程分类 */
  async createCategory(data: {
    description?: string;
    name: string;
    status?: number;
  }): Promise<CourseApi.CourseCategory> {
    try {
      const response = await apiClient.post('/courses/categories', data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /** 更新课程分类 */
  async updateCategory(
    id: number,
    data: { description?: string; name?: string; status?: number }
  ): Promise<CourseApi.CourseCategory> {
    try {
      const response = await apiClient.put(`/courses/categories/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /** 删除课程分类 */
  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`/courses/categories/${id}`);
    } catch (error) {
      throw error;
    }
  }
}

// 创建单例实例
export const courseService = new CourseService();
