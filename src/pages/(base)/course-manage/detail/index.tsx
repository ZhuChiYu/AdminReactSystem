import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Space, Spin, Tag, Typography, message, theme } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { attachmentService, courseService } from '@/service/api';
import type { CourseApi } from '@/service/api/types';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseApi.CourseListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const { token } = theme.useToken();

  const fetchCourseDetail = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchAttachmentCount = useCallback(async () => {
    if (!courseId) {
      return;
    }
    try {
      const response = await attachmentService.getCourseAttachmentStats(Number.parseInt(courseId, 10));
      setAttachmentCount(response?.totalCount || 0);
    } catch (error) {
      // 获取附件数量失败
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetail();
    if (courseId) {
      fetchAttachmentCount();
    }
  }, [fetchCourseDetail, fetchAttachmentCount, courseId]);

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
          <Descriptions.Item label="课程分类">
            <Tag color="blue">{course.category?.name}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="课程价格">
            <Typography.Text style={{ color: token.colorPrimary, fontSize: '16px', fontWeight: 'bold' }}>
              ¥{course.price}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="开课日期">{dayjs(course.startDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={course.status === 1 ? 'success' : 'default'}>{course.status === 1 ? '已上线' : '未上线'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="附件数量">
            <Tag color="purple">{attachmentCount} 个文件</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(course.createdAt || course.createTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
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
