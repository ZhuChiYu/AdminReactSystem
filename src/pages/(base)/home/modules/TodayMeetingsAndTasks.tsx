import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Card, List, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { meetingService } from '@/service/api';
import { projectService } from '@/service/api/project';
import type { MeetingApi, TaskApi } from '@/service/api/types';

interface MeetingItem {
  id: number;
  location?: string;
  status: number;
  time: string;
  title: string;
  type: string;
}

interface TaskItem {
  dueDate: string;
  id: number;
  priority: number;
  project: string;
  status: number;
  title: string;
}

const TodayMeetingsAndTasks = () => {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取今日会议
  const fetchTodayMeetings = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 10,
        startTimeBegin: `${today} 00:00:00`,
        startTimeEnd: `${today} 23:59:59`
      });

      const todayMeetings: MeetingItem[] = response.records.map((meeting: MeetingApi.MeetingListItem) => ({
        id: meeting.id,
        location: meeting.meetingRoom || meeting.meetingUrl,
        status: meeting.meetingStatus,
        time: meeting.startTime,
        title: meeting.meetingTitle,
        type: meeting.meetingType
      }));

      setMeetings(todayMeetings);
    } catch (error) {
      console.error('获取今日会议失败:', error);
      setMeetings([]);
    }
  };

  // 获取即将到期的任务
  const fetchUpcomingTasks = async () => {
    try {
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const response = await projectService.getTaskList({
        current: 1,
        dueDateEnd: `${tomorrow} 23:59:59`,
        size: 10
      });

      const upcomingTasks: TaskItem[] = response.records
        .filter((task: TaskApi.TaskListItem) => task.dueDate && dayjs(task.dueDate).isAfter(dayjs()))
        .map((task: TaskApi.TaskListItem) => ({
          dueDate: task.dueDate || '',
          id: task.id,
          priority: task.priority || 0,
          project: task.projectName || '',
          status: task.taskStatus,
          title: task.taskName
        }));

      setTasks(upcomingTasks);
    } catch (error) {
      console.error('获取即将到期任务失败:', error);
      setTasks([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTodayMeetings(), fetchUpcomingTasks()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取会议状态标签
  const getMeetingStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="default">待开始</Tag>;
      case 1:
        return <Tag color="processing">进行中</Tag>;
      case 2:
        return <Tag color="success">已完成</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  // 获取任务优先级标签
  const getPriorityTag = (priority: number) => {
    switch (priority) {
      case 1:
        return <Tag color="red">高</Tag>;
      case 2:
        return <Tag color="orange">中</Tag>;
      case 3:
        return <Tag color="blue">低</Tag>;
      default:
        return <Tag color="default">普通</Tag>;
    }
  };

  // 获取任务状态标签
  const getTaskStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="default">未开始</Tag>;
      case 1:
        return <Tag color="processing">进行中</Tag>;
      case 2:
        return <Tag color="success">已完成</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 今日会议 */}
      <Card
        loading={loading}
        size="small"
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined />
            <span>今日会议</span>
          </div>
        }
      >
        {meetings.length > 0 ? (
          <List
            dataSource={meetings}
            size="small"
            renderItem={meeting => (
              <List.Item>
                <div className="w-full flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-gray-500">
                      <ClockCircleOutlined className="mr-1" />
                      {dayjs(meeting.time).format('HH:mm')}
                      {meeting.location && ` | ${meeting.location}`}
                    </div>
                    <div className="text-xs text-gray-400">{meeting.type}</div>
                  </div>
                  <div className="ml-2">{getMeetingStatusTag(meeting.status)}</div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8 text-center text-gray-500">
            <CalendarOutlined className="text-2xl" />
            <div className="mt-2">今日暂无会议</div>
          </div>
        )}
      </Card>

      {/* 即将到期的任务 */}
      <Card
        loading={loading}
        size="small"
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined />
            <span>即将到期任务</span>
          </div>
        }
      >
        {tasks.length > 0 ? (
          <List
            dataSource={tasks}
            size="small"
            renderItem={task => (
              <List.Item>
                <div className="w-full flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500">项目: {task.project}</div>
                    <div className="text-xs text-gray-400">
                      <ClockCircleOutlined className="mr-1" />
                      截止: {dayjs(task.dueDate).format('MM-DD HH:mm')}
                    </div>
                  </div>
                  <div className="ml-2 space-x-1">
                    {getPriorityTag(task.priority)}
                    {getTaskStatusTag(task.status)}
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8 text-center text-gray-500">
            <CheckCircleOutlined className="text-2xl" />
            <div className="mt-2">暂无即将到期任务</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TodayMeetingsAndTasks;
