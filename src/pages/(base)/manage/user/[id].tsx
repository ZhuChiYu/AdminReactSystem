import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button as AButton,
  Card as ACard,
  Descriptions as ADescriptions,
  Divider as ADivider,
  Tag as ATag
} from 'antd';
import dayjs from 'dayjs';
import { type FC } from 'react';
import { type LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';

import LookForward from '@/components/LookForward';
import { fetchGetUserDetail } from '@/service/api/system-manage';

interface Role {
  code: string;
  name: string;
  type: 'permission' | 'position';
}

interface UserDetail {
  address: string;
  avatar: string | null;
  bankCard: string;
  contractEndDate: string | null;
  contractStartDate: string | null;
  contractYears: number | null;
  createdAt: string;
  department: { id: number; name: string } | null;
  departmentId: number | null;
  email: string;
  gender: number;
  id: number;
  idCard: string;
  lastLoginIp: string | null;
  lastLoginTime: string | null;
  nickName: string;
  phone: string;
  position: string | null;
  roles: Role[];
  status: number;
  tim: string;
  updatedAt: string;
  userName: string;
  wechat: string;
}

interface InfoProps {
  data: UserDetail;
}

// 基本信息组件
const BasicInfo: FC<InfoProps> = ({ data }) => {
  const getStatusTag = (status: number) => {
    const statusMap = {
      0: { color: 'error', text: '禁用' },
      1: { color: 'success', text: '启用' }
    };
    return (
      <ATag color={statusMap[status as keyof typeof statusMap]?.color}>
        {statusMap[status as keyof typeof statusMap]?.text}
      </ATag>
    );
  };

  const getGenderLabel = (gender: number) => {
    const genderMap = {
      0: '女',
      1: '男'
    };
    return genderMap[gender as keyof typeof genderMap] || '未知';
  };

  return (
    <ADescriptions
      bordered
      column={{ md: 3, sm: 2, xs: 1 }}
      labelStyle={{ padding: '8px 16px', textAlign: 'right', width: '100px' }}
      size="middle"
      items={[
        {
          children: data.userName,
          key: 'userName',
          label: '用户名'
        },
        {
          children: getStatusTag(data.status),
          key: 'status',
          label: '状态'
        },
        {
          children: data.nickName,
          key: 'nickName',
          label: '姓名'
        },
        {
          children: getGenderLabel(data.gender),
          key: 'gender',
          label: '性别'
        },
        {
          children: data.email || '-',
          key: 'email',
          label: '邮箱',
          span: data.email ? 2 : 1
        },
        {
          children: data.phone || '-',
          key: 'phone',
          label: '手机号码',
          span: data.phone ? 2 : 1
        }
      ]}
    />
  );
};

// 角色信息组件
const RoleInfo: FC<InfoProps> = ({ data }) => {
  const getRoleColor = (role: Role) => {
    switch (role.type) {
      case 'position':
        return 'blue';
      case 'permission':
        return 'green';
      default:
        return 'default';
    }
  };

  const positionRoles = data.roles?.filter(role => role.type === 'position') || [];
  const permissionRoles = data.roles?.filter(role => role.type === 'permission') || [];

  return (
    <ADescriptions
      bordered
      column={{ md: 2, sm: 2, xs: 1 }}
      labelStyle={{ padding: '8px 16px', textAlign: 'right', width: '100px' }}
      size="middle"
      items={[
        {
          children:
            positionRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {positionRoles.map(role => (
                  <ATag
                    color={getRoleColor(role)}
                    key={role.code}
                  >
                    {role.name}
                  </ATag>
                ))}
              </div>
            ) : (
              <ATag color="default">未分配职位</ATag>
            ),
          key: 'positionRole',
          label: '职位'
        },
        {
          children:
            permissionRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {permissionRoles.map(role => (
                  <ATag
                    color={getRoleColor(role)}
                    key={role.code}
                  >
                    {role.name}
                  </ATag>
                ))}
              </div>
            ) : (
              <ATag color="default">未分配权限</ATag>
            ),
          key: 'permissionRole',
          label: '权限'
        }
      ]}
    />
  );
};

// 联系方式组件
const ContactInfo: FC<InfoProps> = ({ data }) => (
  <ADescriptions
    bordered
    column={{ md: 3, sm: 2, xs: 1 }}
    items={[
      {
        children: data.address || '-',
        key: 'address',
        label: '家庭住址'
      },
      {
        children: data.bankCard || '-',
        key: 'bankCard',
        label: '银行卡号'
      },
      {
        children: data.idCard || '-',
        key: 'idCard',
        label: '身份证号'
      },
      {
        children: data.wechat || '-',
        key: 'wechat',
        label: '工作微信'
      },
      {
        children: data.tim || '-',
        key: 'tim',
        label: 'TIM号'
      }
    ]}
  />
);

// 系统信息组件
const SystemInfo: FC<InfoProps> = ({ data }) => (
  <ADescriptions
    bordered
    column={{ md: 2, sm: 2, xs: 1 }}
    labelStyle={{ padding: '8px 16px', textAlign: 'right', width: '120px' }}
    size="middle"
    items={[
      {
        children: data.id,
        key: 'id',
        label: 'ID'
      },
      {
        children: data.department?.name || '-',
        key: 'department',
        label: '所属部门'
      },
      {
        children: data.position || '-',
        key: 'position',
        label: '职位'
      },
      {
        children: dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        key: 'createTime',
        label: '创建时间'
      },
      {
        children: dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        key: 'updateTime',
        label: '更新时间'
      },
      {
        children: data.lastLoginTime ? dayjs(data.lastLoginTime).format('YYYY-MM-DD HH:mm:ss') : '-',
        key: 'lastLoginTime',
        label: '最后登录时间'
      }
    ]}
  />
);

// 合同信息组件
const ContractInfo: FC<InfoProps> = ({ data }) => (
  <ADescriptions
    bordered
    column={{ md: 2, sm: 2, xs: 1 }}
    items={[
      {
        children: data.contractYears || '-',
        key: 'contractYears',
        label: '合同年限'
      },
      {
        children: data.contractStartDate ? dayjs(data.contractStartDate).format('YYYY-MM-DD') : '-',
        key: 'contractStartDate',
        label: '合同开始日期'
      },
      {
        children: data.contractEndDate ? dayjs(data.contractEndDate).format('YYYY-MM-DD') : '-',
        key: 'contractEndDate',
        label: '合同结束日期'
      }
    ]}
  />
);

// 员工详情页面
const UserDetailPage = () => {
  const data = useLoaderData() as UserDetail | undefined;
  const navigate = useNavigate();

  if (!data) {
    return <LookForward />;
  }

  return (
    <div className="h-[calc(100vh-56px)] flex-1 bg-[#f5f5f5]">
      <div className="h-full p-6">
        <ACard
          className="h-full"
          extra={
            <AButton
              ghost
              icon={<ArrowLeftOutlined />}
              type="primary"
              onClick={() => navigate(-1)}
            >
              返回
            </AButton>
          }
          title={
            <div className="flex items-center gap-2">
              <UserOutlined />
              <span>员工详情信息</span>
            </div>
          }
        >
          <div className="space-y-6">
            <section>
              <ADivider orientation="left">
                <span className="text-base font-medium">基本信息</span>
              </ADivider>
              <BasicInfo data={data} />
            </section>

            <section>
              <ADivider orientation="left">
                <span className="text-base font-medium">角色信息</span>
              </ADivider>
              <RoleInfo data={data} />
            </section>

            <section>
              <ADivider orientation="left">
                <span className="text-base font-medium">联系方式</span>
              </ADivider>
              <ContactInfo data={data} />
            </section>

            <section>
              <ADivider orientation="left">
                <span className="text-base font-medium">合同信息</span>
              </ADivider>
              <ContractInfo data={data} />
            </section>

            <section>
              <ADivider orientation="left">
                <span className="text-base font-medium">系统信息</span>
              </ADivider>
              <SystemInfo data={data} />
            </section>
          </div>
        </ACard>
      </div>
    </div>
  );
};

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const data = await fetchGetUserDetail(Number(params.id));

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

export default UserDetailPage;
