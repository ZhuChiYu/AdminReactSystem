import { apiClient, createMockResponse } from './client';
import type { UserApi } from './types';

/** 认证相关API服务 */
export class AuthService {
  /** 用户登录 */
  async login(params: UserApi.LoginRequest): Promise<UserApi.LoginResponse> {
    // 使用真实API调用
    return apiClient.post('/auth/login', params);
  }

  /** 用户登出 */
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  }

  /** 刷新Token */
  async refreshToken(refreshToken: string): Promise<{ refreshToken: string; token: string }> {
    return apiClient.post('/auth/refresh', { refreshToken });
  }

  /** 获取用户信息 */
  async getUserInfo(): Promise<UserApi.UserInfo> {
    return apiClient.get('/auth/me');
  }

  /** 获取路由菜单 */
  async getRoutes(): Promise<UserApi.MenuRoute[]> {
    return apiClient.get('/auth/routes');
  }

  /** 获取验证码 */
  async getCaptcha() {
    return apiClient.get<{ captchaId: string; captchaImage: string }>('/auth/captcha');
  }

  /** 获取登录记录（仅超级管理员） */
  async getLoginRecords(params: { current?: number; size?: number }) {
    return apiClient.get<{
      current: number;
      pages: number;
      records: Array<{
        id: number;
        userId: number;
        userName: string;
        nickName: string;
        avatar: string | null;
        loginIp: string;
        userAgent: string | null;
        loginTime: string;
        loginResult: string;
        location: string | null;
      }>;
      size: number;
      total: number;
    }>('/auth/login-records', { params });
  }
}

// 导出认证服务实例
export const authService = new AuthService();

// 为了兼容现有的导入，导出独立的函数
export const fetchRefreshToken = (refreshToken: string) => {
  return authService.refreshToken(refreshToken);
};

export const fetchLogin = (params: UserApi.LoginRequest) => {
  return authService.login(params);
};

export const fetchLogout = () => {
  return authService.logout();
};

export const fetchUserInfo = () => {
  return authService.getUserInfo();
};

export const fetchGetUserInfo = () => {
  return authService.getUserInfo();
};

export const fetchRoutes = () => {
  return authService.getRoutes();
};
