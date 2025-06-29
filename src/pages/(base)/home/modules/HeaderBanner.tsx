import { TeamOutlined } from '@ant-design/icons';
import { Button as AButton, Card as ACard } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import UserAvatar from '@/components/common/UserAvatar';
import { selectUserInfo, setUserInfo } from '@/features/auth/authStore';
import { useAppSelector } from '@/hooks/business/useStore';
import { authService } from '@/service/api';
import { isAdminOrSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';
import 'dayjs/locale/zh-cn';

dayjs.extend(duration);
dayjs.locale('zh-cn');

const HeaderBanner = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 用户注册时间，模拟数据
  const [joinTime, setJoinTime] = useState<string>('');

  // 检查是否为管理员或超级管理员
  const showTeamManagement = isAdminOrSuperAdmin();

  // 刷新用户信息
  const refreshUserInfo = async () => {
    try {
      console.log('🔄 刷新用户信息...');
      const latestUserInfo = await authService.getUserInfo();
      console.log('🔍 获取到的最新用户信息:', latestUserInfo);

      // 转换并更新用户信息
      const updatedUserInfo: Api.Auth.UserInfo = {
        avatar: (latestUserInfo as any).avatar || userInfo.avatar,
        buttons: (latestUserInfo as any).buttons || userInfo.buttons,
        contractStartDate: (latestUserInfo as any).contractStartDate,
        department: (latestUserInfo as any).department || userInfo.department,
        email: (latestUserInfo as any).email || userInfo.email,
        gender: (latestUserInfo as any).gender || userInfo.gender,
        nickName: (latestUserInfo as any).nickName || userInfo.nickName,
        phone: (latestUserInfo as any).phone || userInfo.phone,
        position: (latestUserInfo as any).position || userInfo.position,
        roles:
          (latestUserInfo as any).roles?.map((role: any) => (typeof role === 'string' ? role : role.roleCode)) ||
          userInfo.roles,
        userId: (latestUserInfo as any).userId || userInfo.userId,
        userName: (latestUserInfo as any).userName || userInfo.userName
      };

      console.log('🔍 转换后的用户信息:', updatedUserInfo);

      // 更新Redux store和localStorage
      dispatch(setUserInfo(updatedUserInfo));
      localStg.set('userInfo', updatedUserInfo);
    } catch (error) {
      console.error('❌ 刷新用户信息失败:', error);
    }
  };

  // 计算工作时长的函数
  const calculateJoinTime = (contractStartDate?: string) => {
    console.log('🔍 计算工作时长，合同开始时间:', contractStartDate);

    if (contractStartDate) {
      // 如果有合同开始时间，就使用它来计算工作时长
      const joinDate = dayjs(contractStartDate);
      const now = dayjs();

      console.log('🔍 合同开始日期:', joinDate.format('YYYY-MM-DD'));
      console.log('🔍 当前日期:', now.format('YYYY-MM-DD'));

      // 检查是否是未来日期
      if (joinDate.isAfter(now)) {
        console.log('⚠️ 合同开始时间是未来日期，显示为即将入职');
        setJoinTime('即将入职');
        return;
      }

      const years = now.diff(joinDate, 'year');
      const months = now.subtract(years, 'year').diff(joinDate, 'month');
      const days = now.subtract(years, 'year').subtract(months, 'month').diff(joinDate, 'day');

      console.log('🔍 计算结果:', { days, months, years });

      let timeString = '';
      if (years > 0) {
        timeString += `${years}年`;
      }
      if (months > 0 || years > 0) {
        timeString += `${months}个月`;
      }
      timeString += `${days}天`;

      console.log('🔍 最终显示时间:', timeString);
      setJoinTime(timeString);
    } else {
      console.log('⚠️ 没有合同开始时间，使用模拟数据');
      // 如果没有合同开始时间，使用模拟数据
      const randomDays = Math.floor(Math.random() * 365) + 1;
      const joinDate = dayjs().subtract(randomDays, 'day');

      const now = dayjs();
      const years = now.diff(joinDate, 'year');
      const months = now.subtract(years, 'year').diff(joinDate, 'month');
      const days = now.subtract(years, 'year').subtract(months, 'month').diff(joinDate, 'day');

      let timeString = '';
      if (years > 0) {
        timeString += `${years}年`;
      }
      if (months > 0 || years > 0) {
        timeString += `${months}个月`;
      }
      timeString += `${days}天`;

      setJoinTime(timeString);
    }
  };

  useEffect(() => {
    // 组件初始化时，先刷新用户信息，然后计算工作时长
    const initializeData = async () => {
      console.log('🔍 初始化首页数据...');
      console.log('🔍 当前用户信息:', userInfo);

      // 刷新用户信息
      await refreshUserInfo();

      // 延迟一下确保用户信息已更新
      setTimeout(() => {
        const updatedUserInfo = localStg.get('userInfo');
        console.log('🔍 刷新后的用户信息:', updatedUserInfo);
        calculateJoinTime(updatedUserInfo?.contractStartDate);
      }, 100);
    };

    initializeData();
  }, []); // 只在组件挂载时执行一次

  // 监听用户信息的contractStartDate变化
  useEffect(() => {
    calculateJoinTime(userInfo.contractStartDate);
  }, [userInfo.contractStartDate]);

  // 转换性别格式
  const convertGender = (gender: number | undefined): 'male' | 'female' | undefined => {
    if (gender === 1) return 'male';
    if (gender === 2) return 'female';
    return undefined;
  };

  return (
    <ACard
      className="card-wrapper"
      variant="borderless"
    >
      <div className="flex-y-center justify-between">
        <div className="flex-y-center">
          <div className="size-72px flex shrink-0 items-center justify-center overflow-hidden rd-1/2">
            <UserAvatar
              avatar={userInfo.avatar}
              gender={convertGender(userInfo.gender)}
              size={72}
            />
          </div>
          <div className="pl-12px">
            <h3 className="text-18px font-semibold">
              {userInfo.userName}你好，你已加入一品华信{joinTime}，新的一天继续加油！
            </h3>
          </div>
        </div>

        {showTeamManagement && (
          <AButton
            icon={<TeamOutlined />}
            type="primary"
            onClick={() => navigate('/employee-manager')}
          >
            团队管理
          </AButton>
        )}
      </div>
    </ACard>
  );
};

export default HeaderBanner;
