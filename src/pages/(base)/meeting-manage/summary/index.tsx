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
import React, { useEffect, useState } from 'react';

import { meetingService } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

interface MeetingSummary {
  author: string;
  conclusion: string;
  content: string;
  id: string;
  meetingId: string;
  meetingTitle: string;
  nextSteps: string[];
  summaryDate: string;
  tags: string[];
}

const MeetingSummaryPage = () => {
  const [summaries, setSummaries] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<MeetingSummary | null>(null);

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
        createTime: summary.createTime,
        creator: summary.creator?.name || '',
        id: summary.id,
        meetingDate: summary.meetingDate,
        meetingId: summary.meetingId,
        meetingTitle: summary.meetingTitle,
        participants: summary.participants || [],
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
  }, []);

  const showDetail = (summary: MeetingSummary) => {
    setSelectedSummary(summary);
    setDetailVisible(true);
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
