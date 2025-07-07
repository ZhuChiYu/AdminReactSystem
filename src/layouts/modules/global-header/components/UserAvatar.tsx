import type { MenuProps } from 'antd';
import { Button as AButton, Dropdown as ADropdown } from 'antd';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import SvgIcon from '@/components/SvgIcon';
import UserAvatarComponent from '@/components/common/UserAvatar';
import { selectToken, selectUserInfo, setUserInfo } from '@/features/auth/authStore';
import { useRouter } from '@/features/router';
import { useAppSelector } from '@/hooks/business/useStore';
import { getServiceBaseURL } from '@/utils/service';
import { localStg } from '@/utils/storage';

const UserAvatar = memo(() => {
  const token = useAppSelector(selectToken);
  const userInfo = useAppSelector(selectUserInfo);
  const dispatch = useDispatch();

  const { navigate } = useRouter();

  const { t } = useTranslation();

  // 获取后端服务器基础URL
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  // 刷新用户信息从localStorage
  useEffect(() => {
    const storedUserInfo = localStg.get('userInfo');
    if (storedUserInfo && (storedUserInfo.avatar !== userInfo.avatar || !userInfo.avatar)) {
      dispatch(setUserInfo(storedUserInfo));
    }
  }, [userInfo.avatar, dispatch]);

  function logout() {
    window?.$modal?.confirm({
      cancelText: t('common.cancel'),
      content: t('common.logoutConfirm'),
      okText: t('common.confirm'),
      onOk: () => {
        navigate('/login-out');
      },
      title: t('common.tip')
    });
  }

  function onClick({ key }: { key: string }) {
    if (key === '1') {
      logout();
    } else {
      navigate('/user-center');
    }
  }

  function loginOrRegister() {
    navigate('/login');
  }

  const items: MenuProps['items'] = [
    {
      key: '0',
      label: (
        <div className="flex-center gap-8px">
          <SvgIcon
            className="text-icon"
            icon="ph:user-circle"
          />
          {t('common.userCenter')}
        </div>
      )
    },
    {
      type: 'divider'
    },
    {
      key: '1',
      label: (
        <div className="flex-center gap-8px">
          <SvgIcon
            className="text-icon"
            icon="ph:sign-out"
          />
          {t('common.logout')}
        </div>
      )
    }
  ];

  const convertGender = (gender: number | undefined): 'male' | 'female' | undefined => {
    if (gender === 1) return 'male';
    if (gender === 2) return 'female';
    return undefined;
  };

  // 处理头像URL，确保包含基础URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return '';

    // 如果已经是完整URL，直接返回
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }

    // 如果是相对路径，添加后端服务器的基础URL
    if (avatar.startsWith('/uploads/')) {
      // 移除baseURL中的/api后缀（如果存在）
      const cleanBaseURL = baseURL.replace('/api', '');
      return `${cleanBaseURL}${avatar}`;
    }

    return avatar;
  };

  return token ? (
    <ADropdown
      menu={{ items, onClick }}
      placement="bottomRight"
      trigger={['click']}
    >
      <div className="h-full flex cursor-pointer items-center justify-center px-12px">
        <div className="flex items-center justify-center">
          <UserAvatarComponent
            avatar={getAvatarUrl(userInfo.avatar)}
            gender={convertGender(userInfo.gender)}
            key={`${userInfo.avatar}-${Date.now()}`}
            size={32}
          />
        </div>
        <span className="ml-8px text-16px font-medium">{userInfo.userName}</span>
      </div>
    </ADropdown>
  ) : (
    <AButton onClick={loginOrRegister}>登录</AButton>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
