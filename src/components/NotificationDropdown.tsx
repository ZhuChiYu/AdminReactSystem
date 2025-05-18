import { BellOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Badge, Button, Dropdown, List, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

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
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
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
    <div className="custom-dropdown" style={{ maxHeight: '400px', maxWidth: '350px', overflow: 'auto' }}>
      <div className="p-2">
        <div className="mb-2 flex items-center justify-between">
          <Title level={5} style={{ margin: 0 }}>通知</Title>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={() => {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              setUnreadCount(0);
            }}>
              全部标为已读
            </Button>
          )}
        </div>

        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
              onClick={() => viewNotification(item)}
            >
              <List.Item.Meta
                title={<Text strong>{item.title}</Text>}
                description={
                  <Space direction="vertical" size={1}>
                    <Text>{item.content}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.datetime}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无通知' }}
        />

        <div className="mt-2 border-t pt-2 text-center">
          <Button type="link" onClick={viewAllNotifications}>
            查看全部通知
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationItems}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button type="text" className="flex items-center">
        <Badge count={unreadCount} overflowCount={99}>
          <BellOutlined style={{ fontSize: '18px' }} />
        </Badge>
      </Button>
    </Dropdown>
  );
};

export default NotificationDropdown;
