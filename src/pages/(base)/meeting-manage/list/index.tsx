import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface MeetingItem {
  endTime: string;
  id: string;
  location: string;
  organizer: string;
  participants: string[];
  startTime: string;
  status: 'cancelled' | 'completed' | 'ongoing' | 'pending';
  title: string;
}

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 模拟数据
  const mockData: MeetingItem[] = [
    {
      endTime: '2023-10-20 16:00',
      id: '1',
      location: '会议室A',
      organizer: '张三',
      participants: ['李四', '王五', '赵六'],
      startTime: '2023-10-20 14:00',
      status: 'pending',
      title: '项目进度汇报会'
    },
    {
      endTime: '2023-10-22 12:00',
      id: '2',
      location: '会议室B',
      organizer: '李四',
      participants: ['张三', '王五', '钱七'],
      startTime: '2023-10-22 10:00',
      status: 'pending',
      title: '季度业绩分析会'
    },
    {
      endTime: '2023-10-18 11:30',
      id: '3',
      location: '会议室C',
      organizer: '王五',
      participants: ['张三', '李四', '孙八'],
      startTime: '2023-10-18 09:00',
      status: 'completed',
      title: '产品设计讨论会'
    }
  ];

  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('创建会议:', values);
      // 实际项目中这里会调用API
      setIsModalVisible(false);
    });
  };

  const columns = [
    {
      dataIndex: 'title',
      key: 'title',
      title: '会议标题'
    },
    {
      dataIndex: 'organizer',
      key: 'organizer',
      title: '组织者'
    },
    {
      dataIndex: 'startTime',
      key: 'startTime',
      title: '开始时间'
    },
    {
      dataIndex: 'endTime',
      key: 'endTime',
      title: '结束时间'
    },
    {
      dataIndex: 'location',
      key: 'location',
      title: '地点'
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        let text = '待开始';

        if (status === 'ongoing') {
          color = 'green';
          text = '进行中';
        } else if (status === 'completed') {
          color = 'gray';
          text = '已结束';
        } else if (status === 'cancelled') {
          color = 'red';
          text = '已取消';
        }

        return <Tag color={color}>{text}</Tag>;
      },
      title: '状态'
    },
    {
      dataIndex: 'participants',
      key: 'participants',
      render: (participants: string[]) => participants.length,
      title: '参与人数'
    },
    {
      key: 'action',
      render: (_: any, _record: MeetingItem) => (
        <Space>
          <Button
            size="small"
            type="link"
          >
            会议记录
          </Button>
          <Button
            size="small"
            type="link"
          >
            会议总结
          </Button>
        </Space>
      ),
      title: '操作'
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>会议列表</Title>
          <Button
            type="primary"
            onClick={showModal}
          >
            创建会议
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={mockData}
          rowKey="id"
        />
      </Card>

      <Modal
        destroyOnClose
        open={isModalVisible}
        title="创建会议"
        onCancel={() => setIsModalVisible(false)}
        onOk={handleOk}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="会议标题"
            name="title"
            rules={[{ message: '请输入会议标题', required: true }]}
          >
            <Input placeholder="请输入会议标题" />
          </Form.Item>

          <Form.Item
            label="会议时间"
            name="time"
            rules={[{ message: '请选择会议时间', required: true }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="会议地点"
            name="location"
            rules={[{ message: '请输入会议地点', required: true }]}
          >
            <Input placeholder="请输入会议地点" />
          </Form.Item>

          <Form.Item
            label="参会人员"
            name="participants"
            rules={[{ message: '请选择参会人员', required: true }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择参会人员"
              options={[
                { label: '张三', value: '张三' },
                { label: '李四', value: '李四' },
                { label: '王五', value: '王五' },
                { label: '赵六', value: '赵六' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="会议议程"
            name="agenda"
          >
            <TextArea
              placeholder="请输入会议议程"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Component;
