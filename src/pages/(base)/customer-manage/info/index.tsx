import { UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';

import useCustomerStore, { type CustomerInfo, FollowUpStatus } from '@/store/customerStore';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { getCurrentUserId, getCurrentUserName, isAdmin, isSuperAdmin } from '@/utils/auth';

/** 跟进状态名称 */
const followUpStatusNames = {
  [FollowUpStatus.WECHAT_ADDED]: '已加微信',
  [FollowUpStatus.REJECTED]: '未通过',
  [FollowUpStatus.EARLY_25]: '早25客户',
  [FollowUpStatus.VIP]: '大客户',
  [FollowUpStatus.EFFECTIVE_VISIT]: '有效回访',
  [FollowUpStatus.CONSULT]: '咨询',
  [FollowUpStatus.REGISTERED]: '已报名',
  [FollowUpStatus.ARRIVED]: '已实到',
  [FollowUpStatus.NOT_ARRIVED]: '未实到',
  [FollowUpStatus.NEW_DEVELOP]: '新开发'
};

/** 跟进状态颜色 */
const followUpStatusColors = {
  [FollowUpStatus.WECHAT_ADDED]: 'blue',
  [FollowUpStatus.REJECTED]: 'error',
  [FollowUpStatus.EARLY_25]: 'purple',
  [FollowUpStatus.VIP]: 'gold',
  [FollowUpStatus.EFFECTIVE_VISIT]: 'success',
  [FollowUpStatus.CONSULT]: 'cyan',
  [FollowUpStatus.REGISTERED]: 'success',
  [FollowUpStatus.ARRIVED]: 'green',
  [FollowUpStatus.NOT_ARRIVED]: 'orange',
  [FollowUpStatus.NEW_DEVELOP]: 'geekblue'
};

/** 客户信息管理组件 */
const CustomerManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerInfo | null>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  // 从状态管理器中获取客户数据和添加/更新方法
  const { addCustomer, calculateTaskCounts, customers, updateCustomer } = useCustomerStore();

  // 从权限管理器中获取权限相关方法
  const { hasPermission } = usePermissionStore();

  // 获取当前用户信息
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // 判断当前用户是否为超级管理员或管理员
  const isUserSuperAdmin = isSuperAdmin();
  const isUserAdmin = isAdmin();

  // 检查用户是否有权限修改客户信息
  const canEditCustomer = (customer: CustomerInfo) => {
    // 超级管理员可以修改所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的编辑权限
    const hasCustomerEditPermission = hasPermission(currentUserId, PermissionType.EDIT_CUSTOMER, customer.id);

    // 检查是否有全局编辑权限
    const hasGlobalEditPermission = hasPermission(currentUserId, PermissionType.EDIT_CUSTOMER);

    // 管理员是否可以修改自己分配的客户
    const isAssignedByCurrentAdmin = isUserAdmin && customer.assignedBy === currentUserId;

    return hasCustomerEditPermission || hasGlobalEditPermission || isAssignedByCurrentAdmin;
  };

  // 检查是否有权限查看客户手机号
  const canViewMobile = (customer: CustomerInfo) => {
    // 超级管理员可以查看所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的查看手机号权限
    const hasCustomerMobilePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_MOBILE, customer.id);

    // 检查是否有全局查看手机号权限
    const hasGlobalMobilePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_MOBILE);

    // 对于员工，只能查看自己负责的客户信息
    const isOwnCustomer = customer.employeeId === currentUserId;

    return hasCustomerMobilePermission || hasGlobalMobilePermission || isOwnCustomer;
  };

  // 检查是否有权限查看客户电话
  const canViewPhone = (customer: CustomerInfo) => {
    // 超级管理员可以查看所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的查看电话权限
    const hasCustomerPhonePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_PHONE, customer.id);

    // 检查是否有全局查看电话权限
    const hasGlobalPhonePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_PHONE);

    // 对于员工，只能查看自己负责的客户信息
    const isOwnCustomer = customer.employeeId === currentUserId;

    return hasCustomerPhonePermission || hasGlobalPhonePermission || isOwnCustomer;
  };

  // 检查是否有权限查看客户姓名
  const canViewName = (customer: CustomerInfo) => {
    // 超级管理员可以查看所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的查看姓名权限
    const hasCustomerNamePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_NAME, customer.id);

    // 检查是否有全局查看姓名权限
    const hasGlobalNamePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_NAME);

    // 对于员工，只能查看自己负责的客户信息
    const isOwnCustomer = customer.employeeId === currentUserId;

    return hasCustomerNamePermission || hasGlobalNamePermission || isOwnCustomer;
  };

  // 根据用户角色过滤客户列表
  const filteredCustomersByRole =
    isUserAdmin || isUserSuperAdmin
      ? customers
      : customers.filter((customer: CustomerInfo) => customer.employeeId === currentUserId);

  const [filteredList, setFilteredList] = useState(filteredCustomersByRole);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    company: '',
    followStatus: '',
    name: '',
    phone: ''
  });

  // 处理搜索
  const handleSearch = () => {
    const { company, followStatus, name, phone } = searchParams;

    let filtered = [...filteredCustomersByRole];

    if (name) {
      filtered = filtered.filter(item => item.name.includes(name));
    }

    if (phone) {
      filtered = filtered.filter(item => item.phone?.includes(phone) || item.mobile?.includes(phone));
    }

    if (company) {
      filtered = filtered.filter(item => item.company.includes(company));
    }

    if (followStatus) {
      filtered = filtered.filter(item => item.followStatus === followStatus);
    }

    setFilteredList(filtered);
  };

  // 监听客户数据变化
  useEffect(() => {
    // 根据用户角色重新过滤数据
    const roleFilteredCustomers =
      isUserAdmin || isUserSuperAdmin
        ? customers
        : customers.filter((customer: CustomerInfo) => customer.employeeId === currentUserId);

    setFilteredList(roleFilteredCustomers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, isUserAdmin, isUserSuperAdmin, currentUserId]);

  // 当搜索参数变化时
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      company: '',
      followStatus: '',
      name: '',
      phone: ''
    });
    // 重置为根据角色过滤的列表
    const roleFilteredCustomers =
      isUserAdmin || isUserSuperAdmin
        ? customers
        : customers.filter((customer: CustomerInfo) => customer.employeeId === currentUserId);
    setFilteredList(roleFilteredCustomers);
  };

  // 打开修改跟进状态弹窗
  const openFollowStatusModal = (record: CustomerInfo) => {
    // 检查修改权限
    if (!canEditCustomer(record)) {
      message.error('您没有权限修改此客户的信息');
      return;
    }

    setCurrentCustomer(record);
    form.setFieldsValue({
      followStatus: record.followStatus
    });
    setIsModalVisible(true);
  };

  // 打开添加客户弹窗
  const addNewCustomer = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentCustomer(null);
  };

  // 关闭添加客户弹窗
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  // 提交修改跟进状态
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { followStatus } = values;

      // 更新客户跟进状态
      if (currentCustomer) {
        const updatedCustomer = {
          ...currentCustomer,
          followStatus
        };

        updateCustomer(updatedCustomer);
        calculateTaskCounts(); // 重新计算任务数据
        message.success('更新成功');
      }

      setIsModalVisible(false);
      setCurrentCustomer(null);
    });
  };

  // 提交添加客户
  const handleAddSubmit = () => {
    addForm.validateFields().then(values => {
      // 添加新客户
      const newCustomer: CustomerInfo = {
        company: values.company,
        createTime: new Date().toLocaleString(),
        employeeId: currentUserId,
        employeeName: currentUserName,
        followContent: values.followContent || '',
        followStatus: values.followStatus,
        id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
        mobile: values.mobile || '',
        name: values.name,
        phone: values.phone || '',
        position: values.position || '',
        source: values.source || '手动添加'
      };

      addCustomer(newCustomer);
      calculateTaskCounts(); // 重新计算任务数据
      message.success('添加成功');
      setIsAddModalVisible(false);
    });
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 80
    },
    {
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CustomerInfo) => {
        return canViewName(record) ? text : '*** (无权限查看)';
      },
      title: '姓名',
      width: 120
    },
    {
      dataIndex: 'company',
      key: 'company',
      title: '单位',
      width: 200
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string, record: CustomerInfo) => {
        return canViewPhone(record) ? text : '*** (无权限查看)';
      },
      title: '电话',
      width: 150
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      render: (text: string, record: CustomerInfo) => {
        return canViewMobile(record) ? text : '*** (无权限查看)';
      },
      title: '手机',
      width: 150
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '跟进状态',
      width: 120
    },
    {
      dataIndex: 'employeeName',
      key: 'employeeName',
      title: '负责人',
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
        <Space size="small">
          <Button
            disabled={!canEditCustomer(record)}
            type="link"
            onClick={() => openFollowStatusModal(record)}
          >
            修改状态
          </Button>
        </Space>
      ),
      title: '操作',
      width: 120
    }
  ];

  // 如果是超级管理员或管理员，显示"分配者"列
  if (isUserAdmin || isUserSuperAdmin) {
    columns.splice(7, 0, {
      dataIndex: 'assignedBy',
      key: 'assignedBy',
      title: '分配者',
      width: 120
    });
  }

  return (
    <div className="h-full bg-white p-4 dark:bg-[#141414]">
      <Card
        title="客户资料管理"
        extra={
          <Space>
            <Button
              icon={<UserAddOutlined />}
              type="primary"
              onClick={addNewCustomer}
            >
              添加客户
            </Button>
            <Button onClick={resetSearch}>重置筛选</Button>
          </Space>
        }
      >
        <div className="mb-4 flex items-center gap-4">
          <Input
            allowClear
            placeholder="客户姓名"
            style={{ width: 150 }}
            value={searchParams.name}
            onChange={e => setSearchParams({ ...searchParams, name: e.target.value })}
          />
          <Input
            allowClear
            placeholder="电话/手机"
            style={{ width: 150 }}
            value={searchParams.phone}
            onChange={e => setSearchParams({ ...searchParams, phone: e.target.value })}
          />
          <Input
            allowClear
            placeholder="单位名称"
            style={{ width: 200 }}
            value={searchParams.company}
            onChange={e => setSearchParams({ ...searchParams, company: e.target.value })}
          />
          <Select
            allowClear
            placeholder="跟进状态"
            style={{ width: 150 }}
            value={searchParams.followStatus}
            onChange={value => setSearchParams({ ...searchParams, followStatus: value })}
          >
            {Object.entries(followUpStatusNames).map(([key, value]) => (
              <Select.Option
                key={key}
                value={key}
              >
                {value}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            onClick={handleSearch}
          >
            搜索
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: 1600 }}
        />
      </Card>

      {/* 修改跟进状态弹窗 */}
      <Modal
        open={isModalVisible}
        title="修改跟进状态"
        onCancel={handleCancel}
        onOk={handleSubmit}
      >
        {currentCustomer && (
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item label="客户信息">
              <div>
                {currentCustomer.name} - {currentCustomer.company}
              </div>
            </Form.Item>
            <Form.Item
              label="跟进状态"
              name="followStatus"
              rules={[{ message: '请选择跟进状态', required: true }]}
            >
              <Select placeholder="请选择跟进状态">
                {Object.entries(followUpStatusNames).map(([key, value]) => (
                  <Select.Option
                    key={key}
                    value={key}
                  >
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 添加客户弹窗 */}
      <Modal
        open={isAddModalVisible}
        title="添加客户"
        onCancel={handleAddCancel}
        onOk={handleAddSubmit}
      >
        <Form
          form={addForm}
          layout="vertical"
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ message: '请输入客户姓名', required: true }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item
            label="单位"
            name="company"
            rules={[{ message: '请输入单位名称', required: true }]}
          >
            <Input placeholder="请输入单位名称" />
          </Form.Item>
          <Form.Item
            label="职位"
            name="position"
          >
            <Input placeholder="请输入职位" />
          </Form.Item>
          <Form.Item
            label="电话"
            name="phone"
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            label="手机"
            name="mobile"
          >
            <Input placeholder="请输入手机" />
          </Form.Item>
          <Form.Item
            label="跟进状态"
            name="followStatus"
            rules={[{ message: '请选择跟进状态', required: true }]}
          >
            <Select placeholder="请选择跟进状态">
              {Object.entries(followUpStatusNames).map(([key, value]) => (
                <Select.Option
                  key={key}
                  value={key}
                >
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="跟进内容"
            name="followContent"
          >
            <Input.TextArea
              placeholder="请输入跟进内容"
              rows={3}
            />
          </Form.Item>
          <Form.Item
            label="来源"
            name="source"
          >
            <Input placeholder="请输入来源" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
