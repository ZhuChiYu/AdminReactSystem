import { FileDoneOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message
} from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useCustomerStore from '@/store/customerStore';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { UserRole, getCurrentUserId, getCurrentUserName, isSuperAdmin } from '@/utils/auth';

// 模拟获取用户列表
const mockUsers = [
  { id: '1', name: '张三', role: UserRole.SUPER_ADMIN },
  { id: '2', name: '李四', role: UserRole.ADMIN },
  { id: '3', name: '王五', role: UserRole.EMPLOYEE },
  { id: '4', name: '赵六', role: UserRole.EMPLOYEE },
  { id: '5', name: '钱七', role: UserRole.EMPLOYEE }
];

// 模拟获取班级列表
const mockClasses = [
  { capacity: 30, id: 1, name: '高级开发班', teacher: '张老师' },
  { capacity: 25, id: 2, name: '中级开发班', teacher: '李老师' },
  { capacity: 20, id: 3, name: '初级开发班', teacher: '王老师' }
];

// 权限类型中文名称映射
const permissionTypeNames = {
  [PermissionType.VIEW_CUSTOMER_NAME]: '查看客户姓名',
  [PermissionType.VIEW_CUSTOMER_PHONE]: '查看客户电话',
  [PermissionType.VIEW_CUSTOMER_MOBILE]: '查看客户手机',
  [PermissionType.VIEW_CUSTOMER]: '查看客户信息',
  [PermissionType.EDIT_CUSTOMER]: '编辑客户信息',
  [PermissionType.EDIT_CLASS]: '编辑班级信息',
  [PermissionType.ASSIGN_CUSTOMER]: '分配客户'
};

// 角色中文名称映射
const roleNames = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.EMPLOYEE]: '员工'
};

// 权限管理组件
const PermissionManagement = () => {
  const navigate = useNavigate();

  // 获取当前用户信息
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // 从状态管理器获取权限相关方法
  const {
    getUserPermissions,
    getUsersWithPermission,
    grantClassPermission,
    grantCustomerPermission,
    grantGlobalPermission,
    hasPermission,
    revokeClassPermission,
    revokeCustomerPermission,
    revokeGlobalPermission
  } = usePermissionStore();

  // 从客户状态管理器获取客户数据
  const { customers } = useCustomerStore();

  // 检查是否为超级管理员
  useEffect(() => {
    if (!isSuperAdmin()) {
      // 不是超级管理员，重定向到首页
      message.error('您没有权限访问此页面');
      navigate('/home');
    }
  }, [navigate]);

  // 当前选择的用户
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // 权限表单
  const [form] = Form.useForm();

  // 客户权限表单
  const [customerForm] = Form.useForm();

  // 班级权限表单
  const [classForm] = Form.useForm();

  // 模态框状态
  const [isGlobalModalVisible, setIsGlobalModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isClassModalVisible, setIsClassModalVisible] = useState(false);

  // 用户搜索关键字
  const [userSearchKey, setUserSearchKey] = useState('');

  // 过滤后的用户列表
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);

  // 用户权限列表
  const [userPermissions, setUserPermissions] = useState<any[]>([]);

  // 过滤用户列表
  useEffect(() => {
    if (!userSearchKey) {
      setFilteredUsers(mockUsers);
      return;
    }

    const filtered = mockUsers.filter(
      user =>
        user.id.toLowerCase().includes(userSearchKey.toLowerCase()) ||
        user.name.toLowerCase().includes(userSearchKey.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [userSearchKey]);

  // 当选中用户变化时，获取该用户的权限
  useEffect(() => {
    if (!selectedUser) {
      setUserPermissions([]);
      return;
    }

    // 获取用户权限
    const permissions = getUserPermissions(selectedUser.id);

    // 格式化权限数据用于显示
    const formattedPermissions = permissions.map(permission => ({
      ...permission,
      grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
      key: `${permission.permissionType}_${permission.customerId || 'global'}_${permission.classId || 'global'}`,
      permissionName: permissionTypeNames[permission.permissionType],
      scope: permission.customerId
        ? `客户: ${customers.find(c => c.id === permission.customerId)?.name || 'Unknown'}`
        : permission.classId
          ? `班级: ${mockClasses.find(c => c.id === permission.classId)?.name || 'Unknown'}`
          : '全局'
    }));

    setUserPermissions(formattedPermissions);
  }, [selectedUser, getUserPermissions, customers]);

  // 处理选择用户
  const handleUserSelect = (user: { id: string; name: string; role: string }) => {
    setSelectedUser(user);
  };

  // 打开全局权限设置对话框
  const openGlobalPermissionModal = () => {
    if (!selectedUser) {
      message.warning('请先选择用户');
      return;
    }

    // 初始化表单
    form.resetFields();

    // 预设已有权限
    const userPerms = getUserPermissions(selectedUser.id)
      .filter(p => !p.customerId && !p.classId)
      .map(p => p.permissionType);

    form.setFieldsValue({
      permissions: userPerms
    });

    setIsGlobalModalVisible(true);
  };

  // 打开客户权限设置对话框
  const openCustomerPermissionModal = () => {
    if (!selectedUser) {
      message.warning('请先选择用户');
      return;
    }

    // 初始化表单
    customerForm.resetFields();
    setIsCustomerModalVisible(true);
  };

  // 打开班级权限设置对话框
  const openClassPermissionModal = () => {
    if (!selectedUser) {
      message.warning('请先选择用户');
      return;
    }

    // 初始化表单
    classForm.resetFields();
    setIsClassModalVisible(true);
  };

  // 提交全局权限设置
  const handleGlobalPermissionSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedUser) {
        message.error('未选择用户');
        return;
      }

      // 获取已有的全局权限
      const existingPermissions = getUserPermissions(selectedUser.id)
        .filter(p => !p.customerId && !p.classId)
        .map(p => p.permissionType);

      // 需要添加的权限
      const permissionsToAdd = values.permissions.filter((p: PermissionType) => !existingPermissions.includes(p));

      // 需要移除的权限
      const permissionsToRemove = existingPermissions.filter(p => !values.permissions.includes(p));

      // 添加权限
      if (permissionsToAdd.length > 0) {
        grantGlobalPermission(selectedUser.id, permissionsToAdd, currentUserId);
      }

      // 移除权限
      if (permissionsToRemove.length > 0) {
        revokeGlobalPermission(selectedUser.id, permissionsToRemove, currentUserId);
      }

      message.success('权限设置成功');
      setIsGlobalModalVisible(false);

      // 刷新用户权限列表
      const permissions = getUserPermissions(selectedUser.id);
      const formattedPermissions = permissions.map(permission => ({
        ...permission,
        grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
        key: `${permission.permissionType}_${permission.customerId || 'global'}_${permission.classId || 'global'}`,
        permissionName: permissionTypeNames[permission.permissionType],
        scope: permission.customerId
          ? `客户: ${customers.find(c => c.id === permission.customerId)?.name || 'Unknown'}`
          : permission.classId
            ? `班级: ${mockClasses.find(c => c.id === permission.classId)?.name || 'Unknown'}`
            : '全局'
      }));

      setUserPermissions(formattedPermissions);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 提交客户权限设置
  const handleCustomerPermissionSubmit = async () => {
    try {
      const values = await customerForm.validateFields();

      if (!selectedUser) {
        message.error('未选择用户');
        return;
      }

      // 授予客户权限
      grantCustomerPermission(selectedUser.id, values.customerId, values.permissions, currentUserId);

      message.success('客户权限设置成功');
      setIsCustomerModalVisible(false);

      // 刷新用户权限列表
      const permissions = getUserPermissions(selectedUser.id);
      const formattedPermissions = permissions.map(permission => ({
        ...permission,
        grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
        key: `${permission.permissionType}_${permission.customerId || 'global'}_${permission.classId || 'global'}`,
        permissionName: permissionTypeNames[permission.permissionType],
        scope: permission.customerId
          ? `客户: ${customers.find(c => c.id === permission.customerId)?.name || 'Unknown'}`
          : permission.classId
            ? `班级: ${mockClasses.find(c => c.id === permission.classId)?.name || 'Unknown'}`
            : '全局'
      }));

      setUserPermissions(formattedPermissions);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 提交班级权限设置
  const handleClassPermissionSubmit = async () => {
    try {
      const values = await classForm.validateFields();

      if (!selectedUser) {
        message.error('未选择用户');
        return;
      }

      // 授予班级权限
      grantClassPermission(selectedUser.id, values.classId, values.permissions, currentUserId);

      message.success('班级权限设置成功');
      setIsClassModalVisible(false);

      // 刷新用户权限列表
      const permissions = getUserPermissions(selectedUser.id);
      const formattedPermissions = permissions.map(permission => ({
        ...permission,
        grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
        key: `${permission.permissionType}_${permission.customerId || 'global'}_${permission.classId || 'global'}`,
        permissionName: permissionTypeNames[permission.permissionType],
        scope: permission.customerId
          ? `客户: ${customers.find(c => c.id === permission.customerId)?.name || 'Unknown'}`
          : permission.classId
            ? `班级: ${mockClasses.find(c => c.id === permission.classId)?.name || 'Unknown'}`
            : '全局'
      }));

      setUserPermissions(formattedPermissions);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 撤销权限
  const handleRevokePermission = (record: any) => {
    if (!selectedUser) {
      message.error('未选择用户');
      return;
    }

    if (record.customerId) {
      // 撤销客户权限
      revokeCustomerPermission(selectedUser.id, record.customerId, [record.permissionType], currentUserId);
    } else if (record.classId) {
      // 撤销班级权限
      revokeClassPermission(selectedUser.id, record.classId, [record.permissionType], currentUserId);
    } else {
      // 撤销全局权限
      revokeGlobalPermission(selectedUser.id, [record.permissionType], currentUserId);
    }

    message.success('权限已撤销');

    // 刷新用户权限列表
    const permissions = getUserPermissions(selectedUser.id);
    const formattedPermissions = permissions.map(permission => ({
      ...permission,
      grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
      key: `${permission.permissionType}_${permission.customerId || 'global'}_${permission.classId || 'global'}`,
      permissionName: permissionTypeNames[permission.permissionType],
      scope: permission.customerId
        ? `客户: ${customers.find(c => c.id === permission.customerId)?.name || 'Unknown'}`
        : permission.classId
          ? `班级: ${mockClasses.find(c => c.id === permission.classId)?.name || 'Unknown'}`
          : '全局'
    }));

    setUserPermissions(formattedPermissions);
  };

  // 用户表格列定义
  const userColumns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 100
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名',
      width: 150
    },
    {
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === UserRole.SUPER_ADMIN ? 'gold' : role === UserRole.ADMIN ? 'blue' : 'green'}>
          {roleNames[role as keyof typeof roleNames]}
        </Tag>
      ),
      title: '角色',
      width: 120
    },
    {
      key: 'action',
      render: (_: unknown, record: any) => (
        <Button
          type="link"
          onClick={() => handleUserSelect(record)}
        >
          选择
        </Button>
      ),
      title: '操作',
      width: 100
    }
  ];

  // 权限表格列定义
  const permissionColumns = [
    {
      dataIndex: 'permissionName',
      key: 'permissionName',
      title: '权限类型',
      width: 150
    },
    {
      dataIndex: 'scope',
      key: 'scope',
      title: '权限范围',
      width: 200
    },
    {
      dataIndex: 'grantTime',
      key: 'grantTime',
      title: '授予时间',
      width: 150
    },
    {
      dataIndex: 'grantedBy',
      key: 'grantedBy',
      title: '授予人',
      width: 120
    },
    {
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          danger
          type="link"
          onClick={() => handleRevokePermission(record)}
        >
          撤销
        </Button>
      ),
      title: '操作',
      width: 100
    }
  ];

  return (
    <div className="h-full bg-white p-4 dark:bg-[#141414]">
      <Card
        bordered={false}
        title="权限管理"
      >
        <Row gutter={24}>
          <Col span={8}>
            <Card
              bordered
              title={
                <div className="flex items-center justify-between">
                  <span>用户列表</span>
                  <Input.Search
                    placeholder="搜索用户"
                    style={{ width: 200 }}
                    onChange={e => setUserSearchKey(e.target.value)}
                  />
                </div>
              }
            >
              <Table
                columns={userColumns}
                dataSource={filteredUsers}
                pagination={{ pageSize: 5 }}
                rowClassName={record => (record.id === selectedUser?.id ? 'ant-table-row-selected' : '')}
                rowKey="id"
                size="small"
              />
            </Card>
          </Col>
          <Col span={16}>
            <Card
              bordered
              title={
                <div className="flex items-center justify-between">
                  <span>
                    {selectedUser
                      ? `${selectedUser.name}（${roleNames[selectedUser.role as keyof typeof roleNames]}）的权限`
                      : '用户权限'}
                  </span>
                  <Space>
                    <Button
                      disabled={!selectedUser}
                      icon={<UserOutlined />}
                      type="primary"
                      onClick={openGlobalPermissionModal}
                    >
                      设置全局权限
                    </Button>
                    <Button
                      disabled={!selectedUser}
                      icon={<FileDoneOutlined />}
                      onClick={openCustomerPermissionModal}
                    >
                      设置客户权限
                    </Button>
                    <Button
                      disabled={!selectedUser}
                      onClick={openClassPermissionModal}
                    >
                      设置班级权限
                    </Button>
                  </Space>
                </div>
              }
            >
              {selectedUser ? (
                <Table
                  columns={permissionColumns}
                  dataSource={userPermissions}
                  pagination={{ pageSize: 8 }}
                  rowKey="key"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <span className="text-gray-400">请先选择一个用户</span>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 全局权限设置对话框 */}
      <Modal
        open={isGlobalModalVisible}
        title="设置全局权限"
        onCancel={() => setIsGlobalModalVisible(false)}
        onOk={handleGlobalPermissionSubmit}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="权限选择"
            name="permissions"
            rules={[{ message: '请至少选择一项权限', required: true }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                {Object.entries(permissionTypeNames).map(([key, value]) => (
                  <Col
                    key={key}
                    span={12}
                  >
                    <Checkbox value={key}>{value}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户权限设置对话框 */}
      <Modal
        open={isCustomerModalVisible}
        title="设置客户权限"
        onCancel={() => setIsCustomerModalVisible(false)}
        onOk={handleCustomerPermissionSubmit}
      >
        <Form
          form={customerForm}
          layout="vertical"
        >
          <Form.Item
            label="选择客户"
            name="customerId"
            rules={[{ message: '请选择客户', required: true }]}
          >
            <Select placeholder="请选择客户">
              {customers.map(customer => (
                <Select.Option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name} - {customer.company}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="权限选择"
            name="permissions"
            rules={[{ message: '请至少选择一项权限', required: true }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                <Col span={8}>
                  <Checkbox value={PermissionType.VIEW_CUSTOMER_NAME}>查看姓名</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value={PermissionType.VIEW_CUSTOMER_PHONE}>查看电话</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value={PermissionType.VIEW_CUSTOMER_MOBILE}>查看手机</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value={PermissionType.VIEW_CUSTOMER}>查看信息</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox value={PermissionType.EDIT_CUSTOMER}>编辑信息</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* 班级权限设置对话框 */}
      <Modal
        open={isClassModalVisible}
        title="设置班级权限"
        onCancel={() => setIsClassModalVisible(false)}
        onOk={handleClassPermissionSubmit}
      >
        <Form
          form={classForm}
          layout="vertical"
        >
          <Form.Item
            label="选择班级"
            name="classId"
            rules={[{ message: '请选择班级', required: true }]}
          >
            <Select placeholder="请选择班级">
              {mockClasses.map(classItem => (
                <Select.Option
                  key={classItem.id}
                  value={classItem.id}
                >
                  {classItem.name} - {classItem.teacher}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="权限选择"
            name="permissions"
            rules={[{ message: '请至少选择一项权限', required: true }]}
          >
            <Checkbox.Group>
              <Checkbox value={PermissionType.EDIT_CLASS}>编辑班级信息</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
