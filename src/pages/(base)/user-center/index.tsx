import { LockOutlined, MailOutlined, PhoneOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Col, Divider, Form, Input, Row, Space, Tabs, Tag, message } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUserInfo } from '@/features/auth/authStore';
import { UserRole, isAdmin } from '@/utils/auth';

/** 个人中心组件 */
const UserCenter = () => {
  const userInfo = useSelector(selectUserInfo);
  const [activeTab, setActiveTab] = useState('1');
  const [userForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 判断当前用户是否为管理员
  const isUserAdmin = isAdmin();

  // 提交基本信息表单
  const handleSubmitUserInfo = async (values: any) => {
    try {
      setSubmitting(true);
      // 模拟提交操作
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      console.log('提交的用户信息:', values);
      message.success('个人资料修改成功！');
    } catch {
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 提交密码修改表单
  const handleSubmitPassword = async (values: any) => {
    try {
      setSubmitting(true);
      // 模拟提交操作
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      console.log('提交的密码信息:', values);
      message.success('密码修改成功！');
      passwordForm.resetFields();
    } catch {
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 基本信息表单
  const UserInfoForm = () => (
    <Form
      form={userForm}
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 16 }}
      initialValues={{
        // 模拟数据
        department: isUserAdmin ? '管理部门' : '员工部门',
        email: 'user@example.com', // 模拟数据
        phone: '13800138000',
        userName: userInfo.userName // 模拟数据
      }}
      onFinish={handleSubmitUserInfo}
    >
      <Form.Item
        label="用户名"
        name="userName"
      >
        <Input
          disabled
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
        <Input prefix={<MailOutlined />} />
      </Form.Item>
      <Form.Item
        label="手机号码"
        name="phone"
        rules={[
          { message: '请输入有效的手机号码', pattern: /^1[3-9]\d{9}$/ },
          { message: '请输入手机号码', required: true }
        ]}
      >
        <Input prefix={<PhoneOutlined />} />
      </Form.Item>
      <Form.Item
        label="所属部门"
        name="department"
      >
        <Input disabled />
      </Form.Item>
      <Form.Item label="用户角色">
        <Space>
          {userInfo.roles.map(role => (
            <Tag
              color={role === UserRole.ADMIN ? 'gold' : 'blue'}
              key={role}
            >
              {role === UserRole.ADMIN ? '管理员' : '员工'}
            </Tag>
          ))}
        </Space>
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
      onFinish={handleSubmitPassword}
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
          { message: '密码长度不能小于6位', min: 6 }
        ]}
      >
        <Input.Password
          placeholder="请输入新密码"
          prefix={<LockOutlined />}
        />
      </Form.Item>
      <Form.Item
        dependencies={['newPassword']}
        label="确认新密码"
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

  return (
    <div className="h-full bg-white p-6 dark:bg-[#141414]">
      <Row gutter={24}>
        <Col
          lg={8}
          md={8}
          xl={6}
          xs={24}
        >
          <Card>
            <div className="flex flex-col items-center">
              <Badge
                color="gold"
                dot={isUserAdmin}
              >
                <Avatar
                  icon={<UserOutlined />}
                  size={100}
                />
              </Badge>
              <Divider />
              <h2 className="mb-2 mt-4 text-xl font-medium">{userInfo.userName}</h2>
              <p className="mb-2 text-gray-500">ID: {userInfo.userId || '未设置'}</p>
              <div className="mt-2">
                {userInfo.roles.map(role => (
                  <Tag
                    color={role === UserRole.ADMIN ? 'gold' : 'blue'}
                    key={role}
                  >
                    {role === UserRole.ADMIN ? '管理员' : '员工'}
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
                <p className="mb-3 text-gray-700">user@example.com</p>
                <p className="mb-1 text-gray-500">
                  <PhoneOutlined className="mr-2" />
                  联系电话
                </p>
                <p className="text-gray-700">13800138000</p>
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
          <Card>
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
