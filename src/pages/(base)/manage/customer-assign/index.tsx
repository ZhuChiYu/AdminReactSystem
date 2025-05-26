import { CustomerServiceOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Button as AButton, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { customerService, employeeService, type CustomerApi, type EmployeeApi } from '@/service/api';
import { getCurrentUserId, isAdminOrSuperAdmin } from '@/utils/auth';

// 角色中文名称映射
const roleNames = {
  super_admin: '超级管理员',
  admin: '管理员',
  consultant: '顾问',
  marketing_manager: '市场部经理',
  hr_specialist: '人力专员',
  hr_bp: '人力BP',
  sales_manager: '销售经理',
  sales_director: '销售总监'
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
  const currentUserId = getCurrentUserId();

  // 状态管理
  const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
  const [customers, setCustomers] = useState<CustomerApi.CustomerListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>();
  const [remark, setRemark] = useState('');

  // 检查权限
  useEffect(() => {
    if (!isAdminOrSuperAdmin()) {
      message.error('您没有权限访问此页面');
      navigate('/home');
    }
  }, [navigate]);

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 获取客户列表
        const customerResponse = await customerService.getCustomerList({ current: 1, size: 1000 });
        setCustomers(customerResponse.records);

        // 获取员工列表
        const employeeResponse = await employeeService.getEmployeeList({ current: 1, size: 1000 });
        setEmployees(employeeResponse.records);

        // TODO: 获取分配记录 - 这里暂时使用空数组，等后端API实现
        setAssignments([]);
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
    // 如果是超级管理员，可以看到所有员工
    if (Number(currentUserId) === 1) {
      return employees;
    }
    // 如果是管理员，只能看到自己管理的员工
    // TODO: 这里需要根据实际的管理关系来过滤
    return employees.filter(emp => emp.id !== Number(currentUserId));
  };

  // 获取可分配的客户（未分配的客户）
  const getAvailableCustomers = () => {
    const assignedCustomerIds = assignments.map(a => a.customerId);
    return customers.filter(customer => !assignedCustomerIds.includes(customer.id));
  };

  // 分配客户给员工
  const handleAssignCustomers = async () => {
    try {
      setLoading(true);

      if (!selectedEmployee || selectedCustomers.length === 0) {
        message.error('请选择员工和客户');
        return;
      }

      const employee = employees.find(e => e.id === selectedEmployee);

      // TODO: 调用后端API进行分配
      // await customerService.assignCustomers({
      //   employeeId: selectedEmployee,
      //   customerIds: selectedCustomers,
      //   remark
      // });

      // 临时创建分配记录用于展示
      const newAssignments = selectedCustomers.map(customerId => {
        const customer = customers.find(c => c.id === customerId);
        return {
          assignedById: Number(currentUserId),
          assignedByName: '当前管理员',
          assignedTime: new Date().toISOString().split('T')[0],
          assignedToId: selectedEmployee,
          assignedToName: employee?.nickName || '',
          customerId,
          customerName: customer?.customerName || '',
          id: Date.now() + customerId,
          remark
        };
      });

      setAssignments(prev => [...prev, ...newAssignments]);
      setIsModalVisible(false);
      form.resetFields();
      setSelectedCustomers([]);
      setSelectedEmployee(undefined);
      setRemark('');
      message.success('分配成功');
    } catch (error) {
      console.error('分配失败:', error);
      message.error('分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消分配
  const handleUnassign = async (assignmentId: number) => {
    try {
      // TODO: 调用后端API取消分配
      // await customerService.unassignCustomer(assignmentId);

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      message.success('取消分配成功');
    } catch (error) {
      console.error('取消分配失败:', error);
      message.error('取消分配失败');
    }
  };

  // 过滤当前用户相关的分配记录
  const getFilteredAssignments = () => {
    if (Number(currentUserId) === 1) {
      // 超级管理员可以看到所有分配记录
      return assignments;
    }
    // 管理员只能看到自己分配的记录
    return assignments.filter(a => a.assignedById === Number(currentUserId));
  };

  // 获取员工的角色中文名称
  const getEmployeeRoleName = (employee: EmployeeApi.EmployeeListItem) => {
    const roleCode = employee.roles?.[0]?.code || '';
    return roleNames[roleCode as keyof typeof roleNames] || roleCode || '未知角色';
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string) => (
        <Space>
          <CustomerServiceOutlined />
          {text}
        </Space>
      ),
      title: '客户姓名'
    },
    {
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      render: (text: string) => <Tag color="green">{text}</Tag>,
      title: '分配给员工'
    },
    {
      dataIndex: 'assignedByName',
      key: 'assignedByName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
      title: '分配人'
    },
    {
      dataIndex: 'assignedTime',
      key: 'assignedTime',
      title: '分配时间'
    },
    {
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || '-',
      title: '备注'
    },
    {
      key: 'action',
      render: (_: any, record: CustomerAssignment) => (
        <Space>
          {(record.assignedById === Number(currentUserId) || Number(currentUserId) === 1) && (
            <AButton
              danger
              size="small"
              onClick={() => {
                Modal.confirm({
                  content: `确定要取消客户 ${record.customerName} 的分配吗？`,
                  onOk: () => handleUnassign(record.id),
                  title: '确认取消分配'
                });
              }}
            >
              取消分配
            </AButton>
          )}
        </Space>
      ),
      title: '操作'
    }
  ];

  return (
    <div className="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden">
      <Card
        title="客户分配管理"
        extra={
          <AButton
            icon={<UserSwitchOutlined />}
            type="primary"
            onClick={() => setIsModalVisible(true)}
          >
            分配客户
          </AButton>
        }
      >
        <Table
          columns={columns}
          dataSource={getFilteredAssignments()}
          loading={loading}
          rowKey="id"
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 分配客户模态框 */}
      <Modal
        confirmLoading={loading}
        open={isModalVisible}
        title="分配客户给员工"
        width={600}
        onOk={handleAssignCustomers}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedCustomers([]);
          setSelectedEmployee(undefined);
          setRemark('');
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

                return nickName.includes(searchText) ||
                       userName.includes(searchText) ||
                       roleName.includes(searchText);
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
            rules={[{ message: '请选择至少一个客户', required: true }]}
          >
            <Select
              showSearch
              mode="multiple"
              placeholder="请选择客户"
              value={selectedCustomers}
              filterOption={(input, option) => {
                const customer = getAvailableCustomers().find(cust => cust.id === option?.value);
                if (!customer) return false;

                const searchText = input.toLowerCase();
                const customerName = customer.customerName?.toLowerCase() || '';
                const company = customer.company?.toLowerCase() || '';
                const phone = customer.phone?.toLowerCase() || '';
                const mobile = customer.mobile?.toLowerCase() || '';

                return customerName.includes(searchText) ||
                       company.includes(searchText) ||
                       phone.includes(searchText) ||
                       mobile.includes(searchText);
              }}
              onChange={setSelectedCustomers}
            >
              {getAvailableCustomers().map(customer => (
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
          >
            <Input.TextArea
              placeholder="请输入分配备注（可选）"
              rows={3}
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ background: '#f6f6f6', borderRadius: '4px', padding: '12px' }}>
              <h4>分配说明：</h4>
              <ul>
                <li>管理员只能将客户分配给自己管理的员工</li>
                <li>员工只能查看分配给自己的客户</li>
                <li>管理员和员工无法查看不是自己添加的客户的敏感信息</li>
                <li>超级管理员可以查看所有信息</li>
              </ul>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerAssignManagement;
