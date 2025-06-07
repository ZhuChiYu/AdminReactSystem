import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Space, Spin, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { courseService } from '@/service/api';
import type { CourseApi } from '@/service/api/types';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseApi.CourseListItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCourseDetail = async () => {
    if (!courseId) {
      message.error('课程ID无效');
      return;
    }

    setLoading(true);
    try {
      const response = await courseService.getCourseDetail(Number.parseInt(courseId, 10));
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="未找到课程信息" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Space
        className="mb-4"
        size="middle"
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/course-manage/list')}
        >
          返回
        </Button>
        <Typography.Title
          level={4}
          style={{ margin: 0 }}
        >
          课程详情
        </Typography.Title>
      </Space>

      <Card>
        <Descriptions
          column={{ lg: 2, md: 2, sm: 1, xl: 2, xs: 1, xxl: 2 }}
          title="基本信息"
        >
          <Descriptions.Item label="课程名称">{course.courseName}</Descriptions.Item>
          <Descriptions.Item label="课程分类">{course.category?.name}</Descriptions.Item>
          <Descriptions.Item label="课程价格">¥{course.price}</Descriptions.Item>
          <Descriptions.Item label="开课日期">{course.startDate}</Descriptions.Item>
        </Descriptions>
      </Card>

      {course.description && (
        <Card
          className="mt-4"
          title="课程描述"
        >
          <Typography.Paragraph>{course.description}</Typography.Paragraph>
        </Card>
      )}
    </div>
  );
};

export default CourseDetail;
