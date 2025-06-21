import { AimOutlined, DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { Button as AButton, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { type EmployeeApi, employeeService, employeeTargetService } from '@/service/api';
import type { EmployeeTarget, SetEmployeeTargetRequest } from '@/service/api/employeeTarget';
import { getCurrentUserId, isAdmin, isSuperAdmin } from '@/utils/auth';
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
  const [targetForm] = Form.useForm();

  // 检查用户权限
  const isAdminUser = isAdmin();
  const isSuperAdminUser = isSuperAdmin();
  const canManageTargets = isAdminUser || isSuperAdminUser;

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

  // 员工目标管理相关状态
  const [targets, setTargets] = useState<EmployeeTarget[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EmployeeTarget | null>(null);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);

  // 加载基础数据
  const fetchBasicData = async () => {
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

      // 只有超级管理员才获取员工-管理员关系记录
      if (isSuperAdminUser) {
        const relationsResponse = await employeeService.getEmployeeManagerRelations({ current: 1, size: 1000 });
        setRelations(relationsResponse.records || []);
      }
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

  // 加载员工目标数据
  const fetchTargetData = async () => {
    if (!canManageTargets) return;

    try {
      setTargetLoading(true);
      const response = await employeeTargetService.getEmployeeTargets({
        year: targetYear,
        month: targetMonth,
        current: 1,
        size: 1000
      });
      setTargets(response.records || []);
    } catch (error) {
      console.error('获取目标数据失败:', error);
      message.error('获取目标数据失败');
    } finally {
      setTargetLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchBasicData();
  }, []);

  useEffect(() => {
    if (canManageTargets) {
      fetchTargetData();
    }
  }, [targetYear, targetMonth, canManageTargets]);

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

  // 员工目标管理相关函数
  const handleSetTarget = async () => {
    try {
      const values = await targetForm.validateFields();
      setTargetLoading(true);

      const targetData: SetEmployeeTargetRequest = {
        employeeId: values.employeeId,
        targetYear: values.targetDate.year(),
        targetMonth: values.targetDate.month() + 1,
        targetAmount: values.targetAmount,
        remark: values.remark
      };

      await employeeTargetService.setEmployeeTarget(targetData);
      message.success(editingTarget ? '更新目标成功' : '设置目标成功');

      setIsTargetModalVisible(false);
      setEditingTarget(null);
      targetForm.resetFields();
      fetchTargetData();
    } catch (error) {
      console.error('设置目标失败:', error);
      message.error('设置目标失败');
    } finally {
      setTargetLoading(false);
    }
  };

  const handleEditTarget = (record: EmployeeTarget) => {
    setEditingTarget(record);
    targetForm.setFieldsValue({
      employeeId: record.employeeId,
      targetDate: dayjs(`${record.targetYear}-${record.targetMonth.toString().padStart(2, '0')}-01`),
      targetAmount: record.targetAmount,
      remark: record.remark
    });
    setIsTargetModalVisible(true);
  };

  const handleDeleteTarget = async (id: number) => {
    try {
      await employeeTargetService.deleteEmployeeTarget(id);
      message.success('删除目标成功');
      fetchTargetData();
    } catch (error) {
      console.error('删除目标失败:', error);
      message.error('删除目标失败');
    }
  };

  // 获取管理的员工列表（用于目标设置）
  const getManagedEmployees = () => {
    if (isSuperAdminUser) {
      // 超级管理员可以管理所有员工
      return employees.filter(emp =>
        !emp.roles?.some(role => role.code === 'admin' || role.code === 'super_admin')
      );
    } else if (isAdminUser) {
      // 管理员只能管理分配给自己的员工
      const managedEmployeeIds = relations
        .filter(relation => relation.managerId === getCurrentUserId())
        .map(relation => relation.employeeId);
      return employees.filter(emp => managedEmployeeIds.includes(emp.id));
    }
    return [];
  };

  // 员工目标表格列定义
  const targetColumns = [
    {
      align: 'center' as const,
      dataIndex: 'employeeName',
      key: 'employeeName',
      title: '员工姓名',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'departmentName',
      key: 'departmentName',
      title: '部门',
      width: 120
    },
    {
      align: 'center' as const,
      key: 'targetPeriod',
      render: (_: any, record: EmployeeTarget) => `${record.targetYear}年${record.targetMonth}月`,
      title: '目标月份',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      render: (value: number) => `¥${value.toLocaleString()}`,
      title: '目标金额',
      width: 150
    },
    {
      align: 'center' as const,
      dataIndex: 'managerName',
      key: 'managerName',
      title: '设置人',
      width: 120
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
      render: (_: any, record: EmployeeTarget) => (
        <Space>
          <AButton
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => handleEditTarget(record)}
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
                content: `确定要删除 ${record.employeeName} 的目标吗？`,
                onOk: () => handleDeleteTarget(record.id),
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

  // 关系管理表格列定义
  const relationColumns = [
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

  // 构建Tab项
  const tabItems = [
    // 员工目标管理Tab - 管理员和超级管理员可见
    ...(canManageTargets ? [{
      key: 'targets',
      label: '员工目标管理',
      children: (
        <Card
          title={
            <Space>
              <span>员工目标管理</span>
              <DatePicker.MonthPicker
                value={dayjs(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`)}
                onChange={(date) => {
                  if (date) {
                    setTargetYear(date.year());
                    setTargetMonth(date.month() + 1);
                  }
                }}
                placeholder="选择月份"
              />
            </Space>
          }
          extra={
            <AButton
              icon={<AimOutlined />}
              type="primary"
              onClick={() => {
                setEditingTarget(null);
                targetForm.resetFields();
                setIsTargetModalVisible(true);
              }}
            >
              设置目标
            </AButton>
          }
        >
          <Table
            columns={targetColumns}
            dataSource={targets}
            loading={targetLoading}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            {...getFullTableConfig(10)}
          />
        </Card>
      )
    }] : []),

    // 员工分配管理Tab - 只有超级管理员可见
    ...(isSuperAdminUser ? [{
      key: 'relations',
      label: '员工分配管理',
      children: (
      <Card
          title="员工分配管理"
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
            columns={relationColumns}
          dataSource={relations}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          {...getFullTableConfig(10)}
        />
      </Card>
      )
    }] : [])
  ];

  return (
    <div className="h-full min-h-500px flex-col-stretch gap-16px overflow-hidden">
      <Card title="团队管理">
        <Tabs
          defaultActiveKey={canManageTargets ? 'targets' : 'relations'}
          items={tabItems}
        />
      </Card>

      {/* 员工目标设置模态框 */}
      {canManageTargets && (
        <Modal
          confirmLoading={targetLoading}
          open={isTargetModalVisible}
          title={editingTarget ? '编辑员工目标' : '设置员工目标'}
          width={600}
          onOk={handleSetTarget}
          onCancel={() => {
            setIsTargetModalVisible(false);
            setEditingTarget(null);
            targetForm.resetFields();
          }}
        >
          <Form
            form={targetForm}
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
                filterOption={(input, option) => {
                  const employee = getManagedEmployees().find(emp => emp.id === option?.value);
                  if (!employee) return false;

                  const searchText = input.toLowerCase();
                  const nickName = employee.nickName?.toLowerCase() || '';
                  const userName = employee.userName?.toLowerCase() || '';

                  return nickName.includes(searchText) || userName.includes(searchText);
                }}
              >
                {getManagedEmployees().map(employee => (
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
              label="目标月份"
              name="targetDate"
              rules={[{ message: '请选择目标月份', required: true }]}
            >
              <DatePicker.MonthPicker
                placeholder="选择目标月份"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="目标金额（元）"
              name="targetAmount"
              rules={[
                { message: '请输入目标金额', required: true },
                { message: '目标金额必须大于0', min: 1, type: 'number' }
              ]}
            >
              <InputNumber
                min={0}
                max={10000000}
                step={1000}
                placeholder="请输入目标金额"
                style={{ width: '100%' }}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              label="备注"
              name="remark"
            >
              <Input.TextArea
                rows={3}
                placeholder="请输入备注信息（可选）"
              />
            </Form.Item>

            <Form.Item>
              <div style={{ background: '#f6f6f6', borderRadius: '4px', padding: '12px' }}>
                <h4>目标设置说明：</h4>
                <ul>
                  <li>按月设置员工的业绩目标</li>
                  <li>系统将根据员工的培训费收入和项目收入计算实际业绩</li>
                  <li>管理员只能设置自己管理的员工目标</li>
                  <li>超级管理员可以设置所有员工的目标</li>
                </ul>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* 分配员工模态框 */}
      {isSuperAdminUser && (
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
      )}
    </div>
  );
};

export default EmployeeManagerManagement;
