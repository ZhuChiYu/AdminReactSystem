import { Button, Card, Form, Input, Modal, Radio, Space, Table, Tag, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { isSuperAdmin } from '@/utils/auth';

const { Title } = Typography;
const { TextArea } = Input;

interface ExpenseItem {
  amount: number;
  applicant: string;
  date: string;
  department: string;
  id: string;
  status: 'approved' | 'pending' | 'rejected';
  title: string;
  type: string;
}

const Component: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<ExpenseItem | null>(null);
  const [form] = Form.useForm();
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 检查用户是否为超级管理员
  const isUserSuperAdmin = isSuperAdmin();

  // 页面加载时获取报销数据
  useEffect(() => {
    if (!isUserSuperAdmin) {
      return;
    }

    setLoading(true);

    // 获取本地存储中的通知
    const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');

    // 获取报销申请数据 (实际项目中应从API获取)
    const storedExpenses = localStorage.getItem('expenseApplications');

    setTimeout(() => {
      // 如果有存储的报销数据，使用它们
      if (storedExpenses) {
        try {
          const parsedExpenses = JSON.parse(storedExpenses);
          setExpenseData(parsedExpenses);
        } catch (error) {
          console.error('解析报销数据失败:', error);
          // 如果解析失败，使用模拟数据
          setExpenseData(mockExpenseData);
        }
      } else {
        // 否则使用模拟数据
        setExpenseData(mockExpenseData);
      }

      // 标记通知为已读 (如果有相关通知)
      const expenseNotifications = notifications.filter((n: any) => n.type === 'expense');
      if (expenseNotifications.length > 0) {
        const updatedNotifications = notifications.map((n: any) => {
          if (n.type === 'expense') {
            return { ...n, read: true };
          }
          return n;
        });
        localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
      }

      setLoading(false);
    }, 500);
  }, [isUserSuperAdmin]);

  // 模拟数据
  const mockExpenseData: ExpenseItem[] = [
    {
      amount: 2500,
      applicant: '张三',
      date: '2023-10-15',
      department: '技术部',
      id: '1',
      status: 'pending',
      title: '项目差旅费',
      type: '差旅费'
    },
    {
      amount: 800,
      applicant: '李四',
      date: '2023-10-12',
      department: '行政部',
      id: '2',
      status: 'pending',
      title: '办公用品采购',
      type: '办公用品'
    },
    {
      amount: 1200,
      applicant: '王五',
      date: '2023-10-10',
      department: '销售部',
      id: '3',
      status: 'approved',
      title: '客户会议餐费',
      type: '餐费'
    }
  ];

  const showApproveModal = (record: ExpenseItem) => {
    setCurrentItem(record);
    setVisible(true);
    form.resetFields();
  };

  const handleApprove = () => {
    form.validateFields().then(values => {
      console.log('审批结果:', values);

      // 更新报销项目状态
      const updatedData = expenseData.map(item => {
        if (item.id === currentItem?.id) {
          return {
            ...item,
            status: values.result
          };
        }
        return item;
      });

      setExpenseData(updatedData);

      // 保存到本地存储 (实际项目中应调用API)
      localStorage.setItem('expenseApplications', JSON.stringify(updatedData));

      // 显示成功消息
      message.success(`已${values.result === 'approved' ? '通过' : '拒绝'}该报销申请`);

      setVisible(false);
    });
  };

  const columns = [
    {
      dataIndex: 'title',
      key: 'title',
      title: '报销标题'
    },
    {
      dataIndex: 'applicant',
      key: 'applicant',
      title: '申请人'
    },
    {
      dataIndex: 'department',
      key: 'department',
      title: '所属部门'
    },
    {
      dataIndex: 'type',
      key: 'type',
      title: '报销类型'
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      render: (text: number) => `¥${text.toFixed(2)}`,
      title: '报销金额'
    },
    {
      dataIndex: 'date',
      key: 'date',
      title: '申请日期'
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        let text = '待审核';

        if (status === 'approved') {
          color = 'green';
          text = '已通过';
        } else if (status === 'rejected') {
          color = 'red';
          text = '已拒绝';
        }

        return <Tag color={color}>{text}</Tag>;
      },
      title: '状态'
    },
    {
      key: 'action',
      render: (_: any, record: ExpenseItem) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              onClick={() => showApproveModal(record)}
            >
              审批
            </Button>
          )}
          <Button size="small">查看详情</Button>
        </Space>
      ),
      title: '操作'
    }
  ];

  if (!isUserSuperAdmin) {
    return (
      <div className="p-4">
        <Card>
          <div className="flex h-64 items-center justify-center">
            <Typography.Text className="text-lg text-gray-500">
              您没有权限访问此页面
            </Typography.Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <Title level={4}>报销审核</Title>
        <Table
          columns={columns}
          dataSource={expenseData}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        destroyOnClose
        open={visible}
        title="报销审批"
        onCancel={() => setVisible(false)}
        onOk={handleApprove}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="审批结果"
            name="result"
            rules={[{ message: '请选择审批结果', required: true }]}
          >
            <Radio.Group>
              <Radio value="approved">通过</Radio>
              <Radio value="rejected">拒绝</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="审批意见"
            name="comment"
            rules={[{ message: '请填写审批意见', required: true }]}
          >
            <TextArea
              placeholder="请输入审批意见"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Component;
