import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  UserOutlined,
  EyeOutlined
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
  Tag,
  Typography,
  Table,
  message
} from 'antd';
import React, { useState, useEffect } from 'react';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

import { meetingService } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';

const { Paragraph, Title, Text } = Typography;
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
        id: summary.id,
        meetingId: summary.meetingId,
        meetingTitle: summary.meetingTitle,
        meetingDate: summary.meetingDate,
        content: summary.content,
        creator: summary.creator?.name || '',
        createTime: summary.createTime,
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
      title: '会议标题',
      dataIndex: 'meetingTitle',
      key: 'meetingTitle',
      ...getCenterColumnConfig(),
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '会议日期',
      dataIndex: 'meetingDate',
      key: 'meetingDate',
      ...getCenterColumnConfig()
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      ...getCenterColumnConfig()
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      ...getCenterColumnConfig()
    },
    {
      title: '参与人数',
      dataIndex: 'participants',
      key: 'participants',
      ...getCenterColumnConfig(),
      render: (participants: string[]) => participants.length
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      ...getCenterColumnConfig(),
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_: any, record: MeetingSummary) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
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
          <Button type="primary" icon={<PlusOutlined />}>
            新建总结
          </Button>
        </div>

        <div className="mb-4">
          <Input.Search
            placeholder="搜索会议标题或创建人"
            allowClear
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
        title="会议总结详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
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
                <Text type="secondary">
                  参与人员：{selectedSummary.participants.join('、')}
                </Text>
              </div>
            </div>
            
            <div>
              <Title level={5}>会议总结内容</Title>
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#fafafa',
                  minHeight: '200px',
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
