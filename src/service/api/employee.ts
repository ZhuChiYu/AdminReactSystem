import { apiClient } from './client';
import type { EmployeeApi, PageResponse } from './types';

/** 员工管理相关API服务 */
export class EmployeeService {
  /** 获取员工列表 */
  async getEmployeeList(params: EmployeeApi.EmployeeQueryParams): Promise<PageResponse<EmployeeApi.EmployeeListItem>['data']> {
    try {
      // 调用真实的后端API
      const response = await apiClient.get('/users/employees', { params });
      return response;
    } catch (error) {
      console.error('获取员工列表失败:', error);

      // 如果API调用失败，返回空数据
      return {
        records: [],
        total: 0,
        current: params.current || 1,
        size: params.size || 10,
        pages: 0
      };
    }
  }

  /** 获取员工详情 */
  async getEmployeeDetail(id: number): Promise<EmployeeApi.EmployeeListItem> {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response;
    } catch (error) {
      console.error('获取员工详情失败:', error);
      throw error;
    }
  }

  /** 获取所有员工（不分页，用于下拉选择） */
  async getAllEmployees(): Promise<EmployeeApi.EmployeeListItem[]> {
    try {
      const response = await apiClient.get('/users/employees', {
        params: { current: 1, size: 1000 }
      });
      return response.records || [];
    } catch (error) {
      console.error('获取所有员工失败:', error);
      return [];
    }
  }

  /** 获取管理员列表 */
  async getAdminList(): Promise<EmployeeApi.EmployeeListItem[]> {
    try {
      const response = await this.getAllEmployees();
      return response.filter(emp => emp.roles?.includes('admin'));
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      return [];
    }
  }

  /** 获取普通员工列表 */
  async getRegularEmployeeList(): Promise<EmployeeApi.EmployeeListItem[]> {
    try {
      const response = await this.getAllEmployees();
      return response.filter(emp =>
        emp.roles?.includes('employee') ||
        emp.roles?.includes('consultant') ||
        emp.roles?.includes('sales_manager') ||
        emp.roles?.includes('hr_specialist')
      );
    } catch (error) {
      console.error('获取普通员工列表失败:', error);
      return [];
    }
  }

  /**
   * 导入员工数据
   */
  async importEmployees(file: File): Promise<EmployeeApi.ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  }

  /**
   * 下载导入模板
   */
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/users/template', {
      responseType: 'blob'
    });
    return response;
  }
}

// 导出员工服务实例
export const employeeService = new EmployeeService();
