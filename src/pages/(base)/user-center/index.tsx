import { LockOutlined, MailOutlined, PhoneOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Col, Divider, Form, Input, Row, Space, Tabs, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { selectUserInfo, setUserInfo } from '@/features/auth/authStore';
import { UserRole, isAdmin, isSuperAdmin } from '@/utils/auth';
import UserAvatar from '@/components/UserAvatar';
import { userService, authService } from '@/service/api';
import { localStg } from '@/utils/storage';

/** 个人中心组件 */
const UserCenter = () => {
  const userInfo = useSelector(selectUserInfo);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('1');
  const [userForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(userInfo);

  // 判断当前用户权限
  const isUserAdmin = isAdmin();
  const isUserSuperAdmin = isSuperAdmin();

  // 加载最新用户信息
  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const latestUserInfo = await authService.getUserInfo();
      setCurrentUserData(latestUserInfo);
      dispatch(setUserInfo(latestUserInfo));
      // 更新本地存储
      localStg.set('userInfo', latestUserInfo);
      
      // 更新表单数据
      userForm.setFieldsValue({
        userName: latestUserInfo.userName,
        email: latestUserInfo.email,
        phone: latestUserInfo.phone,
        department: latestUserInfo.department || (isUserAdmin ? '管理部门' : '员工部门')
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
        userId: parseInt(currentUserData.userId),
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
        userId: parseInt(currentUserData.userId),
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
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
      // 更新用户头像
      const updatedUserInfo = { ...currentUserData, avatar: newAvatarUrl };
      setCurrentUserData(updatedUserInfo);
      dispatch(setUserInfo(updatedUserInfo));
      localStg.set('userInfo', updatedUserInfo);
      
      // 同时更新后端
      await userService.updateUserProfile({
        userId: parseInt(currentUserData.userId),
        avatar: newAvatarUrl
      });
      
      message.success('头像更新成功');
    } catch (error) {
      console.error('更新头像失败:', error);
      message.error('更新头像失败');
    }
  };

  // 基本信息表单
  const UserInfoForm = () => (
    <Form
      form={userForm}
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 16 }}
      initialValues={{
        userName: currentUserData.userName,
        email: currentUserData.email,
        phone: currentUserData.phone,
        department: currentUserData.department || (isUserAdmin ? '管理部门' : '员工部门')
      }}
      onFinish={handleSaveProfile}
    >
      <Form.Item
        label="用户名"
        name="userName"
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="请输入用户名"
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
          prefix={<MailOutlined />} 
          placeholder="请输入电子邮箱"
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
          prefix={<PhoneOutlined />} 
          placeholder="请输入手机号码"
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
          type="primary"
          htmlType="submit"
          loading={submitting}
          icon={<SaveOutlined />}
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
        rules={[{ required: true, message: '请输入当前密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入当前密码"
        />
      </Form.Item>
      <Form.Item
        label="新密码"
        name="newPassword"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码长度不能少于6位' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入新密码"
        />
      </Form.Item>
      <Form.Item
        label="确认密码"
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请确认新密码' },
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
          prefix={<LockOutlined />}
          placeholder="请确认新密码"
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 5, span: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          icon={<SaveOutlined />}
        >
          修改密码
        </Button>
      </Form.Item>
    </Form>
  );

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
              <Card
                bordered={false}
                style={{ textAlign: 'center' }}
              >
                <UserAvatar
                  userId={parseInt(currentUserData.userId)}
                  avatar={currentUserData.avatar}
                  gender={currentUserData.gender}
                  size={120}
                  editable={true}
                  onAvatarChange={handleAvatarChange}
                />
                <h3 style={{ marginTop: 16 }}>{currentUserData.userName}</h3>
              </Card>
              <Divider />
              <p className="mb-2 text-gray-500">ID: {currentUserData.userId || '未设置'}</p>
              <div className="mt-2">
                {currentUserData.roles?.map(role => (
                  <Tag
                    color={role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN ? 'gold' : 'blue'}
                    key={role}
                  >
                    {role === UserRole.SUPER_ADMIN ? '超级管理员' : 
                     role === UserRole.ADMIN ? '管理员' : '员工'}
                  </Tag>
                ))}
              </div>
              <Divider />
              <div className="w-full">
                <p className="mb-1 text-gray-500">
                  <UserOutlined className="mr-2" />
                  上次登录时间
                </p>
                <p className="mb-3 text-gray-700">{new Date().toLocaleString()}</p>
                <p className="mb-1 text-gray-500">
                  <MailOutlined className="mr-2" />
                  电子邮箱
                </p>
                <p className="mb-3 text-gray-700">{currentUserData.email || '未设置'}</p>
                <p className="mb-1 text-gray-500">
                  <PhoneOutlined className="mr-2" />
                  联系电话
                </p>
                <p className="text-gray-700">{currentUserData.phone || '未设置'}</p>
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
