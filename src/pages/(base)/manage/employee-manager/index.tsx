import { DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { Button as AButton, Card, Form, Input, Modal, Select, Space, Table, message } from 'antd';
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
  remark?: string;
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
  const [editingRelation, setEditingRelation] = useState<EmployeeManagerRelation | null>(null);

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 获取所有员工列表
        const employeeResponse = await employeeService.getEmployeeList({
          current: 1,
          size: 1000,
          status: 'active' // 只获取有效的员工
        });
        const allEmployees = employeeResponse.records || [];

        // 设置所有员工数据
        setEmployees(allEmployees);

        // 过滤出管理员角色的员工
        const managerList = allEmployees.filter(emp =>
          emp.roles?.some(role => role.code === 'admin' || role.code === '管理员')
        );
        setManagers(managerList);

        // 获取员工-管理员关系记录
        const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
        setRelations(relationsResponse.records || []);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取可选的员工列表
  const getSelectableEmployees = () => {
    // 过滤出所有员工（不包括管理员）
    const employeeList = employees.filter(emp => {
      // 检查是否是管理员
      const isManager = emp.roles?.some(
        role =>
          role.code === 'admin' || role.code === '管理员' || role.code === '超级管理员' || role.code === 'super_admin'
      );
      if (isManager) return false;

      return true;
    });

    // 如果是编辑模式，返回所有员工和当前正在编辑的员工
    if (editingRelation) {
      return employeeList;
    }

    // 如果是新增模式，过滤掉已经分配的员工
    return employeeList.filter(emp => !relations.some(r => r.employeeId === emp.id));
  };

  // 分配员工给管理员
  const handleAssign = async () => {
    if (selectedEmployees.length === 0 || !selectedManager) {
      message.warning('请选择员工和管理员');
      return;
    }

    try {
      setLoading(true);

      if (editingRelation) {
        // 更新现有分配
        await employeeService.updateEmployeeManagerRelation(editingRelation.id, {
          employeeId: selectedEmployees[0],
          managerId: selectedManager,
          remark: assignRemark
        });
        message.success('更新成功');
      } else {
        // 新建分配
        await employeeService.assignEmployeesToManager({
          employeeIds: selectedEmployees,
          managerId: selectedManager,
          remark: assignRemark
        });
        message.success('分配成功');
      }

      // 重新获取关系数据
      const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
      setRelations(relationsResponse.records);

      // 清空选择
      setSelectedEmployees([]);
      setSelectedManager(undefined);
      setAssignRemark('');
      setIsModalVisible(false);
      setEditingRelation(null);
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
      await employeeService.removeEmployeeManagerRelation(id);
      message.success('删除成功');

      // 重新获取关系数据
      const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
      setRelations(relationsResponse.records);
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const handleEdit = (record: EmployeeManagerRelation) => {
    setEditingRelation(record);
    setSelectedEmployees([record.employeeId]);
    setSelectedManager(record.managerId);
    setAssignRemark(record.remark || '');
    form.setFieldsValue({
      employeeIds: [record.employeeId],
      managerId: record.managerId,
      remark: record.remark
    });
    setIsModalVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      align: 'center' as const,
      dataIndex: 'employeeName',
      key: 'employeeName',
      title: '员工姓名',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'managerName',
      key: 'managerName',
      title: '管理员姓名',
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
      render: (_: any, record: EmployeeManagerRelation) => (
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
                content: `确定要删除 ${record.employeeName} 的分配关系吗？`,
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
        title="团队管理"
        extra={
          <AButton
            icon={<UserOutlined />}
            type="primary"
            onClick={() => {
              setEditingRelation(null);
              setSelectedEmployees([]);
              setSelectedManager(undefined);
              setAssignRemark('');
              form.resetFields();
              setIsModalVisible(true);
            }}
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
          scroll={{ x: 'max-content' }}
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 分配员工模态框 */}
      <Modal
        confirmLoading={loading}
        open={isModalVisible}
        title={editingRelation ? '编辑分配关系' : '分配员工给管理员'}
        width={600}
        onOk={handleAssign}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRelation(null);
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
            rules={[{ message: '请选择员工', required: true }]}
          >
            <Select
              showSearch
              mode={editingRelation ? undefined : 'multiple'}
              placeholder="请选择员工"
              value={selectedEmployees}
              filterOption={(input, option) => {
                const employee = getSelectableEmployees().find(emp => emp.id === option?.value);
                if (!employee) return false;

                const searchText = input.toLowerCase();
                const nickName = employee.nickName?.toLowerCase() || '';
                const userName = employee.userName?.toLowerCase() || '';

                return nickName.includes(searchText) || userName.includes(searchText);
              }}
              onChange={value => setSelectedEmployees(Array.isArray(value) ? value : [value])}
            >
              {getSelectableEmployees().map(employee => (
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
