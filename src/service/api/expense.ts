import { apiClient } from './client';
import type { ApiResponse, ExpenseApi, PageResponse } from './types';

/** 费用服务 */
class ExpenseService {
  private readonly baseURL = '/expense';

  /** 获取费用申请列表 */
  async getExpenseList(params: ExpenseApi.ExpenseQueryParams) {
    const response = await apiClient.get<PageResponse<ExpenseApi.ExpenseListItem>>(`${this.baseURL}/list`, {
      params
    });
    return response;
  }

  /** 创建费用申请 */
  async createExpense(data: ExpenseApi.CreateExpenseApplicationRequest) {
    const response = await apiClient.post<ExpenseApi.ExpenseListItem>(`${this.baseURL}/create`, data);
    return response;
  }

  /** 审批费用申请 */
  async approveExpense(id: number, data: ExpenseApi.ApproveExpenseRequest) {
    const response = await apiClient.put<ExpenseApi.ExpenseListItem>(
      `${this.baseURL}/${id}/approve`,
      data
    );
    return response;
  }

  /** 获取费用详情 */
  async getExpenseDetail(expenseId: number) {
    const response = await apiClient.get<ExpenseApi.ExpenseListItem>(`${this.baseURL}/${expenseId}`);
    return response;
  }

  /** 更新费用申请 */
  async updateExpense(expenseId: number, data: Partial<ExpenseApi.CreateExpenseRequest>) {
    const response = await apiClient.put<ExpenseApi.ExpenseListItem>(`${this.baseURL}/${expenseId}`, data);
    return response;
  }

  /** 删除费用申请 */
  async deleteExpense(expenseId: number) {
    const response = await apiClient.delete<void>(`${this.baseURL}/${expenseId}`);
    return response;
  }

  /** 批量审批费用申请 */
  async batchApproveExpense(expenseIds: number[], data: ExpenseApi.ApproveExpenseRequest) {
    const response = await apiClient.put<void>(`${this.baseURL}/batch-approve`, {
      expenseIds,
      ...data
    });
    return response;
  }

  /** 获取费用统计 */
  async getExpenseStatistics(params: { month?: number; status?: number; year?: number }) {
    const response = await apiClient.get<{
      approvedAmount: number;
      approvedCount: number;
      pendingAmount: number;
      pendingCount: number;
      rejectedAmount: number;
      rejectedCount: number;
      totalAmount: number;
      totalCount: number;
    }>(`${this.baseURL}/statistics`, {
      params
    });
    return response;
  }

  /** 上传费用申请附件 */
  async uploadExpenseAttachment(id: number, file: File, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post<any>(
      `${this.baseURL}/${id}/attachments/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  }

  /** 获取费用申请附件列表 */
  async getExpenseAttachments(id: number) {
    const response = await apiClient.get<any[]>(
      `${this.baseURL}/${id}/attachments`
    );
    return response;
  }

  /** 下载费用申请附件 */
  async downloadExpenseAttachment(id: number, fileName: string) {
    const response = await apiClient.get(
      `${this.baseURL}/${id}/attachments/${fileName}/download`,
      {
        responseType: 'blob'
      }
    );
    return response;
  }

  /** 删除费用申请附件 */
  async deleteExpenseAttachment(id: number, fileName: string) {
    const response = await apiClient.delete<void>(
      `${this.baseURL}/${id}/attachments/${fileName}`
    );
    return response;
  }
}

export const expenseService = new ExpenseService();
