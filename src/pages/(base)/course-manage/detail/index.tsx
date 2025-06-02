import { ArrowLeftOutlined, EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Descriptions, Row, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { courseService } from '@/service/api';
import type { CourseApi } from '@/service/api/types';

const { Paragraph, Title } = Typography;

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { message } = App.useApp();
  const [course, setCourse] = useState<CourseApi.CourseListItem | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取课程详情
  const fetchCourseDetail = async () => {
    if (!courseId) {
      message.error('课程ID无效');
      return;
    }

    setLoading(true);
    try {
      console.log('开始获取课程详情，courseId:', courseId);
      const response = await courseService.getCourseDetail(Number.parseInt(courseId, 10));
      console.log('课程详情响应:', response);
      setCourse(response);
    } catch (error) {
      message.error('获取课程详情失败');
      console.error('获取课程详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetail();
  }, [courseId]);

  // 返回列表
  const handleBack = () => {
    navigate('/course-manage/list');
  };

  // 编辑课程
  const handleEdit = () => {
    message.info('编辑功能待实现');
  };

  // 管理附件
  const handleAttachments = () => {
    navigate(`/course-manage/attachments/${courseId}`);
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card loading={loading}>
          <div className="text-center text-gray-500">加载中...</div>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-4">
        <Card>
          <div className="text-center text-gray-500">
            <p>课程不存在或加载失败</p>
            <Button onClick={handleBack}>返回列表</Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'success';
      case 0:
        return 'warning';
      default:
        return 'error';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return '已上线';
      case 0:
        return '未上线';
      default:
        return '已下线';
    }
  };

  return (
    <div className="p-4">
      {/* 页面头部 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            返回列表
          </Button>
          <Title
            className="!mb-0"
            level={3}
          >
            {course.courseName}
          </Title>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            type="primary"
            onClick={handleEdit}
          >
            编辑课程
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={handleAttachments}
          >
            附件管理
          </Button>
        </div>
      </div>

      <Row gutter={24}>
        {/* 左侧：课程基本信息 */}
        <Col span={16}>
          <Card
            className="mb-4"
            title="课程信息"
          >
            <Descriptions
              bordered
              column={2}
            >
              <Descriptions.Item label="课程名称">{course.courseName}</Descriptions.Item>
              <Descriptions.Item label="课程编码">{course.courseCode}</Descriptions.Item>
              <Descriptions.Item label="课程分类">
                <Tag color="blue">{course.category?.name || '未分类'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="讲师">
                <span className="flex items-center gap-1">
                  <UserOutlined />
                  {course.instructor}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="课程价格">
                <span className="text-lg text-red-500 font-semibold">
                  ¥{typeof course.price === 'string' ? Number.parseFloat(course.price) : course.price}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="课程时长">{course.duration} 天</Descriptions.Item>
              <Descriptions.Item label="最大学员数">{course.maxStudents} 人</Descriptions.Item>
              <Descriptions.Item label="课程状态">
                <Tag color={getStatusColor(course.status)}>{getStatusText(course.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label="创建时间"
                span={2}
              >
                {dayjs(course.createTime || course.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 课程描述 */}
          {(course as any).description && (
            <Card title="课程描述">
              <Paragraph>{(course as any).description}</Paragraph>
            </Card>
          )}
        </Col>

        {/* 右侧：统计信息 */}
        <Col span={8}>
          <Card title="课程统计">
            <Row gutter={16}>
              <Col span={24}>
                <Statistic
                  suffix="人"
                  title="报名人数"
                  value={course.enrollmentCount || course.enrollCount || 0}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CourseDetail;
