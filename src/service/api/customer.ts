import { apiClient } from './client';
import type { CustomerApi, PageResponse } from './types';

/** 客户管理相关API服务 */
export class CustomerService {
  /** 获取客户列表 */
  async getCustomerList(
    params: CustomerApi.CustomerQueryParams
  ): Promise<PageResponse<CustomerApi.CustomerListItem>['data']> {
    try {
      // 调用真实的后端API
      const response = await apiClient.get('/customers', { params });
      return response;
    } catch (error) {
      console.error('获取客户列表失败:', error);

      // 如果API调用失败，返回空数据而不是模拟数据
      return {
        current: params.current || 1,
        pages: 0,
        records: [],
        size: params.size || 10,
        total: 0
      };
    }
  }

  /** 获取客户详情 */
  async getCustomerDetail(id: number): Promise<CustomerApi.CustomerListItem> {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response;
    } catch (error) {
      console.error('获取客户详情失败:', error);
      throw error;
    }
  }

  /** 创建客户 */
  async createCustomer(data: CustomerApi.CreateCustomerRequest): Promise<CustomerApi.CustomerListItem> {
    try {
      const response = await apiClient.post('/customers', data);
      return response;
    } catch (error) {
      console.error('创建客户失败:', error);
      throw error;
    }
  }

  /** 更新客户信息 */
  async updateCustomer(
    id: number,
    data: Partial<CustomerApi.CreateCustomerRequest>
  ): Promise<CustomerApi.CustomerListItem> {
    try {
      const response = await apiClient.put(`/customers/${id}`, data);
      return response;
    } catch (error) {
      console.error('更新客户失败:', error);
      throw error;
    }
  }

  /** 删除客户 */
  async deleteCustomer(id: number): Promise<void> {
    try {
      await apiClient.delete(`/customers/${id}`);
    } catch (error) {
      console.error('删除客户失败:', error);
      throw error;
    }
  }

  /** 获取客户跟进记录 */
  async getFollowRecords(customerId: number): Promise<CustomerApi.FollowRecord[]> {
    try {
      const response = await apiClient.get(`/customers/${customerId}/follow-records`);
      return response;
    } catch (error) {
      console.error('获取跟进记录失败:', error);
      throw error;
    }
  }

  /** 添加跟进记录 */
  async addFollowRecord(
    customerId: number,
    data: {
      followContent: string;
      followResult?: string;
      followType: string;
      nextFollowTime?: string;
    }
  ): Promise<CustomerApi.FollowRecord> {
    try {
      const response = await apiClient.post(`/customers/${customerId}/follow-records`, data);
      return response;
    } catch (error) {
      console.error('添加跟进记录失败:', error);
      throw error;
    }
  }

  /** 获取客户统计数据 */
  async getCustomerStatistics(params?: { scope?: 'all' | 'own' }): Promise<Record<string, number>> {
    try {
      // 直接调用统计API，传递参数
      const response = await apiClient.get('/customers/statistics', { params });
      return response;
    } catch (error) {
      console.error('获取客户统计失败:', error);

      // 如果统计API失败，尝试从客户列表计算统计
      try {
        const customerParams = { current: 1, size: 1000, ...(params || {}) };
        const customerData = await this.getCustomerList(customerParams);
        const statistics: Record<string, number> = {
          all: customerData.total,
          arrived: 0,
          consult: 0,
          early_25: 0,
          effective_visit: 0,
          new_develop: 0,
          not_arrived: 0,
          registered: 0,
          rejected: 0,
          vip: 0,
          wechat_added: 0
        };

        // 统计各状态的客户数量
        customerData.records.forEach(customer => {
          if (statistics[customer.followStatus] !== undefined) {
            statistics[customer.followStatus] += 1;
          }
        });

        return statistics;
      } catch (fallbackError) {
        console.error('Fallback统计计算失败:', fallbackError);

        // 返回默认统计数据
        return {
          all: 0,
          arrived: 0,
          consult: 0,
          early_25: 0,
          effective_visit: 0,
          new_develop: 0,
          not_arrived: 0,
          registered: 0,
          rejected: 0,
          vip: 0,
          wechat_added: 0
        };
      }
    }
  }

  /** 批量分配客户 */
  async batchAssignCustomers(customerIds: number[], employeeId: number, remark?: string): Promise<void> {
    try {
      await apiClient.post('/customers/batch-assign', { customerIds, employeeId, remark });
    } catch (error) {
      console.error('批量分配客户失败:', error);
      throw error;
    }
  }

  /** 获取客户分配列表 */
  async getCustomerAssignments(params?: { current?: number; size?: number }): Promise<{
    current: number;
    pages: number;
    records: any[];
    size: number;
    total: number;
  }> {
    try {
      const response = await apiClient.get('/customers/assignments', { params });
      return response;
    } catch (error) {
      console.error('获取客户分配列表失败:', error);
      return {
        current: params?.current || 1,
        pages: 0,
        records: [],
        size: params?.size || 10,
        total: 0
      };
    }
  }

  /** 分配客户给员工 */
  async assignCustomers(data: { assignedToId: number; customerIds: number[]; remark?: string }): Promise<any> {
    try {
      const response = await apiClient.post('/customers/assignments', data);
      return response;
    } catch (error) {
      console.error('分配客户给员工失败:', error);
      throw error;
    }
  }

  /** 导出客户数据 */
  async exportCustomers(params?: CustomerApi.CustomerQueryParams): Promise<void> {
    try {
      // 实现文件下载
      const response = await apiClient.get('/customers/export', {
        params,
        responseType: 'blob'
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出客户数据失败:', error);
      throw error;
    }
  }

  /** 导入客户Excel文件 */
  async importCustomers(formData: FormData): Promise<{
    errors?: string[];
    failureCount: number;
    hasMoreErrors?: boolean;
    successCount: number;
    totalCount: number;
  }> {
    try {
      const response = await apiClient.post('/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('导入客户数据失败:', error);
      throw error;
    }
  }

  /** 更新客户分配关系 */
  async updateCustomerAssignment(
    id: number,
    data: { assignedToId: number; customerId: number; remark?: string }
  ): Promise<any> {
    try {
      const response = await apiClient.put('/customers/assignments', {
        id,
        ...data
      });
      return response;
    } catch (error) {
      console.error('更新客户分配关系失败:', error);
      throw error;
    }
  }

  /** 删除客户分配关系 */
  async removeCustomerAssignment(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/customers/assignments/${id}`);
      return response;
    } catch (error) {
      console.error('删除客户分配关系失败:', error);
      throw error;
    }
  }
}

// 导出客户服务实例
export const customerService = new CustomerService();
