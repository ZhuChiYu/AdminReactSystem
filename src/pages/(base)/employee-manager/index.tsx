import { AimOutlined, DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button as AButton,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  message
} from 'antd';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useEffect, useState } from 'react';

import { type EmployeeApi, employeeService, employeeTargetService } from '@/service/api';
import type { EmployeeTarget, SetEmployeeTargetRequest } from '@/service/api/employeeTarget';
import { getCurrentUserId, isAdmin, isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';

// 扩展dayjs插件
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

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

// 工具函数：根据年份和周数获取日期范围
const getWeekDateRange = (
  year: number,
  weekNumber: number
): { end: dayjs.Dayjs; endDate: string; start: dayjs.Dayjs; startDate: string } => {
  // 获取指定年份第一天
  const firstDayOfYear = dayjs().year(year).startOf('year');

  // 计算指定周的开始日期（周一）
  const weekStart = firstDayOfYear.isoWeek(weekNumber).startOf('isoWeek');
  const weekEnd = weekStart.endOf('isoWeek');

  return {
    end: weekEnd,
    endDate: weekEnd.format('MM月DD日'),
    start: weekStart,
    startDate: weekStart.format('MM月DD日')
  };
};

// 工具函数：格式化周期显示
const formatPeriodDisplay = (params: {
  month?: number;
  targetType: 'month' | 'week';
  week?: number;
  year: number;
}): string => {
  const { month, targetType, week, year } = params;
  if (targetType === 'month') {
    return `${year}年${month}月`;
  } else if (week) {
    const { endDate, startDate } = getWeekDateRange(year, week);
    return `${year}年第${week}周 (${startDate}-${endDate})`;
  }
  return `${year}年`;
};

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
  const [managedEmployees, setManagedEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);
  const [employeeTargets, setEmployeeTargets] = useState<Record<number, EmployeeTarget>>({});
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeApi.EmployeeListItem | null>(null);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 1);
  const [targetWeek, setTargetWeek] = useState<number>(dayjs().week());
  const [targetType, setTargetType] = useState<'month' | 'week'>('month');

  // 员工目标管理分页状态
  const [targetPagination, setTargetPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 员工分配管理分页状态
  const [relationPagination, setRelationPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取员工分配关系数据（支持分页）
  const fetchRelationsData = async () => {
    if (!canManageTargets) return;

    try {
      const relationsResponse = await employeeService.getEmployeeManagerRelations({
        current: relationPagination.current,
        size: relationPagination.pageSize
      });
      setRelations(relationsResponse.records || []);
      setRelationPagination(prev => ({
        ...prev,
        total: relationsResponse.total || 0
      }));
    } catch (error) {
      console.error('获取员工分配关系失败:', error);
      message.error('获取员工分配关系失败');
    }
  };

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

      // 调试：查找当前用户在员工列表中的信息
      const userInfo = localStg.get('userInfo');
      const currentUserInEmployees = allEmployees.find(
        emp => emp.userName === userInfo?.userName || emp.userName === 'manager1'
      );

      // 过滤出管理员角色的员工
      const managerList = allEmployees.filter(emp =>
        emp.roles?.some(role => role.code === 'admin' || role.code === '管理员')
      );
      setManagers(managerList);

      // 获取员工-管理员关系记录（所有管理员都需要）
      if (canManageTargets) {
        await fetchRelationsData();
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取员工目标数据（支持周/月统计）
  const fetchEmployeeTargets = async () => {
    try {
      const params: any = {
        current: 1,
        size: 1000,
        targetType,
        year: targetYear
      };

      if (targetType === 'month') {
        params.month = targetMonth;
      } else {
        params.week = targetWeek;
      }

      const targetData = await employeeTargetService.getEmployeeTargets(params);

      // 将目标数据转换为以员工ID为键的对象
      const targetsMap: Record<number, EmployeeTarget> = {};
      targetData.records.forEach(target => {
        targetsMap[target.employeeId] = target;
      });

      setEmployeeTargets(targetsMap);
    } catch (error) {
      console.error('获取员工目标数据失败:', error);
    }
  };

  // 获取超级管理员管理的员工列表
  const getSuperAdminManagedEmployees = () => {
    const allEmployees = [...employees];

    // 将员工分为管理员和普通员工
    const adminEmployees = allEmployees.filter(emp =>
      emp.roles?.some(role => role.code === 'admin' || role.code === 'super_admin')
    );
    const regularEmployees = allEmployees.filter(
      emp => !emp.roles?.some(role => role.code === 'admin' || role.code === 'super_admin')
    );

    // 管理员置顶，然后是普通员工
    return [...adminEmployees, ...regularEmployees];
  };

  // 获取当前用户ID
  const getCurrentUserIdForAdmin = () => {
    const userInfo = localStg.get('userInfo');
    let currentUserId: string | number | undefined = getCurrentUserId() || userInfo?.userId;

    // 如果还是没找到，尝试从员工列表中查找
    if (!currentUserId) {
      const currentUserInEmployees = employees.find(
        emp => emp.userName === userInfo?.userName || emp.userName === 'manager1'
      );
      currentUserId = currentUserInEmployees?.id;
    }

    // 如果通过ID匹配不到，尝试通过用户名匹配关系数据中的managerName
    if (!currentUserId && userInfo?.userName) {
      const relationWithCurrentUser = relations.find(
        rel => rel.managerName === userInfo.userName || rel.managerName.includes(userInfo.userName)
      );
      if (relationWithCurrentUser) {
        currentUserId = relationWithCurrentUser.managerId;
      }
    }

    // 临时方案：如果是manager1用户，直接使用ID=2
    if (!currentUserId && (userInfo?.userName === 'manager1' || userInfo?.email?.includes('manager1'))) {
      currentUserId = 2;
    }

    return currentUserId;
  };

  // 获取管理员管理的员工列表
  const getAdminManagedEmployees = () => {
    const currentUserId = getCurrentUserIdForAdmin();
    const currentUserIdNum = Number(currentUserId);

    const managedEmployeeIds = relations
      .filter(relation => relation.managerId === currentUserIdNum)
      .map(relation => relation.employeeId);

    return employees.filter(emp => managedEmployeeIds.includes(emp.id));
  };

  // 获取管理的员工列表（用于目标设置）- 支持分页
  const getManagedEmployeesWithPagination = () => {

    let allEmployees: EmployeeApi.EmployeeListItem[] = [];

    if (isSuperAdminUser) {
      allEmployees = getSuperAdminManagedEmployees();
    } else if (isAdminUser) {
      allEmployees = getAdminManagedEmployees();
    }

    // 计算分页数据
    const total = allEmployees.length;
    const startIndex = (targetPagination.current - 1) * targetPagination.pageSize;
    const endIndex = startIndex + targetPagination.pageSize;
    const paginatedEmployees = allEmployees.slice(startIndex, endIndex);

    return {
      employees: paginatedEmployees,
      total
    };
  };

  // 加载管理的员工数据
  const fetchManagedEmployees = async () => {
    if (!canManageTargets) return;

    try {
      setTargetLoading(true);
      const { employees: paginatedEmployees, total } = getManagedEmployeesWithPagination();
      const userInfo = localStg.get('userInfo');
      setManagedEmployees(paginatedEmployees);

      // 更新分页状态
      setTargetPagination(prev => ({
        ...prev,
        total
      }));

      // 获取员工目标数据
      await fetchEmployeeTargets();
    } catch (error) {
      console.error('获取管理员工数据失败:', error);
      message.error('获取管理员工数据失败');
    } finally {
      setTargetLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchBasicData();
  }, []);

  useEffect(() => {
    if (canManageTargets && employees.length > 0 && relations.length >= 0) {
      fetchManagedEmployees();
    }
  }, [
    targetYear,
    targetMonth,
    targetWeek,
    targetType,
    canManageTargets,
    employees,
    relations,
    targetPagination.current,
    targetPagination.pageSize
  ]);

  // 监听员工分配关系分页变化
  useEffect(() => {
    if (canManageTargets && employees.length > 0) {
      fetchRelationsData();
    }
  }, [relationPagination.current, relationPagination.pageSize]);

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
      await fetchRelationsData();

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
      await fetchRelationsData();
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
  // 设置员工任务目标（支持周/月统计）
  const handleSetTarget = async () => {
    try {
      const values = await targetForm.validateFields();
      setTargetLoading(true);

      // 构建四种任务类型的目标数据
      const targetData: SetEmployeeTargetRequest = {
        consultTarget: values.consultTarget || 0,
        developTarget: values.developTarget || 0,
        employeeId: values.employeeId,
        followUpTarget: values.followUpTarget || 0,
        registerTarget: values.registerTarget || 0,
        remark: values.remark || '',
        targetType: values.targetType,
        targetYear: values.targetYear
      };

      // 根据目标类型设置相应的时间字段
      if (values.targetType === 'month') {
        targetData.targetMonth = values.targetMonth;
      } else {
        targetData.targetWeek = values.targetWeek;
      }

      await employeeTargetService.setEmployeeTarget(targetData);
      message.success(`设置员工${values.targetType === 'month' ? '月' : '周'}目标成功`);

      setIsTargetModalVisible(false);
      setEditingEmployee(null);
      targetForm.resetFields();
      fetchManagedEmployees();
    } catch (error) {
      console.error('设置员工任务目标失败:', error);
      message.error('设置员工任务目标失败');
    } finally {
      setTargetLoading(false);
    }
  };

  // 编辑员工目标（支持周/月统计）
  const handleEditEmployeeTarget = (employee: EmployeeApi.EmployeeListItem) => {
    setEditingEmployee(employee);

    // 获取员工当前的目标数据
    const currentTarget = employeeTargets[employee.id];

    targetForm.setFieldsValue({
      consultTarget: currentTarget?.consultTarget || 0,
      developTarget: currentTarget?.developTarget || 0,
      employeeId: employee.id,
      followUpTarget: currentTarget?.followUpTarget || 0,
      registerTarget: currentTarget?.registerTarget || 0,
      remark: currentTarget?.remark || '',
      targetMonth: currentTarget?.targetMonth || targetMonth,
      targetType: currentTarget?.targetType || targetType,
      targetWeek: currentTarget?.targetWeek || targetWeek,
      targetYear: currentTarget?.targetYear || targetYear
    });
    setIsTargetModalVisible(true);
  };

  // 管理员工列表表格列定义
  const managedEmployeeColumns = [
    {
      align: 'center' as const,
      dataIndex: 'nickName',
      key: 'nickName',
      title: '员工姓名',
      width: 120
    },
    {
      align: 'center' as const,
      dataIndex: 'department',
      key: 'department',
      render: (dept: any) => dept?.name || '-',
      title: '部门',
      width: 120
    },
    {
      align: 'center' as const,
      key: 'targetPeriod',
      render: () => formatPeriodDisplay({ month: targetMonth, targetType, week: targetWeek, year: targetYear }),
      title: '目标周期',
      width: 180
    },
    {
      align: 'center' as const,
      key: 'consultTarget',
      render: (_: any, record: EmployeeApi.EmployeeListItem) => {
        const target = employeeTargets[record.id];
        return target?.consultTarget ?? '-';
      },
      title: '咨询任务目标',
      width: 120
    },
    {
      align: 'center' as const,
      key: 'followUpTarget',
      render: (_: any, record: EmployeeApi.EmployeeListItem) => {
        const target = employeeTargets[record.id];
        return target?.followUpTarget ?? '-';
      },
      title: '回访任务目标',
      width: 120
    },
    {
      align: 'center' as const,
      key: 'developTarget',
      render: (_: any, record: EmployeeApi.EmployeeListItem) => {
        const target = employeeTargets[record.id];
        return target?.developTarget ?? '-';
      },
      title: '开发任务目标',
      width: 120
    },
    {
      align: 'center' as const,
      key: 'registerTarget',
      render: (_: any, record: EmployeeApi.EmployeeListItem) => {
        const target = employeeTargets[record.id];
        return target?.registerTarget ?? '-';
      },
      title: '报名任务目标',
      width: 120
    },
    {
      align: 'center' as const,
      fixed: 'right' as const,
      key: 'action',
      render: (_: any, record: EmployeeApi.EmployeeListItem) => (
        <Space>
          <AButton
            icon={<AimOutlined />}
            size="small"
            type="link"
            onClick={() => handleEditEmployeeTarget(record)}
          >
            设置目标
          </AButton>
        </Space>
      ),
      title: '操作',
      width: 120
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
    ...(canManageTargets
      ? [
          {
            children: (
              <Card
                title={
                  <Space>
                    <span>员工目标管理</span>
                    <Select
                      style={{ width: 100 }}
                      value={targetType}
                      options={[
                        { label: '周目标', value: 'week' },
                        { label: '月目标', value: 'month' }
                      ]}
                      onChange={(value: 'month' | 'week') => {
                        setTargetType(value);
                      }}
                    />
                    {targetType === 'month' ? (
                      <DatePicker.MonthPicker
                        placeholder="选择月份"
                        value={dayjs(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`)}
                        onChange={date => {
                          if (date) {
                            setTargetYear(date.year());
                            setTargetMonth(date.month() + 1);
                          }
                        }}
                      />
                    ) : (
                      <Space>
                        <DatePicker
                          format="YYYY年第WW周 (MM月DD日)"
                          picker="week"
                          placeholder="选择周"
                          style={{ width: 200 }}
                          value={(() => {
                            try {
                              // 根据年份和周数构造日期
                              const { start } = getWeekDateRange(targetYear, targetWeek);
                              return start;
                            } catch {
                              return dayjs().year(targetYear).isoWeek(targetWeek);
                            }
                          })()}
                          onChange={date => {
                            if (date) {
                              setTargetYear(date.year());
                              setTargetWeek(date.isoWeek());
                            }
                          }}
                        />
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {(() => {
                            try {
                              const { endDate, startDate } = getWeekDateRange(targetYear, targetWeek);
                              return `${startDate} 至 ${endDate}`;
                            } catch {
                              return '';
                            }
                          })()}
                        </span>
                      </Space>
                    )}
                  </Space>
                }
              >
                <Table
                  columns={managedEmployeeColumns}
                  dataSource={managedEmployees}
                  loading={targetLoading}
                  rowKey="id"
                  scroll={{ x: 'max-content', y: 500 }}
                  pagination={{
                    current: targetPagination.current,
                    onChange: (page, pageSize) => {
                      setTargetPagination(prev => ({
                        ...prev,
                        current: page,
                        pageSize: pageSize || prev.pageSize
                      }));
                    },
                    onShowSizeChange: (_current, size) => {
                      setTargetPagination(prev => ({
                        ...prev,
                        current: 1, // 改变页面大小时重置到第一页
                        pageSize: size
                      }));
                    },
                    pageSize: targetPagination.pageSize,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                    total: targetPagination.total
                  }}
                />
              </Card>
            ),
            key: 'targets',
            label: '员工目标管理'
          }
        ]
      : []),

    // 员工分配管理Tab - 只有超级管理员可见
    ...(isSuperAdminUser
      ? [
          {
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
                  scroll={{ x: 'max-content', y: 500 }}
                  pagination={{
                    current: relationPagination.current,
                    onChange: (page, pageSize) => {
                      setRelationPagination(prev => ({
                        ...prev,
                        current: page,
                        pageSize: pageSize || prev.pageSize
                      }));
                    },
                    onShowSizeChange: (_current, size) => {
                      setRelationPagination(prev => ({
                        ...prev,
                        current: 1, // 改变页面大小时重置到第一页
                        pageSize: size
                      }));
                    },
                    pageSize: relationPagination.pageSize,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                    total: relationPagination.total
                  }}
                />
              </Card>
            ),
            key: 'relations',
            label: '员工分配管理'
          }
        ]
      : [])
  ];

  return (
    <div className="h-full min-h-500px flex-col-stretch gap-16px">
      <Card title="团队管理">
        <Tabs
          defaultActiveKey={canManageTargets ? 'targets' : 'relations'}
          items={tabItems}
        />
      </Card>

      {/* 员工任务目标设置模态框 */}
      {canManageTargets && (
        <Modal
          confirmLoading={targetLoading}
          open={isTargetModalVisible}
          title="设置员工任务目标"
          width={600}
          onOk={handleSetTarget}
          onCancel={() => {
            setIsTargetModalVisible(false);
            setEditingEmployee(null);
            targetForm.resetFields();
          }}
        >
          <Form
            form={targetForm}
            layout="vertical"
          >
            <Form.Item
              name="employeeId"
              style={{ display: 'none' }}
            >
              <Input type="hidden" />
            </Form.Item>

            <Form.Item
              name="targetYear"
              style={{ display: 'none' }}
            >
              <Input type="hidden" />
            </Form.Item>

            <Form.Item label="员工信息">
              <Input
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
                value={
                  editingEmployee
                    ? `${editingEmployee.nickName || editingEmployee.userName} (${editingEmployee.userName})`
                    : ''
                }
              />
            </Form.Item>

            <Form.Item
              label="目标类型"
              name="targetType"
              rules={[{ message: '请选择目标类型', required: true }]}
            >
              <Select
                placeholder="选择目标类型"
                style={{ width: '100%' }}
                options={[
                  { label: '周目标', value: 'week' },
                  { label: '月目标', value: 'month' }
                ]}
              />
            </Form.Item>

            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <Form.Item
                label="目标年份"
                name="targetYear"
                rules={[{ message: '请选择目标年份', required: true }]}
              >
                <InputNumber
                  max={2030}
                  min={2020}
                  placeholder="年份"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.targetType !== currentValues.targetType}
              >
                {({ getFieldValue }) => {
                  const currentTargetType = getFieldValue('targetType');
                  return currentTargetType === 'month' ? (
                    <Form.Item
                      label="目标月份"
                      name="targetMonth"
                      rules={[{ message: '请选择目标月份', required: true }]}
                    >
                      <Select
                        placeholder="选择月份"
                        style={{ width: '100%' }}
                        options={Array.from({ length: 12 }, (_, i) => ({
                          label: `${i + 1}月`,
                          value: i + 1
                        }))}
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      label="目标周数"
                      name="targetWeek"
                      rules={[{ message: '请选择目标周数', required: true }]}
                    >
                      <div>
                        <DatePicker
                          format="YYYY年第WW周"
                          picker="week"
                          placeholder="选择周"
                          style={{ width: '100%' }}
                          value={(() => {
                            const formYear = targetForm.getFieldValue('targetYear') || new Date().getFullYear();
                            const formWeek = targetForm.getFieldValue('targetWeek') || dayjs().isoWeek();
                            try {
                              const { start } = getWeekDateRange(formYear, formWeek);
                              return start;
                            } catch {
                              return dayjs().year(formYear).isoWeek(formWeek);
                            }
                          })()}
                          onChange={date => {
                            if (date) {
                              targetForm.setFieldsValue({
                                targetWeek: date.isoWeek(),
                                targetYear: date.year()
                              });
                            }
                          }}
                        />
                        <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) =>
                              prev.targetYear !== curr.targetYear || prev.targetWeek !== curr.targetWeek
                            }
                          >
                            {({ getFieldValue: getFormFieldValue }) => {
                              const formYear = getFormFieldValue('targetYear');
                              const formWeek = getFormFieldValue('targetWeek');
                              if (formYear && formWeek) {
                                try {
                                  const { endDate, startDate } = getWeekDateRange(formYear, formWeek);
                                  return `${startDate} 至 ${endDate}`;
                                } catch {
                                  return '';
                                }
                              }
                              return '';
                            }}
                          </Form.Item>
                        </div>
                      </div>
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <div style={{ alignItems: 'end', display: 'flex', paddingBottom: '24px' }}>
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    const now = dayjs();
                    targetForm.setFieldsValue({
                      targetMonth: now.month() + 1,
                      targetWeek: now.isoWeek(),
                      targetYear: now.year()
                    });
                  }}
                >
                  设为当前
                </Button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <Form.Item
                label="咨询任务目标"
                name="consultTarget"
                rules={[{ message: '咨询任务目标必须大于等于0', min: 0, type: 'number' }]}
              >
                <InputNumber
                  max={1000}
                  min={0}
                  placeholder="咨询任务数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="回访任务目标"
                name="followUpTarget"
                rules={[{ message: '回访任务目标必须大于等于0', min: 0, type: 'number' }]}
              >
                <InputNumber
                  max={1000}
                  min={0}
                  placeholder="回访任务数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="开发任务目标"
                name="developTarget"
                rules={[{ message: '开发任务目标必须大于等于0', min: 0, type: 'number' }]}
              >
                <InputNumber
                  max={1000}
                  min={0}
                  placeholder="开发任务数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="报名任务目标"
                name="registerTarget"
                rules={[{ message: '报名任务目标必须大于等于0', min: 0, type: 'number' }]}
              >
                <InputNumber
                  max={1000}
                  min={0}
                  placeholder="报名任务数量"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>

            <Form.Item
              label="备注"
              name="remark"
            >
              <Input.TextArea
                placeholder="请输入备注信息（可选）"
                rows={3}
              />
            </Form.Item>

            <Form.Item>
              <div style={{ background: '#f6f6f6', borderRadius: '4px', padding: '12px' }}>
                <h4>任务目标设置说明：</h4>
                <ul>
                  <li>咨询任务：处理新客户咨询课程情况</li>
                  <li>回访任务：进行客户回访和跟进</li>
                  <li>开发任务：开发新课程计划</li>
                  <li>报名任务：培训课程报名审核</li>
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
