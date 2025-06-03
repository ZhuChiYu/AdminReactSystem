import { apiClient } from './client';

class UserService {
  /** 更新用户资料 */
  async updateUserProfile(data: {
    avatar?: string;
    email?: string;
    phone?: string;
    userId: number;
    userName?: string;
  }) {
    try {
      const response = await apiClient.put(`/users/${data.userId}/profile`, data);
      return response;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
  }

  /** 修改密码 */
  async changePassword(data: { newPassword: string; oldPassword: string; userId: number }) {
    try {
      const response = await apiClient.put(`/users/${data.userId}/password`, {
        newPassword: data.newPassword,
        oldPassword: data.oldPassword
      });
      return response;
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
