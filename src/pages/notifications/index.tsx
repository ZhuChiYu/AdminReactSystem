import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Avatar, Button, Card, Empty, List, Radio, Space, Tabs, Tag, Typography } from 'antd';
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

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  // 模拟获取通知数据
  useEffect(() => {
    // 在实际应用中，这里应该从API获取数据
    const mockNotifications: Notification[] = [
      {
        content: '您有一个新的会议需要审批，请尽快处理',
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
      },
      {
        content: '您的会议"产品设计讨论"被拒绝，原因：时间冲突',
        datetime: '2023-11-07 16:45',
        id: '4',
        read: true,
        title: '会议被拒绝',
        type: 'warning'
      },
      {
        content: '明天下午2点将召开"技术架构讨论"会议，请准时参加',
        datetime: '2023-11-06 11:20',
        id: '5',
        read: true,
        title: '会议提醒',
        type: 'info'
      },
      {
        content: '您负责的"市场营销策略"会议已成功创建',
        datetime: '2023-11-05 14:10',
        id: '6',
        read: true,
        title: '会议创建成功',
        type: 'success'
      }
    ];

    setNotifications(mockNotifications);
    filterNotifications(mockNotifications, activeTab);
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
  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    filterNotifications(updatedNotifications, activeTab);
  };

  // 标记所有通知为已读
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updatedNotifications);
    filterNotifications(updatedNotifications, activeTab);
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
              className={`cursor-pointer ${!item.read ? 'bg-blue-50' : ''}`}
              onClick={() => viewNotification(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={getNotificationIcon(item.type)} />
                }
                description={
                  <Space direction="vertical" size={1}>
                    <Text>{item.content}</Text>
                    <Space size={8}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {item.datetime}
                      </Text>
                      {!item.read && <Tag color="blue">未读</Tag>}
                    </Space>
                  </Space>
                }
                title={<Text strong>{item.title}</Text>}
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
          <Button type="primary" onClick={markAllAsRead} disabled={!notifications.some(n => !n.read)}>
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
