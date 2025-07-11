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

import { fetchGetUserList, meetingService } from '@/service/api';
import type { MeetingApi } from '@/service/api/types';
import { getCurrentUserId, getCurrentUserName } from '@/utils/auth';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

interface MeetingParticipantRecord {
  content: string;
  createdAt: string;
  id: string;
  recorder: string;
}

interface MeetingRecord {
  attendeeIds?: number[];
  attendees: string[]; // 保存参会人员ID用于编辑
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
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | null>(null);
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [meetings, setMeetings] = useState<MeetingApi.MeetingListItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentMeetingForParticipants, setCurrentMeetingForParticipants] = useState<MeetingRecord | null>(null);

  // 获取当前登录用户姓名
  const currentUser = getCurrentUserName() || '未知用户';

  // 使用项目中已有的用户认证工具函数

  // 判断用户是否为会议参与者
  const isUserParticipant = (userId: string, meeting: any): boolean => {
    if (!meeting || !userId) return false;

    const numUserId = Number.parseInt(userId, 10);

    // 如果是会议的组织者，可以查看
    if (meeting.organizer?.id === numUserId || meeting.organizer?.id?.toString() === userId) return true;

    // 如果有participantIds数组，检查用户是否在其中
    if ((meeting as any).participantIds && Array.isArray((meeting as any).participantIds)) {
      return (meeting as any).participantIds.includes(numUserId) || (meeting as any).participantIds.includes(userId);
    }

    // 如果没有具体的参与者信息，暂时允许查看（或者可以改为false更严格）
    return true;
  };

  // 查看参与人员
  const handleViewParticipants = async (record: MeetingRecord) => {
    if (record.attendees.length === 0) {
      message.info('该会议记录暂无参与人员');
      return;
    }

    setCurrentMeetingForParticipants(record);
    setParticipantsModalVisible(true);
    setParticipantsLoading(true);

    try {
      // 尝试从会议详情获取参与人员信息
      const relatedMeeting = meetings.find(m => m.id.toString() === record.meetingId);
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
          } else if ((detail as any).participantIds && Array.isArray((detail as any).participantIds)) {
            participantsData = (detail as any).participantIds.map((participantId: number) => {
              const user = users.find(u => u.id === participantId);
              return {
                id: participantId,
                name: user ? user.nickName || user.userName : `用户${participantId}`
              };
            });
          } else {
            // 如果API没有返回参与人员详情，生成占位数据
            participantsData = Array.from({ length: record.attendees.length }, (_, index) => ({
              id: index + 1,
              name: `参与者${index + 1}`
            }));
          }

          // 更新当前记录的参与人员信息
          setCurrentMeetingForParticipants(prev =>
            prev
              ? ({
                  ...prev,
                  participants: participantsData
                } as MeetingRecord & { participants: Array<{ id: number; name: string }> })
              : null
          );
        } catch (error) {
          console.error('获取会议详情失败:', error);
          // 使用占位数据
          const participantsData = Array.from({ length: record.attendees.length }, (_, index) => ({
            id: index + 1,
            name: `参与者${index + 1}`
          }));

          setCurrentMeetingForParticipants(prev =>
            prev
              ? ({
                  ...prev,
                  participants: participantsData
                } as MeetingRecord & { participants: Array<{ id: number; name: string }> })
              : null
          );
        }
      }
    } finally {
      setParticipantsLoading(false);
    }
  };

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
        size: 1000 // 获取所有会议，暂时不过滤审批状态
      });
      const records = response.records || [];
      setMeetings(records);
    } catch (error) {
      console.error('获取会议列表失败:', error);
    }
  };

  // 获取会议记录列表
  const fetchRecords = async () => {
    try {
      const response = await meetingService.getMeetingRecordList({
        current: 1,
        size: 1000
      });

      // 转换API数据格式
      const formattedRecords: MeetingRecord[] = await Promise.all(
        (response as any).records.map(async (apiRecord: any) => {
          // 从对应的会议获取参会人员信息
          const relatedMeeting = meetings.find(m => m.id === apiRecord.meetingId);
          let attendeeIds: number[] = [];
          let attendeeNames: string[] = [];

          // 如果记录中有参会人员信息，优先使用
          if (apiRecord.attendees && Array.isArray(apiRecord.attendees)) {
            attendeeIds = apiRecord.attendees;
          } else if (relatedMeeting) {
            // 否则从对应的会议中获取参会人员
            try {
              const meetingDetail = await meetingService.getMeetingDetail(relatedMeeting.id);

              if ((meetingDetail as any).participantIds && Array.isArray((meetingDetail as any).participantIds)) {
                attendeeIds = (meetingDetail as any).participantIds;
              } else if ((meetingDetail as any).participants && Array.isArray((meetingDetail as any).participants)) {
                // 尝试从participants数组获取
                attendeeIds = (meetingDetail as any).participants.map((p: any) => p.id || p.userId);
              }
            } catch (_error) {
              console.warn('获取会议详情失败，使用参会人数生成占位数据:', _error);
            }
          }

          // 如果还是没有获取到参会人员，使用参会人数生成占位数据
          if (attendeeIds.length === 0 && relatedMeeting?.participantCount) {
            attendeeIds = Array.from({ length: relatedMeeting.participantCount }, (_, index) => index + 1);
            attendeeNames = Array.from(
              { length: relatedMeeting.participantCount },
              (_, index) => `参会人员${index + 1}`
            );
          } else {
            // 转换参会人员ID为名称
            attendeeNames = attendeeIds.map(id => {
              const user = users.find(u => u.id === id);
              return user ? user.nickName || user.userName : `用户${id}`;
            });
          }

          return {
            attendeeIds,
            attendees: attendeeNames,
            content: apiRecord.content,
            id: apiRecord.id.toString(),
            meetingId: apiRecord.meetingId.toString(),
            meetingTitle: apiRecord.meeting?.title || relatedMeeting?.meetingTitle || '',
            participantRecords: [],
            recordDate: dayjs(apiRecord.createTime || apiRecord.recordTime).format('YYYY-MM-DD'),
            recorder: apiRecord.recorder?.nickName || apiRecord.recorder?.userName || '',
            tags: []
          };
        })
      );

      // 权限过滤：只显示当前用户参与的会议记录
      const currentUserId = getCurrentUserId();
      const filteredRecords = formattedRecords.filter(record => {
        const relatedMeeting = meetings.find(m => m.id.toString() === record.meetingId);
        return isUserParticipant(currentUserId, relatedMeeting);
      });

      setRecords(filteredRecords);
    } catch (error) {
      console.error('获取会议记录失败:', error);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  // 当meetings数据加载完成后，再获取会议记录
  useEffect(() => {
    if (meetings.length > 0) {
      fetchRecords();
    }
  }, [meetings]);

  const showModal = (record?: MeetingRecord) => {
    form.resetFields();
    if (record) {
      setEditingRecord(record);
      form.setFieldsValue({
        attendees: record.attendeeIds || [], // 使用ID而不是名称
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
      .then(async values => {
        // 转换日期格式
        const formattedValues = {
          ...values,
          recordDate: values.recordDate.format('YYYY-MM-DD')
        };

        if (editingRecord) {
          // 更新记录
          try {
            await meetingService.updateMeetingRecord(Number(editingRecord.id), {
              content: formattedValues.content,
              title: getMeetingTitle(formattedValues.meetingId)
            });
            message.success('会议记录已更新');
            fetchRecords(); // 重新获取列表
          } catch (_error) {
            message.error('更新会议记录失败');
          }
        } else {
          // 创建新记录
          try {
            await meetingService.createMeetingRecord({
              content: formattedValues.content,
              meetingId: Number(formattedValues.meetingId)
            });
            message.success('会议记录已创建');
            fetchRecords(); // 重新获取列表
          } catch (error) {
            message.error('创建会议记录失败');
          }
        }
        setIsModalVisible(false);
      })
      .catch(info => {
        console.error('表单验证失败:', info);
      });
  };

  const handleDeleteRecord = (id: string) => {
    Modal.confirm({
      content: '确定要删除这条会议记录吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await meetingService.deleteMeetingRecord(Number(id));
          message.success('会议记录已删除');
          // 重新获取会议记录列表
          await fetchRecords();
        } catch (error) {
          console.error('删除会议记录失败:', error);
          message.error('删除会议记录失败');
        }
      },
      title: '确认删除'
    });
  };

  const handleExportRecord = async (record: MeetingRecord) => {
    try {
      message.loading({ content: '正在准备导出...', key: 'export' });

      const blob = await meetingService.exportMeetingRecord(Number(record.id));

      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `会议记录-${record.meetingTitle}-${record.recordDate}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理URL对象
      window.URL.revokeObjectURL(downloadUrl);

      message.success({ content: '会议记录导出成功', key: 'export' });
    } catch (error) {
      console.error('导出会议记录失败:', error);
      message.error({ content: '导出失败，请重试', key: 'export' });
    }
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
                  <TeamOutlined /> 参会人数:
                  <Button
                    disabled={item.attendees.length === 0}
                    style={{ color: item.attendees.length > 0 ? '#1890ff' : 'inherit', height: 'auto', padding: 0 }}
                    type="link"
                    onClick={() => handleViewParticipants(item)}
                  >
                    {item.attendees.length} 人
                  </Button>
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
              {meetings.map(meeting => (
                <Select.Option
                  key={meeting.id}
                  value={meeting.id.toString()}
                >
                  {meeting.meetingTitle || meeting.title} ({dayjs(meeting.startTime).format('YYYY-MM-DD')})
                </Select.Option>
              ))}
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
            name="attendees"
            rules={editingRecord ? [] : [{ message: '请选择参会人员', required: true }]}
            label={
              <div>
                参会人员
                {editingRecord && (
                  <span style={{ color: '#999', fontSize: '12px', fontWeight: 'normal', marginLeft: '8px' }}>
                    (编辑模式下无法修改，请在会议管理中修改)
                  </span>
                )}
              </div>
            }
          >
            <Select
              showSearch
              disabled={Boolean(editingRecord)}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              mode="multiple"
              placeholder={editingRecord ? '参会人员信息来源于对应会议' : '请选择参会人员'}
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
        {currentMeetingForParticipants && (
          <div>
            <div className="mb-4">
              <p>
                <strong>会议标题：</strong> {currentMeetingForParticipants.meetingTitle}
              </p>
              <p>
                <strong>记录日期：</strong> {currentMeetingForParticipants.recordDate}
              </p>
              <p>
                <strong>参与人数：</strong> {currentMeetingForParticipants.attendees.length} 人
              </p>
            </div>

            {participantsLoading ? (
              <div className="py-4 text-center">
                <div>正在加载参与人员...</div>
              </div>
            ) : (currentMeetingForParticipants as any).participants &&
              (currentMeetingForParticipants as any).participants.length > 0 ? (
              <div>
                <h4 className="mb-3">参与人员列表：</h4>
                <div className="space-y-2">
                  {(currentMeetingForParticipants as any).participants.map((participant: any, index: number) => (
                    <div
                      className="flex items-center justify-between rounded bg-gray-50 p-2"
                      key={participant.id}
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
              <div className="py-4 text-center text-gray-500">
                <div>暂无参与人员详情</div>
                <div className="mt-2 text-sm">参与人数：{currentMeetingForParticipants.attendees.length} 人</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Component;
