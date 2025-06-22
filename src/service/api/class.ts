import { apiClient } from './client';

// 班级相关类型定义

/** 班级查询参数 */
export interface ClassQueryParams {
  categoryId?: number;
  current?: number;
  name?: string;
  size?: number;
  status?: number;
}

/** 班级列表项 */
export interface ClassListItem {
  categoryId: number;
  categoryName: string;
  courseId?: number;
  courseName?: string;
  coursePrice?: number;
  createdAt: string;
  description?: string;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
  status: number;
  studentCount: number;
  trainingFee?: string;
  updatedAt: string;
}

/** 班级详情 */
export interface ClassDetail extends ClassListItem {
  students: ClassStudent[];
}

/** 班级学员 */
export interface ClassStudent {
  attendanceRate: number;
  company: string;
  createdAt: string;
  createdBy?: {
    id: number;
    nickName: string;
    userName: string;
  } | null;
  email?: string;
  id: number;
  joinDate: string;
  name: string;
  phone?: string;
  position?: string;
  status: number;
}

/** 创建班级参数 */
export interface CreateClassParams {
  categoryId: number;
  courseId?: number;
  description?: string;
  endDate: string;
  name: string;
  startDate: string;
}

/** 更新班级参数 */
export interface UpdateClassParams {
  categoryId?: number;
  courseId?: number;
  description?: string;
  endDate?: string;
  name?: string;
  startDate?: string;
}

/** 班级分类 */
export interface ClassCategory {
  code: string;
  createdAt: string;
  description?: string;
  id: number;
  name: string;
  sort: number;
  status: number;
  updatedAt: string;
}

/** 创建班级分类参数 */
export interface CreateCategoryRequest {
  code: string;
  description?: string;
  name: string;
  sort?: number;
  status?: number;
}

/** 更新班级分类参数 */
export interface UpdateCategoryRequest {
  code?: string;
  description?: string;
  name?: string;
  sort?: number;
  status?: number;
}

// 班级服务 - 使用静态方法
export const classService = {
  /** 创建班级分类 */
  async createCategory(data: CreateCategoryRequest): Promise<ClassCategory> {
    const response = await apiClient.post('/classes/categories', data);
    return response;
  },

  /** 创建班级 */
  async createClass(params: CreateClassParams): Promise<ClassDetail> {
    const response = await apiClient.post<ClassDetail>('/classes', params);
    return response;
  },

  /** 添加学员 */
  async createStudent(data: any): Promise<any> {
    const response = await apiClient.post('/classes/students', data);
    return response;
  },

  /** 删除班级分类 */
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/classes/categories/${id}`);
  },

  /** 删除班级 */
  async deleteClass(id: number): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  },

  /** 删除学员 */
  async deleteStudent(studentId: number): Promise<any> {
    const response = await apiClient.delete(`/classes/students/${studentId}`);
    return response;
  },

  /** 批量删除学员 */
  async deleteStudentsBatch(studentIds: number[]): Promise<any> {
    const response = await apiClient.delete('/classes/students/batch', {
      data: { studentIds }
    });
    return response;
  },

  /** 下载学员导入模板 */
  async downloadStudentTemplate(): Promise<Blob> {
    const response = await apiClient.get('/classes/students/template', {
      responseType: 'blob'
    });
    return response;
  },

  /** 获取班级分类列表 */
  async getClassCategories(): Promise<ClassCategory[]> {
    try {
      const response = await apiClient.get('/classes/categories/list');
      return response;
    } catch {
      return [];
    }
  },

  /** 获取班级详情 */
  async getClassDetail(classId: number) {
    const response = await apiClient.get(`/classes/${classId}`);
    return response;
  },

  /** 获取班级列表 */
  async getClassList(params: ClassQueryParams = {}) {
    const response = await apiClient.get('/classes', {
      params: {
        current: 1,
        size: 10,
        ...params
      }
    });
    return response;
  },

  /** 获取班级教职工列表 */
  async getClassStaffList(params: { classId: number }) {
    try {
      const response = await apiClient.get('/classes/staff', {
        params
      });
      return response;
    } catch {
      return [];
    }
  },

  /** 获取班级学生列表 */
  async getClassStudentList(params: { classId: number; current?: number; size?: number }) {
    try {
      const response = await apiClient.get('/classes/students', {
        params
      });
      return response;
    } catch {
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  },

  /** 获取课程列表（用于班级关联） */
  async getCourseList(): Promise<any[]> {
    try {
      const response = await apiClient.get('/courses', {
        params: {
          current: 1,
          size: 1000, // 获取所有课程
          status: 1 // 只获取已发布的课程
        }
      });
      return response?.records || [];
    } catch (error) {
      return [];
    }
  },

  /** 批量导入学员 */
  async importStudentsBatch(classId: number, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId.toString());

      const response = await apiClient.post('/classes/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** 更新班级分类 */
  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<ClassCategory> {
    try {
      const response = await apiClient.put(`/classes/categories/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** 更新班级 */
  async updateClass(id: number, params: UpdateClassParams): Promise<ClassDetail> {
    const response = await apiClient.put<ClassDetail>(`/classes/${id}`, params);
    return response;
  },

  /** 更新学员信息 */
  async updateStudent(studentId: number, data: any): Promise<any> {
    try {
      const response = await apiClient.put(`/classes/students/${studentId}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** 上传学员头像 */
  async uploadStudentAvatar(studentId: number, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post(`/classes/students/${studentId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};
