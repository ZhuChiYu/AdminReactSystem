import { CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

import type { CustomerApi } from '@/service/api';
import { customerService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

/** 跟进状态枚举 */
export enum FollowUpStatus {
  ARRIVED = 'arrived',
  CONSULT = 'consult',
  EARLY_25 = 'early_25',
  EFFECTIVE_VISIT = 'effective_visit',
  NEW_DEVELOP = 'new_develop',
  NOT_ARRIVED = 'not_arrived',
  REGISTERED = 'registered',
  REJECTED = 'rejected',
  VIP = 'vip',
  WECHAT_ADDED = 'wechat_added'
}

/** 跟进状态选项 */
const followUpStatusOptions = [
  { bgColor: '#f5f5f5', color: 'default', label: '全部', textColor: '#666', value: 'all' },
  { bgColor: '#e6f7ff', color: 'blue', label: '咨询', textColor: '#1890ff', value: FollowUpStatus.CONSULT },
  { bgColor: '#f6ffed', color: 'green', label: '已加微信', textColor: '#52c41a', value: FollowUpStatus.WECHAT_ADDED },
  { bgColor: '#fff7e6', color: 'orange', label: '已报名', textColor: '#fa8c16', value: FollowUpStatus.REGISTERED },
  { bgColor: '#e6fffb', color: 'cyan', label: '已实到', textColor: '#13c2c2', value: FollowUpStatus.ARRIVED },
  { bgColor: '#f9f0ff', color: 'purple', label: '新开发', textColor: '#722ed1', value: FollowUpStatus.NEW_DEVELOP },
  { bgColor: '#fff0f6', color: 'magenta', label: '早25客户', textColor: '#eb2f96', value: FollowUpStatus.EARLY_25 },
  { bgColor: '#fffbe6', color: 'gold', label: '有效回访', textColor: '#faad14', value: FollowUpStatus.EFFECTIVE_VISIT },
  { bgColor: '#fff2f0', color: 'red', label: '未实到', textColor: '#ff4d4f', value: FollowUpStatus.NOT_ARRIVED },
  { bgColor: '#fafafa', color: 'default', label: '未通过', textColor: '#8c8c8c', value: FollowUpStatus.REJECTED },
  { bgColor: '#fff2e8', color: 'volcano', label: '大客户', textColor: '#fa541c', value: FollowUpStatus.VIP }
];

/** 获取状态标签颜色 */
const getStatusColor = (status: string) => {
  const option = followUpStatusOptions.find(opt => opt.value === status);
  return option?.color || 'default';
};

/** 获取状态标签文本 */
const getStatusLabel = (status: string) => {
  if (status === 'empty') {
    return '-';
  }
  const option = followUpStatusOptions.find(opt => opt.value === status);
  return option?.label || status;
};

// 添加CSS样式
const cardStyles = `
  .statistic-card {
    transition: all 0.3s ease !important;
  }

  .statistic-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  }

  .statistic-card.selected {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = cardStyles;
  if (!document.head.querySelector('style[data-card-styles]')) {
    styleElement.setAttribute('data-card-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

/** 客户跟进管理组件 */
const CustomerFollow = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  const [_followRecords, setFollowRecords] = useState<CustomerApi.CustomerListItem[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CustomerApi.CustomerListItem[]>([]);
  const [selectedFollowStatus, setSelectedFollowStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerApi.CustomerListItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [_selectedRows, setSelectedRows] = useState<CustomerApi.CustomerListItem[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 添加分页状态管理
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 检查是否为超级管理员
  const isSuper = isSuperAdmin();

  // 复制到剪切板的功能
  const copyToClipboard = async (text: string, type: string) => {
    if (!text || text === '-') {
      message.warning(`${type}为空，无法复制`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type}已复制到剪切板`);
    } catch {
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

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    assignedToName: '',
    company: '',
    customerName: '',
    followStatus: '',
    phone: ''
  });

  // 获取跟进数据 - 支持分页、状态筛选和搜索
  const fetchFollowData = async (pageNum?: number, pageSize?: number, status?: string) => {
    setLoading(true);
    try {
      const currentPage = pageNum || pagination.current;
      const currentPageSize = pageSize || pagination.pageSize;
      const currentStatus = status !== undefined ? status : selectedFollowStatus;

      // 获取统计数据，客户跟进页面只显示自己的数据
      const statisticsData = await customerService.getCustomerStatistics({ scope: 'own' });
      setStatistics(statisticsData);

      // 构建查询参数
      const queryParams: any = {
        assignedToName: searchParams.assignedToName || undefined,
        company: searchParams.company || undefined,
        current: currentPage,
        customerName: searchParams.customerName || undefined,
        mobile: searchParams.phone || undefined,
        phone: searchParams.phone || undefined,
        scope: 'own',
        size: currentPageSize
      };

      // 如果有状态筛选且不是'all'，添加筛选条件
      if (currentStatus && currentStatus !== 'all') {
        queryParams.followStatus = currentStatus;
      } else if (searchParams.followStatus) {
        queryParams.followStatus = searchParams.followStatus;
      }

      // 获取客户列表数据，支持分页和筛选
      const customerData = await customerService.getCustomerList(queryParams);

      // 转换数据格式以匹配前端类型
      const formattedRecords = customerData.records.map(customer => ({
        ...customer,
        canViewEmail: true,
        canViewMobile: true,
        canViewPhone: true,
        canViewRealName: true,
        // 兼容性映射
        createTime: customer.createdAt,
        customerLevel: customer.level,
        employee: customer.assignedTo,
        followContent: customer.remark || '暂无跟进内容',
        updateTime: customer.updatedAt
      }));

      setFollowRecords(formattedRecords);
      setFilteredRecords(formattedRecords);

      // 更新分页信息
      setPagination({
        current: customerData.current,
        pageSize: customerData.size,
        total: customerData.total
      });

      // 清空选择状态
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error) {
      console.error('❌ 获取跟进数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选数据 - 修改为支持分页的筛选
  const filterData = (status: string) => {
    setSelectedFollowStatus(status);

    // 清空选择状态
    setSelectedRowKeys([]);
    setSelectedRows([]);

    // 重置到第一页并重新获取数据
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFollowData(1, pagination.pageSize, status);
  };

  // 处理分页变化
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || pagination.pageSize;

    // 更新分页状态
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: newPageSize
    }));

    // 重新获取数据
    fetchFollowData(page, newPageSize);
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 })); // 重置到第一页
    fetchFollowData(1, pagination.pageSize);
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
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFollowData(1, pagination.pageSize);
  };

  // 添加跟进记录
  const handleAddFollow = () => {
    setIsModalVisible(true);
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 创建客户数据
      const customerData = {
        company: values.company,
        customerName: values.customerName,
        email: values.email || '',
        followStatus: values.followStatus || 'new_develop',
        gender: values.gender || '',
        industry: 'other',
        level: 1,
        mobile: values.mobile || '',
        phone: values.phone || '',
        position: values.position || '',
        remark: values.followContent || '',
        source: 'manual'
      };
      const result = await customerService.createCustomer(customerData);

      message.success('添加跟进记录成功');
      setIsModalVisible(false);
      form.resetFields();

      fetchFollowData(); // 重新获取当前分页的数据
    } catch (error) {
      console.error('❌ 添加跟进记录失败:', error);
      message.error('添加跟进记录失败');
    }
  };

  // 编辑记录
  const handleEdit = (record: CustomerApi.CustomerListItem) => {
    setEditingCustomer(record);
    editForm.setFieldsValue({
      company: record.company,
      customerName: record.customerName,
      followContent: record.remark || '',
      followStatus: record.followStatus,
      gender: record.gender,
      mobile: record.mobile,
      phone: record.phone,
      position: record.position
    });
    setIsEditModalVisible(true);
  };

  // 提交编辑
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();

      if (!editingCustomer) {
        message.error('编辑数据异常');
        return;
      }

      const updateData = {
        company: values.company,
        customerName: values.customerName,
        followStatus: values.followStatus,
        gender: values.gender,
        mobile: values.mobile,
        phone: values.phone,
        position: values.position,
        remark: values.followContent
      };

      await customerService.updateCustomer(editingCustomer.id, updateData);

      message.success('编辑成功');
      setIsEditModalVisible(false);
      setEditingCustomer(null);
      editForm.resetFields();
      fetchFollowData(); // 重新获取当前分页的数据
    } catch (error) {
      console.error('❌ 编辑失败:', error);
      message.error('编辑失败');
    }
  };

  // 删除记录
  const handleDelete = (id: number) => {
    Modal.confirm({
      cancelText: '取消',
      content: '确定要删除这条跟进记录吗？删除后无法恢复。',
      okText: '确认删除',
      okType: 'danger',
      onOk: async () => {
        try {
          await customerService.deleteCustomer(id);
          message.success('删除成功');
          fetchFollowData(); // 重新获取当前分页的数据
        } catch (error) {
          console.error('❌ 删除失败:', error);
          message.error('删除失败');
        }
      },
      title: '确认删除'
    });
  };

  // 表格行选择配置
  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: CustomerApi.CustomerListItem[]) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
    onSelect: (
      record: CustomerApi.CustomerListItem,
      selected: boolean,
      selectedRows: CustomerApi.CustomerListItem[]
    ) => {},
    onSelectAll: (
      selected: boolean,
      selectedRows: CustomerApi.CustomerListItem[],
      changeRows: CustomerApi.CustomerListItem[]
    ) => {},
    selectedRowKeys
  };

  // 客户数据导出功能
  const handleExport = async () => {
    if (!isSuper) {
      message.error('只有超级管理员可以导出客户数据');
      return;
    }

    setExportLoading(true);
    try {
      // 准备导出数据
      const exportData = filteredRecords.map((record, index) => ({
        公司: record.company,
        创建时间: record.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN') : '-',
        客户姓名: record.customerName,
        序号: index + 1,
        手机: record.mobile || '-',
        电话: record.phone || '-',
        职位: record.position || '-',
        负责人: record.assignedTo?.name || '未分配',
        跟进内容: record.remark || '暂无跟进内容',
        跟进状态: getStatusLabel(record.followStatus)
      }));

      // 转换为CSV格式
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n');

      // 创建下载链接
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      // 生成文件名
      const fileName = `客户跟进数据_${selectedFollowStatus === 'all' ? '全部' : getStatusLabel(selectedFollowStatus)}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`成功导出 ${exportData.length} 条客户数据`);
    } catch (error) {
      console.error('❌ 导出失败:', error);
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 批量删除功能
  const handleBatchDelete = () => {
    if (!isSuper) {
      message.error('只有超级管理员可以批量删除客户');
      return;
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的客户');
      return;
    }

    Modal.confirm({
      content: `确定要删除选中的 ${selectedRowKeys.length} 条客户记录吗？删除后无法恢复。`,
      icon: <DeleteOutlined />,
      okText: '确认删除',
      okType: 'danger',
      onOk: async () => {
        setDeleteLoading(true);
        try {
          // 并发删除所有选中的客户
          const deletePromises = selectedRowKeys.map(id => customerService.deleteCustomer(Number(id)));

          await Promise.all(deletePromises);

          message.success(`成功删除 ${selectedRowKeys.length} 条客户记录`);

          // 清空选择并重新获取当前分页的数据
          setSelectedRowKeys([]);
          setSelectedRows([]);
          fetchFollowData();
        } catch (error) {
          console.error('❌ 批量删除失败:', error);
          message.error('批量删除失败');
        } finally {
          setDeleteLoading(false);
        }
      },
      title: '批量删除确认'
    });
  };

  // 表格列定义
  const columns: ColumnsType<CustomerApi.CustomerListItem> = [
    {
      dataIndex: 'customerName',
      key: 'customerName',
      ...getCenterColumnConfig(),
      render: text => <span>{text}</span>,
      title: '客户姓名',
      width: 100
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      ...getCenterColumnConfig(),
      render: (gender: string) => {
        if (!gender) return '-';
        if (gender === 'male') return '男';
        if (gender === 'female') return '女';
        return gender;
      },
      title: '性别',
      width: 80
    },
    {
      dataIndex: 'company',
      ellipsis: true,
      key: 'company',
      ...getCenterColumnConfig(),
      title: '公司',
      width: 200
    },
    {
      dataIndex: 'position',
      key: 'position',
      ...getCenterColumnConfig(),
      title: '职位',
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
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
      title: '电话',
      width: 160
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
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
      title: '手机',
      width: 160
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      ...getCenterColumnConfig(),
      render: (status: string) => {
        if (status === 'empty') {
          return <span style={{ color: '#8c8c8c' }}>-</span>;
        }
        return <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>;
      },
      title: '跟进状态',
      width: 100
    },
    {
      dataIndex: 'remark',
      ellipsis: true,
      key: 'followContent',
      ...getCenterColumnConfig(),
      render: (text: string) => (
        <span title={text}>{text?.length > 30 ? `${text.slice(0, 30)}...` : text || '暂无跟进内容'}</span>
      ),
      title: '跟进内容'
    },
    {
      dataIndex: ['assignedTo', 'name'],
      key: 'employeeName',
      ...getCenterColumnConfig(),
      render: text => text || '未分配',
      title: '负责人',
      width: 100
    },
    {
      dataIndex: 'updatedAt',
      key: 'updateTime',
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
      title: '修改时间',
      width: 150
    },
    {
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            type="link"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
      title: '操作'
    }
  ];

  // 组件初始化
  useEffect(() => {
    fetchFollowData();
  }, []);

  // 当搜索参数变化时重新获取数据
  useEffect(() => {
    fetchFollowData();
  }, [searchParams]);

  return (
    <div className="customer-follow">
      {/* 统计卡片 */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16 }}
      >
        {followUpStatusOptions.map(option => (
          <Col
            key={option.value}
            lg={6}
            md={8}
            sm={12}
            xl={4}
            xs={24}
          >
            <Card
              hoverable
              className={`statistic-card ${selectedFollowStatus === option.value ? 'selected' : ''}`}
              style={{
                backgroundColor: selectedFollowStatus === option.value ? option.bgColor : `${option.bgColor}80`, // 未选中时使用50%透明度
                border:
                  selectedFollowStatus === option.value
                    ? `2px solid ${option.textColor}`
                    : `1px solid ${option.textColor}40`, // 未选中时边框更淡
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => filterData(option.value)}
            >
              <Statistic
                value={statistics[option.value] || 0}
                title={
                  <span
                    style={{
                      color: selectedFollowStatus === option.value ? option.textColor : '#666',
                      fontWeight: selectedFollowStatus === option.value ? 'bold' : 'normal'
                    }}
                  >
                    {option.label}
                  </span>
                }
                valueStyle={{
                  color: option.textColor, // 数字始终使用对应颜色
                  fontSize: selectedFollowStatus === option.value ? '28px' : '24px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 搜索框 */}
      <Card style={{ marginBottom: 16 }}>
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
            placeholder="电话或手机号"
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
            {followUpStatusOptions.slice(1).map(option => (
              <Select.Option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button onClick={resetSearch}>重置</Button>
        </div>
      </Card>

      {/* 操作栏 */}
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          {isSuper && selectedRowKeys.length > 0 && (
            <span style={{ color: '#666' }}>已选择 {selectedRowKeys.length} 条记录</span>
          )}
        </div>
        <Space>
          {isSuper && (
            <>
              <Button
                danger
                disabled={selectedRowKeys.length === 0}
                icon={<DeleteOutlined />}
                loading={deleteLoading}
                onClick={handleBatchDelete}
              >
                批量删除 {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
              </Button>
              <Button
                icon={<DownloadOutlined />}
                loading={exportLoading}
                onClick={handleExport}
              >
                导出数据
              </Button>
            </>
          )}
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={handleAddFollow}
          >
            添加跟进
          </Button>
        </Space>
      </div>

      {/* 跟进记录表格 */}
      <Table
        columns={columns}
        dataSource={filteredRecords}
        loading={loading}
        rowKey="id"
        rowSelection={isSuper ? rowSelection : undefined}
        {...getFullTableConfig(10)}
        pagination={{
          ...getFullTableConfig(10).pagination,
          current: pagination.current,
          onChange: handleTableChange,
          pageSize: pagination.pageSize,
          pageSizeOptions: ['10', '20', '50', '100'],
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          total: pagination.total
        }}
      />

      {/* 添加跟进记录模态框 */}
      <Modal
        destroyOnClose
        open={isModalVisible}
        title="添加跟进记录"
        onCancel={() => setIsModalVisible(false)}
        onOk={handleFormSubmit}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="客户姓名"
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
            label="公司"
            name="company"
            rules={[{ message: '请输入公司名称', required: true }]}
          >
            <Input placeholder="请输入公司名称" />
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
            <Input placeholder="请输入电话号码" />
          </Form.Item>

          <Form.Item
            label="手机"
            name="mobile"
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>

          <Form.Item
            label="跟进状态"
            name="followStatus"
            rules={[{ message: '请选择跟进状态', required: true }]}
          >
            <Select placeholder="请选择跟进状态">
              {followUpStatusOptions.slice(1).map(option => (
                <Select.Option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="跟进内容"
            name="followContent"
            rules={[{ message: '请输入跟进内容', required: true }]}
          >
            <Input.TextArea
              placeholder="请输入跟进内容"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑客户弹窗 */}
      <Modal
        cancelText="取消"
        okText="保存"
        open={isEditModalVisible}
        title="编辑客户信息"
        width={600}
        onOk={handleEditSubmit}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingCustomer(null);
          editForm.resetFields();
        }}
      >
        <Form
          form={editForm}
          layout="vertical"
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="客户姓名"
                name="customerName"
                rules={[{ message: '请输入客户姓名', required: true }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="性别"
                name="gender"
              >
                <Select placeholder="请选择性别">
                  <Select.Option value="male">男</Select.Option>
                  <Select.Option value="female">女</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="公司名称"
                name="company"
                rules={[{ message: '请输入公司名称', required: true }]}
              >
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="职位"
                name="position"
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="跟进状态"
                name="followStatus"
                rules={[{ message: '请选择跟进状态', required: true }]}
              >
                <Select placeholder="请选择跟进状态">
                  {followUpStatusOptions.slice(1).map(option => (
                    <Select.Option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="电话"
                name="phone"
              >
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="手机"
                name="mobile"
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="跟进内容"
            name="followContent"
          >
            <Input.TextArea
              placeholder="请输入跟进内容"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerFollow;
