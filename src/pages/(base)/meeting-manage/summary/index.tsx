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

import { meetingService, fetchGetUserList } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';
import { getCurrentUserId } from '@/utils/auth';
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
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<MeetingSummary | null>(null);
  const [currentSummaryForParticipants, setCurrentSummaryForParticipants] = useState<MeetingSummary | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await fetchGetUserList({
        current: 1,
        size: 1000 // 获取所有用户
      });

      if (response?.records) {
        setUsers(response.records);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

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

    // 使用项目中已有的用户认证工具函数

    // 判断用户是否为会议参与者
  const isUserParticipant = (userId: string, meeting: any): boolean => {
    if (!meeting || !userId) return false;

    const numUserId = parseInt(userId, 10);

    // 如果是会议的组织者，可以查看
    if (meeting.organizer?.id === numUserId || meeting.organizer?.id?.toString() === userId) return true;

    // 如果有participantIds数组，检查用户是否在其中
    if ((meeting as any).participantIds && Array.isArray((meeting as any).participantIds)) {
      return (meeting as any).participantIds.includes(numUserId) || (meeting as any).participantIds.includes(userId);
    }

    // 如果没有具体的参与者信息，暂时允许查看
    return true;
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
      const formattedSummaries: MeetingSummary[] = (response as any).records.map((summary: any) => {
        const relatedMeeting = meetings.find(m => m.id === summary.meetingId);
        const participantCount = relatedMeeting?.participantCount || 0;

        return {
          content: summary.content,
          createTime: dayjs(summary.createdAt || summary.createTime).format('YYYY-MM-DD HH:mm'),
          creator: summary.creator?.nickName || summary.creator?.userName || '',
          id: summary.id,
          meetingDate: dayjs(summary.meeting?.startTime || relatedMeeting?.startTime).format('YYYY-MM-DD'),
          meetingId: summary.meetingId,
          meetingTitle: summary.meeting?.title || summary.title || relatedMeeting?.meetingTitle || '',
          participants: Array.from({ length: participantCount }, (_, index) => `参与者${index + 1}`), // 根据实际参会人数生成数组
          status: summary.status === 1 ? 'published' : 'draft'
        };
      });

      // 权限过滤：只显示当前用户参与的会议总结
      const currentUserId = getCurrentUserId();
      const filteredSummaries = formattedSummaries.filter(summary => {
        const relatedMeeting = meetings.find(m => m.id.toString() === summary.meetingId.toString());
        return isUserParticipant(currentUserId, relatedMeeting);
      });

      setSummaries(filteredSummaries);
    } catch (error) {
      message.error('获取会议总结列表失败');
      console.error('获取会议总结列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  // 当meetings数据加载完成后，再获取会议总结
  useEffect(() => {
    if (meetings.length > 0) {
      fetchSummaries();
    }
  }, [meetings]);

  const showDetail = (summary: MeetingSummary) => {
    setSelectedSummary(summary);
    setDetailVisible(true);
  };

  const showCreateModal = () => {
    form.resetFields();
    setCreateVisible(true);
  };

  // 查看参与人员
  const handleViewParticipants = async (summary: MeetingSummary) => {
    if (summary.participants.length === 0) {
      message.info('该会议总结暂无参与人员');
      return;
    }

    setCurrentSummaryForParticipants(summary);
    setParticipantsModalVisible(true);
    setParticipantsLoading(true);

    try {
      // 尝试从会议详情获取参与人员信息
      const relatedMeeting = meetings.find(m => m.id.toString() === summary.meetingId.toString());
      if (relatedMeeting) {
        try {
          const detail = await meetingService.getMeetingDetail(relatedMeeting.id);

          let participantsData: Array<{ id: number; name: string }> = [];

          // 从后端API返回的数据结构中正确提取参与人员信息
          if ((detail as any).participants && Array.isArray((detail as any).participants)) {
            participantsData = (detail as any).participants.map((participant: any) => {
              // 后端返回的结构：{ id: participantId, user: { id, nickName, userName, ... } }
              const user = participant.user;
              return {
                id: user?.id || participant.id,
                name: user?.nickName || user?.userName || `参与人员${participant.id}`
              };
            });
            console.log('会议总结-从participants提取到的数据:', participantsData); // 调试日志
          } else if ((detail as any).participantIds && Array.isArray((detail as any).participantIds)) {
            participantsData = (detail as any).participantIds.map((participantId: number) => {
              const user = users.find(u => u.id === participantId);
              return {
                id: participantId,
                name: user ? (user.nickName || user.userName) : `用户${participantId}`
              };
            });
            console.log('会议总结-从participantIds提取到的数据:', participantsData); // 调试日志
          } else {
            // 如果API没有返回参与人员详情，生成占位数据
            participantsData = Array.from({ length: summary.participants.length }, (_, index) => ({
              id: index + 1,
              name: `参与者${index + 1}`
            }));
            console.log('会议总结-生成的占位数据:', participantsData); // 调试日志
          }

          // 更新当前总结的参与人员信息
          setCurrentSummaryForParticipants(prev => prev ? {
            ...prev,
            participantsDetail: participantsData
          } as MeetingSummary & { participantsDetail: Array<{ id: number; name: string }> } : null);

        } catch (error) {
          console.error('获取会议详情失败:', error);
          // 使用占位数据
          const participantsData = Array.from({ length: summary.participants.length }, (_, index) => ({
            id: index + 1,
            name: `参与者${index + 1}`
          }));

          setCurrentSummaryForParticipants(prev => prev ? {
            ...prev,
            participantsDetail: participantsData
          } as MeetingSummary & { participantsDetail: Array<{ id: number; name: string }> } : null);
        }
      }
    } finally {
      setParticipantsLoading(false);
    }
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
      render: (participants: string[], record: MeetingSummary) => (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto', color: participants.length > 0 ? '#1890ff' : 'inherit' }}
          disabled={participants.length === 0}
          onClick={() => handleViewParticipants(record)}
        >
          {participants.length} 人
        </Button>
      )
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
                <Text type="secondary">会议日期：{selectedSummary.meetingDate}</Text>
              </div>
              <div className="mb-2">
                <Text type="secondary">创建人：{selectedSummary.creator}</Text>
              </div>
              <div className="mb-2">
                <Text type="secondary">创建时间：{selectedSummary.createTime}</Text>
              </div>
              <div className="mb-4">
                <Text type="secondary">参与人数：{selectedSummary.participants.length} 人</Text>
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

      {/* 参与人员弹窗 */}
      <Modal
        destroyOnClose
        open={participantsModalVisible}
        title="参与人员"
        width={500}
        footer={[
          <Button
            key="close"
            onClick={() => setParticipantsModalVisible(false)}
          >
            关闭
          </Button>
        ]}
        onCancel={() => setParticipantsModalVisible(false)}
      >
        {currentSummaryForParticipants && (
          <div>
            <div className="mb-4">
              <p>
                <strong>会议标题：</strong> {currentSummaryForParticipants.meetingTitle}
              </p>
              <p>
                <strong>会议日期：</strong> {currentSummaryForParticipants.meetingDate}
              </p>
              <p>
                <strong>参与人数：</strong> {currentSummaryForParticipants.participants.length} 人
              </p>
            </div>

            {participantsLoading ? (
              <div className="text-center py-4">
                <div>正在加载参与人员...</div>
              </div>
            ) : (currentSummaryForParticipants as any).participantsDetail && (currentSummaryForParticipants as any).participantsDetail.length > 0 ? (
              <div>
                <h4 className="mb-3">参与人员列表：</h4>
                <div className="space-y-2">
                  {(currentSummaryForParticipants as any).participantsDetail.map((participant: any, index: number) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="flex items-center">
                        <span className="mr-2 text-gray-500">#{index + 1}</span>
                        <span>{participant.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div>暂无参与人员详情</div>
                <div className="text-sm mt-2">参与人数：{currentSummaryForParticipants.participants.length} 人</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MeetingSummaryPage;
