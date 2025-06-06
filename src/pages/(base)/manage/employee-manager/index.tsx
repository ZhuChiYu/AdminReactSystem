import { UserOutlined } from '@ant-design/icons';
import { Button as AButton, Card, Checkbox, Form, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type EmployeeApi, employeeService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

// 角色中文名称映射
const roleNames = {
  // 权限角色
  admin: '管理员',
  // 职务角色
  consultant: '顾问',
  employee: '员工',
  general_manager: '总经理',
  hr_bp: '人力BP',
  hr_specialist: '人力专员',
  marketing_manager: '市场部经理',
  sales_director: '销售总监',
  sales_manager: '销售经理',
  super_admin: '超级管理员'
};

// 权限角色选项
const permissionRoleOptions = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '管理员', value: 'admin' },
  { label: '员工', value: 'employee' }
];

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

  // 状态管理
  const [relations, setRelations] = useState<EmployeeManagerRelation[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [managers, setManagers] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | undefined>();
  const [assignRemark, setAssignRemark] = useState('');
  const [editingPermissionRole, setEditingPermissionRole] = useState<{ currentRole: string; id: number } | null>(null);

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
          emp.roles?.some(role => role.code === 'admin' || role.code === 'super_admin')
        );
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

  // 获取未分配的员工
  const getUnassignedEmployees = () => {
    const assignedEmployeeIds = relations.map(r => r.employeeId);
    return employees.filter(
      emp =>
        !assignedEmployeeIds.includes(emp.id) &&
        !emp.roles?.some(role => role.code === 'admin') &&
        !emp.roles?.some(role => role.code === 'super_admin')
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

  // 取消分配
  const handleRemoveAssignment = async (relationId: number) => {
    try {
      setLoading(true);

      // 调用后端API取消分配
      await employeeService.removeEmployeeManagerRelation(relationId);

      message.success('取消分配成功');

      // 重新获取关系数据
      const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
      setRelations(relationsResponse.records);
    } catch (error) {
      console.error('取消分配失败:', error);
      message.error('取消分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取员工的角色中文名称
  const getEmployeeRoleName = (employee: EmployeeApi.EmployeeListItem) => {
    const roleCode = employee.roles?.[0]?.code || '';
    return roleNames[roleCode as keyof typeof roleNames] || roleCode || '未知角色';
  };

  // 处理权限角色修改
  const handlePermissionRoleChange = async (employeeId: number, newRole: string) => {
    try {
      await employeeService.updateEmployeePermissionRole(employeeId, newRole);
      message.success('权限角色更新成功');
      // 刷新列表
      // TODO: 调用获取列表的方法
    } catch (error) {
      message.error('权限角色更新失败');
    }
    setEditingPermissionRole(null);
  };

  // 表格列定义
  const columns = [
    {
      align: 'center',
      dataIndex: 'index',
      key: 'index',
      title: '序号',
      width: 80
    },
    {
      align: 'center',
      dataIndex: 'username',
      key: 'username',
      title: '用户名',
      width: 120
    },
    {
      align: 'center',
      dataIndex: 'password',
      key: 'password',
      render: () => (
        <Space>
          ******
          <AButton
            size="small"
            type="link"
          >
            查看
          </AButton>
        </Space>
      ),
      title: '密码',
      width: 120
    },
    {
      align: 'center',
      dataIndex: 'nickName',
      key: 'nickName',
      title: '姓名',
      width: 120
    },
    {
      align: 'center',
      dataIndex: 'roles',
      key: 'positionRole',
      render: (roles: Array<{ code: string; name: string; type: string }>) => {
        const positionRole = roles.find(role => role.type === 'position');
        return positionRole ? (
          <Tag color="blue">{roleNames[positionRole.code as keyof typeof roleNames] || positionRole.code}</Tag>
        ) : null;
      },
      title: '员工角色',
      width: 120
    },
    {
      align: 'center',
      dataIndex: 'roles',
      key: 'permissionRole',
      render: (roles: Array<{ code: string; name: string; type: string }>, record: any) => {
        const permissionRole = roles.find(role => role.type === 'permission');
        const currentRole = permissionRole?.code || 'employee';

        if (editingPermissionRole?.id === record.id) {
          return (
            <Select
              autoFocus
              defaultValue={currentRole}
              options={permissionRoleOptions}
              style={{ width: 120 }}
              onBlur={() => setEditingPermissionRole(null)}
              onChange={value => handlePermissionRoleChange(record.id, value)}
              onClick={e => e.stopPropagation()}
            />
          );
        }

        const roleColor = currentRole === 'super_admin' ? 'gold' : currentRole === 'admin' ? 'green' : 'blue';

        return (
          <Tag
            color={roleColor}
            style={{ cursor: isSuperAdmin() ? 'pointer' : 'default' }}
            onClick={e => {
              e.stopPropagation();
              if (isSuperAdmin()) {
                setEditingPermissionRole({ currentRole, id: record.id });
              }
            }}
          >
            {roleNames[currentRole as keyof typeof roleNames] || currentRole}
          </Tag>
        );
      },
      title: '权限角色',
      width: 120
    },
    {
      align: 'center',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => <Tag color={gender === '男' ? 'blue' : 'pink'}>{gender}</Tag>,
      title: '性别',
      width: 80
    },
    {
      align: 'center',
      dataIndex: 'phone',
      key: 'phone',
      title: '手机号',
      width: 120
    },
    {
      align: 'center',
      dataIndex: 'email',
      key: 'email',
      title: '邮箱',
      width: 200
    },
    {
      align: 'center',
      dataIndex: 'address',
      key: 'address',
      title: '家庭住址',
      width: 200
    },
    {
      align: 'center',
      dataIndex: 'bankCardNo',
      key: 'bankCardNo',
      title: '银行卡号',
      width: 180
    },
    {
      align: 'center',
      fixed: 'right',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <AButton
            size="small"
            type="link"
          >
            编辑
          </AButton>
          <AButton
            size="small"
            type="link"
          >
            详情
          </AButton>
          {record.username !== 'admin' && (
            <AButton
              danger
              size="small"
              type="link"
            >
              删除
            </AButton>
          )}
        </Space>
      ),
      title: '操作',
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
                const manager = managers.find(mgr => mgr.id === option?.value);
                if (!manager) return false;

                const searchText = input.toLowerCase();
                const nickName = manager.nickName?.toLowerCase() || '';
                const userName = manager.userName?.toLowerCase() || '';
                const roleName = getEmployeeRoleName(manager).toLowerCase();

                return nickName.includes(searchText) || userName.includes(searchText) || roleName.includes(searchText);
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

                return nickName.includes(searchText) || userName.includes(searchText) || roleName.includes(searchText);
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

          <Form.Item
            label="备注"
            name="remark"
            rules={[{ message: '请输入备注', required: true }]}
          >
            <input
              type="text"
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
