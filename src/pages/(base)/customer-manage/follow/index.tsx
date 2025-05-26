import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

import type { CustomerApi } from '@/service/api';
import { customerService } from '@/service/api';

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
  const [followRecords, setFollowRecords] = useState<CustomerApi.CustomerListItem[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CustomerApi.CustomerListItem[]>([]);
  const [selectedFollowStatus, setSelectedFollowStatus] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  // 用户角色状态，可以在开发环境下切换测试
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');

  // 切换用户角色（仅供开发测试使用）
  const toggleUserRole = () => {
    setUserRole(prev => (prev === 'admin' ? 'user' : 'admin'));
  };

  // 获取跟进数据
  const fetchFollowData = async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const statisticsData = await customerService.getCustomerStatistics();
      setStatistics(statisticsData);

      // 获取客户列表数据
      const customerData = await customerService.getCustomerList({
        current: 1,
        size: 100 // 获取更多数据用于演示
      });

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
    } catch (error) {
      message.error('获取数据失败');
      console.error('获取跟进数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 筛选数据
  const filterData = (status: string) => {
    setSelectedFollowStatus(status);
    if (status === 'all') {
      setFilteredRecords(followRecords);
    } else {
      const filtered = followRecords.filter(record => record.followStatus === status);
      setFilteredRecords(filtered);
    }
  };

  // 添加跟进记录
  const handleAddFollow = () => {
    setIsModalVisible(true);
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('提交跟进记录:', values);

      // 这里调用API添加跟进记录
      // await customerService.addFollowRecord(customerId, values);

      message.success('添加跟进记录成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchFollowData(); // 重新获取数据
    } catch (error) {
      console.error('添加跟进记录失败:', error);
    }
  };

  // 编辑记录
  const handleEdit = (record: CustomerApi.CustomerListItem) => {
    console.log('编辑记录:', record);
    // 实现编辑功能
  };

  // 删除记录
  const handleDelete = (_id: number) => {
    Modal.confirm({
      content: '确定要删除这条跟进记录吗？',
      onOk: async () => {
        try {
          // await customerService.deleteCustomer(id);
          message.success('删除成功');
          fetchFollowData();
        } catch {
          message.error('删除失败');
        }
      },
      title: '确认删除'
    });
  };

  // 表格列定义
  const columns: ColumnsType<CustomerApi.CustomerListItem> = [
    {
      dataIndex: 'customerName',
      key: 'customerName',
      render: text => <span>{text}</span>,
      title: '客户姓名',
      width: 100
    },
    {
      dataIndex: 'company',
      ellipsis: true,
      key: 'company',
      title: '公司',
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
      render: text => <span>{text || '-'}</span>,
      title: '电话',
      width: 120
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      render: text => <span>{text || '-'}</span>,
      title: '手机',
      width: 120
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>,
      title: '跟进状态',
      width: 100
    },
    {
      dataIndex: 'remark',
      ellipsis: true,
      key: 'followContent',
      render: (text: string) => (
        <span title={text}>{text?.length > 30 ? `${text.slice(0, 30)}...` : text || '暂无跟进内容'}</span>
      ),
      title: '跟进内容'
    },
    {
      dataIndex: ['assignedTo', 'name'],
      key: 'employeeName',
      render: text => text || '未分配',
      title: '负责人',
      width: 100
    },
    {
      dataIndex: 'createdAt',
      key: 'createTime',
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
      title: '创建时间',
      width: 150
    },
    {
      key: 'action',
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
          {userRole === 'admin' && (
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              type="link"
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
      title: '操作',
      width: 120
    }
  ];

  // 组件初始化
  useEffect(() => {
    fetchFollowData();
  }, []);

  return (
    <div className="customer-follow">
      {/* 开发测试：角色切换按钮 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          size="small"
          type="dashed"
          onClick={toggleUserRole}
        >
          当前角色: {userRole === 'admin' ? '管理员' : '普通用户'} (点击切换)
        </Button>
      </div>

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

      {/* 操作栏 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
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
        scroll={{ x: 1200 }}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
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
    </div>
  );
};

export default CustomerFollow;
