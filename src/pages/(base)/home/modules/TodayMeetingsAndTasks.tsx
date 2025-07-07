import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, ProjectOutlined } from '@ant-design/icons';
import { Button, Card, List, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { meetingService } from '@/service/api';
import { projectService } from '@/service/api/project';
import type { MeetingApi, TaskApi } from '@/service/api/types';
import { localStg } from '@/utils/storage';

interface MeetingItem {
  approvalStatus: number;
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
  executor?: { id: number; nickName?: string; userName?: string };
  id: number;
  priority: number;
  projectName: string;
  projectType: string;
  responsiblePerson?: { id: number; nickName?: string; userName?: string };
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

  // 获取会议列表
  const fetchMeetings = async () => {
    try {
      const today = dayjs();
      const weekStart = today.startOf('week').format('YYYY-MM-DD');
      const weekEnd = today.endOf('week').format('YYYY-MM-DD');

      const params = {
        current: 1,
        size: 10, // 增加显示数量
        startTimeBegin: `${weekStart} 00:00:00`,
        startTimeEnd: `${weekEnd} 23:59:59`
      };

      const response = await meetingService.getMeetingList(params);

      const recentMeetings: MeetingItem[] = response.records.map((meeting: any) => ({
        approvalStatus: meeting.approvalStatus || 0,
        id: meeting.id,
        location: meeting.location || meeting.room?.name || '未指定',
        status: meeting.status || 0,
        time: meeting.startTime,
        title: meeting.title,
        type: meeting.meetingType || 'meeting'
      }));

      setMeetings(recentMeetings);
    } catch (error) {
      console.error('❌ 获取会议列表失败:', error);
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
      const myTasks: ProjectTaskItem[] = response.records.map((task: TaskApi.TaskListItem) => {
        const stageInfo = PROJECT_STAGES.find(s => s.key === task.currentStage);
        return {
          currentStage: task.currentStage,
          currentStageTitle: stageInfo?.title || task.currentStage,
          dueDate: task.endTime,
          executor: task.executor,
          id: task.id,
          priority: task.priority || 2,
          projectName: task.projectName,
          projectType: task.projectType,
          responsiblePerson: task.responsiblePerson
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
        await Promise.all([fetchMeetings(), fetchMyProjectTasks()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  // 获取会议状态标签（审批状态）
  const getMeetingStatusTag = (approvalStatus: number) => {
    switch (approvalStatus) {
      case 2:
        return <Tag color="success">已批准</Tag>;
      case 1:
        return <Tag color="processing">审批中</Tag>;
      case -1:
        return <Tag color="error">已拒绝</Tag>;
      default:
        return <Tag color="default">待审批</Tag>;
    }
  };

  // 获取会议进行状态标签
  const getMeetingProgressTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="default">待开始</Tag>;
      case 1:
        return <Tag color="processing">进行中</Tag>;
      case 2:
        return <Tag color="success">已完成</Tag>;
      case -1:
        return <Tag color="error">已取消</Tag>;
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

  // 跳转到会议列表
  const handleViewAllMeetings = () => {
    navigate('/meeting-manage/list');
  };

  // 点击会议项跳转到会议列表
  const handleMeetingClick = () => {
    navigate('/meeting-manage/list');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 会议列表 */}
      <Card
        loading={loading}
        size="small"
        extra={
          meetings.length > 0 && (
            <Button
              size="small"
              type="link"
              onClick={handleViewAllMeetings}
            >
              查看全部
            </Button>
          )
        }
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined />
            <span>会议列表</span>
          </div>
        }
      >
        {meetings.length > 0 ? (
          <List
            dataSource={meetings}
            size="small"
            renderItem={meeting => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50"
                onClick={handleMeetingClick}
              >
                <div className="w-full">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-base text-gray-800 font-medium">{meeting.title}</div>
                    <div className="ml-2">{getMeetingStatusTag(meeting.approvalStatus)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockCircleOutlined className="mr-2" />
                      <span>{dayjs(meeting.time).format('MM-DD HH:mm')}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📍</span>
                      <span>{meeting.location || '待定'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">会议状态: {getMeetingProgressTag(meeting.status)}</div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8 text-center text-gray-500">
            <CalendarOutlined className="text-2xl" />
            <div className="mt-2">暂无会议</div>
            <Button
              className="mt-2"
              size="small"
              type="link"
              onClick={handleViewAllMeetings}
            >
              查看会议列表
            </Button>
          </div>
        )}
      </Card>

      {/* 我的项目事项 */}
      <Card
        loading={loading}
        size="small"
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
        title={
          <div className="flex items-center gap-2">
            <ProjectOutlined />
            <span>我的项目事项</span>
          </div>
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
                    <div className="text-sm text-gray-500">类型: {task.projectType}</div>
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
