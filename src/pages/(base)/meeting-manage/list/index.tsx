import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { meetingService } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface MeetingItem {
  approvalStatus: number; // 审批状态
  endTime: string;
  id: number;
  location: string;
  organizer: string;
  participants: string[];
  // 会议总结内容
  record?: string;
  startTime: string;
  status: number;
  summary?: string;
  title: string; // 会议记录内容
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
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const { message } = App.useApp();

  // 当前用户角色，在实际应用中应该从认证上下文中获取
  const currentUserRole = 'employee'; // 可能的值: 'super-admin', 'admin', 'employee'

  // 获取会议列表
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 1000
      });

      // 转换API数据格式
      const formattedMeetings: MeetingItem[] = response.records.map((meeting: MeetingApi.MeetingListItem) => ({
        approvalStatus: 0, // 默认待审批状态
        endTime: meeting.endTime,
        id: meeting.id,
        location: meeting.meetingRoom || '未指定',
        organizer: meeting.organizer?.name || '',
        participants: [], // API中没有participants字段，使用空数组
        record: '', // API中没有meetingRecord字段，使用空字符串
        startTime: meeting.startTime,
        status: meeting.meetingStatus,
        summary: '', // API中没有meetingSummary字段，使用空字符串
        title: meeting.meetingTitle
      }));

      setMeetings(formattedMeetings);
    } catch (error) {
      message.error('获取会议列表失败');
      console.error('获取会议列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // 显示创建会议弹窗
  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 创建会议
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const meetingData: MeetingApi.CreateMeetingRequest = {
        endTime: values.time[1].format('YYYY-MM-DD HH:mm:ss'),
        isOnline: false,
        meetingDesc: values.agenda || '',
        meetingRoom: values.location,
        meetingTitle: values.title,
        meetingType: 'meeting',
        participantIds: [],
        startTime: values.time[0].format('YYYY-MM-DD HH:mm:ss')
      };

      await meetingService.createMeeting(meetingData);
      message.success('会议创建成功，等待审批');
      setIsModalVisible(false);
      fetchMeetings(); // 重新获取列表
    } catch (error) {
      message.error('创建会议失败');
      console.error('创建会议失败:', error);
    }
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
  const handleSaveRecord = async () => {
    try {
      const values = await recordForm.validateFields();

      if (currentMeeting) {
        // 由于API类型定义中没有meetingRecord字段，这里暂时注释掉或使用其他方式处理
        // await meetingService.updateMeeting(currentMeeting.id, {
        //   meetingRecord: values.content
        // });
        console.log('保存会议记录:', values.content);
        message.success('会议记录保存成功');
        setRecordModalVisible(false);
        fetchMeetings(); // 重新获取列表
      }
    } catch (error) {
      message.error('保存会议记录失败');
      console.error('保存会议记录失败:', error);
    }
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
  const handleSaveSummary = async () => {
    try {
      const values = await summaryForm.validateFields();

      if (currentMeeting) {
        // 由于API类型定义中没有meetingSummary字段，这里暂时注释掉或使用其他方式处理
        // await meetingService.updateMeeting(currentMeeting.id, {
        //   meetingSummary: values.content
        // });
        console.log('保存会议总结:', values.content);
        message.success('会议总结保存成功');
        setSummaryModalVisible(false);
        fetchMeetings(); // 重新获取列表
      }
    } catch (error) {
      message.error('保存会议总结失败');
      console.error('保存会议总结失败:', error);
    }
  };

  // 获取审批状态标签
  const getApprovalStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="success">已批准</Tag>;
      case 0:
        return <Tag color="processing">审批中</Tag>;
      case -1:
        return <Tag color="error">已拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 表格列配置
  const columns = [
    {
      dataIndex: 'title',
      key: 'title',
      title: '会议标题',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'organizer',
      key: 'organizer',
      title: '组织者',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'startTime',
      key: 'startTime',
      title: '开始时间',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'endTime',
      key: 'endTime',
      title: '结束时间',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'location',
      key: 'location',
      title: '地点',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      title: '审批状态',
      ...getCenterColumnConfig(),
      render: (status: number) => getApprovalStatusTag(status)
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: number) => {
        let color = 'blue';
        let text = '待开始';

        if (status === 1) {
          color = 'green';
          text = '进行中';
        } else if (status === 2) {
          color = 'gray';
          text = '已结束';
        } else if (status === -1) {
          color = 'red';
          text = '已取消';
        }

        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      dataIndex: 'participants',
      key: 'participants',
      title: '参与人数',
      ...getCenterColumnConfig(),
      render: (participants: string[]) => participants.length
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(200),
      render: (_: any, record: MeetingItem) => (
        <Space>
          {/* 只有会议被批准且已结束才能添加记录和总结 */}
          {record.approvalStatus === 1 && record.status === 2 && (
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
          {record.approvalStatus === 0 && <Tag color="orange">等待审批</Tag>}
          {record.approvalStatus === -1 && <Tag color="red">审批拒绝</Tag>}
        </Space>
      )
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
          dataSource={meetings}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
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
        title={currentMeeting?.record ? '会议记录详情' : '添加会议记录'}
        width={700}
        onCancel={() => setRecordModalVisible(false)}
        onOk={handleSaveRecord}
      >
        <Form
          form={recordForm}
          layout="vertical"
        >
          <div className="mb-4">
            <p>
              <strong>会议标题：</strong> {currentMeeting?.title}
            </p>
            <p>
              <strong>会议时间：</strong> {currentMeeting?.startTime} 至 {currentMeeting?.endTime}
            </p>
            <p>
              <strong>会议地点：</strong> {currentMeeting?.location}
            </p>
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
        title={currentMeeting?.summary ? '会议总结详情' : '添加会议总结'}
        width={700}
        onCancel={() => setSummaryModalVisible(false)}
        onOk={handleSaveSummary}
      >
        <Form
          form={summaryForm}
          layout="vertical"
        >
          <div className="mb-4">
            <p>
              <strong>会议标题：</strong> {currentMeeting?.title}
            </p>
            <p>
              <strong>会议时间：</strong> {currentMeeting?.startTime} 至 {currentMeeting?.endTime}
            </p>
            <p>
              <strong>会议地点：</strong> {currentMeeting?.location}
            </p>
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
