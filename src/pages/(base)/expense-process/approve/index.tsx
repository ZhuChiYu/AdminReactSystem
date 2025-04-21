import { Button, Card, Form, Input, Modal, Radio, Space, Table, Tag, Typography } from 'antd';
import React, { useState } from 'react';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentItem, setCurrentItem] = useState<ExpenseItem | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  const mockData: ExpenseItem[] = [
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
      // 实际项目中这里会调用API
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

  return (
    <div className="p-4">
      <Card>
        <Title level={4}>报销审核</Title>
        <Table
          columns={columns}
          dataSource={mockData}
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
