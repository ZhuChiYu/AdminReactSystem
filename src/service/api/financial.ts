import { apiClient } from './client';
import type { ApiResponse, PageResponse } from './types';

// 提取后的分页数据类型（响应拦截器会自动提取 data 字段）
export interface ExtractedPageData<T> {
  current: number;
  pages: number;
  records: T[];
  size: number;
  total: number;
}

export interface FinancialRecord {
  amount: number;
  attachments?: any[]; // 1: 收入, 2: 支出
  category: string;
  createdAt: string;
  createdBy?: {
    id: number;
    nickName: string;
    userName: string;
  };
  createdById: number;
  description: string;
  id: number;
  recordDate: string;
  relatedId?: number;
  relatedType?: string;
  status: number;
  type: number;
  updatedAt: string;
}

export interface CreateFinancialRecordRequest {
  amount: number;
  attachments?: any[];
  // 1: 收入, 2: 支出
  category: string;
  description: string;
  recordDate: string;
  relatedId?: number;
  relatedType?: string;
  type: number;
}

export interface UpdateFinancialRecordRequest {
  amount?: number;
  attachments?: any[];
  category?: string;
  description?: string;
  recordDate?: string;
  relatedId?: number;
  relatedType?: string;
  type?: number;
}

export interface FinancialQueryParams {
  category?: string;
  createdById?: number;
  current?: number;
  endDate?: string;
  size?: number;
  startDate?: string;
  type?: number;
}

export interface FinancialStatistics {
  categoryStats: {
    amount: number;
    category: string;
    count: number;
  }[];
  expenseTypeDistribution: {
    amount: number;
    category: string;
    percentage: number;
  }[];
  monthlyExpense: number;
  monthlyIncome: number;
  monthlyTrend: {
    expense: number;
    income: number;
    month: string;
    profit: number;
  }[];
  totalExpense: number;
  totalIncome: number;
}

/** 财务记录服务 */
class FinancialService {
  private readonly baseURL = '/financial';

  /** 获取财务记录列表 */
  async getFinancialRecords(params: FinancialQueryParams): Promise<ExtractedPageData<FinancialRecord>> {
    const response = await apiClient.get<PageResponse<FinancialRecord>>(`${this.baseURL}/list`, {
      params
    });
    return response as any; // 响应拦截器会自动提取data字段
  }

  /** 创建财务记录 */
  async createFinancialRecord(data: CreateFinancialRecordRequest) {
    const response = await apiClient.post<ApiResponse<FinancialRecord>>(`${this.baseURL}/create`, data);
    return response;
  }

  /** 更新财务记录 */
  async updateFinancialRecord(id: number, data: UpdateFinancialRecordRequest) {
    const response = await apiClient.put<ApiResponse<FinancialRecord>>(`${this.baseURL}/${id}`, data);
    return response;
  }

  /** 删除财务记录 */
  async deleteFinancialRecord(id: number) {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseURL}/${id}`);
    return response;
  }

  /** 获取财务记录详情 */
  async getFinancialRecordDetail(id: number) {
    const response = await apiClient.get<ApiResponse<FinancialRecord>>(`${this.baseURL}/${id}`);
    return response;
  }

  /** 获取财务统计数据 */
  async getFinancialStatistics(params?: { month?: number; year?: number }) {
    const response = await apiClient.get<ApiResponse<FinancialStatistics>>(`${this.baseURL}/statistics`, {
      params
    });
    return response;
  }

  /** 获取支出类型分布 */
  async getExpenseTypeDistribution(params?: { month?: number; year?: number }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          amount: number;
          category: string;
          color: string;
          percentage: number;
        }[]
      >
    >(`${this.baseURL}/expense-distribution`, {
      params
    });
    return response;
  }

  /** 获取收入类型分布 */
  async getIncomeTypeDistribution(params?: { month?: number; year?: number }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          amount: number;
          category: string;
          color: string;
          percentage: number;
        }[]
      >
    >(`${this.baseURL}/income-distribution`, {
      params
    });
    return response;
  }

  /** 获取月度趋势数据 */
  async getMonthlyTrend(params?: { year?: number }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          expense: number;
          income: number;
          month: string;
          profit: number;
          [key: string]: any; // 支持各类型支出
        }[]
      >
    >(`${this.baseURL}/monthly-trend`, {
      params
    });
    return response;
  }

  /** 批量删除财务记录 */
  async batchDeleteFinancialRecords(ids: number[]) {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseURL}/batch-delete`, {
      data: { ids }
    });
    return response;
  }
}

export const financialService = new FinancialService();
