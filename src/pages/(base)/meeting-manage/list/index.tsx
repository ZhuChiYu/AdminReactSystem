import { App, Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { fetchGetUserList, meetingService } from '@/service/api';
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
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingItem | null>(null);
  const [recordForm] = Form.useForm();
  const [summaryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const { message } = App.useApp();

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
    setLoading(true);
    try {
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 1000
      });

      // 转换API数据格式
      const formattedMeetings: MeetingItem[] = response.records.map((meeting: any) => ({
        approvalStatus: meeting.approvalStatus || 1, // 使用实际的审批状态
        endTime: meeting.endTime,
        id: meeting.id,
        location: meeting.location || meeting.room?.name || '未指定',
        organizer: meeting.organizer?.nickName || meeting.organizer?.userName || '',
        participants: [], // API中没有participants字段，使用空数组
        record: '', // API中没有meetingRecord字段，使用空字符串
        startTime: meeting.startTime,
        status: meeting.status || 0,
        summary: '', // API中没有meetingSummary字段，使用空字符串
        title: meeting.title
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
    fetchUsers();
  }, []);

  // 显示创建会议弹窗
  const showModal = () => {
    form.resetFields();
    setCurrentMeeting(null);
    setIsModalVisible(true);
  };

  // 创建或更新会议
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
        participantIds: values.participants || [], // 使用选择的参会人员ID
        startTime: values.time[0].format('YYYY-MM-DD HH:mm:ss')
      };

      if (currentMeeting) {
        // 编辑模式
        await meetingService.updateMeeting(currentMeeting.id, meetingData);
        message.success('会议更新成功');
      } else {
        // 创建模式
        await meetingService.createMeeting(meetingData);
        message.success('会议创建成功，等待审批');
      }

      setIsModalVisible(false);
      setCurrentMeeting(null);
      form.resetFields();
      fetchMeetings(); // 重新获取列表
    } catch (error) {
      const errorMsg = currentMeeting ? '更新会议失败' : '创建会议失败';
      message.error(errorMsg);
      console.error(errorMsg, error);
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
        await meetingService.createMeetingRecord({
          content: values.content,
          meetingId: currentMeeting.id
        });
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
        await meetingService.createMeetingSummary({
          content: values.content,
          meetingId: currentMeeting.id
        });
        message.success('会议总结保存成功');
        setSummaryModalVisible(false);
        fetchMeetings(); // 重新获取列表
      }
    } catch (error) {
      message.error('保存会议总结失败');
      console.error('保存会议总结失败:', error);
    }
  };

  // 查看会议详情
  const handleView = (record: MeetingItem) => {
    // 可以跳转到详情页或者显示详情弹窗
    console.log('查看会议详情:', record);
    // navigate(`/meeting-manage/detail/${record.id}`);
  };

  // 编辑会议
  const handleEdit = (record: MeetingItem) => {
    // 设置表单值并打开编辑弹窗
    form.setFieldsValue({
      location: record.location,
      participants: record.participants,
      time: [dayjs(record.startTime), dayjs(record.endTime)],
      title: record.title
    });
    setCurrentMeeting(record);
    setIsModalVisible(true);
  };

  // 删除会议
  const handleDelete = (record: MeetingItem) => {
    Modal.confirm({
      content: `确定要删除会议"${record.title}"吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await meetingService.deleteMeeting(record.id);
          message.success('会议删除成功');
          fetchMeetings(); // 重新获取列表
        } catch (error) {
          message.error('删除会议失败');
          console.error('删除会议失败:', error);
        }
      },
      title: '确认删除'
    });
  };

  // 获取审批状态标签
  const getApprovalStatusTag = (status: number) => {
    switch (status) {
      case 2:
        return <Tag color="success">已批准</Tag>;
      case 1:
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
      ...getCenterColumnConfig(),
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      dataIndex: 'endTime',
      key: 'endTime',
      title: '结束时间',
      ...getCenterColumnConfig(),
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
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
      ...getActionColumnConfig(300),
      render: (_: any, record: MeetingItem) => (
        <Space size="small">
          {/* 基本操作按钮 */}
          <Button
            size="small"
            type="link"
            onClick={() => handleView(record)}
          >
            查看
          </Button>

          {/* 只有审批中或未审批的会议才能编辑 */}
          {(record.approvalStatus === 1 || record.approvalStatus === 0) && (
            <Button
              size="small"
              type="link"
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}

          {/* 只有未开始的会议才能删除 */}
          {record.status === 0 && (
            <Button
              danger
              size="small"
              type="link"
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}

          {/* 只有会议被批准且已结束才能添加记录和总结 */}
          {record.approvalStatus === 2 && record.status === 2 && (
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

      {/* 创建/编辑会议弹窗 */}
      <Modal
        destroyOnClose
        open={isModalVisible}
        title={currentMeeting ? '编辑会议' : '创建会议'}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentMeeting(null);
          form.resetFields();
        }}
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
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              mode="multiple"
              placeholder="请选择参会人员"
              options={users.map(user => ({
                label: `${user.nickName || user.userName} (${user.userName})`,
                value: user.id
              }))}
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
