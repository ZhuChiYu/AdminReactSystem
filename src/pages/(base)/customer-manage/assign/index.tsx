import { UserAddOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useCustomerStore, { type CustomerInfo } from '@/store/customerStore';
import usePermissionStore from '@/store/permissionStore';
import { UserRole, getCurrentUserId, isAdminOrSuperAdmin, isSuperAdmin } from '@/utils/auth';

// 模拟用户列表 - 实际应用中应从API获取
const mockUsers = [
  { id: '1', name: '张三', role: UserRole.SUPER_ADMIN },
  { id: '2', name: '李四', role: UserRole.ADMIN },
  { id: '3', name: '王五', role: UserRole.EMPLOYEE },
  { id: '4', name: '赵六', role: UserRole.EMPLOYEE },
  { id: '5', name: '钱七', role: UserRole.EMPLOYEE }
];

// 角色名称显示映射
const roleNames = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.EMPLOYEE]: '员工'
};

/** 客户分配组件 */
const CustomerAssignment = () => {
  const navigate = useNavigate();

  // 获取当前用户信息
  const currentUserId = getCurrentUserId();

  // 从状态管理器获取客户数据和分配方法
  const { assignCustomersToEmployee, assignCustomerToEmployee, getUnassignedCustomers } = useCustomerStore();

  // 从权限管理器获取权限检查方法
  const { hasPermission } = usePermissionStore();

  // 未分配的客户列表
  const [unassignedCustomers, setUnassignedCustomers] = useState<CustomerInfo[]>([]);

  // 分配表单
  const [form] = Form.useForm();

  // 批量分配表单
  const [batchForm] = Form.useForm();

  // 选中的客户ID列表（用于批量分配）
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);

  // 模态框状态
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isBatchAssignModalVisible, setIsBatchAssignModalVisible] = useState(false);

  // 当前选中的客户（用于单个分配）
  const [currentCustomer, setCurrentCustomer] = useState<CustomerInfo | null>(null);

  // 判断当前用户角色
  const isUserSuperAdmin = isSuperAdmin();

  // 刷新未分配客户列表
  const refreshUnassignedCustomers = () => {
    const unassigned = getUnassignedCustomers();
    setUnassignedCustomers(unassigned);
  };

  // 检查权限
  useEffect(() => {
    // 超级管理员和管理员都可以访问
    if (!(isSuperAdmin() || isAdminOrSuperAdmin())) {
      message.error('您没有权限访问此页面');
      navigate('/home');
    }
  }, [currentUserId, hasPermission, navigate]);

  // 初始化时获取未分配的客户
  useEffect(() => {
    refreshUnassignedCustomers();
  }, []);

  // 打开单个客户分配弹窗
  const openAssignModal = (customer: CustomerInfo) => {
    setCurrentCustomer(customer);
    form.resetFields();
    setIsAssignModalVisible(true);
  };

  // 打开批量分配弹窗
  const openBatchAssignModal = () => {
    if (selectedCustomerIds.length === 0) {
      message.warning('请先选择客户');
      return;
    }

    batchForm.resetFields();
    setIsBatchAssignModalVisible(true);
  };

  // 提交单个客户分配
  const handleAssignSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!currentCustomer) {
        message.error('未选择客户');
        return;
      }

      // 判断当前用户是否为管理员，并且尝试分配给自己
      if (isAdminOrSuperAdmin() && values.employeeId === currentUserId && !isSuperAdmin()) {
        message.error('管理员不能将客户分配给自己');
        return;
      }

      // 分配客户
      assignCustomerToEmployee(currentCustomer.id, values.employeeId, currentUserId);

      message.success('客户分配成功');
      setIsAssignModalVisible(false);
      refreshUnassignedCustomers();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 提交批量分配
  const handleBatchAssignSubmit = async () => {
    try {
      const values = await batchForm.validateFields();

      // 判断当前用户是否为管理员，并且尝试分配给自己
      if (isAdminOrSuperAdmin() && values.employeeId === currentUserId && !isSuperAdmin()) {
        message.error('管理员不能将客户分配给自己');
        return;
      }

      // 批量分配客户
      assignCustomersToEmployee(selectedCustomerIds, values.employeeId, currentUserId);

      message.success('批量分配成功');
      setIsBatchAssignModalVisible(false);
      refreshUnassignedCustomers();
      setSelectedCustomerIds([]);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 表格选择变更处理
  const onSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedCustomerIds(selectedRowKeys as number[]);
  };

  // 表格行选择配置
  const rowSelection = {
    onChange: onSelectionChange,
    selectedRowKeys: selectedCustomerIds
  };

  // 客户表格列定义（管理员敏感信息脱敏，超管可见全信息）
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 60
    },
    {
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (isUserSuperAdmin ? text : '***'),
      title: '客户姓名',
      width: 120
    },
    {
      dataIndex: 'company',
      key: 'company',
      title: '公司名称',
      width: 200
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      width: 120
    },
    {
      dataIndex: 'source',
      key: 'source',
      title: '来源',
      width: 120
    },
    {
      dataIndex: 'createTime',
      key: 'createTime',
      title: '创建时间',
      width: 180
    },
    {
      key: 'action',
      render: (_: any, record: CustomerInfo) => (
        <Button
          icon={<UserSwitchOutlined />}
          type="primary"
          onClick={() => openAssignModal(record)}
        >
          分配
        </Button>
      ),
      title: '操作',
      width: 120
    }
  ];

  // 过滤出可以分配客户的员工（不包括当前管理员，除非是超级管理员）
  const getAvailableEmployees = () => {
    if (isUserSuperAdmin) {
      // 超级管理员可以分配给任何人
      return mockUsers.filter(user => user.role === UserRole.EMPLOYEE || user.role === UserRole.ADMIN);
    }
    // 管理员不能分配给自己
    return mockUsers.filter(user => user.role === UserRole.EMPLOYEE && user.id !== currentUserId);
  };

  return (
    <div className="h-full bg-white p-4 dark:bg-[#141414]">
      <Card
        title="客户分配管理"
        extra={
          <Space>
            <Button
              disabled={selectedCustomerIds.length === 0}
              icon={<UserAddOutlined />}
              type="primary"
              onClick={openBatchAssignModal}
            >
              批量分配
            </Button>
            <Tag color="blue">未分配客户: {unassignedCustomers.length}</Tag>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={unassignedCustomers}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          rowSelection={rowSelection}
        />
      </Card>

      {/* 单个客户分配弹窗 */}
      <Modal
        open={isAssignModalVisible}
        title="分配客户"
        onCancel={() => setIsAssignModalVisible(false)}
        onOk={handleAssignSubmit}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item label="客户信息">
            <div>
              {currentCustomer?.name} - {currentCustomer?.company}
            </div>
          </Form.Item>
          <Form.Item
            label="选择员工"
            name="employeeId"
            rules={[{ message: '请选择员工', required: true }]}
          >
            <Select placeholder="请选择要分配的员工">
              {getAvailableEmployees().map(employee => (
                <Select.Option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ({roleNames[employee.role as keyof typeof roleNames]})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量分配弹窗 */}
      <Modal
        open={isBatchAssignModalVisible}
        title="批量分配客户"
        onCancel={() => setIsBatchAssignModalVisible(false)}
        onOk={handleBatchAssignSubmit}
      >
        <Form
          form={batchForm}
          layout="vertical"
        >
          <Form.Item
            label="选择员工"
            name="employeeId"
            rules={[{ message: '请选择员工', required: true }]}
          >
            <Select placeholder="请选择要分配的员工">
              {getAvailableEmployees().map(employee => (
                <Select.Option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ({roleNames[employee.role as keyof typeof roleNames]})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="已选客户">
            <div>已选择 {selectedCustomerIds.length} 个客户</div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerAssignment;
