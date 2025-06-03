import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Badge, Button, Card, Descriptions, Form, Input, Modal, Radio, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { expenseService } from '@/service/api';
import type { ExpenseApi } from '@/service/api/types';
import { isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ExpenseItem {
  amount: number;
  applicant: string;
  applicationDate: string;
  approvalDate?: string;
  approver?: string;
  comment?: string;
  department: string;
  description: string;
  expenseType: string;
  id: number;
  status: number;
}

const Component: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<ExpenseItem | null>(null);
  const [form] = Form.useForm();
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 检查用户是否为超级管理员
  const isUserSuperAdmin = isSuperAdmin();

  // 获取费用申请列表
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expenseService.getExpenseList({
        current: 1,
        size: 1000,
        status: 0 // 只获取待审批的申请
      });

      console.log('收到响应:', response);

      // expenseService.getExpenseList 直接返回的是 PageResponse 中的 data 部分
      // 所以这里 response 就是 { records: [], total: number, current: number, size: number, pages: number }
      if (!response) {
        console.log('响应数据为空，设置为空数组');
        setExpenseData([]);
        return;
      }

      console.log('✅ 业务成功响应，返回data:', response);

      // 检查 records 是否存在
      if (!response.records || !Array.isArray(response.records)) {
        console.log('records 数据不存在或格式错误，设置为空数组');
        setExpenseData([]);
        return;
      }

      // 转换API数据格式
      const formattedExpenses: ExpenseItem[] = response.records.map((expense: ExpenseApi.ExpenseListItem) => ({
        amount: expense.amount || 0,
        applicant: expense.applicant?.name || '未知用户',
        applicationDate: expense.applicationTime || '',
        approvalDate: expense.approvalTime || '',
        approver: expense.approver?.name || '',
        comment: expense.remark || '',
        department: expense.department || '未知部门',
        description: expense.description || '',
        expenseType: expense.expenseType || '未知类型',
        id: expense.id,
        status: expense.status || 0
      }));

      setExpenseData(formattedExpenses);
    } catch (error) {
      console.error('获取费用申请列表失败:', error);
      // 设置空数组，避免页面崩溃，不显示错误提示
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const showApprovalModal = (record: ExpenseItem) => {
    setCurrentExpense(record);
    form.resetFields();
    setVisible(true);
  };

  const showDetailModal = (record: ExpenseItem) => {
    setCurrentExpense(record);
    setDetailVisible(true);
  };

  const handleApprove = async () => {
    try {
      const values = await form.validateFields();

      if (currentExpense) {
        await expenseService.approveExpense(currentExpense.id, {
          remark: values.comment,
          status: values.approval
        });

        window.$message?.success('审批完成');
        setVisible(false);
        fetchExpenses(); // 重新获取列表
      }
    } catch (error) {
      window.$message?.error('审批失败');
      console.error('费用审批失败:', error);
    }
  };

  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: '申请编号',
      width: 100
    },
    {
      dataIndex: 'applicant',
      key: 'applicant',
      ...getCenterColumnConfig(),
      render: (text: string) => <Text strong>{text}</Text>,
      title: '申请人'
    },
    {
      dataIndex: 'department',
      key: 'department',
      ...getCenterColumnConfig(),
      title: '部门'
    },
    {
      dataIndex: 'expenseType',
      key: 'expenseType',
      ...getCenterColumnConfig(),
      title: '费用类型'
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      ...getCenterColumnConfig(),
      render: (amount: number) => <Text style={{ color: '#f50' }}>{amount.toFixed(2)}</Text>,
      title: '金额(元)',
      width: 120
    },
    {
      dataIndex: 'applicationDate',
      key: 'applicationDate',
      ...getCenterColumnConfig(),
      title: '申请时间',
      width: 150
    },
    {
      dataIndex: 'status',
      key: 'status',
      ...getCenterColumnConfig(),
      render: (status: number) => {
        if (status === 0) {
          return (
            <Badge
              status="processing"
              text="待审批"
            />
          );
        } else if (status === 1) {
          return (
            <Badge
              status="success"
              text="已通过"
            />
          );
        }
        return (
          <Badge
            status="error"
            text="已拒绝"
          />
        );
      },
      title: '状态'
    },
    {
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_: any, record: ExpenseItem) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => showDetailModal(record)}
          >
            详情
          </Button>
          {record.status === 0 && (
            <Button
              size="small"
              type="primary"
              onClick={() => showApprovalModal(record)}
            >
              审批
            </Button>
          )}
        </Space>
      ),
      title: '操作'
    }
  ];

  if (!isUserSuperAdmin) {
    return (
      <div className="p-4">
        <Card>
          <div className="h-64 flex items-center justify-center">
            <Typography.Text className="text-lg text-gray-500">您没有权限访问此页面</Typography.Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4">
          <Title level={4}>费用审批</Title>
        </div>
        <Table<ExpenseItem>
          columns={columns}
          dataSource={expenseData}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 审批弹窗 */}
      <Modal
        destroyOnClose
        open={visible}
        title="费用审批"
        width={600}
        onCancel={() => setVisible(false)}
        onOk={handleApprove}
      >
        {currentExpense && (
          <div>
            <Descriptions
              bordered
              column={2}
              title="费用详情"
            >
              <Descriptions.Item label="申请人">
                <Space>
                  <UserOutlined />
                  {currentExpense.applicant}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="部门">{currentExpense.department}</Descriptions.Item>
              <Descriptions.Item label="费用类型">
                <Tag color="blue">{currentExpense.expenseType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <Space>
                  <DollarOutlined style={{ color: '#f50' }} />
                  <Text
                    strong
                    style={{ color: '#f50' }}
                  >
                    ¥{currentExpense.amount.toFixed(2)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label="申请时间"
                span={2}
              >
                <Space>
                  <CalendarOutlined />
                  {currentExpense.applicationDate}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label="费用说明"
                span={2}
              >
                <Space>
                  <FileTextOutlined />
                  {currentExpense.description || '暂无说明'}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={form}
              layout="vertical"
              style={{ marginTop: 24 }}
            >
              <Form.Item
                label="审批决定"
                name="approval"
                rules={[{ message: '请选择审批结果', required: true }]}
              >
                <Radio.Group>
                  <Radio value={1}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    &nbsp;同意
                  </Radio>
                  <Radio value={-1}>
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                    &nbsp;拒绝
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="审批意见"
                name="comment"
              >
                <TextArea
                  placeholder="请输入审批意见（可选）"
                  rows={4}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        destroyOnClose
        footer={null}
        open={detailVisible}
        title="费用详情"
        width={700}
        onCancel={() => setDetailVisible(false)}
      >
        {currentExpense && (
          <div>
            <Descriptions
              bordered
              column={2}
            >
              <Descriptions.Item label="申请编号">{currentExpense.id}</Descriptions.Item>
              <Descriptions.Item label="申请人">
                <Space>
                  <UserOutlined />
                  {currentExpense.applicant}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="部门">{currentExpense.department}</Descriptions.Item>
              <Descriptions.Item label="费用类型">
                <Tag color="blue">{currentExpense.expenseType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请金额">
                <Space>
                  <DollarOutlined style={{ color: '#f50' }} />
                  <Text
                    strong
                    style={{ color: '#f50' }}
                  >
                    ¥{currentExpense.amount.toFixed(2)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                <Space>
                  <CalendarOutlined />
                  {currentExpense.applicationDate}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label="费用说明"
                span={2}
              >
                <Space>
                  <FileTextOutlined />
                  {currentExpense.description || '暂无说明'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="审批状态">
                {currentExpense.status === 0 && (
                  <Badge
                    status="processing"
                    text="待审批"
                  />
                )}
                {currentExpense.status === 1 && (
                  <Badge
                    status="success"
                    text="已通过"
                  />
                )}
                {currentExpense.status === -1 && (
                  <Badge
                    status="error"
                    text="已拒绝"
                  />
                )}
              </Descriptions.Item>
              {currentExpense.approver && (
                <Descriptions.Item label="审批人">{currentExpense.approver}</Descriptions.Item>
              )}
              {currentExpense.approvalDate && (
                <Descriptions.Item
                  label="审批时间"
                  span={2}
                >
                  <Space>
                    <CalendarOutlined />
                    {currentExpense.approvalDate}
                  </Space>
                </Descriptions.Item>
              )}
              {currentExpense.comment && (
                <Descriptions.Item
                  label="审批意见"
                  span={2}
                >
                  {currentExpense.comment}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Component;
