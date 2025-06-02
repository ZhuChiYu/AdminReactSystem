import { useState } from 'react';
import { type LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';

import LookForward from '@/components/LookForward';
import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import { ATG_MAP } from '@/constants/common';
import { fetchGetUserList } from '@/service/api';

// 员工详情页面
const UserDetailPage = () => {
  const data = useLoaderData() as Api.SystemManage.User | undefined;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (!data) return <LookForward />;

  const getStatusTag = (status: string | null) => {
    if (status === null) return null;
    const label = t(enableStatusRecord[status as Api.Common.EnableStatus]);
    return <ATag color={ATG_MAP[status as Api.Common.EnableStatus]}>{label}</ATag>;
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === null) return null;
    return t(userGenderRecord[gender as Api.SystemManage.UserGender]);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev: boolean) => !prev);
  };

  const password = data.password || '123456';
  const passwordDisplay = (
    <div className="flex-center gap-4px">
      <span>{passwordVisible ? password : '******'}</span>
      <AButton
        size="small"
        type="link"
        onClick={togglePasswordVisibility}
      >
        {passwordVisible ? t('common.hide') : t('common.show')}
      </AButton>
    </div>
  );

  const items = [
    {
      children: data.userName || '-',
      key: 'userName',
      label: '用户名'
    },
    {
      children: getGenderLabel(data.userGender) || '-',
      key: 'userGender',
      label: '性别'
    },
    {
      children: data.nickName || '-',
      key: 'nickName',
      label: '昵称'
    },
    {
      children: data.userPhone || '-',
      key: 'userPhone',
      label: '手机号'
    },
    {
      children: data.userEmail || '-',
      key: 'userEmail',
      label: '邮箱'
    },
    {
      children: getStatusTag(data.status),
      key: 'status',
      label: '状态'
    },
    {
      children: passwordDisplay,
      key: 'password',
      label: '密码'
    },
    {
      children: data.userRoles?.join(', ') || '-',
      key: 'userRoles',
      label: '用户角色',
      span: 2
    },
    {
      children: data.id,
      key: 'id',
      label: 'ID'
    },
    {
      children: data.createBy || '-',
      key: 'createBy',
      label: '创建人'
    },
    {
      children: data.createTime || '-',
      key: 'createTime',
      label: '创建时间'
    },
    {
      children: data.updateBy || '-',
      key: 'updateBy',
      label: '更新人'
    },
    {
      children: data.updateTime || '-',
      key: 'updateTime',
      label: '更新时间'
    }
  ];

  return (
    <ACard
      className="h-full card-wrapper"
      extra={<AButton onClick={() => navigate(-1)}>返回</AButton>}
      title="员工详情信息"
      variant="borderless"
    >
      <ADivider orientation="left">基本信息</ADivider>
      <ADescriptions
        bordered
        column={{ md: 3, sm: 2, xs: 1 }}
        items={items.slice(0, 8)}
      />

      <ADivider
        className="mt-24px"
        orientation="left"
      >
        系统信息
      </ADivider>
      <ADescriptions
        bordered
        column={{ md: 2, sm: 2, xs: 1 }}
        items={items.slice(8)}
      />
    </ACard>
  );
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { data, error } = await fetchGetUserList();
  if (error) return null;

  const info = data.records.find(item => String(item.id) === params.id);
  return info;
}

export default UserDetailPage;
