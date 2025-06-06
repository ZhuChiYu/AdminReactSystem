import { UserOutlined } from '@ant-design/icons';
import { Button as AButton, Card, Form, Input, Modal, Select, Table, message } from 'antd';
import { useEffect, useState } from 'react';

import { type EmployeeApi, employeeService } from '@/service/api';
import { getFullTableConfig } from '@/utils/table';

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
  const [form] = Form.useForm();

  // 状态管理
  const [relations, setRelations] = useState<EmployeeManagerRelation[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [managers, setManagers] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | undefined>();
  const [assignRemark, setAssignRemark] = useState('');

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
        const managerList = allEmployees.filter(emp => emp.roles?.some(role => role.code === 'admin'));
        setManagers(managerList);

        // 获取员工-管理员关系记录
        const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
        setRelations(relationsResponse.records);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取未分配的员工（只显示权限角色为"员工"的用户）
  const getUnassignedEmployees = () => {
    const assignedEmployeeIds = relations.map(r => r.employeeId);
    return employees.filter(
      emp => !assignedEmployeeIds.includes(emp.id) && emp.roles?.some(role => role.code === 'employee')
    );
  };

  // 分配员工给管理员
  const handleAssign = async () => {
    if (selectedEmployees.length === 0 || !selectedManager) {
      message.warning('请选择员工和管理员');
      return;
    }

    try {
      setLoading(true);

      // 调用后端API进行分配
      await employeeService.assignEmployeesToManager({
        employeeIds: selectedEmployees,
        managerId: selectedManager,
        remark: assignRemark
      });

      message.success('分配成功');

      // 重新获取关系数据
      const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
      setRelations(relationsResponse.records);

      // 清空选择
      setSelectedEmployees([]);
      setSelectedManager(undefined);
      setAssignRemark('');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('分配失败:', error);
      message.error('分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'employeeName',
      key: 'employeeName',
      title: '员工姓名',
      width: 120
    },
    {
      dataIndex: 'managerName',
      key: 'managerName',
      title: '管理员姓名',
      width: 120
    },
    {
      dataIndex: 'assignedByName',
      key: 'assignedByName',
      title: '分配人',
      width: 120
    },
    {
      dataIndex: 'assignedTime',
      key: 'assignedTime',
      title: '分配时间',
      width: 180
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
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 分配员工模态框 */}
      <Modal
        confirmLoading={loading}
        open={isModalVisible}
        title="分配员工给管理员"
        width={600}
        onOk={handleAssign}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedEmployees([]);
          setSelectedManager(undefined);
          setAssignRemark('');
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
                const manager = managers.find(m => m.id === option?.value);
                if (!manager) return false;

                const searchText = input.toLowerCase();
                const nickName = manager.nickName?.toLowerCase() || '';
                const userName = manager.userName?.toLowerCase() || '';

                return nickName.includes(searchText) || userName.includes(searchText);
              }}
              onChange={setSelectedManager}
            >
              {managers.map(manager => (
                <Select.Option
                  key={manager.id}
                  value={manager.id}
                >
                  {manager.nickName} ({manager.userName})
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

                return nickName.includes(searchText) || userName.includes(searchText);
              }}
              onChange={setSelectedEmployees}
            >
              {getUnassignedEmployees().map(employee => (
                <Select.Option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.nickName} ({employee.userName})
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
