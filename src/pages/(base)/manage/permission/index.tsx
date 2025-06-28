import { FileDoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type EmployeeApi, employeeService, customerService } from '@/service/api';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { UserRole, getCurrentUserId, isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

// 权限类型中文名称映射
const permissionTypeNames = {
  [PermissionType.VIEW_CUSTOMER_NAME]: '查看客户姓名',
  [PermissionType.VIEW_CUSTOMER_PHONE]: '查看客户电话',
  [PermissionType.VIEW_CUSTOMER_MOBILE]: '查看客户手机',
  [PermissionType.VIEW_CUSTOMER]: '查看客户信息',
  [PermissionType.EDIT_CUSTOMER]: '编辑客户信息',
  [PermissionType.EDIT_CLASS]: '编辑班级信息',
  [PermissionType.ASSIGN_CUSTOMER]: '分配客户',
  [PermissionType.VIEW_CLASS_STUDENT_NAME]: '查看班级学员姓名',
  [PermissionType.VIEW_CLASS_STUDENT_PHONE]: '查看班级学员电话',
  [PermissionType.VIEW_CLASS_STUDENT_MOBILE]: '查看班级学员手机',
  [PermissionType.VIEW_CLASS_STUDENT]: '查看班级学员信息',
  [PermissionType.EDIT_CLASS_STUDENT]: '编辑班级学员信息'
};

// 角色中文名称映射
const roleNames = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.CONSULTANT]: '顾问',
  [UserRole.MARKETING_MANAGER]: '市场部经理',
  [UserRole.HR_SPECIALIST]: '人力专员',
  [UserRole.HR_BP]: '人力BP',
  [UserRole.SALES_MANAGER]: '销售经理',
  [UserRole.SALES_DIRECTOR]: '销售总监'
};

// 权限管理组件
const PermissionManagement = () => {
  const navigate = useNavigate();

  // 获取当前用户信息
  const currentUserId = getCurrentUserId();

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

  // 客户列表数据
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  // 员工列表数据
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 班级列表数据 - 新增状态
  const [classes, setClasses] = useState<any[]>([]);
  const [classLoading, setClassLoading] = useState(false);

  // 员工列表分页状态
  const [employeePagination, setEmployeePagination] = useState({
    current: 1,
    size: 10,
    total: 0
  });

  // 检查是否为超级管理员
  useEffect(() => {
    if (!isSuperAdmin()) {
      // 不是超级管理员，重定向到首页
      message.error('您没有权限访问此页面');
      navigate('/home');
    }
  }, [navigate]);

  // 加载员工数据
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeService.getEmployeeList({
          current: employeePagination.current,
          size: employeePagination.size
        });
        setEmployees(response.records);
        setEmployeePagination(prev => ({
          ...prev,
          total: response.total
        }));
      } catch (error) {
        console.error('获取员工列表失败:', error);
        message.error('获取员工列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [employeePagination.current, employeePagination.size]);

  // 加载客户数据
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomerLoading(true);
        const { customerService } = await import('@/service/api/customer');
        const response = await customerService.getCustomerList({ current: 1, size: 1000 });
        setCustomers(response.records || []);
      } catch (error) {
        console.error('获取客户列表失败:', error);
        message.error('获取客户列表失败');
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // 加载班级数据 - 新增
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassLoading(true);
        // 使用classService获取班级列表
        const { classService } = await import('@/service/api/class');
        const response = await classService.getClassList({ current: 1, size: 1000 });
        setClasses(response.records || []);
      } catch (error) {
        console.error('获取班级列表失败:', error);
        message.error('获取班级列表失败');
      } finally {
        setClassLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // 当前选择的员工
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

  // 编辑状态
  const [isEditingPermission, setIsEditingPermission] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // 员工搜索关键字
  const [userSearchKey, setUserSearchKey] = useState('');

  // 过滤后的员工列表
  const [filteredUsers, setFilteredUsers] = useState<EmployeeApi.EmployeeListItem[]>([]);

  // 员工权限列表
  const [userPermissions, setUserPermissions] = useState<any[]>([]);

  // 刷新权限列表的通用函数
  const refreshUserPermissions = () => {
    if (!selectedUser) return;

    const permissions = getUserPermissions(selectedUser.id);
    const groupedPermissions = new Map();

    permissions.forEach(permission => {
      let scope = '全局';
      let scopeKey = 'global';

      if (permission.customerId) {
        const customer = customers.find(c => c.id === permission.customerId);
        scope = `客户: ${customer?.customerName || 'Unknown'}`;
        scopeKey = `customer_${permission.customerId}`;
      } else if (permission.classId) {
        const classItem = classes.find(c => c.id === permission.classId);
        scope = `班级: ${classItem?.name || 'Unknown'}`;
        scopeKey = `class_${permission.classId}`;
      }

      if (!groupedPermissions.has(scopeKey)) {
        groupedPermissions.set(scopeKey, {
          key: scopeKey,
          scope,
          permissions: [],
          customerId: permission.customerId,
          classId: permission.classId,
          grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
          grantedBy: permission.grantedBy
        });
      }

      groupedPermissions.get(scopeKey).permissions.push({
        type: permission.permissionType,
        name: permissionTypeNames[permission.permissionType as keyof typeof permissionTypeNames]
      });
    });

    const formattedPermissions = Array.from(groupedPermissions.values());
    setUserPermissions(formattedPermissions);
  };

  // 过滤员工列表
  useEffect(() => {
    if (!userSearchKey) {
      setFilteredUsers(employees);
      return;
    }

    const filtered = employees.filter(
      employee =>
        String(employee.id).toLowerCase().includes(userSearchKey.toLowerCase()) ||
        employee.nickName.toLowerCase().includes(userSearchKey.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [userSearchKey, employees]);

  // 当搜索关键词变化时，重置分页到第一页
  useEffect(() => {
    if (userSearchKey) {
      setEmployeePagination(prev => ({
        ...prev,
        current: 1
      }));
    }
  }, [userSearchKey]);

  // 当选中员工变化时，获取该员工的权限
  useEffect(() => {
    if (!selectedUser) {
      setUserPermissions([]);
      return;
    }

    // 获取员工权限
    const permissions = getUserPermissions(selectedUser.id);

    // 按权限范围分组
    const groupedPermissions = new Map();

    permissions.forEach(permission => {
      let scope = '全局';
      let scopeKey = 'global';

      if (permission.customerId) {
        const customer = customers.find(c => c.id === permission.customerId);
        scope = `客户: ${customer?.customerName || 'Unknown'}`;
        scopeKey = `customer_${permission.customerId}`;
      } else if (permission.classId) {
        const classItem = classes.find(c => c.id === permission.classId);
        scope = `班级: ${classItem?.name || 'Unknown'}`;
        scopeKey = `class_${permission.classId}`;
      }

      if (!groupedPermissions.has(scopeKey)) {
        groupedPermissions.set(scopeKey, {
          key: scopeKey,
          scope,
          permissions: [],
          customerId: permission.customerId,
          classId: permission.classId,
          grantTime: permission.grantedTime ? new Date(permission.grantedTime).toLocaleString() : '-',
          grantedBy: permission.grantedBy
        });
      }

      groupedPermissions.get(scopeKey).permissions.push({
        type: permission.permissionType,
        name: permissionTypeNames[permission.permissionType as keyof typeof permissionTypeNames]
      });
    });

    // 转换为数组格式
    const formattedPermissions = Array.from(groupedPermissions.values());

    setUserPermissions(formattedPermissions);
  }, [selectedUser, getUserPermissions, customers, classes]);

  // 处理选择员工
  const handleUserSelect = (user: { id: string; name: string; role: string }) => {
    console.log('👤 选择员工调试信息:', user);
    setSelectedUser(user);
  };

  // 处理员工列表分页变化
  const handleEmployeePaginationChange = (page: number, size?: number) => {
    setEmployeePagination(prev => ({
      ...prev,
      current: page,
      size: size || prev.size
    }));
  };

  // 打开全局权限设置对话框
  const openGlobalPermissionModal = () => {
    if (!selectedUser) {
      message.warning('请先选择员工');
      return;
    }

    // 初始化表单
    form.resetFields();
    setIsEditingPermission(false);
    setEditingRecord(null);

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
      message.warning('请先选择员工');
      return;
    }

    // 初始化表单
    customerForm.resetFields();
    setIsEditingPermission(false);
    setEditingRecord(null);
    setIsCustomerModalVisible(true);
  };

  // 打开班级权限设置对话框
  const openClassPermissionModal = () => {
    if (!selectedUser) {
      message.warning('请先选择员工');
      return;
    }

    // 初始化表单
    classForm.resetFields();
    setIsEditingPermission(false);
    setEditingRecord(null);
    setIsClassModalVisible(true);
  };

  // 提交全局权限设置
  const handleGlobalPermissionSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedUser) {
        message.error('未选择员工');
        return;
      }

      if (isEditingPermission && editingRecord) {
        // 编辑模式：先撤销原有权限，再授予新权限
        const oldPermissionTypes = editingRecord.permissions.map((p: any) => p.type);
        revokeGlobalPermission(selectedUser.id, oldPermissionTypes, currentUserId);
      } else {
        // 新建模式：获取已有的全局权限
        const existingPermissions = getUserPermissions(selectedUser.id)
          .filter(p => !p.customerId && !p.classId)
          .map(p => p.permissionType);

        // 需要移除的权限
        const permissionsToRemove = existingPermissions.filter(p => !values.permissions.includes(p));

        // 移除权限
        if (permissionsToRemove.length > 0) {
          revokeGlobalPermission(selectedUser.id, permissionsToRemove, currentUserId);
        }
      }

      // 授予权限
      if (values.permissions.length > 0) {
        grantGlobalPermission(selectedUser.id, values.permissions, currentUserId);
      }

      message.success(isEditingPermission ? '全局权限修改成功' : '全局权限设置成功');
      setIsGlobalModalVisible(false);
      setIsEditingPermission(false);
      setEditingRecord(null);

      // 立即刷新权限列表显示
      setTimeout(() => {
        refreshUserPermissions();
      }, 100);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 提交客户权限设置
  const handleCustomerPermissionSubmit = async () => {
    try {
      const values = await customerForm.validateFields();

      if (!selectedUser) {
        message.error('未选择员工');
        return;
      }

      if (isEditingPermission && editingRecord) {
        // 编辑模式：先撤销原有权限，再授予新权限
        const oldPermissionTypes = editingRecord.permissions.map((p: any) => p.type);
        revokeCustomerPermission(selectedUser.id, values.customerId, oldPermissionTypes, currentUserId);
      }

      // 授予客户权限
      grantCustomerPermission(selectedUser.id, values.customerId, values.permissions, currentUserId);

      console.log('🔧 权限设置调试信息:', {
        selectedUserId: selectedUser.id,
        selectedUserIdType: typeof selectedUser.id,
        customerId: values.customerId,
        customerIdType: typeof values.customerId,
        permissions: values.permissions,
        grantedBy: currentUserId,
        grantedByType: typeof currentUserId,
        isEditingMode: isEditingPermission
      });

      // 关键修复：调用后端API真正分配客户给员工
      try {
        await customerService.assignCustomers({
          assignedToId: parseInt(selectedUser.id), // 确保是数字类型
          customerIds: [values.customerId],
          remark: `权限管理分配 - ${new Date().toLocaleString()}`
        });
        console.log('✅ 客户分配成功:', {
          employeeId: selectedUser.id,
          customerId: values.customerId
        });
      } catch (error) {
        console.error('❌ 客户分配失败:', error);
        // 如果分配失败，显示警告但不阻止权限设置
        message.warning('权限设置成功，但客户分配可能失败，请检查该客户是否已分配给其他员工');
      }

      // 验证权限是否正确保存
      setTimeout(() => {
        const savedPermissions = getUserPermissions(selectedUser.id);
        const allPermissions = usePermissionStore.getState().permissions;
        console.log('📝 保存后的权限验证:', {
          userId: selectedUser.id,
          userIdType: typeof selectedUser.id,
          allPermissions: allPermissions,
          savedPermissions: savedPermissions,
          customerPermissions: savedPermissions.filter(p => p.customerId === values.customerId),
          // 额外检查：查找所有包含该用户ID的权限
          permissionsContainingUserId: allPermissions.filter(p => p.userId === selectedUser.id)
        });
      }, 50);

      message.success(isEditingPermission ? '客户权限修改成功' : '客户权限设置成功');
      setIsCustomerModalVisible(false);
      setIsEditingPermission(false);
      setEditingRecord(null);

      // 立即刷新权限列表显示
      setTimeout(() => {
        refreshUserPermissions();
      }, 100);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 提交班级权限设置
  const handleClassPermissionSubmit = async () => {
    try {
      const values = await classForm.validateFields();

      if (!selectedUser) {
        message.error('未选择员工');
        return;
      }

      if (isEditingPermission && editingRecord) {
        // 编辑模式：先撤销原有权限，再授予新权限
        const oldPermissionTypes = editingRecord.permissions.map((p: any) => p.type);
        revokeClassPermission(selectedUser.id, values.classId, oldPermissionTypes, currentUserId);
      }

      // 授予班级权限
      grantClassPermission(selectedUser.id, values.classId, values.permissions, currentUserId);

      message.success(isEditingPermission ? '班级权限修改成功' : '班级权限设置成功');
      setIsClassModalVisible(false);
      setIsEditingPermission(false);
      setEditingRecord(null);

      // 立即刷新权限列表显示
      setTimeout(() => {
        refreshUserPermissions();
      }, 100);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 编辑权限
  const handleEditPermission = (record: any) => {
    if (!selectedUser) {
      message.error('未选择员工');
      return;
    }

    setEditingRecord(record);
    setIsEditingPermission(true);

    if (record.customerId) {
      // 编辑客户权限
      customerForm.setFieldsValue({
        customerId: record.customerId,
        permissions: record.permissions.map((p: any) => p.type)
      });
      setIsCustomerModalVisible(true);
    } else if (record.classId) {
      // 编辑班级权限
      classForm.setFieldsValue({
        classId: record.classId,
        permissions: record.permissions.map((p: any) => p.type)
      });
      setIsClassModalVisible(true);
    } else {
      // 编辑全局权限
      form.setFieldsValue({
        permissions: record.permissions.map((p: any) => p.type)
      });
      setIsGlobalModalVisible(true);
    }
  };

  // 撤销权限
  const handleRevokePermission = async (record: any) => {
    if (!selectedUser) {
      message.error('未选择员工');
      return;
    }

    const permissionTypes = record.permissions.map((p: any) => p.type);

    if (record.customerId) {
      // 撤销客户权限
      revokeCustomerPermission(selectedUser.id, record.customerId, permissionTypes, currentUserId);

      // 同时取消客户分配 - 查找并删除对应的分配关系
      try {
        const assignments = await customerService.getCustomerAssignments({ current: 1, size: 1000 });
        const targetAssignment = assignments.records.find(
          (assignment: any) =>
            assignment.customerId === record.customerId &&
            assignment.assignedToId === parseInt(selectedUser.id)
        );

        if (targetAssignment) {
          await customerService.removeCustomerAssignment(targetAssignment.id);
          console.log('✅ 客户分配已取消:', {
            assignmentId: targetAssignment.id,
            employeeId: selectedUser.id,
            customerId: record.customerId
          });
        }
      } catch (error) {
        console.error('❌ 取消客户分配失败:', error);
        message.warning('权限已撤销，但取消客户分配可能失败');
      }
    } else if (record.classId) {
      // 撤销班级权限
      revokeClassPermission(selectedUser.id, record.classId, permissionTypes, currentUserId);
    } else {
      // 撤销全局权限
      revokeGlobalPermission(selectedUser.id, permissionTypes, currentUserId);
    }

    message.success('权限已撤销');

    // 立即刷新权限列表显示
    setTimeout(() => {
      refreshUserPermissions();
    }, 100);
  };

  // 员工表格列定义
  const userColumns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: 'ID',
      width: 100
    },
    {
      dataIndex: 'nickName',
      key: 'nickName',
      ...getCenterColumnConfig(),
      title: '姓名',
      width: 150
    },
    {
      dataIndex: 'roles',
      key: 'roles',
      ...getCenterColumnConfig(),
      render: (roles: Array<{ code: string; name: string }>) => {
        const roleCode = roles?.[0]?.code || '';
        let color = 'green';
        if (roleCode === 'super_admin') {
          color = 'gold';
        } else if (roleCode === 'admin') {
          color = 'blue';
        }
        return <Tag color={color}>{roleNames[roleCode as keyof typeof roleNames] || roleCode || '未知角色'}</Tag>;
      },
      title: '角色',
      width: 120
    },
    {
      key: 'action',
      ...getActionColumnConfig(100),
      render: (_: unknown, record: EmployeeApi.EmployeeListItem) => (
        <Button
          type="link"
          onClick={() => {
            const userToSelect = {
              id: String(record.id),
              name: record.nickName,
              role: record.roles?.[0]?.code || ''
            };
            console.log('👥 员工记录信息:', { record, userToSelect });
            handleUserSelect(userToSelect);
          }}
        >
          选择
        </Button>
      ),
      title: '操作'
    }
  ];

  // 权限表格列定义
  const permissionColumns = [
    {
      dataIndex: 'permissions',
      key: 'permissions',
      ...getCenterColumnConfig(),
      title: '权限类型',
      width: 250,
      render: (permissions: Array<{type: string, name: string}>) => (
        <div className="space-y-1">
          {permissions.map((perm, index) => (
            <Tag key={index} color="blue">
              {perm.name}
            </Tag>
          ))}
        </div>
      )
    },
    {
      dataIndex: 'scope',
      key: 'scope',
      ...getCenterColumnConfig(),
      title: '权限范围',
      width: 200
    },
    {
      dataIndex: 'grantTime',
      key: 'grantTime',
      ...getCenterColumnConfig(),
      title: '授予时间',
      width: 150
    },
    {
      dataIndex: 'grantedBy',
      key: 'grantedBy',
      ...getCenterColumnConfig(),
      title: '授予人',
      width: 120
    },
    {
      key: 'action',
      ...getActionColumnConfig(150),
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleEditPermission(record)}
          >
            编辑
          </Button>
          <Button
            danger
            type="link"
            onClick={() => handleRevokePermission(record)}
          >
            撤销
          </Button>
        </Space>
      ),
      title: '操作'
    }
  ];

  return (
    <div className="h-full bg-white p-4 dark:bg-[#141414]">
      <Card
        title="权限管理"
        variant="borderless"
      >
        <div className="space-y-6">
          <Card
            bordered
            title={
              <div className="flex items-center justify-between">
                <span>员工列表</span>
                <Input.Search
                  placeholder="搜索员工"
                  style={{ width: 200 }}
                  onChange={e => setUserSearchKey(e.target.value)}
                />
              </div>
            }
          >
            <Table
              columns={userColumns}
              dataSource={filteredUsers}
              loading={loading}
              rowClassName={record => (String(record.id) === selectedUser?.id ? 'ant-table-row-selected' : '')}
              rowKey="id"
              size="small"
              pagination={
                userSearchKey
                  ? false
                  : {
                      current: employeePagination.current,
                      onChange: handleEmployeePaginationChange,
                      onShowSizeChange: handleEmployeePaginationChange,
                      pageSize: employeePagination.size,
                      showQuickJumper: true,
                      showSizeChanger: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                      total: employeePagination.total
                    }
              }
            />
          </Card>

          <Card
            bordered
            title={
              <div className="flex items-center justify-between">
                <span>
                  {selectedUser
                    ? `${selectedUser.name}（${roleNames[selectedUser.role as keyof typeof roleNames] || selectedUser.role || '未知角色'}）的权限`
                    : '员工权限'}
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
                rowKey="key"
                {...getFullTableConfig(8)}
              />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <span className="text-gray-400">请先选择一个员工</span>
              </div>
            )}
          </Card>
        </div>
      </Card>

      <Modal
        open={isGlobalModalVisible}
        title={isEditingPermission ? "编辑全局权限" : "设置全局权限"}
        onCancel={() => {
          setIsGlobalModalVisible(false);
          setIsEditingPermission(false);
          setEditingRecord(null);
        }}
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

      <Modal
        open={isCustomerModalVisible}
        title={isEditingPermission ? "编辑客户权限" : "设置客户权限"}
        onCancel={() => {
          setIsCustomerModalVisible(false);
          setIsEditingPermission(false);
          setEditingRecord(null);
        }}
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
            <Select
              placeholder="请选择客户"
              disabled={isEditingPermission}
              loading={customerLoading}
            >
              {customers.map(customer => {
                // 检查该客户是否已设置过权限
                const hasExistingPermission = selectedUser && getUserPermissions(selectedUser.id)
                  .some(p => p.customerId === customer.id && (!isEditingPermission || editingRecord?.customerId !== customer.id));

                return (
                  <Select.Option
                    key={customer.id}
                    value={customer.id}
                    disabled={hasExistingPermission}
                    title={hasExistingPermission ? '该客户已设置权限' : ''}
                  >
                    {customer.customerName} - {customer.company}
                    {hasExistingPermission && <span style={{ color: '#ff4d4f' }}> (已设置)</span>}
                  </Select.Option>
                );
              })}
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

      <Modal
        open={isClassModalVisible}
        title={isEditingPermission ? "编辑班级权限" : "设置班级权限"}
        onCancel={() => {
          setIsClassModalVisible(false);
          setIsEditingPermission(false);
          setEditingRecord(null);
        }}
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
            <Select
              loading={classLoading}
              placeholder="请选择班级"
              disabled={isEditingPermission}
            >
              {classes.map(classItem => {
                // 检查该班级是否已设置过权限
                const hasExistingPermission = selectedUser && getUserPermissions(selectedUser.id)
                  .some(p => p.classId === classItem.id && (!isEditingPermission || editingRecord?.classId !== classItem.id));

                return (
                  <Select.Option
                    key={classItem.id}
                    value={classItem.id}
                    disabled={hasExistingPermission}
                    title={hasExistingPermission ? '该班级已设置权限' : ''}
                  >
                    {classItem.name} - {classItem.categoryName || '未分类'}
                    {hasExistingPermission && <span style={{ color: '#ff4d4f' }}> (已设置)</span>}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            label="权限选择"
            name="permissions"
            rules={[{ message: '请至少选择一项权限', required: true }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row>
                <Col span={12}>
                  <Checkbox value={PermissionType.EDIT_CLASS}>编辑班级信息</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value={PermissionType.VIEW_CLASS_STUDENT_NAME}>查看学员姓名</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value={PermissionType.VIEW_CLASS_STUDENT_PHONE}>查看学员电话</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value={PermissionType.VIEW_CLASS_STUDENT_MOBILE}>查看学员手机</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value={PermissionType.VIEW_CLASS_STUDENT}>查看学员信息</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value={PermissionType.EDIT_CLASS_STUDENT}>编辑学员信息</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
