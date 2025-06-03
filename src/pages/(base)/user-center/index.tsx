import { LockOutlined, MailOutlined, PhoneOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, Row, Tabs, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import UserAvatar from '@/components/UserAvatar';
import { selectUserInfo, setUserInfo } from '@/features/auth/authStore';
import { authService, userService } from '@/service/api';
import { UserRole, isAdmin, isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';

// 扩展用户信息接口以包含更多属性
interface ExtendedUserInfo extends Api.Auth.UserInfo {
  avatar?: string;
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

  // 判断当前用户权限
  const isUserAdmin = isAdmin();
  const isUserSuperAdmin = isSuperAdmin();

  // 加载最新用户信息
  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const latestUserInfo = await authService.getUserInfo();

      // 转换API返回的用户信息格式以匹配本地状态
      const convertedUserInfo: ExtendedUserInfo = {
        // 扩展属性
        avatar: latestUserInfo.avatar || '',
        buttons: latestUserInfo.buttons || [],
        department: latestUserInfo.department || (isUserAdmin ? '管理部门' : '员工部门'),
        email: latestUserInfo.email || '',
        gender: latestUserInfo.gender || undefined,
        nickName: latestUserInfo.nickName || '',
        phone: latestUserInfo.phone || '',
        position: latestUserInfo.position || '',
        roles: latestUserInfo.roles?.map((role: any) => role.roleCode || role) || [],
        userId: latestUserInfo.id?.toString() || currentUserData.userId,
        userName: latestUserInfo.userName || ''
      };

      setCurrentUserData(convertedUserInfo);
      dispatch(
        setUserInfo({
          avatar: convertedUserInfo.avatar,
          buttons: convertedUserInfo.buttons,
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
    } catch (error) {
      console.error('加载用户信息失败:', error);
      message.error('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  // 保存个人信息
  const handleSaveProfile = async (values: any) => {
    try {
      setSubmitting(true);
      await userService.updateUserProfile({
        userId: Number.parseInt(currentUserData.userId, 10),
        ...values
      });
      message.success('个人信息保存成功');

      // 重新加载用户信息
      await loadUserInfo();
    } catch (error: any) {
      console.error('保存个人信息失败:', error);
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    try {
      setSubmitting(true);
      await userService.changePassword({
        newPassword: values.newPassword,
        oldPassword: values.oldPassword,
        userId: Number.parseInt(currentUserData.userId, 10)
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('修改密码失败:', error);
      message.error(error.response?.data?.message || '修改密码失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 头像更新回调
  const handleAvatarChange = async (newAvatarUrl: string) => {
    try {
      // 立即更新前端显示
      const updatedUserInfo = { ...currentUserData, avatar: newAvatarUrl };
      setCurrentUserData(updatedUserInfo);

      // 更新Redux状态和本地存储
      dispatch(
        setUserInfo({
          avatar: updatedUserInfo.avatar,
          buttons: updatedUserInfo.buttons,
          department: updatedUserInfo.department,
          email: updatedUserInfo.email,
          gender: updatedUserInfo.gender,
          nickName: updatedUserInfo.nickName,
          phone: updatedUserInfo.phone,
          position: updatedUserInfo.position,
          roles: updatedUserInfo.roles,
          userId: updatedUserInfo.userId,
          userName: updatedUserInfo.userName
        })
      );
      localStg.set('userInfo', {
        avatar: updatedUserInfo.avatar,
        buttons: updatedUserInfo.buttons,
        department: updatedUserInfo.department,
        email: updatedUserInfo.email,
        gender: updatedUserInfo.gender,
        nickName: updatedUserInfo.nickName,
        phone: updatedUserInfo.phone,
        position: updatedUserInfo.position,
        roles: updatedUserInfo.roles,
        userId: updatedUserInfo.userId,
        userName: updatedUserInfo.userName
      });

      // 重新加载最新的用户信息以确保数据同步
      await loadUserInfo();

      message.success('头像更新成功');
    } catch (error) {
      console.error('更新头像失败:', error);
      message.error('更新头像失败');
      // 发生错误时重新加载用户信息
      await loadUserInfo();
    }
  };

  // 转换性别格式
  const convertGender = (gender: number | undefined): 'male' | 'female' | undefined => {
    if (gender === 1) return 'male';
    if (gender === 2) return 'female';
    return undefined;
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
          disabled={!isUserSuperAdmin} // 只有超级管理员可以修改部门
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
        rules={[
          { message: '请输入新密码', required: true },
          { message: '密码长度不能少于6位', min: 6 }
        ]}
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
                          editable={true}
                          gender={convertGender(currentUserData.gender)}
                          size={120}
                          userId={Number.parseInt(currentUserData.userId, 10)}
                          onAvatarChange={handleAvatarChange}
                        />
                      </div>
                    </div>
                  </div>
                  {/* 在线状态指示器 */}
                  <div className="absolute bottom-2 right-2 h-6 w-6 border-2 border-white rounded-full bg-green-500" />
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
                }
              ]}
              onChange={setActiveTab}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserCenter;
