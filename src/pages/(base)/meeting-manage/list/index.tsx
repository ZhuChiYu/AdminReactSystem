import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface MeetingItem {
  approvalStatus: 'approved' | 'pending' | 'rejected'; // 审批状态
  endTime: string;
  id: string;
  location: string;
  organizer: string;
  participants: string[];
  startTime: string;
  status: 'cancelled' | 'completed' | 'ongoing' | 'pending';
  title: string;
  summary?: string; // 会议总结内容
  record?: string; // 会议记录内容
}

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingItem | null>(null);
  const [recordForm] = Form.useForm();
  const [summaryForm] = Form.useForm();

  // 当前用户角色，在实际应用中应该从认证上下文中获取
  const currentUserRole = 'employee'; // 可能的值: 'super-admin', 'admin', 'employee'

  // 模拟数据
  const mockData: MeetingItem[] = [
    {
      approvalStatus: 'approved',
      endTime: '2023-10-20 16:00',
      id: '1',
      location: '会议室A',
      organizer: '张三',
      participants: ['李四', '王五', '赵六'],
      startTime: '2023-10-20 14:00',
      status: 'completed',
      title: '项目进度汇报会',
      record: '讨论了项目当前进度，确定了下一阶段的目标和任务分配。张三负责前端开发，李四负责后端开发，王五负责测试。',
      summary: '项目总体进度良好，但后端性能优化任务需要加快推进。'
    },
    {
      approvalStatus: 'pending',
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
      approvalStatus: 'rejected',
      endTime: '2023-10-18 11:30',
      id: '3',
      location: '会议室C',
      organizer: '王五',
      participants: ['张三', '李四', '孙八'],
      startTime: '2023-10-18 09:00',
      status: 'cancelled',
      title: '产品设计讨论会'
    }
  ];

  // 显示创建会议弹窗
  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 创建会议
  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('创建会议:', values);
      // 实际项目中这里会调用API，并处理审批流程
      message.success('会议创建成功，等待审批');
      setIsModalVisible(false);
    });
  };

  // 显示记录弹窗
  const showRecordModal = (record: MeetingItem) => {
    setCurrentMeeting(record);
    recordForm.setFieldsValue({
      content: record.record || ''
    });
    setRecordModalVisible(true);
  };

  // 保存会议记录
  const handleSaveRecord = () => {
    recordForm.validateFields().then(values => {
      console.log('保存会议记录:', values, '会议ID:', currentMeeting?.id);
      message.success('会议记录保存成功');
      setRecordModalVisible(false);
    });
  };

  // 显示总结弹窗
  const showSummaryModal = (record: MeetingItem) => {
    setCurrentMeeting(record);
    summaryForm.setFieldsValue({
      content: record.summary || ''
    });
    setSummaryModalVisible(true);
  };

  // 保存会议总结
  const handleSaveSummary = () => {
    summaryForm.validateFields().then(values => {
      console.log('保存会议总结:', values, '会议ID:', currentMeeting?.id);
      message.success('会议总结保存成功');
      setSummaryModalVisible(false);
    });
  };

  // 获取审批状态标签
  const getApprovalStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="success">已批准</Tag>;
      case 'pending':
        return <Tag color="processing">审批中</Tag>;
      case 'rejected':
        return <Tag color="error">已拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
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
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status: string) => getApprovalStatusTag(status),
      title: '审批状态'
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
      render: (_: any, record: MeetingItem) => (
        <Space>
          {/* 只有会议被批准且已结束才能添加记录和总结 */}
          {record.approvalStatus === 'approved' && record.status === 'completed' && (
            <>
          <Button
            size="small"
            type="link"
                onClick={() => showRecordModal(record)}
          >
                {record.record ? '查看记录' : '添加记录'}
          </Button>
          <Button
            size="small"
            type="link"
                onClick={() => showSummaryModal(record)}
          >
                {record.summary ? '查看总结' : '添加总结'}
          </Button>
            </>
          )}

          {/* 显示审批状态消息 */}
          {record.approvalStatus === 'pending' && (
            <Tag color="orange">等待审批</Tag>
          )}
          {record.approvalStatus === 'rejected' && (
            <Tag color="red">审批拒绝</Tag>
          )}
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

      {/* 创建会议弹窗 */}
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

      {/* 会议记录弹窗 */}
      <Modal
        destroyOnClose
        open={recordModalVisible}
        title={currentMeeting?.record ? "会议记录详情" : "添加会议记录"}
        width={700}
        onCancel={() => setRecordModalVisible(false)}
        onOk={handleSaveRecord}
      >
        <Form
          form={recordForm}
          layout="vertical"
        >
          <div className="mb-4">
            <p><strong>会议标题：</strong> {currentMeeting?.title}</p>
            <p><strong>会议时间：</strong> {currentMeeting?.startTime} 至 {currentMeeting?.endTime}</p>
            <p><strong>会议地点：</strong> {currentMeeting?.location}</p>
          </div>

          <Form.Item
            label="会议记录内容"
            name="content"
            rules={[{ message: '请输入会议记录内容', required: true }]}
          >
            <TextArea
              placeholder="请详细记录会议的讨论内容、决策和下一步行动计划等"
              rows={10}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 会议总结弹窗 */}
      <Modal
        destroyOnClose
        open={summaryModalVisible}
        title={currentMeeting?.summary ? "会议总结详情" : "添加会议总结"}
        width={700}
        onCancel={() => setSummaryModalVisible(false)}
        onOk={handleSaveSummary}
      >
        <Form
          form={summaryForm}
          layout="vertical"
        >
          <div className="mb-4">
            <p><strong>会议标题：</strong> {currentMeeting?.title}</p>
            <p><strong>会议时间：</strong> {currentMeeting?.startTime} 至 {currentMeeting?.endTime}</p>
            <p><strong>会议地点：</strong> {currentMeeting?.location}</p>
          </div>

          <Form.Item
            label="会议总结内容"
            name="content"
            rules={[{ message: '请输入会议总结内容', required: true }]}
          >
            <TextArea
              placeholder="请总结会议的主要内容、达成的共识和需要跟进的事项等"
              rows={10}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Component;
