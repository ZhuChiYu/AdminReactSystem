import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, ProjectOutlined } from '@ant-design/icons';
import { Card, List, Tag, Button } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { meetingService } from '@/service/api';
import { projectService } from '@/service/api/project';
import type { MeetingApi, TaskApi } from '@/service/api/types';
import { localStg } from '@/utils/storage';

interface MeetingItem {
  id: number;
  location?: string;
  status: number;
  time: string;
  title: string;
  type: string;
}

interface ProjectTaskItem {
  currentStage: string;
  currentStageTitle: string;
  dueDate?: string;
  id: number;
  priority: number;
  projectName: string;
  projectType: string;
  responsiblePerson?: { id: number; nickName?: string; userName?: string };
  executor?: { id: number; nickName?: string; userName?: string };
}

// 项目阶段映射
const PROJECT_STAGES = [
  { description: '负责人发起项目', key: 'customer_inquiry', title: '客户询价' },
  { description: '咨询部上传方案', key: 'proposal_submission', title: '方案申报' },
  { description: '咨询部确认授课老师', key: 'teacher_confirmation', title: '师资确定' },
  { description: '市场部经理审批', key: 'project_approval', title: '项目审批' },
  { description: '咨询部确认合同签订', key: 'contract_signing', title: '签订合同' },
  { description: '咨询部跟进项目过程', key: 'project_execution', title: '项目进行' },
  { description: '负责人确认收款', key: 'project_settlement', title: '项目结算' }
];

const TodayMeetingsAndTasks = () => {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 获取当前用户信息
  const userInfo = localStg.get('userInfo');
  const currentUserId = userInfo?.userId ? Number(userInfo.userId) : undefined;

  // 获取今日会议
  const fetchTodayMeetings = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await meetingService.getMeetingList({
        current: 1,
        size: 5,
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

  // 获取当前用户相关的项目事项
  const fetchMyProjectTasks = async () => {
    try {
      if (!currentUserId) return;

      const response = await projectService.getMyTasks({
        current: 1,
        size: 8
      });

      // 处理返回的数据
      const myTasks: ProjectTaskItem[] = response.records
        .map((task: TaskApi.TaskListItem) => {
          const stageInfo = PROJECT_STAGES.find(s => s.key === task.currentStage);
          return {
            currentStage: task.currentStage,
            currentStageTitle: stageInfo?.title || task.currentStage,
            dueDate: task.endTime,
            id: task.id,
            priority: task.priority || 2,
            projectName: task.projectName,
            projectType: task.projectType,
            responsiblePerson: task.responsiblePerson,
            executor: task.executor
          };
        });

      setProjectTasks(myTasks);
    } catch (error) {
      console.error('获取我的项目事项失败:', error);
      setProjectTasks([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTodayMeetings(), fetchMyProjectTasks()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

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

  // 获取项目优先级标签
  const getPriorityTag = (priority: number) => {
    switch (priority) {
      case 1:
        return <Tag color="red">高</Tag>;
      case 2:
        return <Tag color="orange">中</Tag>;
      case 3:
        return <Tag color="green">低</Tag>;
      default:
        return <Tag color="default">普通</Tag>;
    }
  };

  // 获取阶段标签颜色
  const getStageTagColor = (stage: string): string => {
    const colors: Record<string, string> = {
      contract_signing: 'green',
      customer_inquiry: 'blue',
      project_approval: 'cyan',
      project_execution: 'lime',
      project_settlement: 'gold',
      proposal_submission: 'orange',
      teacher_confirmation: 'purple'
    };
    return colors[stage] || 'default';
  };

  // 跳转到项目事项列表
  const handleViewAllProjects = () => {
    navigate('/project-manage/task');
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

      {/* 我的项目事项 */}
      <Card
        loading={loading}
        size="small"
        title={
          <div className="flex items-center gap-2">
            <ProjectOutlined />
            <span>我的项目事项</span>
          </div>
        }
        extra={
          projectTasks.length > 0 && (
            <Button
              size="small"
              type="link"
              onClick={handleViewAllProjects}
            >
              查看全部
            </Button>
          )
        }
      >
        {projectTasks.length > 0 ? (
          <List
            dataSource={projectTasks}
            size="small"
            renderItem={task => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50"
                onClick={handleViewAllProjects}
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{task.projectName}</div>
                    <div className="text-sm text-gray-500">
                      类型: {task.projectType}
                    </div>
                    <div className="text-xs text-gray-400">
                      {task.responsiblePerson?.id === currentUserId ? '我负责' : '我办理'}
                      {task.dueDate && (
                        <>
                          <span className="mx-1">|</span>
                          截止: {dayjs(task.dueDate).format('MM-DD')}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 space-x-1">
                    <Tag color={getStageTagColor(task.currentStage)}>{task.currentStageTitle}</Tag>
                    {getPriorityTag(task.priority)}
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8 text-center text-gray-500">
            <ProjectOutlined className="text-2xl" />
            <div className="mt-2">暂无相关项目事项</div>
            <Button
              className="mt-2"
              size="small"
              type="link"
              onClick={handleViewAllProjects}
            >
              查看项目列表
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TodayMeetingsAndTasks;
