import { apiClient } from './client';
import type { EmployeeApi, PageResponse } from './types';

/** 员工管理相关API服务 */
export class EmployeeService {
  /** 获取员工列表 */
  async getEmployeeList(
    params: EmployeeApi.EmployeeQueryParams
  ): Promise<PageResponse<EmployeeApi.EmployeeListItem>['data']> {
    try {
      // 调用真实的后端API
      const response = await apiClient.get('/users/employees', { params });
      return response;
    } catch (error) {
      console.error('获取员工列表失败:', error);

      // 如果API调用失败，返回空数据
      return {
        current: params.current || 1,
        pages: 0,
        records: [],
        size: params.size || 10,
        total: 0
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
      return response.filter(emp => emp.roles?.some(role => role.code === 'admin'));
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      return [];
    }
  }

  /** 获取普通员工列表 */
  async getRegularEmployeeList(): Promise<EmployeeApi.EmployeeListItem[]> {
    try {
      const response = await this.getAllEmployees();
      return response.filter(
        emp =>
          emp.roles?.some(role => role.code === 'employee') ||
          emp.roles?.some(role => role.code === 'consultant') ||
          emp.roles?.some(role => role.code === 'sales_manager') ||
          emp.roles?.some(role => role.code === 'hr_specialist')
      );
    } catch (error) {
      console.error('获取普通员工列表失败:', error);
      return [];
    }
  }

  /** 获取员工-管理员关系列表 */
  async getEmployeeManagerRelations(params?: { current?: number; size?: number }): Promise<{
    current: number;
    pages: number;
    records: EmployeeApi.EmployeeManagerRelation[];
    size: number;
    total: number;
  }> {
    try {
      const response = await apiClient.get('/users/employee-manager-relations', { params });
      return response;
    } catch (error) {
      console.error('获取员工-管理员关系列表失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 分配员工给管理员 */
  async assignEmployeesToManager(data: { employeeIds: number[]; managerId: number; remark?: string }): Promise<any> {
    try {
      const response = await apiClient.post('/users/employee-manager-relations', data);
      return response;
    } catch (error) {
      console.error('分配员工给管理员失败:', error);
      throw error;
    }
  }

  /** 取消员工管理关系 */
  async removeEmployeeManagerRelation(relationId: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/users/employee-manager-relations/${relationId}`);
      return response;
    } catch (error) {
      console.error('取消员工管理关系失败:', error);
      throw error;
    }
  }

  /** 导入员工数据 */
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

  /** 下载导入模板 */
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/users/template', {
      responseType: 'blob'
    });
    return response;
  }

  /** 删除员工 */
  async deleteEmployee(id: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      console.error('删除员工失败:', error);
      throw error;
    }
  }

  /** 批量删除员工 */
  async batchDeleteEmployees(userIds: number[]): Promise<{ deletedCount: number; skippedSuperAdmins: any[] }> {
    try {
      const response = await apiClient.post('/users/batch-delete', { userIds });
      return response;
    } catch (error) {
      console.error('批量删除员工失败:', error);
      throw error;
    }
  }

  /** 更新员工信息 */
  async updateEmployee(id: number, data: EmployeeApi.UpdateEmployeeRequest): Promise<EmployeeApi.EmployeeListItem> {
    try {
      const response = await apiClient.put(`/users/${id}/profile`, data);
      return response;
    } catch (error) {
      console.error('更新员工信息失败:', error);
      throw error;
    }
  }

  /** update employee permission role */
  updateEmployeePermissionRole(userId: number, roleCode: string) {
    return apiClient.put(`/system/users/${userId}/permission-role`, { roleCode });
  }
}

// 导出员工服务实例
export const employeeService = new EmployeeService();
