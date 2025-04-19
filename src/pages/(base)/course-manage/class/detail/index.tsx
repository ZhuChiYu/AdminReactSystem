import { ArrowLeftOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Descriptions, List, Space, Table, Tabs, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

  useEffect(() => {
    // 模拟加载班级数据
    setLoading(true);

    // 尝试从localStorage获取班级列表数据
    const storedClasses = localStorage.getItem('classList');
    if (storedClasses) {
      try {
        const classes = JSON.parse(storedClasses);
        const currentClass = classes.find((c: any) => c.id === Number(classId));
        if (currentClass) {
          setClassInfo(currentClass);
        }
      } catch (error) {
        console.error('解析班级数据失败', error);
      }
    }

    // 加载模拟学员数据
    const mockStudents = [
      {
        attendance: 95.5,
        company: '阿里巴巴',
        email: 'zhangting@company.cn',
        gender: '女',
        id: 1,
        joinDate: '2024-03-01',
        name: '张婷',
        phone: '010-50778734',
        position: '测试工程师',
        studentId: '11490102359'
      },
      {
        attendance: 92.0,
        company: '理想科技',
        email: '曾建华@example.com',
        gender: '男',
        id: 2,
        joinDate: '2024-03-02',
        name: '曾建华',
        phone: '010-12609203',
        position: '后端开发',
        studentId: '15486679562'
      },
      {
        attendance: 88.5,
        company: '南京科技',
        email: '董军@company.cn',
        gender: '男',
        id: 3,
        joinDate: '2024-03-01',
        name: '董军',
        phone: '010-37843376',
        position: '前端开发',
        studentId: '14219252022'
      },
      {
        attendance: 96.0,
        company: '腾讯科技',
        email: 'yang格@example.com',
        gender: '女',
        id: 4,
        joinDate: '2024-03-05',
        name: '杨格',
        phone: '010-44109487',
        position: '技术主管',
        studentId: '18769613825'
      }
    ];
    setStudentList(mockStudents);

    // 加载模拟课程数据
    const mockCourses = [
      {
        classroom: '教室101',
        endDate: '2024-04-30',
        id: 1,
        name: '高等数学',
        schedule: '周一、周三 9:00-10:30',
        startDate: '2024-03-05',
        status: 1,
        teacher: '王老师'
      },
      {
        classroom: '教室102',
        endDate: '2024-04-30',
        id: 2,
        name: '大学物理',
        schedule: '周二、周四 14:00-15:30',
        startDate: '2024-03-05',
        status: 1,
        teacher: '李老师'
      }
    ];
    setCourseList(mockCourses);

    // 加载模拟通知公告数据
    const mockAnnouncements = [
      {
        content: '请同学们于3月1日上午9点到校报到',
        id: 1,
        importance: 2,
        publishDate: '2024-02-25 14:30:00',
        status: 1,
        title: '开学通知'
      },
      {
        content: '因教师请假，本周周三的高等数学课程调整到周五同一时间上课',
        id: 2,
        importance: 1,
        publishDate: '2024-03-10 09:15:00',
        status: 1,
        title: '课程调整通知'
      },
      {
        content: '期中考试将于4月20日上午9点开始，请各位同学提前做好准备',
        id: 3,
        importance: 2,
        publishDate: '2024-03-25 16:30:00',
        status: 1,
        title: '期中考试安排'
      }
    ];
    setAnnounceList(mockAnnouncements);

    setLoading(false);
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
          <Avatar src={`https://xsgames.co/randomusers/avatar.php?g=${Math.random()}`} />
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
        bordered={false}
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
        bordered={false}
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
        bordered={false}
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
        bordered={false}
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
