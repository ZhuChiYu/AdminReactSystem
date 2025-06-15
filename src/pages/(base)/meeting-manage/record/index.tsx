import { CalendarOutlined, FileTextOutlined, PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
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
  message
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { meetingService, fetchGetUserList } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

interface MeetingParticipantRecord {
  content: string;
  createdAt: string;
  id: string;
  recorder: string;
}

interface MeetingRecord {
  attendees: string[];
  content: string;
  id: string;
  meetingId: string;
  meetingTitle: string;
  participantRecords: MeetingParticipantRecord[];
  recordDate: string;
  recorder: string;
  tags: string[];
}

const Component: React.FC = () => {
  const [form] = Form.useForm();
  const [participantRecordForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [participantRecordModalVisible, setParticipantRecordModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | null>(null);
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [meetings, setMeetings] = useState<MeetingApi.MeetingListItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // 模拟当前用户，实际应用中应从用户认证上下文中获取
  const currentUser = '张三';

  // 获取会议标题的辅助函数
  const getMeetingTitle = (meetingId: string): string => {
    const meeting = meetings.find(m => m.id.toString() === meetingId);
    return meeting ? meeting.meetingTitle : '未知会议';
  };

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
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 1000
      });
      setMeetings(response.records);
    } catch (error) {
      console.error('获取会议列表失败:', error);
    }
  };

  // 获取会议记录列表
  const fetchRecords = async () => {
    try {
      // 由于后端还没有会议记录API，暂时使用空数据
      // 这里可以调用 meetingService.getMeetingRecordList() 当API实现后
      setRecords([]);
    } catch (error) {
      message.error('获取会议记录失败');
      console.error('获取会议记录失败:', error);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchRecords();
    fetchUsers();
  }, []);

  const showModal = (record?: MeetingRecord) => {
    form.resetFields();
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue({
        attendees: record.attendees,
        content: record.content,
        meetingId: record.meetingId,
        recordDate: dayjs(record.recordDate),
        tags: record.tags
      });
    } else {
      setEditingRecord(null);
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        // 转换日期格式
        const formattedValues = {
          ...values,
          recordDate: values.recordDate.format('YYYY-MM-DD')
        };

        if (editingRecord) {
          // 更新记录
          const updatedRecords = records.map(record => {
            if (record.id === editingRecord.id) {
              return {
                ...record,
                ...formattedValues
              };
            }
            return record;
          });
          setRecords(updatedRecords);
          message.success('会议记录已更新');
        } else {
          // 创建新记录
          const newRecord: MeetingRecord = {
            ...formattedValues,
            id: (records.length + 1).toString(),
            meetingTitle: getMeetingTitle(formattedValues.meetingId),
            participantRecords: [],
            recorder: currentUser
          };
          setRecords([...records, newRecord]);
          message.success('会议记录已创建');
        }
        setIsModalVisible(false);
      })
      .catch(info => {
        console.error('表单验证失败:', info);
      });
  };

  const handleDeleteRecord = (id: string) => {
    const updatedRecords = records.filter(record => record.id !== id);
    setRecords(updatedRecords);
    message.success('会议记录已删除');
  };

  const handleExportRecord = (record: MeetingRecord) => {
    console.log('导出会议记录', record);
    message.success('会议记录导出功能尚未实现');
  };

  // 添加参与者记录
  const showParticipantRecordModal = (record: MeetingRecord) => {
    setEditingRecord(record);
    participantRecordForm.resetFields();
    setParticipantRecordModalVisible(true);
  };

  const handleAddParticipantRecord = () => {
    participantRecordForm
      .validateFields()
      .then(values => {
        if (editingRecord) {
          const newParticipantRecord: MeetingParticipantRecord = {
            content: values.content,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            id: Date.now().toString(),
            recorder: currentUser
          };

          const updatedRecords = records.map(record => {
            if (record.id === editingRecord.id) {
              return {
                ...record,
                participantRecords: [...record.participantRecords, newParticipantRecord]
              };
            }
            return record;
          });

          setRecords(updatedRecords);
          message.success('参与记录已添加');
          setParticipantRecordModalVisible(false);
        }
      })
      .catch(info => {
        console.error('表单验证失败:', info);
      });
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
          dataSource={records}
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
                    onClick={() => showParticipantRecordModal(item)}
                  >
                    添加参与记录
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

              {/* 参与记录部分 */}
              {item.participantRecords.length > 0 && (
                <div className="mt-4">
                  <Divider orientation="left">参与记录 ({item.participantRecords.length})</Divider>
                  <List
                    dataSource={item.participantRecords}
                    size="small"
                    renderItem={participantRecord => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar>{participantRecord.recorder.slice(0, 1)}</Avatar>}
                          description={<Text type="secondary">{participantRecord.createdAt}</Text>}
                          title={<Text strong>{participantRecord.recorder}</Text>}
                        />
                        <div>{participantRecord.content}</div>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </List.Item>
          )}
        />
      </Card>

      {/* 会议记录表单 */}
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
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map(user => ({
                label: `${user.nickName || user.userName} (${user.userName})`,
                value: user.id
              }))}
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

      {/* 参与记录表单 */}
      <Modal
        destroyOnClose
        open={participantRecordModalVisible}
        title="添加参与记录"
        width={600}
        onCancel={() => setParticipantRecordModalVisible(false)}
        onOk={handleAddParticipantRecord}
      >
        {editingRecord && (
          <div className="mb-4">
            <Text strong>会议：</Text> {editingRecord.meetingTitle}
            <br />
            <Text strong>日期：</Text> {editingRecord.recordDate}
            <br />
            <Text strong>记录人：</Text> {currentUser}
          </div>
        )}

        <Form
          form={participantRecordForm}
          layout="vertical"
        >
          <Form.Item
            label="您的记录内容"
            name="content"
            rules={[{ message: '请输入您的记录内容', required: true }]}
          >
            <TextArea
              placeholder="请输入您对本次会议的看法、意见或补充内容"
              rows={6}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Component;
