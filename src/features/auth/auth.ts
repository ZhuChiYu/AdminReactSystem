import { useLoading } from '@sa/hooks';

import { getIsLogin, selectUserInfo } from '@/features/auth/authStore';
import { usePreviousRoute, useRouter } from '@/features/router';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { localStg } from '@/utils/storage';

import { useCacheTabs } from '../tab/tabHooks';

import { resetAuth as resetAuthAction, setToken, setUserInfo } from './authStore';
import { clearAuthStorage } from './shared';

export function useAuth() {
  const userInfo = useAppSelector(selectUserInfo);

  const isLogin = useAppSelector(getIsLogin);

  function hasAuth(codes: string | string[]) {
    if (!isLogin) {
      return false;
    }

    if (typeof codes === 'string') {
      return userInfo.buttons.includes(codes);
    }

    return codes.some(code => userInfo.buttons.includes(code));
  }

  return {
    hasAuth
  };
}

export function useInitAuth() {
  const { endLoading, loading, startLoading } = useLoading();

  const [searchParams] = useSearchParams();

  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  const { navigate } = useRouter();

  const redirectUrl = searchParams.get('redirect');

  async function toLogin({ password, userName }: { password: string; userName: string }, redirect = true) {
    if (loading) return;

    startLoading();

    try {
      const loginToken = await fetchLogin({ password, userName });

      localStg.set('token', loginToken.token);
      localStg.set('refreshToken', loginToken.refreshToken);

      try {
        const info = await fetchGetUserInfo();

        // 转换用户信息类型以匹配Redux store的期望
        const userInfo: Api.Auth.UserInfo = {
          avatar: info.avatar,
          buttons: info.buttons,
          contractStartDate: info.contractStartDate,
          department: info.department,
          email: info.email,
          gender: info.gender,
          nickName: info.nickName,
          phone: info.phone,
          position: info.position,
          roles: info.roles.map(role => (typeof role === 'string' ? role : role.roleCode)),
          userId: info.id?.toString() || '',
          userName: info.userName
        };

        // 2. store user info
        localStg.set('userInfo', userInfo);

        dispatch(setToken(loginToken.token));
        dispatch(setUserInfo(userInfo));

        if (redirect) {
          if (redirectUrl) {
            navigate(redirectUrl);
          } else {
            navigate('/');
          }
        }

        window.$notification?.success({
          description: t('page.login.common.welcomeBack', { userName: userInfo.userName }),
          message: t('page.login.common.loginSuccess')
        });
      } catch (userInfoError) {
        console.error('获取用户信息失败:', userInfoError);
        window.$notification?.error({
          description: '获取用户信息失败',
          message: t('page.login.common.loginFail')
        });
      }
    } catch (loginError) {
      console.error('登录失败:', loginError);
      window.$notification?.error({
        description: loginError instanceof Error ? loginError.message : '登录失败',
        message: t('page.login.common.loginFail')
      });
    }

    endLoading();
  }

  return {
    loading,
    toLogin
  };
}

export function useResetAuth() {
  const dispatch = useAppDispatch();

  const previousRoute = usePreviousRoute();

  const cacheTabs = useCacheTabs();

  const { navigate, push, resetRoutes } = useRouter();

  function resetAuth() {
    clearAuthStorage();

    dispatch(resetAuthAction());

    resetRoutes();

    cacheTabs();

    if (!previousRoute?.handle?.constant) {
      if (previousRoute?.fullPath) {
        push('/login', { redirect: previousRoute.fullPath }, null, true);
      } else {
        navigate('/login', { replace: true });
      }
    }
  }

  return resetAuth;
}
