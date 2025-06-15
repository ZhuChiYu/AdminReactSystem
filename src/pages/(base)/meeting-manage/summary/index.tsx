import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { meetingService } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

interface MeetingSummary {
  content: string;
  createTime: string;
  creator: string;
  id: string;
  meetingDate: string;
  meetingId: string;
  meetingTitle: string;
  participants: string[];
  status: string;
}

const MeetingSummaryPage = () => {
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<MeetingSummary | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 获取会议列表
  const fetchMeetings = async () => {
    try {
      console.log('开始获取会议列表...'); // 调试日志
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 1000 // 获取所有会议，暂时不过滤审批状态
      });
      console.log('API响应:', response); // 调试日志
      // response 直接就是 data 部分，包含 records 属性
      const records = (response as any).records || [];
      setMeetings(records);
      console.log('获取到的会议列表:', records); // 调试日志
      console.log('会议数量:', records.length); // 调试日志

      if (records.length === 0) {
        console.warn('会议列表为空，可能的原因：权限限制、数据库无数据、API错误');
      }
    } catch (error) {
      console.error('获取会议列表失败:', error);
      message.error('获取会议列表失败，请检查网络连接或联系管理员');
    }
  };

  // 获取会议总结列表
  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const response = await meetingService.getMeetingSummaryList({
        current: 1,
        size: 1000
      });

      // 转换API数据格式
      const formattedSummaries: MeetingSummary[] = response.records.map((summary: any) => ({
        content: summary.content,
        createTime: summary.createdAt,
        creator: summary.creator?.nickName || summary.creator?.userName || '',
        id: summary.id,
        meetingDate: summary.meeting?.startTime,
        meetingId: summary.meetingId,
        meetingTitle: summary.meeting?.title || summary.title,
        participants: summary.participants ? JSON.parse(summary.participants) : [],
        status: summary.status === 1 ? 'published' : 'draft'
      }));

      setSummaries(formattedSummaries);
    } catch (error) {
      message.error('获取会议总结列表失败');
      console.error('获取会议总结列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    fetchMeetings();
  }, []);

  const showDetail = (summary: MeetingSummary) => {
    setSelectedSummary(summary);
    setDetailVisible(true);
  };

  const showCreateModal = () => {
    form.resetFields();
    setCreateVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();

      await meetingService.createMeetingSummary({
        content: values.content,
        meetingId: values.meetingId
      });

      message.success('会议总结创建成功');
      setCreateVisible(false);
      fetchSummaries(); // 重新获取列表
    } catch (error) {
      message.error('创建会议总结失败');
      console.error('创建会议总结失败:', error);
    }
  };

  const columns = [
    {
      dataIndex: 'meetingTitle',
      key: 'meetingTitle',
      title: '会议标题',
      ...getCenterColumnConfig(),
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      dataIndex: 'meetingDate',
      key: 'meetingDate',
      title: '会议日期',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'creator',
      key: 'creator',
      title: '创建人',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'createTime',
      key: 'createTime',
      title: '创建时间',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'participants',
      key: 'participants',
      title: '参与人数',
      ...getCenterColumnConfig(),
      render: (participants: string[]) => participants.length
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>{status === 'published' ? '已发布' : '草稿'}</Tag>
      )
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(120),
      render: (_: any, record: MeetingSummary) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => showDetail(record)}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>
            <FileTextOutlined className="mr-2" />
            会议总结
          </Title>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={showCreateModal}
          >
            新建总结
          </Button>
        </div>

        <div className="mb-4">
          <Input.Search
            allowClear
            placeholder="搜索会议标题或创建人"
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={summaries}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 新建总结弹窗 */}
      <Modal
        destroyOnClose
        open={createVisible}
        title="新建会议总结"
        width={800}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreate}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="选择会议"
            name="meetingId"
            rules={[{ message: '请选择会议', required: true }]}
          >
            <Select
              showSearch
              placeholder="请选择会议"
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {meetings.map(meeting => (
                <Select.Option
                  key={meeting.id}
                  label={meeting.title}
                  value={meeting.id}
                >
                  {meeting.title} ({dayjs(meeting.startTime).format('YYYY-MM-DD')})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="总结标题"
            name="title"
          >
            <Input placeholder="请输入总结标题（可选，默认使用会议标题）" />
          </Form.Item>

          <Form.Item
            label="总结内容"
            name="content"
            rules={[{ message: '请输入总结内容', required: true }]}
          >
            <TextArea
              placeholder="请输入会议总结内容"
              rows={10}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        footer={null}
        open={detailVisible}
        title="会议总结详情"
        width={800}
        onCancel={() => setDetailVisible(false)}
      >
        {selectedSummary && (
          <div>
            <div className="mb-4">
              <Title level={5}>{selectedSummary.meetingTitle}</Title>
              <div className="mb-2">
                <Text type="secondary">会议日期：{dayjs(selectedSummary.meetingDate).format('YYYY-MM-DD')}</Text>
              </div>
              <div className="mb-2">
                <Text type="secondary">创建人：{selectedSummary.creator}</Text>
              </div>
              <div className="mb-2">
                <Text type="secondary">创建时间：{dayjs(selectedSummary.createTime).format('YYYY-MM-DD HH:mm')}</Text>
              </div>
              <div className="mb-4">
                <Text type="secondary">参与人员：{selectedSummary.participants.join('、')}</Text>
              </div>
            </div>

            <div>
              <Title level={5}>会议总结内容</Title>
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  minHeight: '200px',
                  padding: '16px',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedSummary.content}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingSummaryPage;
