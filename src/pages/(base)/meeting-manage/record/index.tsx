import { CalendarOutlined, FileTextOutlined, PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, DatePicker, Form, Input, List, Modal, Select, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react';

const { Paragraph, Title } = Typography;
const { TextArea } = Input;

interface MeetingRecord {
  attendees: string[];
  content: string;
  id: string;
  meetingId: string;
  meetingTitle: string;
  recordDate: string;
  recorder: string;
  tags: string[];
}

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | null>(null);

  // 模拟数据
  const mockData: MeetingRecord[] = [
    {
      attendees: ['张三', '李四', '王五', '赵六'],
      content: '讨论了项目当前进度，确定了下一阶段的目标和任务分配。张三负责前端开发，李四负责后端开发，王五负责测试。',
      id: '1',
      meetingId: '1',
      meetingTitle: '项目进度汇报会',
      recordDate: '2023-10-20',
      recorder: '赵六',
      tags: ['项目进度', '任务分配']
    },
    {
      attendees: ['张三', '李四', '王五', '钱七'],
      content: '分析了上季度的业绩数据，讨论了销售策略调整，确定了下季度的销售目标。',
      id: '2',
      meetingId: '2',
      meetingTitle: '季度业绩分析会',
      recordDate: '2023-10-22',
      recorder: '张三',
      tags: ['业绩分析', '销售策略']
    },
    {
      attendees: ['张三', '李四', '王五', '孙八'],
      content: '讨论了新产品的设计方案，确定了主要功能和界面风格，计划下周开始进行原型设计。',
      id: '3',
      meetingId: '3',
      meetingTitle: '产品设计讨论会',
      recordDate: '2023-10-18',
      recorder: '李四',
      tags: ['产品设计', '功能规划']
    }
  ];

  const showModal = (record?: MeetingRecord) => {
    form.resetFields();
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue({
        attendees: record.attendees,
        content: record.content,
        meetingId: record.meetingId,
        recordDate: record.recordDate,
        tags: record.tags
      });
    } else {
      setEditingRecord(null);
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (editingRecord) {
        console.log('更新会议记录:', values, '记录ID:', editingRecord.id);
      } else {
        console.log('创建会议记录:', values);
      }
      // 实际项目中这里会调用API
      setIsModalVisible(false);
    });
  };

  const handleDeleteRecord = (id: string) => {
    console.log('删除会议记录', id);
    // 实际项目中这里会调用API删除会议记录
  };

  const handleExportRecord = (record: MeetingRecord) => {
    console.log('导出会议记录', record);
    // 实际项目中这里会调用API导出会议记录为Word/PDF等格式
  };

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>会议记录</Title>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => showModal()}
          >
            添加记录
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
                  <CalendarOutlined /> {item.recordDate}
                </Space>,
                <Space key="recorder">
                  <UserOutlined /> 记录人: {item.recorder}
                </Space>,
                <Space key="attendees">
                  <TeamOutlined /> 参会人数: {item.attendees.length}
                </Space>,
                <Space key="actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => showModal(item)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => handleExportRecord(item)}
                  >
                    导出
                  </Button>
                  <Button
                    danger
                    size="small"
                    type="link"
                    onClick={() => handleDeleteRecord(item.id)}
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
                description={`记录编号: ${item.id}`}
                title={<a href="#">{item.meetingTitle}</a>}
              />
              <Paragraph ellipsis={{ expandable: true, rows: 3, symbol: '展开' }}>{item.content}</Paragraph>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        destroyOnClose
        open={isModalVisible}
        title={editingRecord ? '编辑会议记录' : '添加会议记录'}
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
            label="记录日期"
            name="recordDate"
            rules={[{ message: '请选择记录日期', required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="参会人员"
            name="attendees"
            rules={[{ message: '请选择参会人员', required: true }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择参会人员"
              options={[
                { label: '张三', value: '张三' },
                { label: '李四', value: '李四' },
                { label: '王五', value: '王五' },
                { label: '赵六', value: '赵六' },
                { label: '钱七', value: '钱七' },
                { label: '孙八', value: '孙八' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="会议内容"
            name="content"
            rules={[{ message: '请输入会议内容', required: true }]}
          >
            <TextArea
              placeholder="请详细记录会议的讨论内容、决策和下一步行动计划等"
              rows={6}
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
                { label: '任务分配', value: '任务分配' },
                { label: '业绩分析', value: '业绩分析' },
                { label: '产品设计', value: '产品设计' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Component;
