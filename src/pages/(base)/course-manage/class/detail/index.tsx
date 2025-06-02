import { ArrowLeftOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Descriptions, List, Space, Table, Tabs, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { classService, courseService, notificationService } from '@/service/api';
import type { ClassApi, NotificationApi } from '@/service/api/types';
import { message } from 'antd';

import UserAvatar from '@/components/UserAvatar';

/** 班级状态枚举 */
enum ClassStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2
}

/** 班级详情组件 */
const ClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [announceList, setAnnounceList] = useState<any[]>([]);

  // 获取班级详情数据
  const fetchClassData = async () => {
    if (!classId) return;
    
    setLoading(true);
    try {
      // 获取班级基本信息
      const classResponse = await classService.getClassDetail(parseInt(classId, 10));
      setClassInfo({
        id: classResponse.id,
        className: classResponse.className,
        teacher: classResponse.teacher || '未分配',
        category: classResponse.category?.name || '未分类',
        startDate: classResponse.startDate || '',
        endDate: classResponse.endDate || '',
        maxStudents: classResponse.maxStudents || 0,
        currentStudents: classResponse.currentStudents || 0,
        scheduleInfo: classResponse.scheduleInfo || '',
        status: classResponse.status
      });

      // 获取学生列表
      const studentsResponse = await classService.getClassStudentList({
        classId: parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      const formattedStudents = studentsResponse.records.map((student: any) => ({
        id: student.id.toString(),
        name: student.name,
        phone: student.phone || '',
        email: student.email || '',
        enrollmentDate: student.enrollmentDate || '',
        progress: student.progress || 0,
        status: student.status || 'active',
        attendanceRate: student.attendanceRate || 0
      }));

      setStudentList(formattedStudents);

      // 获取课程列表
      const coursesResponse = await courseService.getClassCourseList({
        classId: parseInt(classId, 10),
        current: 1,
        size: 1000
      });

      const formattedCourses = coursesResponse.records.map((course: any) => ({
        id: course.id.toString(),
        courseName: course.courseName,
        instructor: course.instructor || '',
        duration: course.duration || 0,
        schedule: course.schedule || '',
        status: course.status || 'active',
        progress: course.progress || 0
      }));

      setCourseList(formattedCourses);

      // 获取公告列表
      const announcementsResponse = await notificationService.getNotificationList({
        current: 1,
        size: 1000,
        type: 'class_announcement',
        relatedId: parseInt(classId, 10)
      });

      const formattedAnnouncements = announcementsResponse.records.map((announcement: NotificationApi.NotificationListItem) => ({
        id: announcement.id.toString(),
        title: announcement.title,
        content: announcement.content,
        publishDate: announcement.createTime,
        author: '管理员',
        important: false
      }));

      setAnnounceList(formattedAnnouncements);

    } catch (error) {
      message.error('获取班级数据失败');
      console.error('获取班级数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  // 获取状态标签颜色
  const getStatusColor = (status: ClassStatus) => {
    if (status === ClassStatus.IN_PROGRESS) return 'processing';
    if (status === ClassStatus.NOT_STARTED) return 'default';
    return 'success';
  };

  // 获取状态文本
  const getStatusText = (status: ClassStatus) => {
    if (status === ClassStatus.IN_PROGRESS) return '进行中';
    if (status === ClassStatus.NOT_STARTED) return '未开始';
    return '已结束';
  };

  // 获取通知重要性标签颜色
  const getImportanceColor = (importance: number) => {
    if (importance === 2) return 'red';
    if (importance === 1) return 'orange';
    return 'blue';
  };

  // 获取通知重要性文本
  const getImportanceText = (importance: number) => {
    if (importance === 2) return '紧急';
    if (importance === 1) return '重要';
    return '普通';
  };

  // 返回列表页
  const handleBack = () => {
    navigate('/course-manage/class');
  };

  // 学员列表表格列配置
  const studentColumns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 50
    },
    {
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserAvatar userId={text} size={40} />
          {text}
        </Space>
      ),
      title: '姓名',
      width: 120
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      title: '性别',
      width: 80
    },
    {
      dataIndex: 'company',
      key: 'company',
      title: '单位',
      width: 150
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职务',
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      width: 120
    },
    {
      dataIndex: 'email',
      key: 'email',
      title: '邮箱',
      width: 180
    },
    {
      dataIndex: 'joinDate',
      key: 'joinDate',
      title: '加入日期',
      width: 120
    },
    {
      dataIndex: 'attendance',
      key: 'attendance',
      render: (attendance: number) => `${attendance}%`,
      title: '出勤率',
      width: 100
    },
    {
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">详情</Button>
          <Button type="link">编辑</Button>
          <Button
            danger
            type="link"
          >
            移除
          </Button>
        </Space>
      ),
      title: '操作',
      width: 180
    }
  ];

  // 课程列表表格列配置
  const courseColumns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: 'ID',
      width: 50
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '课程名称',
      width: 150
    },
    {
      dataIndex: 'teacher',
      key: 'teacher',
      title: '任课老师',
      width: 120
    },
    {
      dataIndex: 'schedule',
      key: 'schedule',
      title: '上课时间',
      width: 200
    },
    {
      dataIndex: 'classroom',
      key: 'classroom',
      title: '教室',
      width: 100
    },
    {
      dataIndex: 'startDate',
      key: 'startDate',
      title: '开始日期',
      width: 120
    },
    {
      dataIndex: 'endDate',
      key: 'endDate',
      title: '结束日期',
      width: 120
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'processing' : 'default'}>{status === 1 ? '进行中' : '未开始'}</Tag>
      ),
      title: '状态',
      width: 100
    },
    {
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">详情</Button>
          <Button type="link">编辑</Button>
          <Button
            danger
            type="link"
          >
            移除
          </Button>
        </Space>
      ),
      title: '操作',
      width: 180
    }
  ];

  // 渲染主要信息区域
  const renderBasicInfo = () => {
    if (!classInfo) return null;

    return (
      <Card
        variant="borderless"
        className="mb-4"
      >
        <Descriptions
          column={{ lg: 3, md: 2, sm: 1, xl: 4, xs: 1, xxl: 4 }}
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                type="link"
                onClick={handleBack}
              >
                返回
              </Button>
              <span>班级信息</span>
            </Space>
          }
        >
          <Descriptions.Item label="班级名称">{classInfo.name}</Descriptions.Item>
          <Descriptions.Item label="班级ID">{classInfo.id}</Descriptions.Item>
          <Descriptions.Item label="班级类型">{classInfo.categoryName}</Descriptions.Item>
          <Descriptions.Item label="班主任">{classInfo.teacher}</Descriptions.Item>
          <Descriptions.Item label="学员人数">{classInfo.studentCount}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(classInfo.status)}>{getStatusText(classInfo.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="开始日期">{classInfo.startDate}</Descriptions.Item>
          <Descriptions.Item label="结束日期">{classInfo.endDate}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{classInfo.createdAt}</Descriptions.Item>
          <Descriptions.Item
            label="班级描述"
            span={3}
          >
            {classInfo.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 渲染学员列表
  const renderStudentList = () => {
    return (
      <Card
        variant="borderless"
        title="班级学员"
        extra={
          <Space>
            <Button type="primary">添加学员</Button>
            <Button>导入学员</Button>
          </Space>
        }
      >
        <Table
          columns={studentColumns}
          dataSource={studentList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
        />
      </Card>
    );
  };

  // 渲染课程列表
  const renderCourseList = () => {
    return (
      <Card
        variant="borderless"
        extra={<Button type="primary">添加课程</Button>}
        title="班级课程"
      >
        <Table
          columns={courseColumns}
          dataSource={courseList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>
    );
  };

  // 渲染通知公告
  const renderAnnouncements = () => {
    return (
      <Card
        variant="borderless"
        extra={<Button type="primary">发布通知</Button>}
        title="通知公告"
      >
        <List
          dataSource={announceList}
          itemLayout="horizontal"
          loading={loading}
          renderItem={item => (
            <List.Item
              actions={[
                <Button
                  key="list-edit"
                  type="link"
                >
                  编辑
                </Button>,
                <Button
                  danger
                  key="list-delete"
                  type="link"
                >
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<UserAvatar userId={item.id} size={40} />}
                description={
                  <div>
                    <div>{item.content}</div>
                    <div className="mt-2 text-gray-400">发布时间：{item.publishDate}</div>
                  </div>
                }
                title={
                  <Space>
                    <span>{item.title}</span>
                    <Tag color={getImportanceColor(item.importance)}>{getImportanceText(item.importance)}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  if (!classInfo && !loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-xl">未找到班级信息</h2>
          <Button
            type="primary"
            onClick={handleBack}
          >
            返回班级列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 dark:bg-[#141414]">
      {renderBasicInfo()}
      <Tabs
        defaultActiveKey="students"
        items={[
          {
            children: renderStudentList(),
            key: 'students',
            label: '班级学员'
          },
          {
            children: renderCourseList(),
            key: 'courses',
            label: '课程安排'
          },
          {
            children: renderAnnouncements(),
            key: 'announcements',
            label: '通知公告'
          }
        ]}
      />
    </div>
  );
};

export default ClassDetail;
