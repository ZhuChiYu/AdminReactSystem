import { TeamOutlined } from '@ant-design/icons';
import { Button as AButton, Card as ACard } from 'antd';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import UserAvatar from '@/components/common/UserAvatar';
import { selectUserInfo } from '@/features/auth/authStore';
import { useAppSelector } from '@/hooks/business/useStore';
import { isAdminOrSuperAdmin } from '@/utils/auth';
import 'dayjs/locale/zh-cn';

dayjs.extend(duration);
dayjs.locale('zh-cn');

const HeaderBanner = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const navigate = useNavigate();

  // 用户注册时间，模拟数据
  const [joinTime, setJoinTime] = useState<string>('');

  // 检查是否为管理员或超级管理员
  const showTeamManagement = isAdminOrSuperAdmin();

  useEffect(() => {
    // 从用户信息中获取合同开始时间
    const contractStartDate = userInfo.contractStartDate;

    if (contractStartDate) {
      // 如果有合同开始时间，就使用它来计算工作时长
      const joinDate = dayjs(contractStartDate);
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
    } else {
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
