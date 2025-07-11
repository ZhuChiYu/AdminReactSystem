import { BellOutlined } from '@ant-design/icons';
import { App, Badge, Button, Dropdown, Empty, List, Spin, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { notificationService } from '@/service/api';

const { Text } = Typography;

interface Notification {
  content: string;
  id: string;
  read: boolean;
  time: string;
  title: string;
  type: 'error' | 'info' | 'meeting' | 'success' | 'warning';
}

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  // 获取通知数据
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotificationList({
        current: 1,
        size: 10
      });

      // 检查响应数据格式
      if (response && response.records && Array.isArray(response.records)) {
        // 转换API数据格式
        const formattedNotifications: Notification[] = response.records.map(notification => ({
          content: notification.content,
          id: notification.id.toString(),
          read: notification.readStatus === 1,
          time: new Date(notification.createTime).toLocaleString(),
          title: notification.title,
          type: notification.type as 'error' | 'info' | 'meeting' | 'success' | 'warning'
        }));
        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 标记为已读
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(Number.parseInt(id, 10));

      setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      message.error('标记已读失败');
    }
  };

  // 标记所有为已读
  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      message.success('全部已标记为已读');

      // 重新获取通知列表以确保数据同步
      setTimeout(() => {
        fetchNotifications();
      }, 500);
    } catch (error) {
      message.error('标记全部已读失败');
    }
  };

  // 查看所有通知
  const viewAllNotifications = () => {
    navigate('/notifications');
  };

  // 查看单个通知
  const viewNotification = (notification: Notification) => {
    // 如果是未读通知，标记为已读
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 根据通知类型导航到相应页面
    if (notification.type === 'meeting') {
      navigate('/meeting-manage/approve');
    } else {
      // 显示通知详情
    }
  };

  const renderNotificationList = () => {
    if (loading) {
      return (
        <div className="p-4 text-center">
          <Spin />
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="p-4">
          <Empty
            description="暂无通知"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <List
          dataSource={notifications}
          size="small"
          split={false}
          renderItem={item => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 transition-colors ${!item.read ? 'bg-blue-50' : ''}`}
              style={{
                borderBottom: '1px solid #f0f0f0',
                padding: '12px 16px'
              }}
              onClick={() => viewNotification(item)}
            >
              <div className="w-full">
                <div className="mb-1 flex items-center justify-between">
                  <Text
                    ellipsis={{ tooltip: item.title }}
                    strong={!item.read}
                    style={{
                      fontSize: '14px',
                      maxWidth: '220px'
                    }}
                  >
                    {item.title}
                  </Text>
                  {!item.read && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                </div>
                <Text
                  ellipsis={{ tooltip: item.content }}
                  type="secondary"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    lineHeight: '16px',
                    maxWidth: '260px'
                  }}
                >
                  {item.content}
                </Text>
                <div className="mt-1">
                  <Text
                    style={{ fontSize: '11px' }}
                    type="secondary"
                  >
                    {item.time}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    );
  };

  const notificationItems = (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: 320
      }}
    >
      <div
        className="flex items-center justify-between border-b p-3"
        style={{ backgroundColor: '#fafafa', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
      >
        <Text strong>通知</Text>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="small"
              type="link"
              onClick={markAllAsRead}
            >
              全部已读
            </Button>
          )}
          <Button
            size="small"
            type="link"
            onClick={viewAllNotifications}
          >
            查看全部
          </Button>
        </div>
      </div>

      {renderNotificationList()}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationItems}
      placement="bottomRight"
      trigger={['click']}
    >
      <Badge
        count={unreadCount}
        size="small"
      >
        <Button
          icon={<BellOutlined />}
          shape="circle"
          size="large"
          type="text"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
