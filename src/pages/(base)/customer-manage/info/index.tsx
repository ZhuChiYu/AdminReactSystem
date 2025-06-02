import { UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message, App } from 'antd';
import { useEffect, useState } from 'react';

import { customerService } from '@/service/api';
import type { CustomerApi } from '@/service/api/types';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { getCurrentUserId, getCurrentUserName, isAdmin, isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

// 定义本地的跟进状态枚举和映射
export enum FollowUpStatus {
  ARRIVED = 'arrived', // 已实到
  CONSULT = 'consult', // 咨询
  EARLY_25 = 'early_25', // 早25客户
  EFFECTIVE_VISIT = 'effective_visit', // 有效回访
  NEW_DEVELOP = 'new_develop', // 新开发
  NOT_ARRIVED = 'not_arrived', // 未实到
  REGISTERED = 'registered', // 已报名
  REJECTED = 'rejected', // 未通过
  VIP = 'vip', // 大客户
  WECHAT_ADDED = 'wechat_added' // 已加微信
}

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
  [FollowUpStatus.NEW_DEVELOP]: '新开发',
  'already_signed': '已报名',
  'already_paid': '已实到'
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
  [FollowUpStatus.NEW_DEVELOP]: 'geekblue',
  'already_signed': 'success',
  'already_paid': 'green'
};

/** 客户信息管理组件 */
const CustomerManagement = () => {
  const { message } = App.useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerApi.CustomerListItem | null>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  
  // 数据状态
  const [customers, setCustomers] = useState<CustomerApi.CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 从权限管理器中获取权限相关方法
  const { hasPermission } = usePermissionStore();

  // 获取当前用户信息
  const currentUserId = getCurrentUserId();
  const currentUserName = getCurrentUserName();

  // 判断当前用户是否为超级管理员或管理员
  const isUserSuperAdmin = isSuperAdmin();
  const isUserAdmin = isAdmin();

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    company: '',
    followStatus: '',
    customerName: '',
    phone: ''
  });

  // 获取客户数据
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: CustomerApi.CustomerQueryParams = {
        current: pagination.current,
        size: pagination.pageSize,
        customerName: searchParams.customerName || undefined,
        company: searchParams.company || undefined,
        followStatus: searchParams.followStatus || undefined
      };

      const response = await customerService.getCustomerList(params);
      setCustomers(response.records);
      setPagination({
        current: response.current,
        pageSize: response.size,
        total: response.total
      });
    } catch (error) {
      message.error('获取客户数据失败');
      console.error('获取客户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchCustomers();
  }, [pagination.current, pagination.pageSize]);

  // 检查用户是否有权限修改客户信息
  const canEditCustomer = (customer: CustomerApi.CustomerListItem) => {
    // 超级管理员可以修改所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的编辑权限
    const hasCustomerEditPermission = hasPermission(currentUserId, PermissionType.EDIT_CUSTOMER, customer.id);

    // 检查是否有全局编辑权限
    const hasGlobalEditPermission = hasPermission(currentUserId, PermissionType.EDIT_CUSTOMER);

    // 管理员是否可以修改自己分配的客户
    const isAssignedByCurrentAdmin = isUserAdmin && customer.assignedToId === currentUserId;

    return hasCustomerEditPermission || hasGlobalEditPermission || isAssignedByCurrentAdmin;
  };

  // 检查是否有权限查看客户手机号
  const canViewMobile = (customer: CustomerApi.CustomerListItem) => {
    // 超级管理员可以查看所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的查看手机号权限
    const hasCustomerMobilePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_MOBILE, customer.id);

    // 检查是否有全局查看手机号权限
    const hasGlobalMobilePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_MOBILE);

    // 对于员工，只能查看自己负责的客户信息
    const isOwnCustomer = customer.assignedToId === currentUserId;

    return hasCustomerMobilePermission || hasGlobalMobilePermission || isOwnCustomer;
  };

  // 检查是否有权限查看客户电话
  const canViewPhone = (customer: CustomerApi.CustomerListItem) => {
    // 超级管理员可以查看所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的查看电话权限
    const hasCustomerPhonePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_PHONE, customer.id);

    // 检查是否有全局查看电话权限
    const hasGlobalPhonePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_PHONE);

    // 对于员工，只能查看自己负责的客户信息
    const isOwnCustomer = customer.assignedToId === currentUserId;

    return hasCustomerPhonePermission || hasGlobalPhonePermission || isOwnCustomer;
  };

  // 检查是否有权限查看客户姓名
  const canViewName = (customer: CustomerApi.CustomerListItem) => {
    // 超级管理员可以查看所有客户信息
    if (isUserSuperAdmin) return true;

    // 检查是否有特定客户的查看姓名权限
    const hasCustomerNamePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_NAME, customer.id);

    // 检查是否有全局查看姓名权限
    const hasGlobalNamePermission = hasPermission(currentUserId, PermissionType.VIEW_CUSTOMER_NAME);

    // 对于员工，只能查看自己负责的客户信息
    const isOwnCustomer = customer.assignedToId === currentUserId;

    return hasCustomerNamePermission || hasGlobalNamePermission || isOwnCustomer;
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 }); // 重置到第一页
    fetchCustomers();
  };

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      company: '',
      followStatus: '',
      customerName: '',
      phone: ''
    });
    setPagination({ ...pagination, current: 1 });
    // 重新获取数据会在useEffect中触发
  };

  // 当搜索参数或分页变化时重新获取数据
  useEffect(() => {
    fetchCustomers();
  }, [searchParams]);

  // 打开修改跟进状态弹窗
  const openFollowStatusModal = (record: CustomerApi.CustomerListItem) => {
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
        const updateData = {
          followStatus
        };

        customerService.updateCustomer(currentCustomer.id, updateData)
          .then(() => {
            message.success('更新成功');
            setIsModalVisible(false);
            setCurrentCustomer(null);
            fetchCustomers(); // 重新获取数据
          })
          .catch(() => {
            message.error('更新失败');
          });
      }
    });
  };

  // 提交添加客户
  const handleAddSubmit = () => {
    addForm.validateFields().then(values => {
      // 添加新客户
      const newCustomer: CustomerApi.CreateCustomerRequest = {
        customerName: values.customerName,
        company: values.company,
        position: values.position || '',
        phone: values.phone || '',
        mobile: values.mobile || '',
        email: values.email || '',
        industry: values.industry || '',
        source: values.source || '手动添加',
        followStatus: values.followStatus,
        remark: values.remark || ''
      };

      customerService.createCustomer(newCustomer)
        .then(() => {
          message.success('添加成功');
          setIsAddModalVisible(false);
          fetchCustomers(); // 重新获取数据
        })
        .catch(() => {
          message.error('添加失败');
        });
    });
  };

  // 表格分页处理
  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination({
      current: page,
      pageSize: pageSize || pagination.pageSize,
      total: pagination.total
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      ...getCenterColumnConfig(),
      render: (text: string, record: CustomerApi.CustomerListItem) => 
        canViewName(record) ? text : '***',
      width: 120,
    },
    {
      title: '单位名称',
      dataIndex: 'company',
      key: 'company',
      ...getCenterColumnConfig(),
      width: 200,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      ...getCenterColumnConfig(),
      width: 120,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      ...getCenterColumnConfig(),
      render: (text: string, record: CustomerApi.CustomerListItem) => 
        canViewPhone(record) ? text || '-' : '***',
      width: 120,
    },
    {
      title: '手机',
      dataIndex: 'mobile',
      key: 'mobile',
      ...getCenterColumnConfig(),
      render: (text: string, record: CustomerApi.CustomerListItem) => 
        canViewMobile(record) ? text || '-' : '***',
      width: 120,
    },
    {
      title: '跟进状态',
      dataIndex: 'followStatus',
      key: 'followStatus',
      ...getCenterColumnConfig(),
      render: (status: string) => {
        const statusName = followUpStatusNames[status] || status;
        const colorMap: Record<string, string> = {
          [FollowUpStatus.VIP]: 'red',
          [FollowUpStatus.REGISTERED]: 'green',
          [FollowUpStatus.EFFECTIVE_VISIT]: 'blue',
          [FollowUpStatus.WECHAT_ADDED]: 'cyan',
          [FollowUpStatus.NEW_DEVELOP]: 'orange',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {statusName}
          </Tag>
        );
      },
      width: 120,
    },
    {
      title: '跟进次数',
      dataIndex: 'followCount',
      key: 'followCount',
      ...getCenterColumnConfig(),
      render: (count: number) => count || 0,
      width: 100,
    },
    {
      title: '负责人',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      ...getCenterColumnConfig(),
      render: (assignedTo: any) => assignedTo?.name || '-',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_: any, record: CustomerApi.CustomerListItem) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => openFollowStatusModal(record)}
            disabled={!canEditCustomer(record)}
          >
            修改状态
          </Button>
        </Space>
      ),
    }
  ];

  // 如果是超级管理员或管理员，显示"分配者"列
  if (isUserAdmin || isUserSuperAdmin) {
    columns.splice(7, 0, {
      title: '分配者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      ...getCenterColumnConfig(),
      render: (createdBy: any) => createdBy?.userName || '-',
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
            value={searchParams.customerName}
            onChange={e => setSearchParams({ ...searchParams, customerName: e.target.value })}
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
          dataSource={customers}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
          pagination={{
            ...getFullTableConfig(10).pagination,
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handleTableChange
          }}
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
            name="customerName"
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
            label="邮箱"
            name="email"
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            label="行业"
            name="industry"
          >
            <Input placeholder="请输入行业" />
          </Form.Item>
          <Form.Item
            label="来源"
            name="source"
          >
            <Input placeholder="请输入来源" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea
              placeholder="请输入备注"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
