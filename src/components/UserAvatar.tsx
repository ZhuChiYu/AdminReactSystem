import { Avatar, Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';

import { avatarService } from '@/service/api/avatar';
import DefaultAvatar from './DefaultAvatar';

interface UserAvatarProps {
  userId?: number;
  size?: number;
  editable?: boolean;
  className?: string;
  gender?: 'male' | 'female' | '男' | '女';
  avatar?: string;
  onClick?: () => void;
  onAvatarChange?: (avatarUrl: string) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  size = 64,
  editable = false,
  className,
  gender,
  avatar,
  onClick,
  onAvatarChange
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [useDefault, setUseDefault] = useState(false);

  useEffect(() => {
    if (avatar && avatar.trim() && !avatar.includes('xsgames.co') && !avatar.includes('randomusers')) {
      // 如果有真实的自定义头像
      setAvatarUrl(avatar);
      setUseDefault(false);
    } else if (userId) {
      // 如果没有avatar但有userId，从API获取
      loadUserAvatar();
    } else {
      // 都没有，使用默认头像
      setUseDefault(true);
    }
  }, [userId, avatar, gender, size]);

  const loadUserAvatar = async () => {
    if (!userId) return;
    
    try {
      const avatarInfo = await avatarService.getUserAvatar(userId);
      if (avatarInfo?.avatarUrl && avatarInfo.avatarUrl.trim()) {
        setAvatarUrl(avatarInfo.avatarUrl);
        setUseDefault(false);
      } else {
        // 使用默认头像
        setUseDefault(true);
      }
    } catch (error) {
      console.error('加载用户头像失败:', error);
      // 使用默认头像
      setUseDefault(true);
    }
  };

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
        setAvatarUrl(info.file.response.url);
        setUseDefault(false);
        onAvatarChange?.(info.file.response.url);
        message.success('头像上传成功!');
      }
    }
    if (info.file.status === 'error') {
      setLoading(false);
      message.error('头像上传失败!');
    }
  };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
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
  const normalizedGender = 
    gender === '男' || gender === 'male' ? 'male' :
    gender === '女' || gender === 'female' ? 'female' : undefined;

  if (editable) {
    return (
      <Upload
        name="avatar"
        listType="picture-circle"
        className={className}
        showUploadList={false}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        customRequest={customRequest}
      >
        {avatarUrl && avatarUrl.trim() && !useDefault ? (
          <Avatar 
            size={size} 
            src={avatarUrl}
            icon={<UserOutlined />}
          />
        ) : useDefault ? (
          <DefaultAvatar 
            gender={normalizedGender} 
            size={size}
          />
        ) : (
          uploadButton
        )}
      </Upload>
    );
  }

  if (useDefault) {
    return (
      <DefaultAvatar 
        gender={normalizedGender} 
        size={size}
        className={className}
      />
    );
  }

  return (
    <Avatar
      size={size}
      src={avatarUrl && avatarUrl.trim() ? avatarUrl : undefined}
      icon={<UserOutlined />}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
};

export default UserAvatar; 