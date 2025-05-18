import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Empty, List, Space, Tabs, Tag } from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

interface Meeting {
  endTime: string;
  id: string;
  location: string;
  organizer: string;
  participants: string[];
  startTime: string;
  status: 'cancelled' | 'completed' | 'ongoing' | 'pending';
  title: string;
}

interface Task {
  deadline: string;
  id: string;
  priority: 'high' | 'low' | 'medium';
  status: 'completed' | 'in_progress' | 'not_started';
  title: string;
  type: string;
}

const TodayMeetingsAndTasks = () => {
  const navigate = useNavigate();

  // 模拟今日会议数据
  const todayMeetings: Meeting[] = [
    {
      endTime: dayjs().hour(11).minute(30).format('HH:mm'),
      id: '1',
      location: '会议室A',
      organizer: '张经理',
      participants: ['李四', '王五', '赵六'],
      startTime: dayjs().hour(10).minute(0).format('HH:mm'),
      status: 'pending',
      title: '项目周例会'
    },
    {
      endTime: dayjs().hour(15).minute(0).format('HH:mm'),
      id: '2',
      location: '线上会议',
      organizer: '市场部',
      participants: ['客户代表', '产品经理', '销售经理'],
      startTime: dayjs().hour(14).minute(0).format('HH:mm'),
      status: 'pending',
      title: '客户需求沟通会'
    }
  ];

  // 模拟即将到期的任务
  const upcomingTasks: Task[] = [
    {
      deadline: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      id: '1',
      priority: 'high',
      status: 'in_progress',
      title: '完成月度销售报表',
      type: '报表'
    },
    {
      deadline: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      id: '2',
      priority: 'medium',
      status: 'not_started',
      title: '客户资料更新',
      type: '客户管理'
    },
    {
      deadline: dayjs().format('YYYY-MM-DD'),
      id: '3',
      priority: 'high',
      status: 'in_progress',
      title: '项目进度汇报准备',
      type: '项目管理'
    }
  ];

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Tag color="error">紧急</Tag>;
      case 'medium':
        return <Tag color="warning">中等</Tag>;
      case 'low':
        return <Tag color="success">普通</Tag>;
      default:
        return null;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Tag>未开始</Tag>;
      case 'in_progress':
        return <Tag color="processing">进行中</Tag>;
      case 'completed':
        return <Tag color="success">已完成</Tag>;
      default:
        return null;
    }
  };

  const items: TabsProps['items'] = [
    {
      children: (
        <List
          dataSource={todayMeetings}
          size="small"
          locale={{
            emptyText: <Empty description="今日暂无会议安排" />
          }}
          renderItem={meeting => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="link"
                  onClick={() => navigate('/meeting-manage/list')}
                >
                  查看详情
                </Button>
              ]}
            >
              <List.Item.Meta
                description={
                  <Space
                    direction="vertical"
                    size={2}
                  >
                    <Space>
                      <ClockCircleOutlined /> {meeting.startTime} - {meeting.endTime}
                    </Space>
                    <Space>
                      <EnvironmentOutlined /> {meeting.location}
                    </Space>
                    <Space>
                      <TeamOutlined /> 参会人: {meeting.participants.join(', ')}
                    </Space>
                  </Space>
                }
                title={
                  <Space>
                    {meeting.title}
                    {meeting.status === 'ongoing' && <Tag color="green">进行中</Tag>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
      key: 'meetings',
      label: '今日会议'
    },
    {
      children: (
        <List
          dataSource={upcomingTasks}
          size="small"
          locale={{
            emptyText: <Empty description="暂无待办任务" />
          }}
          renderItem={task => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="link"
                  onClick={() => navigate('/project-manage/task')}
                >
                  查看详情
                </Button>
              ]}
            >
              <List.Item.Meta
                description={
                  <Space
                    direction="vertical"
                    size={2}
                  >
                    <div>
                      <CalendarOutlined /> 截止日期: {task.deadline}
                    </div>
                    <div>类型: {task.type}</div>
                  </Space>
                }
                title={
                  <Space>
                    {task.title}
                    {getPriorityTag(task.priority)}
                    {getStatusTag(task.status)}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
      key: 'tasks',
      label: '待办任务'
    }
  ];

  return (
    <Card
      className="card-wrapper"
      title="日程与待办"
      variant="borderless"
    >
      <Tabs
        defaultActiveKey="meetings"
        items={items}
      />
    </Card>
  );
};

export default TodayMeetingsAndTasks;
