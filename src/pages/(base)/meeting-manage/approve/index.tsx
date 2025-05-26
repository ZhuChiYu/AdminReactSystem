import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Badge, Button, Card, Form, Input, Modal, Radio, Space, Table, Tag, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface MeetingApproval {
  approvalDate?: string;
  approver?: string;
  comment?: string;
  department: string;
  endTime: string;
  id: string;
  location: string;
  meetingTitle: string;
  participantsCount: number;
  proposer: string;
  purpose: string;
  startTime: string;
  status: 'approved' | 'pending' | 'rejected';
}

const Component: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingApproval | null>(null);
  const [form] = Form.useForm();

  // 模拟数据
  const mockData: MeetingApproval[] = [
    {
      department: '产品部',
      endTime: '2023-11-10 11:00',
      id: '1',
      location: '会议室A',
      meetingTitle: '产品开发计划会议',
      participantsCount: 8,
      proposer: '张三',
      purpose: '讨论下一季度产品开发计划和资源分配',
      startTime: '2023-11-10 09:00',
      status: 'pending'
    },
    {
      department: '市场部',
      endTime: '2023-11-12 16:00',
      id: '2',
      location: '会议室B',
      meetingTitle: '市场推广策略会议',
      participantsCount: 6,
      proposer: '李四',
      purpose: '制定新产品的市场推广策略和预算规划',
      startTime: '2023-11-12 14:00',
      status: 'pending'
    },
    {
      approvalDate: '2023-11-05',
      approver: '赵总',
      comment: '同意召开年终总结会议，请提前准备好相关材料',
      department: '人力资源部',
      endTime: '2023-12-15 17:00',
      id: '3',
      location: '大会议室',
      meetingTitle: '年终总结会议',
      participantsCount: 15,
      proposer: '王五',
      purpose: '年度工作总结和下一年度工作计划讨论',
      startTime: '2023-12-15 13:00',
      status: 'approved'
    },
    {
      approvalDate: '2023-11-04',
      approver: '孙总',
      comment: '会议时间与季度报告会议冲突，请调整时间后重新申请',
      department: '技术部',
      endTime: '2023-11-08 12:00',
      id: '4',
      location: '会议室C',
      meetingTitle: '技术架构讨论会',
      participantsCount: 10,
      proposer: '钱六',
      purpose: '讨论系统架构升级方案和技术选型',
      startTime: '2023-11-08 10:00',
      status: 'rejected'
    }
  ];

  const showApprovalModal = (record: MeetingApproval) => {
    setCurrentMeeting(record);
    form.resetFields();
    setVisible(true);
  };

  const showDetailModal = (record: MeetingApproval) => {
    setCurrentMeeting(record);
    setDetailVisible(true);
  };

  const handleApprove = () => {
    form.validateFields().then(values => {
      console.log('审批结果:', values, currentMeeting);
      // 实际项目中这里会调用API
      setVisible(false);
    });
  };

  const columns = [
    {
      dataIndex: 'meetingTitle',
      key: 'meetingTitle',
      render: (text: string) => <Text strong>{text}</Text>,
      title: '会议标题'
    },
    {
      dataIndex: 'proposer',
      key: 'proposer',
      title: '申请人'
    },
    {
      dataIndex: 'department',
      key: 'department',
      title: '部门'
    },
    {
      dataIndex: 'startTime',
      key: 'startTime',
      title: '开始时间'
    },
    {
      dataIndex: 'participantsCount',
      key: 'participantsCount',
      title: '参与人数'
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'pending') {
          return (
            <Badge
              status="processing"
              text="待审批"
            />
          );
        } else if (status === 'approved') {
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
      render: (text: string) => text || '-',
      title: '审批人'
    },
    {
      dataIndex: 'approvalDate',
      key: 'approvalDate',
      render: (text: string) => text || '-',
      title: '审批日期'
    },
    {
      key: 'action',
      render: (_: any, record: MeetingApproval) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              icon={<EyeOutlined />}
              type="text"
              onClick={() => showDetailModal(record)}
            />
          </Tooltip>

          {record.status === 'pending' && (
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
        <Title level={4}>会议审核</Title>
        <Table
          columns={columns}
          dataSource={mockData}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      </Card>

      {/* 审批弹窗 */}
      <Modal
        destroyOnClose
        open={visible}
        title="会议审批"
        onCancel={() => setVisible(false)}
        onOk={handleApprove}
      >
        {currentMeeting && (
          <div className="mb-4">
            <p>
              <strong>会议标题：</strong>
              {currentMeeting.meetingTitle}
            </p>
            <p>
              <strong>申请人：</strong>
              {currentMeeting.proposer}
            </p>
            <p>
              <strong>部门：</strong>
              {currentMeeting.department}
            </p>
            <p>
              <strong>会议时间：</strong>
              {`${currentMeeting.startTime} - ${currentMeeting.endTime}`}
            </p>
            <p>
              <strong>会议地点：</strong>
              {currentMeeting.location}
            </p>
            <p>
              <strong>会议目的：</strong>
              {currentMeeting.purpose}
            </p>
          </div>
        )}

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
              <Radio value="approved">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  通过
                </Space>
              </Radio>
              <Radio value="rejected">
                <Space>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  拒绝
                </Space>
              </Radio>
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

      {/* 详情弹窗 */}
      <Modal
        open={detailVisible}
        title="会议详情"
        footer={[
          <Button
            key="close"
            onClick={() => setDetailVisible(false)}
          >
            关闭
          </Button>
        ]}
        onCancel={() => setDetailVisible(false)}
      >
        {currentMeeting && (
          <div>
            <Card
              bodyStyle={{ padding: 0 }}
              variant="borderless"
              className="mb-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <Title level={5}>{currentMeeting.meetingTitle}</Title>
                {currentMeeting.status === 'pending' && <Tag color="blue">待审批</Tag>}
                {currentMeeting.status === 'approved' && <Tag color="green">已通过</Tag>}
                {currentMeeting.status === 'rejected' && <Tag color="red">已拒绝</Tag>}
              </div>

              <Space
                className="w-full"
                direction="vertical"
                size="small"
              >
                <Space>
                  <UserOutlined />
                  <Text>
                    申请人: {currentMeeting.proposer} ({currentMeeting.department})
                  </Text>
                </Space>
                <Space>
                  <CalendarOutlined />
                  <Text>
                    会议时间: {currentMeeting.startTime} - {currentMeeting.endTime}
                  </Text>
                </Space>
                <Space>
                  <EnvironmentOutlined />
                  <Text>会议地点: {currentMeeting.location}</Text>
                </Space>
                <Space>
                  <TeamOutlined />
                  <Text>参会人数: {currentMeeting.participantsCount}人</Text>
                </Space>
              </Space>
            </Card>

            <div className="mb-3">
              <Text strong>会议目的:</Text>
              <p>{currentMeeting.purpose}</p>
            </div>

            {(currentMeeting.status === 'approved' || currentMeeting.status === 'rejected') && (
              <div>
                <div className="mb-2">
                  <Text strong>审批信息:</Text>
                </div>
                <Card
                  bordered
                  className="mb-2"
                  size="small"
                >
                  <p>
                    <Text type="secondary">审批人:</Text> {currentMeeting.approver}
                  </p>
                  <p>
                    <Text type="secondary">审批日期:</Text> {currentMeeting.approvalDate}
                  </p>
                  <p>
                    <Text type="secondary">审批意见:</Text> {currentMeeting.comment}
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Component;
