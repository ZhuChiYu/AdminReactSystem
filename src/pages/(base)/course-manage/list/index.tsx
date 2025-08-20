import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { attachmentService, courseService } from '@/service/api';
import type { CourseApi } from '@/service/api/types';
import { getCurrentUserId, getCurrentUserInfo, isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { RangePicker } = DatePicker;

interface CourseItem {
  attachment: string;
  attachmentCount: number;
  category: string;
  courseCode: string;
  createdAt: string;
  date: string;
  endDate: string;
  id: number;
  name: string;
  price: number;
  startDate: string;
  status: string;
  updatedAt: string;
}

const CourseList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courseList, setCourseList] = useState<CourseItem[]>([]);
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [categories, setCategories] = useState<CourseApi.CourseCategory[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseItem | null>(null);

  // 添加课程相关状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 添加编辑课程相关状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [currentCourse, setCurrentCourse] = useState<CourseItem | null>(null);

  // 权限状态
  const [canCreateCourse, setCanCreateCourse] = useState(false);
  const currentUserId = getCurrentUserId();

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 获取用户权限
  const fetchUserPermissions = async () => {
    // 临时解决方案：直接检查用户角色
    const userInfo = getCurrentUserInfo();

    if (!userInfo) {
      setCanCreateCourse(false);
      return;
    }

    // 检查用户是否有人力BP角色
    const hasHrBpRole = userInfo.roles.some(role => role === 'hr_bp' || role === '人力bp' || role === '人力BP');

    // 临时设置：如果是人力BP角色，则有新增课程权限
    setCanCreateCourse(hasHrBpRole);
  };

  // 获取课程列表
  const fetchCourseList = async (page = pagination.current, size = pagination.pageSize) => {
    setLoading(true);
    try {
      // 构建筛选参数
      const params: any = {
        current: page,
        size
      };

      // 添加筛选条件
      if (searchName) {
        params.courseName = searchName;
      }

      if (selectedCategory) {
        const categoryId = categories.find(cat => cat.name === selectedCategory)?.id;
        if (categoryId) {
          params.categoryId = categoryId;
        }
      }

      // 添加日期范围筛选
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await courseService.getCourseList(params);

      // 更新分页信息
      setPagination(prev => ({
        ...prev,
        current: response.current || page,
        total: response.total || 0
      }));

      // 先转换基本的课程数据
      const basicCourses: CourseItem[] = response.records.map((course: CourseApi.CourseListItem) => ({
        attachment: '获取中...',
        attachmentCount: 0,
        category: course.category.name,
        courseCode: course.courseCode,
        createdAt: course.createTime || course.createdAt || new Date().toISOString(),
        date: course.startDate || course.createdAt || new Date().toISOString(),
        endDate: course.endDate || '',
        id: course.id,
        name: course.courseName,
        price: typeof course.price === 'string' ? Number.parseFloat(course.price) : course.price,
        startDate: course.startDate || '',
        status: course.status === 1 ? '已上线' : '未上线',
        updatedAt: course.updatedAt || course.createTime || course.createdAt || new Date().toISOString()
      }));

      // 按修改时间降序排序
      const sortedCourses = basicCourses.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );

      // 先设置基本数据，让用户看到列表
      setCourseList(sortedCourses);

      // 批量获取附件数量（并发限制为5个）
      const batchSize = 5;
      const updatedCourses = [...basicCourses];

      for (let i = 0; i < basicCourses.length; i += batchSize) {
        const batch = basicCourses.slice(i, i + batchSize);

        const batchPromises = batch.map(async (course, index) => {
          try {
            const stats = await attachmentService.getCourseAttachmentStats(course.id);
            const actualIndex = i + index;
            updatedCourses[actualIndex] = {
              ...course,
              attachment: (stats?.totalCount || 0) > 0 ? '有附件' : '无附件',
              attachmentCount: stats?.totalCount || 0
            };
          } catch (error) {
            console.warn(`获取课程 ${course.id} 附件统计失败:`, error);
            const actualIndex = i + index;
            updatedCourses[actualIndex] = {
              ...course,
              attachment: '获取失败',
              attachmentCount: 0
            };
          }
        });

        await Promise.all(batchPromises);

                // 每完成一批就更新界面，并保持排序
        const sortedUpdatedCourses = [...updatedCourses].sort((a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        setCourseList(sortedUpdatedCourses);
      }
    } catch (error) {
      message.error('获取课程列表失败');
      console.error('获取课程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取课程分类
  const fetchCategories = async () => {
    try {
      const categoriesData = await courseService.getCourseCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('获取课程分类失败:', error);
    }
  };

  useEffect(() => {
    fetchCourseList();
    fetchCategories();
    fetchUserPermissions(); // 获取用户权限
  }, [currentUserId]);

  // 应用筛选
  const applyFilters = () => {
    // 重置到第一页并重新获取数据
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCourseList(1, pagination.pageSize);
  };

  // 重置筛选
  const resetFilters = () => {
    setSearchName('');
    setSelectedCategory('');
    setDateRange(null);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCourseList(1, pagination.pageSize);
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    if (status === '已上线') return 'success';
    if (status === '未发布') return 'default';
    return 'error';
  };

  // 分类选项（不包含"全部分类"项）
  const categoryOptionsForForm = (categories || []).map(category => ({
    label: category.name,
    value: category.name
  }));

  // 打开添加课程模态框
  const showAddModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  // 关闭添加课程模态框
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 打开编辑课程模态框
  const showEditModal = (course: CourseItem) => {
    setCurrentCourse(course);
    editForm.setFieldsValue({
      category: course.category,
      date: dayjs(course.startDate || course.date),
      name: course.name,
      price: course.price
    });
    setEditModalOpen(true);
  };

  // 关闭编辑课程模态框
  const handleEditCancel = () => {
    setEditModalOpen(false);
  };

  // 提交添加课程表单
  const handleAddCourse = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 准备API请求数据
      const courseData = {
        // 生成唯一课程编码
        categoryId: categories.find(cat => cat.name === values.category)?.id || 1,
        courseCode: `COURSE_${Date.now()}`,
        courseName: values.name,
        // 默认讲师
        description: `${values.name}课程`,
        duration: 30,
        endDate: values.date.add(30, 'day').format('YYYY-MM-DD'),
        instructor: '',
        // 默认30天后结束
        location: '线上课程',
        maxStudents: 50,
        originalPrice: values.price,
        // 默认30天
        price: values.price, // 默认最大学员数
        startDate: values.date.format('YYYY-MM-DD'),
        tags: []
      };

      // 调用真实的API
      await courseService.createCourse(courseData);

      message.success(`课程"${values.name}"已成功添加`);
      setIsModalOpen(false);
      form.resetFields();
      fetchCourseList(); // 重新获取列表
    } catch (error) {
      console.error('创建课程失败:', error);
      message.error('创建课程失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 提交编辑课程表单
  const handleEditCourse = async () => {
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);

      if (!currentCourse) {
        message.error('未找到要编辑的课程');
        setSubmitting(false);
        return;
      }

      // 准备API请求数据
      const startDate = values.date.format('YYYY-MM-DD');
      const courseData = {
        categoryId: Number(categories.find(cat => cat.name === values.category)?.id || 1),
        courseName: values.name,
        endDate: values.date.clone().add(30, 'days').format('YYYY-MM-DD'),
        price: Number(values.price),
        startDate,
        status: 1 // 默认状态为已上线
      };

      try {
        await courseService.updateCourse(currentCourse.id, courseData);
        message.success(`课程"${values.name}"已成功更新`);

        // 关闭模态框并重置状态
        setEditModalOpen(false);
        setCurrentCourse(null);

        // 重新获取课程列表
        fetchCourseList();
      } catch (error) {
        console.error('更新课程失败:', error);
        message.error('更新课程失败，请重试');
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      setSubmitting(false);
    }
  };

  // 删除课程
  const handleDelete = async (record: any) => {
    try {
      await courseService.deleteCourse(record.id);
      message.success('删除成功');
      fetchCourseList(); // 重新获取数据
    } catch (error) {
      console.error('删除课程失败:', error);
      message.error('删除失败');
    }
  };

  // 显示删除确认
  const showDeleteConfirm = (course: CourseItem) => {
    setCourseToDelete(course);
    setDeleteModalVisible(true);
  };

  // 导航到课程详情页
  const goToDetail = (courseId: number) => {
    navigate(`/course-manage/detail/${courseId}`);
  };

  // 导航到课程附件页
  const goToAttachments = (courseId: number) => {
    navigate(`/course-manage/attachments/${courseId}`);
  };

  // 表格列配置
  const columns = [
    {
      dataIndex: 'name',
      key: 'name',
      title: '课程名称',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'category',
      key: 'category',
      title: '分类',
      ...getCenterColumnConfig(),
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      dataIndex: 'price',
      key: 'price',
      title: '价格',
      ...getCenterColumnConfig(),
      render: (price: number) => `¥${price}`
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      dataIndex: 'attachmentCount',
      key: 'attachmentCount',
      title: '附件数量',
      ...getCenterColumnConfig(),
      render: (count: number) => <Tag color={count > 0 ? 'green' : 'gray'}>{count || 0} 个</Tag>
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      title: '修改时间',
      ...getCenterColumnConfig(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(300),
      render: (_: any, record: CourseItem) => (
        <Space>
          <Button
            size="small"
            onClick={() => goToDetail(record.id)}
          >
            查看详情
          </Button>
          <Button
            size="small"
            onClick={() => goToAttachments(record.id)}
          >
            附件管理
          </Button>
          {isSuperAdmin() && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => showEditModal(record)}
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                onClick={() => showDeleteConfirm(record)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-4">
      <Card title="课程管理">
        {/* 搜索筛选区域 */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <Input
              allowClear
              placeholder="搜索课程名称"
              style={{ width: 200 }}
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
            <Select
              allowClear
              placeholder="选择分类"
              style={{ width: 150 }}
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              {(categories || []).map(category => (
                <Select.Option
                  key={category.id}
                  value={category.name}
                >
                  {category.name}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={dateRange}
              onChange={dates => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              icon={<SearchOutlined />}
              type="primary"
              onClick={applyFilters}
            >
              搜索
            </Button>
            <Button onClick={resetFilters}>重置</Button>
            {(canCreateCourse || isSuperAdmin()) && (
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={showAddModal}
              >
                新增课程
              </Button>
            )}
          </div>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={courseList}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (page, size) => {
              if (size !== pagination.pageSize) {
                setPagination(prev => ({ ...prev, pageSize: size }));
                fetchCourseList(1, size);
              } else {
                fetchCourseList(page, size);
              }
            }
          }}
          rowKey="id"
          rowSelection={{
            onChange: setSelectedRowKeys,
            selectedRowKeys
          }}
        />

        {/* 删除确认对话框 */}
        <Modal
          cancelText="取消"
          okText="确认"
          open={deleteModalVisible}
          title="确认删除"
          onCancel={() => setDeleteModalVisible(false)}
          onOk={() => courseToDelete && handleDelete(courseToDelete)}
        >
          <p>确定要删除课程 &ldquo;{courseToDelete?.name}&rdquo; 吗？此操作不可撤销。</p>
        </Modal>
      </Card>

      {/* 添加课程模态框 */}
      <Modal
        open={isModalOpen}
        title="添加课程"
        footer={[
          <Button
            key="back"
            onClick={handleCancel}
          >
            取消
          </Button>,
          <Button
            key="submit"
            loading={submitting}
            type="primary"
            onClick={handleAddCourse}
          >
            添加
          </Button>
        ]}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
          name="add_course_form"
        >
          <Form.Item
            label="课程名称"
            name="name"
            rules={[{ message: '请输入课程名称', required: true }]}
          >
            <Input placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item
            label="课程分类"
            name="category"
            rules={[{ message: '请选择课程分类', required: true }]}
          >
            <Select
              options={categoryOptionsForForm}
              placeholder="请选择分类"
            />
          </Form.Item>

          <Form.Item
            label="课程价格"
            name="price"
            rules={[{ message: '请输入课程价格', required: true }]}
          >
            <InputNumber
              addonBefore="¥"
              min={0}
              placeholder="请输入价格"
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="开课日期"
            name="date"
            rules={[{ message: '请选择开课日期', required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑课程模态框 */}
      <Modal
        open={editModalOpen}
        title="编辑课程"
        footer={[
          <Button
            key="back"
            onClick={handleEditCancel}
          >
            取消
          </Button>,
          <Button
            key="submit"
            loading={submitting}
            type="primary"
            onClick={handleEditCourse}
          >
            保存
          </Button>
        ]}
        onCancel={handleEditCancel}
      >
        <Form
          form={editForm}
          layout="vertical"
          name="edit_course_form"
        >
          <Form.Item
            label="课程名称"
            name="name"
            rules={[{ message: '请输入课程名称', required: true }]}
          >
            <Input placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item
            label="课程分类"
            name="category"
            rules={[{ message: '请选择课程分类', required: true }]}
          >
            <Select
              options={categoryOptionsForForm}
              placeholder="请选择分类"
            />
          </Form.Item>

          <Form.Item
            label="课程价格"
            name="price"
            rules={[{ message: '请输入课程价格', required: true }]}
          >
            <InputNumber
              addonBefore="¥"
              min={0}
              placeholder="请输入价格"
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="开课日期"
            name="date"
            rules={[{ message: '请选择开课日期', required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseList;
