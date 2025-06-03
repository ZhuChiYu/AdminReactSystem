import { LoadingOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { App, Avatar, Upload } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import React, { useCallback, useEffect, useState } from 'react';

import { avatarService } from '@/service/api/avatar';

import DefaultAvatar from './DefaultAvatar';

interface UserAvatarProps {
  avatar?: string;
  className?: string;
  editable?: boolean;
  gender?: 'female' | 'male' | '女' | '男';
  onAvatarChange?: (avatarUrl: string) => void;
  onClick?: () => void;
  size?: number;
  userId?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  className,
  editable = false,
  gender,
  onAvatarChange,
  onClick,
  size = 64,
  userId
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [useDefault, setUseDefault] = useState(false);
  const { message } = App.useApp();

  const loadUserAvatar = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('调用avatarService.getUserAvatar, userId:', userId);
      const avatarInfo = await avatarService.getUserAvatar(userId);
      console.log('获取到的头像信息:', avatarInfo);

      if (avatarInfo?.avatarUrl && avatarInfo.avatarUrl.trim()) {
        let fullAvatarUrl = avatarInfo.avatarUrl;

        // 如果是相对路径，转换为完整的后端URL
        if (fullAvatarUrl.startsWith('/')) {
          const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
          const backendDomain = backendBaseUrl.replace('/api', '');
          fullAvatarUrl = backendDomain + fullAvatarUrl;
        }

        console.log('设置头像URL:', fullAvatarUrl);
        setAvatarUrl(fullAvatarUrl);
        setUseDefault(false);
      } else {
        // 使用默认头像
        console.log('头像信息为空，使用默认头像');
        setUseDefault(true);
      }
    } catch (error) {
      console.error('加载用户头像失败:', error);
      // 使用默认头像
      setUseDefault(true);
    }
  }, [userId]);

  useEffect(() => {
    console.log('UserAvatar useEffect 触发:', { avatar, gender, size, userId });

    // 如果传入了有效的头像URL，直接使用
    if (avatar && avatar.trim() && (avatar.startsWith('/uploads/') || avatar.startsWith('http'))) {
      console.log('使用传入的有效头像路径:', avatar);

      let fullAvatarUrl = avatar;
      // 如果是相对路径，转换为完整的后端URL
      if (fullAvatarUrl.startsWith('/')) {
        const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        const backendDomain = backendBaseUrl.replace('/api', '');
        fullAvatarUrl = backendDomain + fullAvatarUrl;
      }

      setAvatarUrl(fullAvatarUrl);
      setUseDefault(false);
      return;
    }

    // 优先从API获取最新的头像信息（只有在没有有效avatar参数时）
    if (userId && (!avatar || !avatar.trim() || (!avatar.startsWith('/uploads/') && !avatar.startsWith('http')))) {
      console.log('从API获取用户头像, userId:', userId);
      loadUserAvatar();
    } else if (avatar && avatar.trim() && !avatar.includes('xsgames.co') && !avatar.includes('randomusers')) {
      // 如果没有userId但有真实的自定义头像，则使用传入的avatar
      console.log('使用传入的头像:', avatar);

      let fullAvatarUrl = avatar;
      // 如果是相对路径，转换为完整的后端URL
      if (fullAvatarUrl.startsWith('/')) {
        const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        const backendDomain = backendBaseUrl.replace('/api', '');
        fullAvatarUrl = backendDomain + fullAvatarUrl;
      }

      setAvatarUrl(fullAvatarUrl);
      setUseDefault(false);
    } else {
      // 都没有，使用默认头像
      console.log('使用默认头像');
      setUseDefault(true);
    }
  }, [userId, avatar, gender, size, loadUserAvatar]);

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
      return false;
    }
    return true;
  };

  const handleChange: UploadProps['onChange'] = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setLoading(false);
      // 上传成功，获取新的头像URL
      if (info.file.response?.url && info.file.response.url.trim()) {
        const newAvatarUrl = info.file.response.url;
        setAvatarUrl(newAvatarUrl);
        setUseDefault(false);
        onAvatarChange?.(newAvatarUrl);
        message.success('头像上传成功!');
      }
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('头像上传失败!');
    }
  };

  const customRequest = async ({ file, onError, onSuccess }: any) => {
    try {
      const response = await avatarService.uploadAvatar(file as File, userId);
      onSuccess(response);
    } catch (error) {
      onError(error);
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传头像</div>
    </div>
  );

  // 转换性别格式
  let normalizedGender: 'male' | 'female' | undefined;
  if (gender === '男' || gender === 'male') {
    normalizedGender = 'male';
  } else if (gender === '女' || gender === 'female') {
    normalizedGender = 'female';
  }

  // 渲染可编辑的头像
  if (editable) {
    return (
      <Upload
        beforeUpload={beforeUpload}
        className={className}
        customRequest={customRequest}
        listType="picture-circle"
        name="avatar"
        showUploadList={false}
        onChange={handleChange}
      >
        {(() => {
          if (!useDefault && avatarUrl && avatarUrl.trim()) {
            return (
              <Avatar
                icon={<UserOutlined />}
                size={size}
                src={avatarUrl}
                style={{ objectFit: 'cover' }}
              />
            );
          }
          if (useDefault) {
            return (
              <DefaultAvatar
                gender={normalizedGender}
                size={size}
              />
            );
          }
          return uploadButton;
        })()}
      </Upload>
    );
  }

  // 渲染只读头像
  if (useDefault) {
    return (
      <DefaultAvatar
        className={className}
        gender={normalizedGender}
        size={size}
      />
    );
  }

  return (
    <Avatar
      className={className}
      icon={<UserOutlined />}
      size={size}
      src={avatarUrl && avatarUrl.trim() ? avatarUrl : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        objectFit: 'cover'
      }}
      onClick={onClick}
    />
  );
};

export default UserAvatar;
