import clsx from 'clsx';
import { useSelector } from 'react-redux';

import UserAvatar from '@/components/common/UserAvatar';
import { selectUserInfo } from '@/features/auth/authStore';

interface SoybeanAvatarProps extends React.ComponentProps<'div'> {
  size?: number;
}

const SoybeanAvatar = ({ className, size = 72, ...props }: SoybeanAvatarProps) => {
  const userInfo = useSelector(selectUserInfo);

  // 转换性别格式
  const convertGender = (gender: number | undefined): 'male' | 'female' | undefined => {
    if (gender === 1) return 'male';
    if (gender === 2) return 'female';
    return undefined;
  };

  return (
    <div
      {...props}
      className={clsx('overflow-hidden rd-1/2', className)}
      style={{ height: size, width: size }}
    >
      <UserAvatar
        avatar={userInfo.avatar}
        gender={convertGender(userInfo.gender)}
        size={size}
        userId={Number.parseInt(userInfo.userId, 10)}
      />
    </div>
  );
};

export default SoybeanAvatar;
