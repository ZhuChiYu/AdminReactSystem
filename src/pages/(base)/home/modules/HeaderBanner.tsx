import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useEffect, useState } from 'react';

import UserAvatar from '@/components/common/UserAvatar';
import { selectUserInfo } from '@/features/auth/authStore';
import { useAppSelector } from '@/hooks/business/useStore';
import 'dayjs/locale/zh-cn';

dayjs.extend(duration);
dayjs.locale('zh-cn');

const HeaderBanner = () => {
  const userInfo = useAppSelector(selectUserInfo);

  // 用户注册时间，模拟数据
  const [joinTime, setJoinTime] = useState<string>('');

  useEffect(() => {
    // 实际项目中，这个时间应该从userInfo中获取
    // 这里为了演示，使用模拟数据，假设用户是在1-365天前加入的
    const randomDays = Math.floor(Math.random() * 365) + 1;
    const joinDate = dayjs().subtract(randomDays, 'day');

    // 计算加入至今的时间
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
  }, []);

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
      <div className="flex-y-center">
        <div className="size-72px shrink-0 overflow-hidden rd-1/2">
          <UserAvatar
            avatar={userInfo.avatar}
            gender={convertGender(userInfo.gender)}
            size={40}
          />
        </div>
        <div className="pl-12px">
          <h3 className="text-18px font-semibold">
            {userInfo.userName}你好，你已加入一品华信{joinTime}，新的一天继续加油！
          </h3>
        </div>
      </div>
    </ACard>
  );
};

export default HeaderBanner;
