import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { useEffect, useState } from 'react';

import { getServiceBaseURL } from '@/utils/service';

interface UserAvatarProps {
  avatar?: string | null;
  className?: string;
  gender?: string | null;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatar, className, gender, size = 40 }) => {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // 获取后端服务器基础URL
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  const getDefaultAvatar = () => {
    if (gender === '女' || gender === 'female') {
      return '/avatars/female-default.svg';
    } else if (gender === '男' || gender === 'male') {
      return '/avatars/male-default.svg';
    }
    return null; // 使用Antd默认图标
  };

  // 处理头像URL，添加时间戳避免缓存问题
  const processAvatarUrl = (avatarUrl?: string | null) => {
    if (!avatarUrl) {
      return getDefaultAvatar();
    }

    let processedUrl = avatarUrl;

    // 如果是相对路径，添加后端服务器的基础URL
    if (avatarUrl.startsWith('/uploads/')) {
      // 移除baseURL中的/api后缀（如果存在）
      const cleanBaseURL = baseURL.replace('/api', '');
      processedUrl = `${cleanBaseURL}${avatarUrl}`;
    }

    // 添加时间戳避免缓存
    const separator = processedUrl.includes('?') ? '&' : '?';
    return `${processedUrl}${separator}t=${Date.now()}`;
  };

  useEffect(() => {
    const newAvatarSrc = processAvatarUrl(avatar);
    setAvatarSrc(newAvatarSrc);
    setImageError(false);
  }, [avatar, gender, size, baseURL]);

  const handleImageError = () => {
    setImageError(true);
    setAvatarSrc(getDefaultAvatar());
    return false; // 阻止默认错误处理
  };

  const finalAvatarSrc = imageError ? getDefaultAvatar() : avatarSrc;

  return (
    <Avatar
      className={`${className || ''} flex items-center justify-center`}
      icon={!finalAvatarSrc && <UserOutlined />}
      size={size}
      src={finalAvatarSrc}
      style={{
        alignItems: 'center',
        backgroundColor: !finalAvatarSrc ? '#87d068' : undefined,
        display: 'flex',
        justifyContent: 'center',
        objectFit: 'cover',
        overflow: 'hidden'
      }}
      onError={handleImageError}
    />
  );
};

export default UserAvatar;
