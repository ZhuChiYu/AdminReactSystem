import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface Notification {
  content: string;
  datetime: string;
  id: string;
  read: boolean;
  title: string;
  type: 'info' | 'meeting' | 'success' | 'warning';
}

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // 模拟获取通知数据
  useEffect(() => {
    // 在实际应用中，这里应该从API获取数据
    const mockNotifications: Notification[] = [
      {
        content: '您有一个新的会议需要审批',
        datetime: '2023-11-10 10:30',
        id: '1',
        read: false,
        title: '会议审批',
        type: 'meeting'
      },
      {
        content: '您的会议"项目评审会议"已审批通过',
        datetime: '2023-11-09 15:20',
        id: '2',
        read: false,
        title: '会议已批准',
        type: 'success'
      },
      {
        content: '您被邀请参加"季度总结会议"',
        datetime: '2023-11-08 09:15',
        id: '3',
        read: true,
        title: '会议邀请',
        type: 'info'
      }
    ];

    setNotifications(mockNotifications);
    // 计算未读通知数量
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // 标记通知为已读
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification => (notification.id === id ? { ...notification, read: true } : notification))
    );
    // 更新未读数量
    setUnreadCount(prev => Math.max(0, prev - 1));
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
      console.log('查看通知:', notification);
    }
  };

  const notificationItems = (
    <div
      className="notification-dropdown"
      style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)',
        width: '320px'
      }}
    >
      <div
        className="notification-header"
        style={{
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px'
        }}
      >
        <Text
          strong
          style={{ fontSize: '16px' }}
        >
          通知
        </Text>
        <Button
          size="small"
          style={{ height: 'auto', padding: '0' }}
          type="link"
          onClick={() => {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
          }}
        >
          全部标为已读
        </Button>
      </div>

      <div
        className="notification-content"
        style={{ maxHeight: '400px', overflow: 'auto' }}
      >
        {notifications.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <Text type="secondary">暂无通知</Text>
          </div>
        ) : (
          <div>
            {notifications.map(notification => (
              <div
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                key={notification.id}
                style={{
                  backgroundColor: notification.read ? '#fff' : '#f0f7ff',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  padding: '12px 16px'
                }}
                onClick={() => viewNotification(notification)}
              >
                <div style={{ marginBottom: '4px' }}>
                  <Text strong>{notification.title}</Text>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <Text style={{ fontSize: '14px' }}>{notification.content}</Text>
                </div>
                <div>
                  <Text
                    style={{ fontSize: '12px' }}
                    type="secondary"
                  >
                    {notification.datetime}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="notification-footer"
        style={{ borderTop: '1px solid #f0f0f0', padding: '8px 16px', textAlign: 'center' }}
      >
        <Button
          block
          type="link"
          onClick={viewAllNotifications}
        >
          查看全部通知
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationItems}
      placement="bottomRight"
      trigger={['click']}
    >
      <div
        className="notification-icon"
        style={{ cursor: 'pointer', padding: '0 8px' }}
      >
        <Badge
          count={unreadCount}
          overflowCount={99}
        >
          <BellOutlined style={{ fontSize: '18px' }} />
        </Badge>
      </div>
    </Dropdown>
  );
};

export default NotificationDropdown;
