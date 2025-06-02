import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Avatar, Button, Card, Empty, List, Radio, Space, Tabs, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { notificationService } from '@/service/api';
import type { NotificationApi } from '@/service/api/types';

const { Text, Title } = Typography;

interface Notification {
  content: string;
  datetime: string;
  id: string;
  read: boolean;
  title: string;
  type: 'info' | 'meeting' | 'success' | 'warning';
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 获取通知数据
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotificationList({
        current: 1,
        size: 100
      });

      // 转换API数据格式
      const formattedNotifications: Notification[] = response.records.map((notification: NotificationApi.NotificationListItem) => ({
        id: notification.id.toString(),
        title: notification.title,
        content: notification.content,
        type: notification.type as 'info' | 'meeting' | 'success' | 'warning',
        datetime: notification.createTime,
        read: notification.readStatus === 1
      }));

      setNotifications(formattedNotifications);
      filterNotifications(formattedNotifications, activeTab);
    } catch (error) {
      message.error('获取通知列表失败');
      console.error('获取通知列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 根据Tab过滤通知
  const filterNotifications = (notifications: Notification[], tab: string) => {
    if (tab === 'all') {
      setFilteredNotifications(notifications);
    } else if (tab === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.read));
    } else {
      setFilteredNotifications(notifications.filter(n => n.type === tab));
    }
  };

  // 标记通知为已读
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(parseInt(id));
      
      const updatedNotifications = notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      setNotifications(updatedNotifications);
      filterNotifications(updatedNotifications, activeTab);
      message.success('已标记为已读');
    } catch (error) {
      message.error('标记失败');
      console.error('标记通知失败:', error);
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
    } catch (error) {
      message.error('标记失败');
      console.error('标记所有通知失败:', error);
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
      default:
        return <BellOutlined />;
    }
  };

  // 处理Tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    filterNotifications(notifications, key);
  };

  const tabItems = [
    {
      children: (
        <List
          dataSource={filteredNotifications}
          itemLayout="horizontal"
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          renderItem={item => (
            <List.Item
              className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
              actions={[
                !item.read ? (
                  <Button
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
              ]}
              onClick={() => viewNotification(item)}
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
      ),
      key: 'all',
      label: `全部通知 (${notifications.length})`
    },
    {
      children: <></>, // 内容与全部通知相同，由activeTab控制过滤
      key: 'unread',
      label: `未读通知 (${notifications.filter(n => !n.read).length})`
    },
    {
      children: <></>, // 内容与全部通知相同，由activeTab控制过滤
      key: 'meeting',
      label: '会议通知'
    },
    {
      children: <></>, // 内容与全部通知相同，由activeTab控制过滤
      key: 'info',
      label: '普通通知'
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Title level={4}>通知中心</Title>
          <Button
            disabled={!notifications.some(n => !n.read)}
            type="primary"
            onClick={markAllAsRead}
          >
            全部标为已读
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
