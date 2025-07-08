import {
  EditOutlined,
  HistoryOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, Modal, Row, Space, Table, Tabs, Tag, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import UserAvatar from '@/components/common/UserAvatar';
import { selectUserInfo, setUserInfo } from '@/features/auth/authStore';
import { useFormRules } from '@/features/form';
import { authService, avatarService, userService } from '@/service/api';
import { UserRole, isAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';

// 扩展用户信息接口以包含更多属性
interface ExtendedUserInfo extends Api.Auth.UserInfo {
  avatar?: string;
  contractStartDate?: string;
  department?: string;
  email?: string;
  gender?: number;
  nickName?: string;
  phone?: string;
  position?: string;
}

/** 个人中心组件 */
const UserCenter = () => {
  const userInfo = useSelector(selectUserInfo);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('1');
  const [userForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<ExtendedUserInfo>(userInfo);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // 添加头像刷新key
  const [loginRecords, setLoginRecords] = useState<any[]>([]);
  const [loginRecordsLoading, setLoginRecordsLoading] = useState(false);
  const [loginRecordsPagination, setLoginRecordsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 判断当前用户权限
  const isUserAdmin = isAdmin();
  const isSuperAdmin = userInfo.roles?.includes('super_admin');

  // 使用表单校验规则
  const { formRules } = useFormRules();

  // 获取用户职务角色对应的部门信息
  const getUserDepartmentFromRole = async (userRoles: any[]): Promise<string> => {
    if (!userRoles?.length) {
      return isUserAdmin ? '管理部门' : '员工部门';
    }

    try {
      const { fetchGetRoleList } = await import('@/service/api/system-manage');
      const roleResponse = await fetchGetRoleList({
        current: 1,
        roleType: 'position',
        size: 100
      });

      if (!roleResponse?.records) {
        return isUserAdmin ? '管理部门' : '员工部门';
      }

      // 找到用户的职务角色
      const userPositionRole = userRoles.find((role: any) =>
        roleResponse.records.some((r: any) => r.roleCode === role.roleCode || r.roleCode === role)
      );

      if (userPositionRole) {
        const roleData = roleResponse.records.find(
          (r: any) => r.roleCode === (userPositionRole.roleCode || userPositionRole)
        );
        if (roleData?.department) {
          return roleData.department;
        }
      }
    } catch (error) {
      console.error('获取角色部门信息失败:', error);
    }

    return isUserAdmin ? '管理部门' : '员工部门';
  };

  // 加载最新用户信息
  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const latestUserInfo = await authService.getUserInfo();

      // 获取用户职务角色对应的部门信息
      const userDepartment = await getUserDepartmentFromRole(latestUserInfo.roles);

      // 转换API返回的用户信息格式以匹配本地状态
      const convertedUserInfo: ExtendedUserInfo = {
        // 扩展属性
        avatar: latestUserInfo.avatar || '',
        buttons: latestUserInfo.buttons || [],
        contractStartDate: (latestUserInfo as any).contractStartDate,
        department: userDepartment,
        email: latestUserInfo.email || '',
        gender: latestUserInfo.gender || undefined,
        nickName: latestUserInfo.nickName || '',
        phone: latestUserInfo.phone || '',
        position: latestUserInfo.position || '',
        roles: latestUserInfo.roles?.map((role: any) => role.roleCode || role) || [],
        userId: (() => {
          // 尝试多种方式获取用户ID
          if ((latestUserInfo as any).userId) {
            return (latestUserInfo as any).userId.toString();
          }
          if ((latestUserInfo as any).id) {
            return (latestUserInfo as any).id.toString();
          }

          // 从当前用户数据获取
          if (currentUserData.userId) {
            return currentUserData.userId;
          }

          // 从localStorage获取
          const storedUserInfo = localStg.get('userInfo');
          if (storedUserInfo?.userId) {
            return storedUserInfo.userId;
          }

          // 如果都获取不到，抛出错误
          throw new Error('无法获取用户ID，用户信息异常');
        })(),
        userName: latestUserInfo.userName || ''
      };

      setCurrentUserData(convertedUserInfo);
      dispatch(
        setUserInfo({
          avatar: convertedUserInfo.avatar,
          buttons: convertedUserInfo.buttons,
          contractStartDate: convertedUserInfo.contractStartDate,
          department: convertedUserInfo.department,
          email: convertedUserInfo.email,
          gender: convertedUserInfo.gender,
          nickName: convertedUserInfo.nickName,
          phone: convertedUserInfo.phone,
          position: convertedUserInfo.position,
          roles: convertedUserInfo.roles,
          userId: convertedUserInfo.userId,
          userName: convertedUserInfo.userName
        })
      );
      localStg.set('userInfo', {
        avatar: convertedUserInfo.avatar,
        buttons: convertedUserInfo.buttons,
        contractStartDate: convertedUserInfo.contractStartDate,
        department: convertedUserInfo.department,
        email: convertedUserInfo.email,
        gender: convertedUserInfo.gender,
        nickName: convertedUserInfo.nickName,
        phone: convertedUserInfo.phone,
        position: convertedUserInfo.position,
        roles: convertedUserInfo.roles,
        userId: convertedUserInfo.userId,
        userName: convertedUserInfo.userName
      });

      // 更新表单数据
      userForm.setFieldsValue({
        department: convertedUserInfo.department,
        email: convertedUserInfo.email,
        phone: convertedUserInfo.phone,
        userName: convertedUserInfo.userName
      });
    } catch (error: any) {
      console.error('加载用户信息失败:', error);
      if (error.message === '无法获取用户ID，用户信息异常') {
        message.error('用户信息异常，请重新登录');
      } else {
        message.error('加载用户信息失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取登录记录
  const loadLoginRecords = async (page = 1, pageSize = 10) => {
    if (!isSuperAdmin) return;

    try {
      setLoginRecordsLoading(true);
      const response = await authService.getLoginRecords({
        current: page,
        size: pageSize
      });

      setLoginRecords(response.records);
      setLoginRecordsPagination({
        current: response.current,
        pageSize: response.size,
        total: response.total
      });
    } catch (error: any) {
      message.error('获取登录记录失败');
    } finally {
      setLoginRecordsLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
    if (isSuperAdmin) {
      loadLoginRecords();
    }
  }, [isSuperAdmin]);

  // 保存个人信息
  const handleSaveProfile = async (values: any) => {
    try {
      setSubmitting(true);

      // 获取用户ID - 改进的获取逻辑
      let userId: number | undefined;

      // 1. 首先尝试从currentUserData获取
      if (currentUserData.userId) {
        userId = Number.parseInt(String(currentUserData.userId), 10);
      }

      // 2. 如果没有，尝试从localStorage获取
      if (!userId || Number.isNaN(userId)) {
        const storedUserInfo = localStg.get('userInfo');
        if (storedUserInfo?.userId) {
          userId = Number.parseInt(String(storedUserInfo.userId), 10);
        }
      }

      // 3. 如果还是没有，从后端API重新获取当前用户信息
      if (!userId || Number.isNaN(userId)) {
        console.warn('无法从本地获取用户ID，尝试从后端重新获取用户信息');
        try {
          const freshUserInfo = await authService.getUserInfo();
          if ((freshUserInfo as any).userId || (freshUserInfo as any).id) {
            userId = Number.parseInt(String((freshUserInfo as any).userId || (freshUserInfo as any).id), 10);
          }
        } catch (error) {
          console.error('从后端获取用户信息失败:', error);
        }
      }

      // 4. 如果仍然无法获取用户ID，抛出错误而不是使用默认值
      if (!userId || Number.isNaN(userId)) {
        throw new Error('无法获取用户ID，请重新登录');
      }

      await userService.updateUserProfile({
        userId,
        ...values
      });
      message.success('个人信息保存成功');

      // 重新加载用户信息
      await loadUserInfo();
    } catch (error: any) {
      console.error('保存个人信息失败:', error);
      if (error.message === '无法获取用户ID，请重新登录') {
        message.error('用户信息异常，请重新登录');
      } else {
        message.error(error.response?.data?.message || '保存失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setSubmitting(true);

      // 获取用户ID - 改进的获取逻辑
      let userId: number | undefined;

      // 1. 首先尝试从currentUserData获取
      if (currentUserData.userId) {
        userId = Number.parseInt(String(currentUserData.userId), 10);
      }

      // 2. 如果没有，尝试从localStorage获取
      if (!userId || Number.isNaN(userId)) {
        const storedUserInfo = localStg.get('userInfo');
        if (storedUserInfo?.userId) {
          userId = Number.parseInt(String(storedUserInfo.userId), 10);
        }
      }

      // 3. 如果还是没有，从后端API重新获取当前用户信息
      if (!userId || Number.isNaN(userId)) {
        console.warn('无法从本地获取用户ID，尝试从后端重新获取用户信息');
        try {
          const freshUserInfo = await authService.getUserInfo();
          if ((freshUserInfo as any).userId || (freshUserInfo as any).id) {
            userId = Number.parseInt(String((freshUserInfo as any).userId || (freshUserInfo as any).id), 10);
          }
        } catch (error) {
          console.error('从后端获取用户信息失败:', error);
        }
      }

      // 4. 如果仍然无法获取用户ID，抛出错误而不是使用默认值
      if (!userId || Number.isNaN(userId)) {
        throw new Error('无法获取用户ID，请重新登录');
      }

      await userService.changePassword({
        newPassword: values.newPassword,
        oldPassword: values.oldPassword,
        userId
      });

      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('修改密码失败:', error);
      if (error.message === '无法获取用户ID，请重新登录') {
        message.error('用户信息异常，请重新登录');
      } else {
        message.error(error.response?.data?.message || '修改密码失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 头像更新回调
  const handleAvatarChange = async (newAvatarUrl: string) => {
    try {
      // 添加时间戳避免缓存问题
      const timestamp = Date.now();
      const avatarUrlWithTimestamp = `${newAvatarUrl}?t=${timestamp}`;

      // 立即更新前端显示
      const updatedUserInfo = { ...currentUserData, avatar: avatarUrlWithTimestamp };
      setCurrentUserData(updatedUserInfo);

      // 更新Redux状态和本地存储
      dispatch(
        setUserInfo({
          ...updatedUserInfo,
          avatar: avatarUrlWithTimestamp
        })
      );

      localStg.set('userInfo', {
        ...updatedUserInfo,
        avatar: avatarUrlWithTimestamp
      });

      // 强制刷新头像组件
      setAvatarKey(timestamp);

      message.success('头像更新成功');
    } catch (error) {
      console.error('更新头像失败:', error);
      message.error('更新头像失败');
      // 发生错误时重新加载用户信息
      await loadUserInfo();
    }
  };

  // 打开头像上传弹窗
  const handleAvatarEdit = () => {
    setAvatarModalVisible(true);
  };

  // 关闭头像上传弹窗
  const handleAvatarModalCancel = () => {
    setAvatarModalVisible(false);
  };

  // 处理头像文件上传
  const handleAvatarUpload = async (file: File) => {
    if (!file) {
      message.error('请选择头像文件');
      return false;
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      message.error('只能上传 JPG、PNG、GIF 格式的图片');
      return false;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过 2MB');
      return false;
    }

    try {
      setUploading(true);

      // 获取用户ID - 改进的获取逻辑
      let userId: number | undefined;

      // 1. 首先尝试从currentUserData获取
      if (currentUserData.userId) {
        userId = Number.parseInt(String(currentUserData.userId), 10);
      }

      // 2. 如果没有，尝试从localStorage获取
      if (!userId || Number.isNaN(userId)) {
        const storedUserInfo = localStg.get('userInfo');
        if (storedUserInfo?.userId) {
          userId = Number.parseInt(String(storedUserInfo.userId), 10);
        }
      }

      // 3. 如果还是没有，从后端API重新获取当前用户信息
      if (!userId || Number.isNaN(userId)) {
        console.warn('无法从本地获取用户ID，尝试从后端重新获取用户信息');
        try {
          const freshUserInfo = await authService.getUserInfo();
          if ((freshUserInfo as any).userId || (freshUserInfo as any).id) {
            userId = Number.parseInt(String((freshUserInfo as any).userId || (freshUserInfo as any).id), 10);
          }
        } catch (error) {
          console.error('从后端获取用户信息失败:', error);
        }
      }

      // 4. 如果仍然无法获取用户ID，抛出错误而不是使用默认值
      if (!userId || Number.isNaN(userId)) {
        throw new Error('无法获取用户ID，请重新登录');
      }

      const response = await avatarService.uploadAvatar(file, userId);
      if (response && response.url) {
        await handleAvatarChange(response.url);
        setAvatarModalVisible(false);
        message.success('头像上传成功');
      } else {
        message.error('头像上传失败');
      }
    } catch (error: any) {
      console.error('头像上传失败:', error);
      if (error.message === '无法获取用户ID，请重新登录') {
        message.error('用户信息异常，请重新登录');
      } else {
        message.error('头像上传失败');
      }
    } finally {
      setUploading(false);
    }

    return false; // 阻止默认上传行为
  };

  // 转换性别格式
  const convertGender = (gender: number | undefined): 'male' | 'female' | undefined => {
    if (gender === 1) return 'male';
    if (gender === 2) return 'female';
    return undefined;
  };

  // 登录记录表格列定义
  const loginRecordsColumns: ColumnsType<any> = [
    {
      dataIndex: 'nickName',
      key: 'nickName',
      render: (text: string, record: any) => (
        <Space>
          <UserAvatar
            avatar={record.avatar}
            size={32}
          />
          <div>
            <div>{record.nickName}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>@{record.userName}</div>
          </div>
        </Space>
      ),
      title: '用户'
    },
    {
      dataIndex: 'loginIp',
      key: 'loginIp',
      title: '登录IP'
    },
    {
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      title: '登录时间'
    },
    {
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (userAgent: string) => {
        if (!userAgent) return '-';
        // 简化显示用户代理信息
        const simplified = userAgent.split(' ')[0] || userAgent;
        return (
          <div
            style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={userAgent}
          >
            {simplified}
          </div>
        );
      },
      title: '设备信息'
    },
    {
      dataIndex: 'loginResult',
      key: 'loginResult',
      render: (result: string) => (
        <Tag color={result === 'success' ? 'success' : 'error'}>{result === 'success' ? '成功' : '失败'}</Tag>
      ),
      title: '状态'
    }
  ];

  // 处理登录记录分页变化
  const handleLoginRecordsTableChange = (pagination: any) => {
    loadLoginRecords(pagination.current, pagination.pageSize);
  };

  // 基本信息表单
  const UserInfoForm = () => (
    <Form
      form={userForm}
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 16 }}
      initialValues={{
        department: currentUserData.department || (isUserAdmin ? '管理部门' : '员工部门'),
        email: currentUserData.email,
        phone: currentUserData.phone,
        userName: currentUserData.userName
      }}
      onFinish={handleSaveProfile}
    >
      <Form.Item
        label="用户名"
        name="userName"
      >
        <Input
          placeholder="请输入用户名"
          prefix={<UserOutlined />}
        />
      </Form.Item>
      <Form.Item
        label="电子邮箱"
        name="email"
        rules={[
          { message: '请输入有效的电子邮箱地址', type: 'email' },
          { message: '请输入电子邮箱', required: true }
        ]}
      >
        <Input
          placeholder="请输入电子邮箱"
          prefix={<MailOutlined />}
        />
      </Form.Item>
      <Form.Item
        label="手机号码"
        name="phone"
        rules={[
          { message: '请输入有效的手机号码', pattern: /^1[3-9]\d{9}$/ },
          { message: '请输入手机号码', required: true }
        ]}
      >
        <Input
          placeholder="请输入手机号码"
          prefix={<PhoneOutlined />}
        />
      </Form.Item>
      <Form.Item
        label="所属部门"
        name="department"
      >
        <Input
          disabled // 所属部门不允许修改，从职务角色中自动获取
          placeholder="所属部门"
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 5, span: 16 }}>
        <Button
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={submitting}
          type="primary"
        >
          保存修改
        </Button>
      </Form.Item>
    </Form>
  );

  // 密码修改表单
  const PasswordForm = () => (
    <Form
      form={passwordForm}
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 16 }}
      onFinish={handleChangePassword}
    >
      <Form.Item
        label="当前密码"
        name="oldPassword"
        rules={[{ message: '请输入当前密码', required: true }]}
      >
        <Input.Password
          placeholder="请输入当前密码"
          prefix={<LockOutlined />}
        />
      </Form.Item>
      <Form.Item
        label="新密码"
        name="newPassword"
        rules={formRules.pwd}
      >
        <Input.Password
          placeholder="请输入新密码"
          prefix={<LockOutlined />}
        />
      </Form.Item>
      <Form.Item
        dependencies={['newPassword']}
        label="确认密码"
        name="confirmPassword"
        rules={[
          { message: '请确认新密码', required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            }
          })
        ]}
      >
        <Input.Password
          placeholder="请确认新密码"
          prefix={<LockOutlined />}
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 5, span: 16 }}>
        <Button
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={submitting}
          type="primary"
        >
          修改密码
        </Button>
      </Form.Item>
    </Form>
  );

  // 登录记录组件
  const LoginRecordsForm = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4>系统登录记录</h4>
        <p style={{ color: '#666' }}>显示所有用户的登录历史记录</p>
      </div>
      <Table
        columns={loginRecordsColumns}
        dataSource={loginRecords}
        loading={loginRecordsLoading}
        rowKey="id"
        scroll={{ x: 800 }}
        pagination={{
          current: loginRecordsPagination.current,
          pageSize: loginRecordsPagination.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条记录`,
          total: loginRecordsPagination.total
        }}
        onChange={handleLoginRecordsTableChange}
      />
    </div>
  );

  // 渲染角色标签
  const renderRoleTag = (role: string) => {
    if (role === UserRole.SUPER_ADMIN) {
      return '超级管理员';
    }
    if (role === UserRole.ADMIN) {
      return '管理员';
    }
    return '员工';
  };

  return (
    <div className="h-full bg-white p-6 dark:bg-[#141414]">
      <Row gutter={24}>
        <Col
          lg={8}
          md={8}
          xl={6}
          xs={24}
        >
          <Card loading={loading}>
            <div className="flex flex-col items-center">
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="rounded-full from-blue-400 to-purple-500 bg-gradient-to-r p-1">
                    <div className="rounded-full bg-white p-2">
                      <div className="overflow-hidden rounded-full">
                        <UserAvatar
                          avatar={currentUserData.avatar}
                          gender={convertGender(currentUserData.gender)}
                          key={avatarKey}
                          size={120}
                        />
                      </div>
                    </div>
                  </div>
                  {/* 在线状态指示器 */}
                  <div className="absolute bottom-2 right-2 h-6 w-6 border-2 border-white rounded-full bg-green-500" />
                  {/* 头像编辑按钮 */}
                  <div
                    className="absolute bottom-0 right-0 h-8 w-8 flex cursor-pointer items-center justify-center border-2 border-white rounded-full bg-blue-500 transition-colors hover:bg-blue-600"
                    title="编辑头像"
                    onClick={handleAvatarEdit}
                  >
                    <EditOutlined className="text-sm text-white" />
                  </div>
                </div>
                <h3 className="text-xl text-gray-800 font-bold dark:text-white">{currentUserData.userName}</h3>
                <p className="text-sm text-gray-500">ID: {currentUserData.userId || '未设置'}</p>
              </div>

              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {currentUserData.roles?.map(role => (
                  <Tag
                    className="px-3 py-1"
                    color={role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN ? 'gold' : 'blue'}
                    key={role}
                  >
                    {renderRoleTag(role)}
                  </Tag>
                ))}
              </div>

              <Divider className="my-4" />

              <div className="w-full space-y-4">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-1 flex items-center text-sm text-gray-500">
                    <UserOutlined className="mr-2" />
                    上次登录时间
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{new Date().toLocaleString()}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-1 flex items-center text-sm text-gray-500">
                    <MailOutlined className="mr-2" />
                    电子邮箱
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{currentUserData.email || '未设置'}</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-1 flex items-center text-sm text-gray-500">
                    <PhoneOutlined className="mr-2" />
                    联系电话
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{currentUserData.phone || '未设置'}</p>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col
          lg={16}
          md={16}
          xl={18}
          xs={24}
        >
          <Card loading={loading}>
            <Tabs
              activeKey={activeTab}
              items={[
                {
                  children: <UserInfoForm />,
                  key: '1',
                  label: '基本资料'
                },
                {
                  children: <PasswordForm />,
                  key: '2',
                  label: '修改密码'
                },
                ...(isSuperAdmin
                  ? [
                      {
                        children: <LoginRecordsForm />,
                        key: '3',
                        label: (
                          <span>
                            <HistoryOutlined />
                            登录记录
                          </span>
                        )
                      }
                    ]
                  : [])
              ]}
              onChange={setActiveTab}
            />
          </Card>
        </Col>
      </Row>

      {/* 头像上传弹窗 */}
      <Modal
        footer={null}
        open={avatarModalVisible}
        title="更换头像"
        width={400}
        onCancel={handleAvatarModalCancel}
      >
        <div className="text-center">
          <div className="mb-4">
            <UserAvatar
              avatar={currentUserData.avatar}
              gender={convertGender(currentUserData.gender)}
              key={avatarKey}
              size={120}
            />
          </div>
          <Upload
            accept="image/*"
            beforeUpload={handleAvatarUpload}
            showUploadList={false}
          >
            <Button
              loading={uploading}
              style={{ width: '200px' }}
              type="primary"
            >
              选择新头像
            </Button>
          </Upload>
          <p className="mt-2 text-sm text-gray-500">支持 JPG、PNG、GIF 格式，文件大小不超过 2MB</p>
        </div>
      </Modal>
    </div>
  );
};

export default UserCenter;
