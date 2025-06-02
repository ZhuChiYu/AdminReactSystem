import { apiClient } from './client';
import type { ApiResponse } from './types';

/**
 * 统计服务
 */
class StatisticsService {
  private readonly baseURL = '/statistics';

  /**
   * 获取线性图表数据
   */
  async getLineChartData(params: {
    period: 'day' | 'week' | 'month' | 'year';
    type: 'revenue' | 'order' | 'user' | 'meeting';
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get<ApiResponse<{
      xAxisData: string[];
      seriesData: number[];
    }>>(`${this.baseURL}/line-chart`, {
      params
    });
    return response.data;
  }

  /**
   * 获取饼图数据
   */
  async getPieChartData(params: {
    type: 'user_source' | 'order_status' | 'course_category' | 'expense_type';
    period?: 'month' | 'quarter' | 'year';
  }) {
    const response = await apiClient.get<ApiResponse<{
      name: string;
      value: number;
    }[]>>(`${this.baseURL}/pie-chart`, {
      params
    });
    return response.data;
  }

  /**
   * 获取柱状图数据
   */
  async getBarChartData(params: {
    type: 'department_performance' | 'monthly_comparison' | 'course_enrollment';
    period?: 'month' | 'quarter' | 'year';
  }) {
    const response = await apiClient.get<ApiResponse<{
      xAxisData: string[];
      seriesData: {
        name: string;
        data: number[];
      }[];
    }>>(`${this.baseURL}/bar-chart`, {
      params
    });
    return response.data;
  }

  /**
   * 获取仪表盘概览数据
   */
  async getDashboardOverview() {
    const response = await apiClient.get<ApiResponse<{
      totalRevenue: number;
      totalOrders: number;
      totalUsers: number;
      totalMeetings: number;
      revenueGrowth: number;
      orderGrowth: number;
      userGrowth: number;
      meetingGrowth: number;
    }>>(`${this.baseURL}/dashboard`);
    return response.data;
  }

  /**
   * 获取今日统计数据
   */
  async getTodayStatistics() {
    const response = await apiClient.get<ApiResponse<{
      todayRevenue: number;
      todayOrders: number;
      todayNewUsers: number;
      todayMeetings: number;
      yesterdayRevenue: number;
      yesterdayOrders: number;
      yesterdayNewUsers: number;
      yesterdayMeetings: number;
    }>>(`${this.baseURL}/today`);
    return response.data;
  }

  /**
   * 获取月度统计数据
   */
  async getMonthlyStatistics(params?: {
    year?: number;
    month?: number;
  }) {
    const response = await apiClient.get<ApiResponse<{
      monthlyRevenue: number[];
      monthlyOrders: number[];
      monthlyUsers: number[];
      monthlyMeetings: number[];
      months: string[];
    }>>(`${this.baseURL}/monthly`, {
      params
    });
    return response.data;
  }

  /**
   * 获取热力图数据
   */
  async getHeatmapData(params: {
    type: 'user_activity' | 'meeting_room_usage';
    startDate: string;
    endDate: string;
  }) {
    const response = await apiClient.get<ApiResponse<{
      date: string;
      hour: number;
      value: number;
    }[]>>(`${this.baseURL}/heatmap`, {
      params
    });
    return response.data;
  }

  /**
   * 获取地图数据（按地区统计）
   */
  async getMapData(params: {
    type: 'user_distribution' | 'revenue_distribution';
    level: 'province' | 'city';
  }) {
    const response = await apiClient.get<ApiResponse<{
      name: string;
      value: number;
      coordinate?: [number, number];
    }[]>>(`${this.baseURL}/map`, {
      params
    });
    return response.data;
  }

  /**
   * 获取实时数据
   */
  async getRealTimeData() {
    const response = await apiClient.get<ApiResponse<{
      onlineUsers: number;
      todayVisits: number;
      activeOrders: number;
      systemLoad: number;
      timestamp: string;
    }>>(`${this.baseURL}/realtime`);
    return response.data;
  }

  /**
   * 导出统计报表
   */
  async exportReport(params: {
    type: 'monthly' | 'quarterly' | 'yearly';
    year: number;
    month?: number;
    quarter?: number;
    format: 'xlsx' | 'pdf';
  }) {
    const response = await apiClient.get(`${this.baseURL}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * 获取部门绩效排名
   */
  async getDepartmentRanking(params?: {
    period: 'month' | 'quarter' | 'year';
    metric: 'revenue' | 'efficiency' | 'satisfaction';
  }) {
    const response = await apiClient.get<ApiResponse<{
      departmentId: number;
      departmentName: string;
      score: number;
      rank: number;
      change: number;
    }[]>>(`${this.baseURL}/department-ranking`, {
      params
    });
    return response.data;
  }
}

export const statisticsService = new StatisticsService(); 