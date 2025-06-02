import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Badge, Button, Card, Form, Input, Modal, Radio, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import React, { useState, useEffect } from 'react';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

import { meetingService } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface MeetingApproval {
  approvalDate?: string;
  approver?: string;
  comment?: string;
  department: string;
  endTime: string;
  id: number;
  location: string;
  meetingTitle: string;
  participantsCount: number;
  proposer: string;
  purpose: string;
  startTime: string;
  status: number;
}

const Component: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingApproval | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState<MeetingApproval[]>([]);

  // 获取待审批的会议列表
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 1000,
        approvalStatus: 0 // 只获取待审批的会议
      });

      // 转换API数据格式
      const formattedMeetings: MeetingApproval[] = response.records.map((meeting: MeetingApi.MeetingListItem) => ({
        id: meeting.id,
        meetingTitle: meeting.meetingTitle,
        proposer: meeting.organizer?.name || '',
        department: meeting.organizer?.department || '',
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.meetingRoom || meeting.meetingUrl || '',
        participantsCount: meeting.participants?.length || 0,
        purpose: meeting.meetingDesc || '',
        status: meeting.approvalStatus || 0,
        approver: meeting.approver?.name || '',
        approvalDate: meeting.approvalTime || '',
        comment: meeting.approvalComment || ''
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

  const showApprovalModal = (record: MeetingApproval) => {
    setCurrentMeeting(record);
    form.resetFields();
    setVisible(true);
  };

  const showDetailModal = (record: MeetingApproval) => {
    setCurrentMeeting(record);
    setDetailVisible(true);
  };

  const handleApprove = async () => {
    try {
      const values = await form.validateFields();

      if (currentMeeting) {
        await meetingService.approveMeeting(currentMeeting.id, {
          approvalStatus: values.approval,
          remark: values.comment
        });

        message.success('审批完成');
      setVisible(false);
        fetchMeetings(); // 重新获取列表
      }
    } catch (error) {
      message.error('审批失败');
      console.error('审批失败:', error);
    }
  };

  const columns = [
    {
      dataIndex: 'meetingTitle',
      key: 'meetingTitle',
      ...getCenterColumnConfig(),
      render: (text: string) => <Text strong>{text}</Text>,
      title: '会议标题'
    },
    {
      dataIndex: 'proposer',
      key: 'proposer',
      ...getCenterColumnConfig(),
      title: '申请人'
    },
    {
      dataIndex: 'department',
      key: 'department',
      ...getCenterColumnConfig(),
      title: '部门'
    },
    {
      dataIndex: 'startTime',
      key: 'startTime',
      ...getCenterColumnConfig(),
      title: '开始时间'
    },
    {
      dataIndex: 'participantsCount',
      key: 'participantsCount',
      ...getCenterColumnConfig(),
      title: '参与人数'
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
      dataIndex: 'approver',
      key: 'approver',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      title: '审批人'
    },
    {
      dataIndex: 'approvalDate',
      key: 'approvalDate',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      title: '审批日期'
    },
    {
      key: 'action',
      ...getActionColumnConfig(150),
      render: (_: any, record: MeetingApproval) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              icon={<EyeOutlined />}
              type="text"
              onClick={() => showDetailModal(record)}
            />
          </Tooltip>

          {record.status === 0 && (
            <Tooltip title="审批">
              <Button
                size="small"
                type="primary"
                onClick={() => showApprovalModal(record)}
              >
                审批
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      title: '操作'
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4">
          <Title level={4}>会议审批</Title>
        </div>
        <Table
          columns={columns}
          dataSource={meetings}
          rowKey="id"
          loading={loading}
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 审批弹窗 */}
      <Modal
        destroyOnClose
        open={visible}
        title="会议审批"
        width={600}
        onCancel={() => setVisible(false)}
        onOk={handleApprove}
      >
        {currentMeeting && (
          <div>
            <Card className="mb-4" size="small" title="会议详情">
              <div className="space-y-2">
                <div className="flex items-center">
                  <CalendarOutlined className="mr-2" />
                  <Text strong>会议标题：</Text>
                  <Text className="ml-2">{currentMeeting.meetingTitle}</Text>
                </div>
                <div className="flex items-center">
                  <UserOutlined className="mr-2" />
                  <Text strong>申请人：</Text>
                  <Text className="ml-2">{currentMeeting.proposer}</Text>
                </div>
                <div className="flex items-center">
                  <TeamOutlined className="mr-2" />
                  <Text strong>部门：</Text>
                  <Text className="ml-2">{currentMeeting.department}</Text>
                </div>
                <div className="flex items-center">
                  <CalendarOutlined className="mr-2" />
                  <Text strong>会议时间：</Text>
                  <Text className="ml-2">
                    {currentMeeting.startTime} ~ {currentMeeting.endTime}
                  </Text>
                </div>
                <div className="flex items-center">
                  <EnvironmentOutlined className="mr-2" />
                  <Text strong>会议地点：</Text>
                  <Text className="ml-2">{currentMeeting.location}</Text>
                </div>
                <div className="flex items-center">
                  <TeamOutlined className="mr-2" />
                  <Text strong>参与人数：</Text>
                  <Text className="ml-2">{currentMeeting.participantsCount}人</Text>
                </div>
                <div className="flex">
                  <Text strong>会议目的：</Text>
                  <Text className="ml-2">{currentMeeting.purpose}</Text>
                </div>
          </div>
            </Card>

        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
                label="审批决定"
                name="approval"
            rules={[{ message: '请选择审批结果', required: true }]}
          >
            <Radio.Group>
                  <Radio value={1}>
                    <CheckCircleOutlined className="text-green-500" />
                    &nbsp;同意
              </Radio>
                  <Radio value={-1}>
                    <CloseCircleOutlined className="text-red-500" />
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
        title="会议详情"
        width={600}
        onCancel={() => setDetailVisible(false)}
      >
        {currentMeeting && (
          <div>
            <Card size="small" title="基本信息">
              <div className="space-y-2">
                <div className="flex items-center">
                  <CalendarOutlined className="mr-2" />
                  <Text strong>会议标题：</Text>
                  <Text className="ml-2">{currentMeeting.meetingTitle}</Text>
                </div>
                <div className="flex items-center">
                  <UserOutlined className="mr-2" />
                  <Text strong>申请人：</Text>
                  <Text className="ml-2">{currentMeeting.proposer}</Text>
                </div>
                <div className="flex items-center">
                  <TeamOutlined className="mr-2" />
                  <Text strong>部门：</Text>
                  <Text className="ml-2">{currentMeeting.department}</Text>
              </div>
                <div className="flex items-center">
                  <CalendarOutlined className="mr-2" />
                  <Text strong>会议时间：</Text>
                  <Text className="ml-2">
                    {currentMeeting.startTime} ~ {currentMeeting.endTime}
                  </Text>
                </div>
                <div className="flex items-center">
                  <EnvironmentOutlined className="mr-2" />
                  <Text strong>会议地点：</Text>
                  <Text className="ml-2">{currentMeeting.location}</Text>
                </div>
                <div className="flex items-center">
                  <TeamOutlined className="mr-2" />
                  <Text strong>参与人数：</Text>
                  <Text className="ml-2">{currentMeeting.participantsCount}人</Text>
                </div>
                <div className="flex">
                  <Text strong>会议目的：</Text>
                  <Text className="ml-2">{currentMeeting.purpose}</Text>
                </div>
              </div>
            </Card>

            {(currentMeeting.status === 1 || currentMeeting.status === -1) && (
              <Card className="mt-4" size="small" title="审批结果">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Text strong>审批状态：</Text>
                    <Text className="ml-2">
                      {currentMeeting.status === 1 ? (
                        <Tag color="green">已通过</Tag>
                      ) : (
                        <Tag color="red">已拒绝</Tag>
                      )}
                    </Text>
                  </div>
                  <div className="flex items-center">
                    <Text strong>审批人：</Text>
                    <Text className="ml-2">{currentMeeting.approver}</Text>
                  </div>
                  <div className="flex items-center">
                    <Text strong>审批时间：</Text>
                    <Text className="ml-2">{currentMeeting.approvalDate}</Text>
                  </div>
                  {currentMeeting.comment && (
                    <div className="flex">
                      <Text strong>审批意见：</Text>
                      <Text className="ml-2">{currentMeeting.comment}</Text>
            </div>
                  )}
                </div>
                </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Component;
