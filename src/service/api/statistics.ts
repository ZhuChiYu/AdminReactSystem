import { apiClient } from './client';
import type { ApiResponse } from './types';

/** 统计服务 */
class StatisticsService {
  private readonly baseURL = '/statistics';

  /** 获取线性图表数据 */
  async getLineChartData(params: {
    endDate?: string;
    period: 'day' | 'month' | 'week' | 'year';
    startDate?: string;
    type: 'meeting' | 'order' | 'revenue' | 'user';
  }) {
    const response = await apiClient.get<
      ApiResponse<{
        seriesData: number[];
        xAxisData: string[];
      }>
    >(`${this.baseURL}/line-chart`, {
      params
    });
    return response.data;
  }

  /** 获取饼图数据 */
  async getPieChartData(params: {
    period?: 'month' | 'quarter' | 'year';
    type: 'course_category' | 'expense_type' | 'order_status' | 'user_source';
  }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          name: string;
          value: number;
        }[]
      >
    >(`${this.baseURL}/pie-chart`, {
      params
    });
    return response.data;
  }

  /** 获取柱状图数据 */
  async getBarChartData(params: {
    period?: 'month' | 'quarter' | 'year';
    type: 'course_enrollment' | 'department_performance' | 'monthly_comparison';
  }) {
    const response = await apiClient.get<
      ApiResponse<{
        seriesData: {
          data: number[];
          name: string;
        }[];
        xAxisData: string[];
      }>
    >(`${this.baseURL}/bar-chart`, {
      params
    });
    return response.data;
  }

  /** 获取仪表盘概览数据 */
  async getDashboardOverview() {
    const response = await apiClient.get<
      ApiResponse<{
        meetingGrowth: number;
        orderGrowth: number;
        revenueGrowth: number;
        totalMeetings: number;
        totalOrders: number;
        totalRevenue: number;
        totalUsers: number;
        userGrowth: number;
      }>
    >(`${this.baseURL}/dashboard`);
    return response.data;
  }

  /** 获取今日统计数据 */
  async getTodayStatistics() {
    const response = await apiClient.get<
      ApiResponse<{
        todayMeetings: number;
        todayNewUsers: number;
        todayOrders: number;
        todayRevenue: number;
        yesterdayMeetings: number;
        yesterdayNewUsers: number;
        yesterdayOrders: number;
        yesterdayRevenue: number;
      }>
    >(`${this.baseURL}/today`);
    return response.data;
  }

  /** 获取月度统计数据 */
  async getMonthlyStatistics(params?: { month?: number; year?: number }) {
    const response = await apiClient.get<
      ApiResponse<{
        monthlyMeetings: number[];
        monthlyOrders: number[];
        monthlyRevenue: number[];
        monthlyUsers: number[];
        months: string[];
      }>
    >(`${this.baseURL}/monthly`, {
      params
    });
    return response.data;
  }

  /** 获取热力图数据 */
  async getHeatmapData(params: { endDate: string; startDate: string; type: 'meeting_room_usage' | 'user_activity' }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          date: string;
          hour: number;
          value: number;
        }[]
      >
    >(`${this.baseURL}/heatmap`, {
      params
    });
    return response.data;
  }

  /** 获取地图数据（按地区统计） */
  async getMapData(params: { level: 'city' | 'province'; type: 'revenue_distribution' | 'user_distribution' }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          coordinate?: [number, number];
          name: string;
          value: number;
        }[]
      >
    >(`${this.baseURL}/map`, {
      params
    });
    return response.data;
  }

  /** 获取实时数据 */
  async getRealTimeData() {
    const response = await apiClient.get<
      ApiResponse<{
        activeOrders: number;
        onlineUsers: number;
        systemLoad: number;
        timestamp: string;
        todayVisits: number;
      }>
    >(`${this.baseURL}/realtime`);
    return response.data;
  }

  /** 导出统计报表 */
  async exportReport(params: {
    format: 'pdf' | 'xlsx';
    month?: number;
    quarter?: number;
    type: 'monthly' | 'quarterly' | 'yearly';
    year: number;
  }) {
    const response = await apiClient.get(`${this.baseURL}/export`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  /** 获取部门绩效排名 */
  async getDepartmentRanking(params?: {
    metric: 'efficiency' | 'revenue' | 'satisfaction';
    period: 'month' | 'quarter' | 'year';
  }) {
    const response = await apiClient.get<
      ApiResponse<
        {
          change: number;
          departmentId: number;
          departmentName: string;
          rank: number;
          score: number;
        }[]
      >
    >(`${this.baseURL}/department-ranking`, {
      params
    });
    return response.data;
  }
}

export const statisticsService = new StatisticsService();
