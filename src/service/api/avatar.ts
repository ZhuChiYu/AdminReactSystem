import { apiClient } from './client';

export interface AvatarUploadResponse {
  url: string;
  filename: string;
  size: number;
}

export interface UserAvatarInfo {
  id: number;
  userId: number;
  avatarUrl: string;
  isCustom: boolean;
  uploadTime: string;
}

class AvatarService {
  /**
   * 上传用户头像
   */
  async uploadAvatar(file: File, userId?: number) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      if (userId) {
        formData.append('userId', userId.toString());
      }

      const response = await apiClient.post<AvatarUploadResponse>('/avatar/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('上传头像失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户头像信息
   */
  async getUserAvatar(userId: number) {
    try {
      const response = await apiClient.get<UserAvatarInfo>(`/avatar/user/${userId}`);
      return response;
    } catch (error) {
      console.error('获取用户头像失败:', error);
      // 返回默认头像信息
      return null;
    }
  }

  /**
   * 删除用户头像（恢复为默认头像）
   */
  async deleteUserAvatar(userId: number) {
    try {
      const response = await apiClient.delete(`/avatar/user/${userId}`);
      return response;
    } catch (error) {
      console.error('删除用户头像失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取用户头像
   */
  async getBatchUserAvatars(userIds: number[]) {
    try {
      const response = await apiClient.post<UserAvatarInfo[]>('/avatar/batch', {
        userIds
      });
      return response;
    } catch (error) {
      console.error('批量获取用户头像失败:', error);
      return [];
    }
  }

  /**
   * 获取默认头像URL
   */
  getDefaultAvatar(gender?: 'male' | 'female', size: number = 64) {
    // 使用本地默认头像资源
    if (gender === 'female') {
      return `/assets/avatars/default-female.png`;
    } else if (gender === 'male') {
      return `/assets/avatars/default-male.png`;
    }
    return `/assets/avatars/default-unknown.png`;
  }

  /**
   * 生成头像显示URL
   */
  getAvatarUrl(user: {
    id?: number;
    avatar?: string;
    gender?: 'male' | 'female' | '男' | '女';
  }) {
    // 如果有自定义头像，直接返回
    if (user.avatar && !user.avatar.includes('xsgames.co')) {
      return user.avatar;
    }

    // 转换性别格式
    let gender: 'male' | 'female' | undefined;
    if (user.gender === '男' || user.gender === 'male') {
      gender = 'male';
    } else if (user.gender === '女' || user.gender === 'female') {
      gender = 'female';
    }

    // 返回默认头像
    return this.getDefaultAvatar(gender);
  }
}

export const avatarService = new AvatarService(); 