import {
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { Button as AButton, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type CustomerApi, type EmployeeApi, customerService, employeeService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

// 角色中文名称映射
const roleNames = {
  admin: '管理员',
  consultant: '顾问',
  hr_bp: '人力BP',
  hr_specialist: '人力专员',
  marketing_manager: '市场部经理',
  sales_director: '销售总监',
  sales_manager: '销售经理',
  super_admin: '超级管理员'
};

interface CustomerAssignment {
  assignedById: number;
  assignedByName: string;
  assignedTime: string;
  assignedToId: number;
  assignedToName: string;
  customerId: number;
  customerName: string;
  id: number;
  remark?: string;
}

const CustomerAssignManagement = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 直接从localStorage获取用户信息和ID
  const userInfo = localStg.get('userInfo');
  const currentUserId = userInfo?.userId || '';
  console.log('🔍 用户信息:', userInfo);
  console.log('🔍 用户ID:', currentUserId);

  // 状态管理
  const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
  const [customers, setCustomers] = useState<CustomerApi.CustomerListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>();
  const [assignRemark, setAssignRemark] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<CustomerAssignment | null>(null);

  // 检查权限
  useEffect(() => {
    if (!isSuperAdmin()) {
      message.error('只有超级管理员可以访问此页面');
      navigate('/home');
    }
  }, [navigate]);

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 获取客户列表（所有数据）
        const customerResponse = await customerService.getCustomerList({
          current: 1,
          size: 1000
        });
        setCustomers(customerResponse.records);

        // 获取员工列表
        const employeeResponse = await employeeService.getEmployeeList({ current: 1, size: 1000 });
        setEmployees(employeeResponse.records);

        // 获取客户分配记录
        const assignmentResponse = await customerService.getCustomerAssignments({ current: 1, size: 1000 });
        console.log('🔍 初始加载分配数据:', assignmentResponse);
        setAssignments(assignmentResponse.records);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取当前用户管理的员工
  const getManagedEmployees = () => {
    // 超级管理员可以看到所有员工
    return employees;
  };

  // 获取可分配的客户（未分配的客户）
  const getAvailableCustomers = () => {
    const assignedCustomerIds = assignments.map(a => a.customerId);
    return customers.filter(customer => !assignedCustomerIds.includes(customer.id));
  };

  // 获取可选的客户列表
  const getSelectableCustomers = () => {
    // 如果是编辑模式，返回所有客户
    if (editingAssignment) {
      return customers;
    }

    // 如果是新增模式，过滤掉已经分配的客户
    return customers.filter(customer => !assignments.some(assignment => assignment.customerId === customer.id));
  };

  // 分配客户给员工
  const handleAssign = async () => {
    if (!editingAssignment && (selectedCustomers.length === 0 || !selectedEmployee)) {
      message.warning('请选择客户和员工');
      return;
    }

    try {
      setLoading(true);

      if (editingAssignment) {
        // 更新现有分配
        await customerService.updateCustomerAssignment(editingAssignment.id, {
          customerId: selectedCustomers[0],
          employeeId: selectedEmployee!,
          remark: assignRemark
        });
        message.success('更新成功');
      } else {
        // 新建分配
        await customerService.assignCustomers({
          assignedToId: selectedEmployee!,
          customerIds: selectedCustomers,
          remark: assignRemark
        });
        message.success('分配成功');
      }

      // 重新获取分配列表
      const assignmentsResponse = await customerService.getCustomerAssignments({ current: 1, size: 1000 });
      setAssignments(assignmentsResponse.records || []);

      // 清空选择
      setSelectedCustomers([]);
      setSelectedEmployee(undefined);
      setAssignRemark('');
      setIsModalVisible(false);
      setEditingAssignment(null);
      form.resetFields();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除分配关系
  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await customerService.removeCustomerAssignment(id);
      message.success('删除成功');

      // 重新获取分配列表
      const assignmentsResponse = await customerService.getCustomerAssignments({ current: 1, size: 1000 });
      setAssignments(assignmentsResponse.records || []);
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const handleEdit = (record: CustomerAssignment) => {
    setEditingAssignment(record);
    setSelectedCustomers([record.customerId]);
    setSelectedEmployee(record.assignedToId);
    setAssignRemark(record.remark || '');
    form.setFieldsValue({
      customerIds: [record.customerId],
      employeeId: record.assignedToId,
      remark: record.remark
    });
    setIsModalVisible(true);
  };

  // 获取员工的角色中文名称
  const getEmployeeRoleName = (employee: EmployeeApi.EmployeeListItem) => {
    const roleCode = employee.roles?.[0]?.code || '';
    return roleNames[roleCode as keyof typeof roleNames] || roleCode || '未知角色';
  };

  // 表格列定义
  const columns = [
    {
      align: 'center' as const,
      dataIndex: 'customerName',
      key: 'customerName',
      title: '客户姓名',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      title: '分配给员工',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'assignedByName',
      key: 'assignedByName',
      title: '分配人',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'assignedTime',
      key: 'assignedTime',
      title: '分配时间',
      width: 180
    },
    {
      align: 'center' as const,
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || '-',
      title: '备注',
      width: 200
    },
    {
      align: 'center' as const,
      fixed: 'right' as const,
      key: 'action',
      render: (_: any, record: CustomerAssignment) => (
        <Space>
          <AButton
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => handleEdit(record)}
          >
            编辑
          </AButton>
          <AButton
            danger
            icon={<DeleteOutlined />}
            size="small"
            type="link"
            onClick={() => {
              Modal.confirm({
                content: `确定要删除 ${record.customerName} 的分配关系吗？`,
                onOk: () => handleDelete(record.id),
                title: '确认删除'
              });
            }}
          >
            删除
          </AButton>
        </Space>
      ),
      title: '操作',
      width: 150
    }
  ];

  return (
    <div className="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden">
      <Card
        title="客户分配管理"
        extra={
          <AButton
            icon={<UserOutlined />}
            type="primary"
            onClick={() => {
              setEditingAssignment(null);
              setSelectedCustomers([]);
              setSelectedEmployee(undefined);
              setAssignRemark('');
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            分配客户
          </AButton>
        }
      >
        <Table
          columns={columns}
          dataSource={assignments}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 分配客户模态框 */}
      <Modal
        confirmLoading={loading}
        open={isModalVisible}
        title={editingAssignment ? '编辑分配关系' : '分配客户给员工'}
        width={600}
        onOk={handleAssign}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingAssignment(null);
          form.resetFields();
          setSelectedCustomers([]);
          setSelectedEmployee(undefined);
          setAssignRemark('');
        }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="选择员工"
            name="employeeId"
            rules={[{ message: '请选择员工', required: true }]}
          >
            <Select
              showSearch
              placeholder="请选择员工"
              value={selectedEmployee}
              filterOption={(input, option) => {
                const employee = getManagedEmployees().find(emp => emp.id === option?.value);
                if (!employee) return false;

                const searchText = input.toLowerCase();
                const nickName = employee.nickName?.toLowerCase() || '';
                const userName = employee.userName?.toLowerCase() || '';
                const roleName = getEmployeeRoleName(employee).toLowerCase();

                return nickName.includes(searchText) || userName.includes(searchText) || roleName.includes(searchText);
              }}
              onChange={setSelectedEmployee}
            >
              {getManagedEmployees().map(employee => (
                <Select.Option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.nickName} ({getEmployeeRoleName(employee)})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="选择客户"
            name="customerIds"
            rules={[{ message: '请选择客户', required: true }]}
          >
            <Select
              showSearch
              mode={editingAssignment ? undefined : 'multiple'}
              placeholder="请选择客户"
              value={selectedCustomers}
              filterOption={(input, option) => {
                const customer = getSelectableCustomers().find(c => c.id === option?.value);
                if (!customer) return false;

                const searchText = input.toLowerCase();
                const customerName = customer.customerName?.toLowerCase() || '';
                const company = customer.company?.toLowerCase() || '';
                const phone = customer.phone?.toLowerCase() || '';
                const mobile = customer.mobile?.toLowerCase() || '';

                return (
                  customerName.includes(searchText) ||
                  company.includes(searchText) ||
                  phone.includes(searchText) ||
                  mobile.includes(searchText)
                );
              }}
              onChange={value => setSelectedCustomers(Array.isArray(value) ? value : [value])}
            >
              {getSelectableCustomers().map(customer => (
                <Select.Option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.customerName} ({customer.company})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
            rules={[{ message: '请输入备注', required: true }]}
          >
            <Input
              value={assignRemark}
              onChange={e => setAssignRemark(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ background: '#f6f6f6', borderRadius: '4px', padding: '12px' }}>
              <h4>分配说明：</h4>
              <ul>
                <li>管理员可以为所属员工分配客户</li>
                <li>员工只能查看分配给自己的客户</li>
              </ul>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerAssignManagement;
