import { UserOutlined } from '@ant-design/icons';
import { Button as AButton, Card, Form, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { employeeService, type EmployeeApi } from '@/service/api';
import { getCurrentUserId, isSuperAdmin } from '@/utils/auth';

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

interface EmployeeManagerRelation {
  assignedById: number;
  assignedByName: string;
  assignedTime: string;
  employeeId: number;
  employeeName: string;
  id: number;
  managerId: number;
  managerName: string;
}

const EmployeeManagerManagement = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const currentUserId = getCurrentUserId();

  // 状态管理
  const [relations, setRelations] = useState<EmployeeManagerRelation[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [managers, setManagers] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | undefined>();

  // 检查权限
  useEffect(() => {
    if (!isSuperAdmin()) {
      message.error('您没有权限访问此页面');
      navigate('/home');
    }
  }, [navigate]);

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 获取员工列表
        const employeeResponse = await employeeService.getEmployeeList({ current: 1, size: 1000 });
        const allEmployees = employeeResponse.records;

        setEmployees(allEmployees);

        // 过滤出管理员角色的员工
        const managerList = allEmployees.filter(emp =>
          emp.roles?.some(role => role.code === 'admin' || role.code === 'manager')
        );
        setManagers(managerList);

        // TODO: 获取员工-管理员关系记录 - 这里暂时使用空数组，等后端API实现
        setRelations([]);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取未分配的员工
  const getUnassignedEmployees = () => {
    const assignedEmployeeIds = relations.map(r => r.employeeId);
    return employees.filter(emp =>
      !assignedEmployeeIds.includes(emp.id) &&
      !emp.roles?.some(role => role.code === 'admin') &&
      !emp.roles?.some(role => role.code === 'super_admin')
    );
  };

  // 分配员工给管理员
  const handleAssignEmployees = async () => {
    try {
      setLoading(true);

      if (!selectedManager || selectedEmployees.length === 0) {
        message.error('请选择管理员和员工');
        return;
      }

      const manager = managers.find(m => m.id === selectedManager);

      // TODO: 调用后端API进行分配
      // await employeeService.assignEmployeesToManager({
      //   managerId: selectedManager,
      //   employeeIds: selectedEmployees
      // });

      // 临时创建关系记录用于展示
      const newRelations = selectedEmployees.map(employeeId => {
        const employee = employees.find(e => e.id === employeeId);
        return {
          assignedById: Number(currentUserId),
          assignedByName: '超级管理员',
          assignedTime: new Date().toISOString().split('T')[0],
          employeeId,
          employeeName: employee?.nickName || '',
          id: Date.now() + employeeId,
          managerId: selectedManager,
          managerName: manager?.nickName || ''
        };
      });

      setRelations(prev => [...prev, ...newRelations]);
      setIsModalVisible(false);
      form.resetFields();
      setSelectedEmployees([]);
      setSelectedManager(undefined);
      message.success('分配成功');
    } catch (error) {
      console.error('分配失败:', error);
      message.error('分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消分配
  const handleUnassign = async (relationId: number) => {
    try {
      // TODO: 调用后端API取消分配
      // await employeeService.unassignEmployeeFromManager(relationId);

      setRelations(prev => prev.filter(r => r.id !== relationId));
      message.success('取消分配成功');
    } catch (error) {
      console.error('取消分配失败:', error);
      message.error('取消分配失败');
    }
  };

  // 获取员工的角色中文名称
  const getEmployeeRoleName = (employee: EmployeeApi.EmployeeListItem) => {
    const roleCode = employee.roles?.[0]?.code || '';
    return roleNames[roleCode as keyof typeof roleNames] || roleCode || '未知角色';
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
      title: '员工姓名'
    },
    {
      dataIndex: 'managerName',
      key: 'managerName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
      title: '管理员'
    },
    {
      dataIndex: 'assignedByName',
      key: 'assignedByName',
      render: (text: string) => <Tag color="green">{text}</Tag>,
      title: '分配人'
    },
    {
      dataIndex: 'assignedTime',
      key: 'assignedTime',
      title: '分配时间'
    },
    {
      key: 'action',
      render: (_: any, record: EmployeeManagerRelation) => (
        <Space>
          <AButton
            danger
            size="small"
            onClick={() => {
              Modal.confirm({
                content: `确定要取消员工 ${record.employeeName} 与管理员 ${record.managerName} 的关系吗？`,
                onOk: () => handleUnassign(record.id),
                title: '确认取消分配'
              });
            }}
          >
            取消分配
          </AButton>
        </Space>
      ),
      title: '操作'
    }
  ];

  return (
    <div className="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden">
      <Card
        title="团队管理"
        extra={
          <AButton
            icon={<UserOutlined />}
            type="primary"
            onClick={() => setIsModalVisible(true)}
          >
            分配员工
          </AButton>
        }
      >
        <Table
          columns={columns}
          dataSource={relations}
          loading={loading}
          rowKey="id"
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 分配员工模态框 */}
      <Modal
        confirmLoading={loading}
        open={isModalVisible}
        title="分配员工给管理员"
        width={600}
        onOk={handleAssignEmployees}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedEmployees([]);
          setSelectedManager(undefined);
        }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="选择管理员"
            name="managerId"
            rules={[{ message: '请选择管理员', required: true }]}
          >
            <Select
              showSearch
              placeholder="请选择管理员"
              value={selectedManager}
              filterOption={(input, option) => {
                const manager = managers.find(mgr => mgr.id === option?.value);
                if (!manager) return false;

                const searchText = input.toLowerCase();
                const nickName = manager.nickName?.toLowerCase() || '';
                const userName = manager.userName?.toLowerCase() || '';
                const roleName = getEmployeeRoleName(manager).toLowerCase();

                return nickName.includes(searchText) ||
                       userName.includes(searchText) ||
                       roleName.includes(searchText);
              }}
              onChange={setSelectedManager}
            >
              {managers.map(manager => (
                <Select.Option
                  key={manager.id}
                  value={manager.id}
                >
                  {manager.nickName} ({getEmployeeRoleName(manager)})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="选择员工"
            name="employeeIds"
            rules={[{ message: '请选择至少一个员工', required: true }]}
          >
            <Select
              showSearch
              mode="multiple"
              placeholder="请选择员工"
              value={selectedEmployees}
              filterOption={(input, option) => {
                const employee = getUnassignedEmployees().find(emp => emp.id === option?.value);
                if (!employee) return false;

                const searchText = input.toLowerCase();
                const nickName = employee.nickName?.toLowerCase() || '';
                const userName = employee.userName?.toLowerCase() || '';
                const roleName = getEmployeeRoleName(employee).toLowerCase();

                return nickName.includes(searchText) ||
                       userName.includes(searchText) ||
                       roleName.includes(searchText);
              }}
              onChange={setSelectedEmployees}
            >
              {getUnassignedEmployees().map(employee => (
                <Select.Option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.nickName} ({getEmployeeRoleName(employee)})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <div style={{ background: '#f6f6f6', borderRadius: '4px', padding: '12px' }}>
              <h4>分配说明：</h4>
              <ul>
                <li>管理员可以查看和管理分配给他们的员工</li>
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

export default EmployeeManagerManagement;
