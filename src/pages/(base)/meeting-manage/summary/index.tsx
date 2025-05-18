import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
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
  Tag,
  Typography
} from 'antd';
import React, { useState } from 'react';

const { Paragraph, Title } = Typography;
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

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 模拟数据
  const mockData: MeetingSummary[] = [
    {
      author: '张三',
      conclusion: '项目总体进度良好，但后端性能优化任务需要加快推进。',
      content:
        '本次会议主要讨论了项目当前进度，确认了各个模块的完成情况和存在的问题。开发团队报告了前端界面已完成80%，后端接口已完成70%，但存在部分性能问题需要优化。',
      id: '1',
      meetingId: '1',
      meetingTitle: '项目进度汇报会',
      nextSteps: ['前端团队继续完成剩余界面开发', '后端团队解决已知性能问题', '测试团队准备下周开始集成测试'],
      summaryDate: '2023-10-20',
      tags: ['项目进度', '性能优化']
    },
    {
      author: '李四',
      conclusion: '本季度业绩达到预期目标，新产品市场反馈良好。',
      content:
        '本季度销售额比上季度增长15%，主要得益于新产品线的推出和市场推广活动的成功。市场部分析了竞争对手的动向和市场趋势，提出了下季度的销售策略建议。',
      id: '2',
      meetingId: '2',
      meetingTitle: '季度业绩分析会',
      nextSteps: ['加大对新产品线的营销投入', '开发新的销售渠道', '优化客户服务流程'],
      summaryDate: '2023-10-22',
      tags: ['销售业绩', '市场策略']
    },
    {
      author: '王五',
      conclusion: '设计方案基本可行，需要根据反馈进行部分调整。',
      content:
        '产品团队展示了新产品的设计方案，包括功能规划、界面设计和用户体验。与会人员对设计方案进行了讨论，提出了多项改进建议，特别是在用户交互和界面简洁性方面。',
      id: '3',
      meetingId: '3',
      meetingTitle: '产品设计讨论会',
      nextSteps: ['完善交互设计细节', '开发团队评估技术实现可行性', '下周二前完成修改后的设计方案'],
      summaryDate: '2023-10-18',
      tags: ['产品设计', 'UI/UX']
    }
  ];

  const showModal = (id?: string) => {
    form.resetFields();
    if (id) {
      const summary = mockData.find(item => item.id === id);
      if (summary) {
        form.setFieldsValue({
          conclusion: summary.conclusion,
          content: summary.content,
          meetingId: summary.meetingId,
          nextSteps: summary.nextSteps,
          tags: summary.tags
        });
        setEditingId(id);
      }
    } else {
      setEditingId(null);
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('提交会议总结:', values, '编辑ID:', editingId);
      // 实际项目中这里会调用API保存或更新数据
      setIsModalVisible(false);
    });
  };

  const handleDelete = (id: string) => {
    console.log('删除会议总结:', id);
    // 实际项目中这里会调用API删除数据
  };

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>会议总结</Title>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => showModal()}
          >
            添加会议总结
          </Button>
        </div>

        <List
          dataSource={mockData}
          itemLayout="vertical"
          renderItem={item => (
            <List.Item
              key={item.id}
              actions={[
                <Space key="meeting-info">
                  <CalendarOutlined /> {item.summaryDate}
                </Space>,
                <Space key="author">
                  <UserOutlined /> 作者: {item.author}
                </Space>,
                <Space key="actions">
                  <Button
                    icon={<EditOutlined />}
                    type="text"
                    onClick={() => showModal(item.id)}
                  >
                    编辑
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => handleDelete(item.id)}
                  >
                    删除
                  </Button>
                </Space>
              ]}
              extra={
                <Space>
                  {item.tags.map(tag => (
                    <Tag
                      color="blue"
                      key={tag}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              }
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                description={`总结编号: ${item.id}`}
                title={<a href="#">{item.meetingTitle}</a>}
              />
              <Paragraph style={{ marginBottom: 8 }}>
                <strong>会议内容：</strong>
              </Paragraph>
              <Paragraph ellipsis={{ expandable: true, rows: 2, symbol: '展开' }}>{item.content}</Paragraph>

              <Divider style={{ margin: '8px 0' }} />

              <Paragraph style={{ marginBottom: 8 }}>
                <strong>会议结论：</strong>
              </Paragraph>
              <Paragraph>{item.conclusion}</Paragraph>

              <Divider style={{ margin: '8px 0' }} />

              <Paragraph style={{ marginBottom: 8 }}>
                <strong>下一步行动：</strong>
              </Paragraph>
              <ul className="pl-5">
                {item.nextSteps.map((step, index) => (
                  <li
                    className="mb-1"
                    key={index}
                  >
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>{step}</span>
                    </Space>
                  </li>
                ))}
              </ul>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        destroyOnClose
        open={isModalVisible}
        title={editingId ? '编辑会议总结' : '添加会议总结'}
        width={700}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleOk}
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
            <Select placeholder="请选择会议">
              <Select.Option value="1">项目进度汇报会 (2023-10-20)</Select.Option>
              <Select.Option value="2">季度业绩分析会 (2023-10-22)</Select.Option>
              <Select.Option value="3">产品设计讨论会 (2023-10-18)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="会议内容总结"
            name="content"
            rules={[{ message: '请输入会议内容总结', required: true }]}
          >
            <TextArea
              placeholder="请总结会议的主要内容和讨论要点"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="会议结论"
            name="conclusion"
            rules={[{ message: '请输入会议结论', required: true }]}
          >
            <TextArea
              placeholder="请输入会议达成的主要结论"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label="下一步行动计划"
            name="nextSteps"
            rules={[{ message: '请输入下一步行动计划', required: true }]}
          >
            <Select
              mode="tags"
              open={false}
              placeholder="请输入行动计划，按回车键确认"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="请输入或选择标签"
              options={[
                { label: '项目进度', value: '项目进度' },
                { label: '性能优化', value: '性能优化' },
                { label: '销售业绩', value: '销售业绩' },
                { label: '市场策略', value: '市场策略' },
                { label: '产品设计', value: '产品设计' },
                { label: 'UI/UX', value: 'UI/UX' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Component;
