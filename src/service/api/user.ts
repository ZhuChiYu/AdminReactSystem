import { apiClient } from './client';

class UserService {
  /**
   * 更新用户资料
   */
  async updateUserProfile(data: {
    userId: number;
    userName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) {
    try {
      const response = await apiClient.put(`/users/${data.userId}/profile`, data);
      return response;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(data: {
    userId: number;
    oldPassword: string;
    newPassword: string;
  }) {
    try {
      const response = await apiClient.put(`/users/${data.userId}/password`, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
      });
      return response;
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }
}

export const userService = new UserService(); 