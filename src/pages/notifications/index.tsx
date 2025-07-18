import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Avatar, Button, Card, Checkbox, Empty, List, Modal, Space, Tabs, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { notificationService } from '@/service/api';
import type { NotificationApi } from '@/service/api/types';
import { isSuperAdmin } from '@/utils/auth';

const { Text, Title } = Typography;

interface Notification {
  content: string;
  datetime: string;
  id: string;
  read: boolean;
  relatedId?: number;
  relatedType?: string;
  title: string;
  type: 'class_announcement_system' | 'course_attachment' | 'info' | 'meeting' | 'success' | 'warning';
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const isSuper = isSuperAdmin();

  // 根据Tab过滤通知
  const filterNotifications = (notificationList: Notification[], tab: string) => {
    if (tab === 'all') {
      setFilteredNotifications(notificationList);
    } else if (tab === 'unread') {
      setFilteredNotifications(notificationList.filter(n => !n.read));
    } else {
      setFilteredNotifications(notificationList.filter(n => n.type === tab));
    }
  };

  // 获取通知数据
  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotificationList({
        current: 1,
        size: 100,
        // 明确排除课程附件通知，系统通知中心只显示真正的系统通知
        type: isSuper ? undefined : undefined // 让后端权限控制处理
      });

      // 转换API数据格式，并过滤掉具体的班级通知公告内容
      const formattedNotifications: Notification[] = response.records
        .filter(
          (notification: NotificationApi.NotificationListItem) => notification.type !== 'class_announcement' // 在前端也过滤掉具体的班级通知公告内容，但保留课程附件通知
        )
        .map((notification: NotificationApi.NotificationListItem) => ({
          content: notification.content,
          datetime: notification.createTime,
          id: notification.id.toString(),
          read: notification.readStatus === 1,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType,
          title: notification.title,
          type: notification.type as
            | 'class_announcement_system'
            | 'course_attachment'
            | 'info'
            | 'meeting'
            | 'success'
            | 'warning'
        }));

      setNotifications(formattedNotifications);
      filterNotifications(formattedNotifications, activeTab);
    } catch {
      message.error('获取通知列表失败');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 标记通知为已读
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(Number.parseInt(id, 10));

      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      setNotifications(updatedNotifications);
      filterNotifications(updatedNotifications, activeTab);
      message.success('已标记为已读');
    } catch {
      message.error('标记失败');
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
      setNotifications(updatedNotifications);
      filterNotifications(updatedNotifications, activeTab);
      message.success('所有通知已标记为已读');

      // 重新获取通知列表以确保数据同步
      setTimeout(() => {
        fetchNotifications();
      }, 500);
    } catch {
      message.error('标记失败');
    }
  };

  // 删除单个通知
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(Number.parseInt(notificationId, 10));

      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      filterNotifications(updatedNotifications, activeTab);
      message.success('通知已删除');
    } catch {
      message.error('删除失败');
    }
  };

  // 批量删除通知
  const batchDeleteNotifications = async () => {
    if (selectedNotifications.length === 0) {
      message.warning('请选择要删除的通知');
      return;
    }

    Modal.confirm({
      content: `确定要删除选中的 ${selectedNotifications.length} 条通知吗？`,
      onOk: async () => {
        try {
          await notificationService.batchDeleteNotifications(selectedNotifications.map(id => Number.parseInt(id, 10)));

          const updatedNotifications = notifications.filter(n => !selectedNotifications.includes(n.id));
          setNotifications(updatedNotifications);
          filterNotifications(updatedNotifications, activeTab);
          setSelectedNotifications([]);
          setIsSelectMode(false);
          message.success(`成功删除 ${selectedNotifications.length} 条通知`);
        } catch {
          message.error('批量删除失败');
        }
      },
      title: '确认删除'
    });
  };

  // 切换选择模式
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedNotifications([]);
  };

  // 处理通知选择
  const handleNotificationSelect = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    } else {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  // 查看通知详情
  const viewNotification = (notification: Notification) => {
    // 标记为已读
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 根据通知类型导航
    if (notification.type === 'meeting') {
      navigate('/meeting-manage/approve');
    } else if (notification.type === 'course_attachment') {
      navigate('/course-manage/list');
    } else if (notification.type === 'class_announcement_system' && notification.relatedId) {
      // 班级通知公告系统通知，跳转到班级详情页面
      navigate(`/class-manage/detail/${notification.relatedId}`);
    }
    // 其他类型可以在这里添加更多处理逻辑
  };

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'meeting':
        return <ClockCircleOutlined style={{ color: '#722ed1' }} />;
      case 'course_attachment':
        return <FileOutlined style={{ color: '#eb2f96' }} />;
      case 'class_announcement_system':
        return <BellOutlined style={{ color: '#f5222d' }} />;
      default:
        return <BellOutlined />;
    }
  };

  // 处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    filterNotifications(notifications, key);
  };

  return (
    <div
      className="p-4"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>通知中心</Title>
          <Space>
            {isSuper && (
              <>
                <Button onClick={toggleSelectMode}>{isSelectMode ? '取消选择' : '选择删除'}</Button>
                {isSelectMode && (
                  <>
                    <Checkbox
                      checked={
                        selectedNotifications.length === filteredNotifications.length &&
                        filteredNotifications.length > 0
                      }
                      indeterminate={
                        selectedNotifications.length > 0 && selectedNotifications.length < filteredNotifications.length
                      }
                      onChange={e => handleSelectAll(e.target.checked)}
                    >
                      全选
                    </Checkbox>
                    <Button
                      danger
                      disabled={selectedNotifications.length === 0}
                      icon={<DeleteOutlined />}
                      onClick={batchDeleteNotifications}
                    >
                      删除选中 ({selectedNotifications.length})
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              disabled={!notifications.some(n => !n.read)}
              type="primary"
              onClick={markAllAsRead}
            >
              全部标为已读
            </Button>
          </Space>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Tabs
            activeKey={activeTab}
            style={{ height: '100%' }}
            items={[
              {
                children: (
                  <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                    <List
                      dataSource={filteredNotifications}
                      locale={{ emptyText: <Empty description="暂无通知" /> }}
                      renderItem={item => (
                        <List.Item
                          className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
                          actions={[
                            ...(isSelectMode && isSuper
                              ? [
                                  <Checkbox
                                    checked={selectedNotifications.includes(item.id)}
                                    key="select"
                                    onChange={e => handleNotificationSelect(item.id, e.target.checked)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ]
                              : []),
                            ...(isSuper && !isSelectMode
                              ? [
                                  <Button
                                    danger
                                    key="delete"
                                    size="small"
                                    type="link"
                                    onClick={e => {
                                      e.stopPropagation();
                                      deleteNotification(item.id);
                                    }}
                                  >
                                    删除
                                  </Button>
                                ]
                              : []),
                            !item.read ? (
                              <Button
                                key="read"
                                size="small"
                                type="link"
                                onClick={e => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                              >
                                标为已读
                              </Button>
                            ) : null
                          ].filter(Boolean)}
                          onClick={() => !isSelectMode && viewNotification(item)}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={getNotificationIcon(item.type)} />}
                            title={<Text strong>{item.title}</Text>}
                            description={
                              <Space
                                direction="vertical"
                                size={1}
                              >
                                <Text>{item.content}</Text>
                                <Space size={8}>
                                  <Text
                                    style={{ fontSize: '12px' }}
                                    type="secondary"
                                  >
                                    {item.datetime}
                                  </Text>
                                  {!item.read && <Tag color="blue">未读</Tag>}
                                </Space>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ),
                key: 'all',
                label: `全部通知 (${notifications.length})`
              },
              {
                children: (
                  <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                    <List
                      dataSource={filteredNotifications}
                      locale={{ emptyText: <Empty description="暂无未读通知" /> }}
                      renderItem={item => (
                        <List.Item
                          className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
                          actions={[
                            ...(isSelectMode && isSuper
                              ? [
                                  <Checkbox
                                    checked={selectedNotifications.includes(item.id)}
                                    key="select"
                                    onChange={e => handleNotificationSelect(item.id, e.target.checked)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ]
                              : []),
                            ...(isSuper && !isSelectMode
                              ? [
                                  <Button
                                    danger
                                    key="delete"
                                    size="small"
                                    type="link"
                                    onClick={e => {
                                      e.stopPropagation();
                                      deleteNotification(item.id);
                                    }}
                                  >
                                    删除
                                  </Button>
                                ]
                              : []),
                            !item.read ? (
                              <Button
                                key="read"
                                size="small"
                                type="link"
                                onClick={e => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                              >
                                标为已读
                              </Button>
                            ) : null
                          ].filter(Boolean)}
                          onClick={() => !isSelectMode && viewNotification(item)}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={getNotificationIcon(item.type)} />}
                            title={<Text strong>{item.title}</Text>}
                            description={
                              <Space
                                direction="vertical"
                                size={1}
                              >
                                <Text>{item.content}</Text>
                                <Space size={8}>
                                  <Text
                                    style={{ fontSize: '12px' }}
                                    type="secondary"
                                  >
                                    {item.datetime}
                                  </Text>
                                  {!item.read && <Tag color="blue">未读</Tag>}
                                </Space>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ),
                key: 'unread',
                label: `未读通知 (${notifications.filter(n => !n.read).length})`
              },
              {
                children: (
                  <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                    <List
                      dataSource={filteredNotifications}
                      locale={{ emptyText: <Empty description="暂无会议通知" /> }}
                      renderItem={item => (
                        <List.Item
                          className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
                          actions={[
                            ...(isSelectMode && isSuper
                              ? [
                                  <Checkbox
                                    checked={selectedNotifications.includes(item.id)}
                                    key="select"
                                    onChange={e => handleNotificationSelect(item.id, e.target.checked)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ]
                              : []),
                            ...(isSuper && !isSelectMode
                              ? [
                                  <Button
                                    danger
                                    key="delete"
                                    size="small"
                                    type="link"
                                    onClick={e => {
                                      e.stopPropagation();
                                      deleteNotification(item.id);
                                    }}
                                  >
                                    删除
                                  </Button>
                                ]
                              : []),
                            !item.read ? (
                              <Button
                                key="read"
                                size="small"
                                type="link"
                                onClick={e => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                              >
                                标为已读
                              </Button>
                            ) : null
                          ].filter(Boolean)}
                          onClick={() => !isSelectMode && viewNotification(item)}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={getNotificationIcon(item.type)} />}
                            title={<Text strong>{item.title}</Text>}
                            description={
                              <Space
                                direction="vertical"
                                size={1}
                              >
                                <Text>{item.content}</Text>
                                <Space size={8}>
                                  <Text
                                    style={{ fontSize: '12px' }}
                                    type="secondary"
                                  >
                                    {item.datetime}
                                  </Text>
                                  {!item.read && <Tag color="blue">未读</Tag>}
                                </Space>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ),
                key: 'meeting',
                label: '会议通知'
              },
              {
                children: (
                  <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                    <List
                      dataSource={filteredNotifications}
                      locale={{ emptyText: <Empty description="暂无普通通知" /> }}
                      renderItem={item => (
                        <List.Item
                          className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
                          actions={[
                            ...(isSelectMode && isSuper
                              ? [
                                  <Checkbox
                                    checked={selectedNotifications.includes(item.id)}
                                    key="select"
                                    onChange={e => handleNotificationSelect(item.id, e.target.checked)}
                                    onClick={e => e.stopPropagation()}
                                  />
                                ]
                              : []),
                            ...(isSuper && !isSelectMode
                              ? [
                                  <Button
                                    danger
                                    key="delete"
                                    size="small"
                                    type="link"
                                    onClick={e => {
                                      e.stopPropagation();
                                      deleteNotification(item.id);
                                    }}
                                  >
                                    删除
                                  </Button>
                                ]
                              : []),
                            !item.read ? (
                              <Button
                                key="read"
                                size="small"
                                type="link"
                                onClick={e => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                              >
                                标为已读
                              </Button>
                            ) : null
                          ].filter(Boolean)}
                          onClick={() => !isSelectMode && viewNotification(item)}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={getNotificationIcon(item.type)} />}
                            title={<Text strong>{item.title}</Text>}
                            description={
                              <Space
                                direction="vertical"
                                size={1}
                              >
                                <Text>{item.content}</Text>
                                <Space size={8}>
                                  <Text
                                    style={{ fontSize: '12px' }}
                                    type="secondary"
                                  >
                                    {item.datetime}
                                  </Text>
                                  {!item.read && <Tag color="blue">未读</Tag>}
                                </Space>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ),
                key: 'info',
                label: '普通通知'
              }
            ]}
            onChange={handleTabChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
