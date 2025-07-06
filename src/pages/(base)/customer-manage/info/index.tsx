import { CopyOutlined, DownloadOutlined, UserAddOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';

import { customerService, employeeService } from '@/service/api';
import type { CustomerApi, EmployeeApi } from '@/service/api/types';

import { isAdmin, isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

// 导入员工服务

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
const followUpStatusNames: Record<string, string> = {
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
  empty: '-'
};



/** 客户信息管理组件 */
const CustomerManagement = () => {
  const { message } = App.useApp();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerApi.CustomerListItem | null>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  // 分配相关状态
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [managedEmployees, setManagedEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [selectedCustomersForAssign, setSelectedCustomersForAssign] = useState<number[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // 导出相关状态
  const [exportLoading, setExportLoading] = useState(false);

  // 数据状态
  const [customers, setCustomers] = useState<CustomerApi.CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });



  // 判断当前用户是否为超级管理员或管理员
  const isUserSuperAdmin = isSuperAdmin();
  const isUserAdmin = isAdmin();

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    assignedToName: '',
    company: '',
    customerName: '',
    followStatus: '',
    phone: ''
  });

  // 获取客户数据
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: CustomerApi.CustomerQueryParams = {
        assignedToName: searchParams.assignedToName || undefined,
        company: searchParams.company || undefined,
        current: pagination.current,
        customerName: searchParams.customerName || undefined,
        followStatus: searchParams.followStatus || undefined,
        mobile: searchParams.phone || undefined,
        phone: searchParams.phone || undefined, // 使用同一个搜索框搜索手机和电话
        size: pagination.pageSize
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

  // 获取管理员管理的员工
  const fetchManagedEmployees = async () => {
    if (isUserAdmin || isUserSuperAdmin) {
      try {
        const response = await employeeService.getManagedEmployees({ current: 1, size: 1000 });
        setManagedEmployees(response.records);
      } catch (error) {
        console.error('获取管理的员工失败:', error);
      }
    }
  };

  // 初始化时获取管理的员工
  useEffect(() => {
    fetchManagedEmployees();
  }, [isUserAdmin, isUserSuperAdmin]);

  // 检查用户是否有权限修改客户信息（简化版，主要权限控制在后端）
  const canEditCustomer = (customer: CustomerApi.CustomerListItem) => {
    // 使用后端返回的权限字段
    return customer.canEdit || false;
  };

  // 复制到剪切板的功能
  const copyToClipboard = async (text: string, type: string) => {
    if (!text || text === '-') {
      message.warning(`${type}为空，无法复制`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type}已复制到剪切板`);
    } catch (error) {
      // 降级处理：使用传统的复制方法
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        message.success(`${type}已复制到剪切板`);
      } catch (fallbackError) {
        console.error('复制失败:', fallbackError);
        message.error('复制失败，请手动复制');
      }
    }
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 }); // 重置到第一页
    fetchCustomers();
  };

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      assignedToName: '',
      company: '',
      customerName: '',
      followStatus: '',
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

        customerService
          .updateCustomer(currentCustomer.id, updateData)
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
        company: values.company,
        customerName: values.customerName,
        email: values.email || '',
        followStatus: values.followStatus,
        gender: values.gender || '',
        industry: values.industry || '',
        mobile: values.mobile || '',
        phone: values.phone || '',
        position: values.position || '',
        remark: values.remark || '',
        source: values.source || '手动添加'
      };

      customerService
        .createCustomer(newCustomer)
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

  // 打开分配客户弹窗
  const openAssignModal = (customerIds: number[]) => {
    if (managedEmployees.length === 0) {
      message.warning('您暂无管理的员工，无法分配客户');
      return;
    }
    setSelectedCustomersForAssign(customerIds);
    assignForm.resetFields();
    setIsAssignModalVisible(true);
  };

  // 批量分配客户
  const openBatchAssignModal = () => {
    if (selectedCustomersForAssign.length === 0) {
      message.warning('请先选择要分配的客户');
      return;
    }
    openAssignModal(selectedCustomersForAssign);
  };

  // 分配单个客户
  const assignSingleCustomer = (customer: CustomerApi.CustomerListItem) => {
    openAssignModal([customer.id]);
  };

  // 导出客户数据
  const handleExportCustomers = async () => {
    if (!isUserSuperAdmin) {
      message.error('只有超级管理员可以导出客户数据');
      return;
    }

    setExportLoading(true);
    try {
      // 动态导入xlsx库
      const XLSX = await import('xlsx');

      // 获取所有客户数据
      const allCustomersData = await customerService.getCustomerList({
        current: 1,
        size: 10000, // 获取大量数据
        ...searchParams
      });

      // 准备导出的数据
      const exportData = allCustomersData.records.map((customer, index) => ({
        创建时间: customer.createdAt ? new Date(customer.createdAt).toLocaleString() : '',
        单位名称: customer.company || '',
        备注: customer.remark || '',
        客户姓名: customer.customerName || '',
        序号: index + 1,
        手机: customer.mobile || '',
        更新时间: customer.updatedAt ? new Date(customer.updatedAt).toLocaleString() : '',
        来源: customer.source || '',
        电话: customer.phone || '',
        职位: customer.position || '',
        行业: customer.industry || '',
        负责人: customer.assignedTo?.name || '',
        跟进状态: followUpStatusNames[customer.followStatus as FollowUpStatus] || customer.followStatus,
        邮箱: customer.email || ''
      }));

      // 创建工作簿
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '客户资料');

      // 设置列宽
      const colWidths = [
        { wch: 8 }, // 序号
        { wch: 15 }, // 客户姓名
        { wch: 25 }, // 单位名称
        { wch: 15 }, // 职位
        { wch: 15 }, // 电话
        { wch: 15 }, // 手机
        { wch: 20 }, // 邮箱
        { wch: 12 }, // 行业
        { wch: 12 }, // 来源
        { wch: 12 }, // 跟进状态
        { wch: 12 }, // 负责人
        { wch: 30 }, // 备注
        { wch: 20 }, // 创建时间
        { wch: 20 } // 更新时间
      ];
      worksheet['!cols'] = colWidths;

      // 生成文件名
      const fileName = `客户资料_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

      // 下载文件
      XLSX.writeFile(workbook, fileName);

      message.success(`成功导出 ${exportData.length} 条客户数据`);
    } catch (error) {
      console.error('导出客户数据失败:', error);
      message.error('导出失败，请重试');
    } finally {
      setExportLoading(false);
    }
  };

  // 提交分配
  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      setAssignLoading(true);

      await customerService.assignCustomers({
        assignedToId: values.employeeId,
        customerIds: selectedCustomersForAssign,
        remark: values.remark || ''
      });

      message.success('分配成功');
      setIsAssignModalVisible(false);
      setSelectedCustomersForAssign([]);
      assignForm.resetFields();
      fetchCustomers(); // 重新获取数据
    } catch (error) {
      console.error('分配客户失败:', error);
      message.error('分配失败');
    } finally {
      setAssignLoading(false);
    }
  };

  // 取消分配弹窗
  const handleAssignCancel = () => {
    setIsAssignModalVisible(false);
    setSelectedCustomersForAssign([]);
    assignForm.resetFields();
  };

  // 表格分页处理
  const handleTableChange = (page: number, pageSize?: number) => {
    console.log('🔍 分页变化:', { current: pagination.current, oldPageSize: pagination.pageSize, page, pageSize });

    const newPageSize = pageSize || pagination.pageSize;

    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: newPageSize
    }));
  };

  // 表格列配置
  const columns = [
    {
      dataIndex: 'customerName',
      key: 'customerName',
      title: '客户姓名',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      width: 120
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      title: '性别',
      ...getCenterColumnConfig(),
      render: (gender: string) => {
        if (!gender) return '-';
        if (gender === 'male') return '男';
        if (gender === 'female') return '女';
        return gender;
      },
      width: 80
    },
    {
      dataIndex: 'company',
      key: 'company',
      title: '单位名称',
      ...getCenterColumnConfig(),
      width: 200
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      ...getCenterColumnConfig(),
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      ...getCenterColumnConfig(),
      render: (text: string) => (
        <Space size="small">
          <span>{text || '-'}</span>
          {text && text !== '-' && (
            <Button
              icon={<CopyOutlined />}
              size="small"
              type="text"
              onClick={() => copyToClipboard(text, '电话')}
            />
          )}
        </Space>
      ),
      width: 160
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      title: '手机',
      ...getCenterColumnConfig(),
      render: (text: string) => (
        <Space size="small">
          <span>{text || '-'}</span>
          {text && text !== '-' && (
            <Button
              icon={<CopyOutlined />}
              size="small"
              type="text"
              onClick={() => copyToClipboard(text, '手机')}
            />
          )}
        </Space>
      ),
      width: 160
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      title: '跟进状态',
      ...getCenterColumnConfig(),
      render: (status: string) => {
        if (status === 'empty') {
          return <span style={{ color: '#8c8c8c' }}>-</span>;
        }
        const statusName = followUpStatusNames[status] || status;
        const colorMap: Record<string, string> = {
          [FollowUpStatus.VIP]: 'red',
          [FollowUpStatus.REGISTERED]: 'green',
          [FollowUpStatus.EFFECTIVE_VISIT]: 'blue',
          [FollowUpStatus.WECHAT_ADDED]: 'cyan',
          [FollowUpStatus.NEW_DEVELOP]: 'orange'
        };
        return <Tag color={colorMap[status] || 'default'}>{statusName}</Tag>;
      },
      width: 120
    },

    {
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      title: '负责人',
      ...getCenterColumnConfig(),
      render: (assignedTo: any) => assignedTo?.name || '-',
      width: 120
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      title: '修改时间',
      ...getCenterColumnConfig(),
      render: (text: string) => {
        if (!text) return '-';
        const date = new Date(text);
        return date
          .toLocaleString('zh-CN', {
            day: '2-digit',
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
            month: '2-digit',
            second: '2-digit',
            year: 'numeric'
          })
          .replace(/\//g, '-');
      },
      width: 150
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(isUserAdmin || isUserSuperAdmin ? 150 : 120),
      render: (_: any, record: CustomerApi.CustomerListItem) => (
        <Space>
          <Button
            disabled={!canEditCustomer(record)}
            size="small"
            type="link"
            onClick={() => openFollowStatusModal(record)}
          >
            修改状态
          </Button>
          {(isUserAdmin || isUserSuperAdmin) && (
            <Button
              icon={<UserSwitchOutlined />}
              size="small"
              type="link"
              onClick={() => assignSingleCustomer(record)}
            >
              分配
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 如果是超级管理员或管理员，显示"分配者"列
  if (isUserAdmin || isUserSuperAdmin) {
    columns.splice(6, 0, {
      dataIndex: 'assignedBy',
      key: 'assignedBy',
      title: '分配者',
      ...getCenterColumnConfig(),
      render: (assignedBy: any) => assignedBy?.name || '-',
      width: 120
    });
  }

  return (
    <div className="h-full bg-white p-4 dark:bg-[#141414]">
      <Card
        title={isUserAdmin || isUserSuperAdmin ? '客户资料管理' : '我的客户'}
        extra={
          <Space>
            <Button
              icon={<UserAddOutlined />}
              type="primary"
              onClick={addNewCustomer}
            >
              添加客户
            </Button>
            {(isUserAdmin || isUserSuperAdmin) && (
              <Button
                disabled={selectedCustomersForAssign.length === 0}
                icon={<UserSwitchOutlined />}
                onClick={openBatchAssignModal}
              >
                批量分配
              </Button>
            )}
            {isUserSuperAdmin && (
              <Button
                icon={<DownloadOutlined />}
                loading={exportLoading}
                onClick={handleExportCustomers}
              >
                导出客户
              </Button>
            )}
            <Button onClick={resetSearch}>重置筛选</Button>
          </Space>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-4">
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
            style={{ width: 160 }}
            value={searchParams.phone}
            onChange={e => setSearchParams({ ...searchParams, phone: e.target.value })}
          />
          <Input
            allowClear
            placeholder="单位名称"
            style={{ width: 160 }}
            value={searchParams.company}
            onChange={e => setSearchParams({ ...searchParams, company: e.target.value })}
          />
          <Input
            allowClear
            placeholder="负责人姓名"
            style={{ width: 160 }}
            value={searchParams.assignedToName}
            onChange={e => setSearchParams({ ...searchParams, assignedToName: e.target.value })}
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
          rowSelection={
            isUserAdmin || isUserSuperAdmin
              ? {
                  onChange: (selectedRowKeys: React.Key[]) => {
                    setSelectedCustomersForAssign(selectedRowKeys as number[]);
                  },
                  selectedRowKeys: selectedCustomersForAssign
                }
              : undefined
          }
          {...getFullTableConfig(10)}
          pagination={{
            ...getFullTableConfig(10).pagination,
            current: pagination.current,
            onChange: handleTableChange,
            pageSize: pagination.pageSize,
            total: pagination.total
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
                {currentCustomer.customerName} - {currentCustomer.company}
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
            label="性别"
            name="gender"
          >
            <Select placeholder="请选择性别">
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
            </Select>
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
            rules={[{ message: '请输入手机号', required: true }]}
          >
            <Input placeholder="请输入手机号" />
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

      {/* 分配客户弹窗 */}
      <Modal
        confirmLoading={assignLoading}
        open={isAssignModalVisible}
        title="分配客户"
        onCancel={handleAssignCancel}
        onOk={handleAssignSubmit}
      >
        <Form
          form={assignForm}
          layout="vertical"
        >
          <Form.Item
            label="分配给"
            name="employeeId"
            rules={[{ message: '请选择要分配的员工', required: true }]}
          >
            <Select
              placeholder="请选择要分配的员工"
              options={managedEmployees.map(employee => ({
                label: `${employee.nickName} (${employee.userName})`,
                value: employee.id
              }))}
            />
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
