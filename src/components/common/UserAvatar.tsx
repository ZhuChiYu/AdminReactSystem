import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { useEffect } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  className?: string;
  gender?: string | null;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatar, className, gender, size = 40 }) => {
  const getDefaultAvatar = () => {
    if (gender === '女' || gender === 'female') {
      return '/avatars/female-default.svg';
    } else if (gender === '男' || gender === 'male') {
      return '/avatars/male-default.svg';
    }
    return null; // 使用Antd默认图标
  };

  // 处理头像URL，添加时间戳避免缓存问题
  const getAvatarSrc = () => {
    if (!avatar) {
      return getDefaultAvatar();
    }

    // 如果是上传的头像，添加时间戳避免缓存
    if (avatar.includes('/uploads/avatars/')) {
      const separator = avatar.includes('?') ? '&' : '?';
      return `${avatar}${separator}t=${Date.now()}`;
    }

    return avatar;
  };

  const avatarSrc = getAvatarSrc();

  useEffect(() => {
    console.log('UserAvatar渲染:', {
      avatar,
      avatarSrc,
      defaultAvatar: getDefaultAvatar(),
      gender,
      isDefault: !avatar
    });
  }, [avatar, gender, avatarSrc]);

  return (
    <Avatar
      className={className}
      icon={!avatarSrc && <UserOutlined />}
      size={size}
      src={avatarSrc}
      style={{
        backgroundColor: !avatarSrc ? '#87d068' : undefined
      }}
    />
  );
};

export default UserAvatar;
