import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { courseService } from '@/service/api';
import {
  type ClassCategory,
  type ClassListItem,
  type ClassQueryParams,
  type CreateClassParams,
  classService
} from '@/service/api/class';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { getCurrentUserId, isSuperAdmin } from '@/utils/auth';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

/** 班级状态枚举 */
enum ClassStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2
}

/** 班级列表组件 */
const ClassList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filteredList, setFilteredList] = useState<ClassListItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0
  });

  // 班级分类数据状态
  const [classCategories, setClassCategories] = useState<ClassCategory[]>([]);

  // 筛选条件
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<number | ''>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // 添加班级相关状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  const { hasPermission } = usePermissionStore();
  const currentUserId = getCurrentUserId();
  const isUserSuperAdmin = isSuperAdmin();

  // 获取可选课程列表
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // 获取班级分类数据
  const fetchClassCategories = async () => {
    try {
      const categories = await classService.getClassCategories();
      setClassCategories(categories || []);
    } catch (error) {
      console.error('获取班级分类失败:', error);
      setClassCategories([]);
    }
  };

  // 获取课程列表数据
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getCourseList({
          current: 1,
          size: 1000 // 获取所有课程用于选择
        });
        setAvailableCourses(response.records || []);
      } catch (error) {
        console.error('获取课程列表失败:', error);
        setAvailableCourses([]);
      }
    };

    fetchCourses();
    fetchClassCategories(); // 同时获取班级分类数据
  }, []);

  // 加载班级列表数据
  const loadClassList = async (params: ClassQueryParams = {}) => {
    try {
      setLoading(true);
      const response = await classService.getClassList({
        current: pagination.current,
        size: pagination.size,
        ...params
      });

      setFilteredList(response.records || []);
      setPagination({
        current: response.current || 1,
        size: response.size || 10,
        total: response.total || 0
      });
    } catch (error) {
      console.error('获取班级列表失败:', error);
      message.error('获取班级列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadClassList();
  }, []);

  // 应用筛选
  const applyFilters = () => {
    const params: ClassQueryParams = {
      current: 1,
      size: pagination.size
    };

    if (searchName) {
      params.name = searchName;
    }

    if (selectedCategory !== '') {
      params.categoryId = Number(selectedCategory);
    }

    if (selectedStatus !== '') {
      params.status = Number(selectedStatus);
    }

    loadClassList(params);
  };

  // 监听筛选条件变化时应用筛选
  useEffect(() => {
    applyFilters();
  }, [searchName, selectedCategory, selectedStatus]);

  // 重置筛选
  const resetFilters = () => {
    setSearchName('');
    setSelectedCategory('');
    setSelectedStatus('');
    setDateRange(null);
    loadClassList({ current: 1, size: pagination.size });
  };

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

  // 分类选项 - 从API获取的数据
  const categoryOptions = [
    { label: '全部类型', value: '' },
    ...classCategories.map(category => ({
      label: category.name,
      value: category.id
    }))
  ];

  // 状态选项
  const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '未开始', value: ClassStatus.NOT_STARTED },
    { label: '进行中', value: ClassStatus.IN_PROGRESS },
    { label: '已结束', value: ClassStatus.COMPLETED }
  ];

  // 查看班级详情
  const handleViewDetail = (classId: number) => {
    navigate(`/class-manage/detail/${classId}`);
    console.log('跳转到详情页，URL:', `/class-manage/detail/${classId}`);
  };

  // 编辑班级
  const handleEdit = async (classId: number) => {
    try {
      // 从API获取班级详情
      const classDetail = await classService.getClassDetail(classId);

      // 打开编辑模态框并填充表单
      form.setFieldsValue({
        categoryId: classDetail.categoryId,
        description: classDetail.description,
        endDate: dayjs(classDetail.endDate),
        name: classDetail.name,
        startDate: dayjs(classDetail.startDate)
      });

      // 设置编辑模式并保存当前编辑的班级ID
      setEditingClassId(classId);
      setIsModalOpen(true);
      console.log('编辑班级:', classId);
    } catch (error) {
      console.error('获取班级详情失败:', error);
      message.error('获取班级详情失败');
    }
  };

  // 删除班级
  const handleDelete = async (classId: number) => {
    Modal.confirm({
      content: '确定要删除该班级吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await classService.deleteClass(classId);
          message.success('班级删除成功');
          // 重新加载数据
          loadClassList({
            current: pagination.current,
            size: pagination.size
          });
        } catch (error) {
          console.error('删除班级失败:', error);
          message.error('删除班级失败');
        }
      },
      title: '确认删除'
    });
  };

  // 提交添加班级表单
  const handleAddClass = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const classData: CreateClassParams = {
        categoryId: values.categoryId,
        courseId: values.courseId,
        description: values.description,
        endDate: values.endDate.format('YYYY-MM-DD'),
        name: values.name,
        startDate: values.startDate.format('YYYY-MM-DD')
      };

      if (editingClassId !== null) {
        // 编辑模式
        await classService.updateClass(editingClassId, classData);
        message.success('班级更新成功');
      } else {
        // 添加模式
        await classService.createClass(classData);
        message.success('班级创建成功');
      }

      // 重新加载数据
      loadClassList({
        current: pagination.current,
        size: pagination.size
      });

      // 重置状态和关闭模态框
      setIsModalOpen(false);
      setSubmitting(false);
      setEditingClassId(null);
      form.resetFields();
    } catch (error) {
      console.error('保存班级失败:', error);
      message.error('保存班级失败');
      setSubmitting(false);
    }
  };

  // 打开添加班级模态框
  const showAddModal = () => {
    form.resetFields();
    setEditingClassId(null);
    setIsModalOpen(true);
  };

  // 关闭添加班级模态框
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingClassId(null);
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: 'ID',
      width: 50
    },
    {
      dataIndex: 'name',
      key: 'name',
      ...getCenterColumnConfig(),
      title: '班级名称',
      width: 180
    },
    {
      dataIndex: 'categoryName',
      key: 'categoryName',
      ...getCenterColumnConfig(),
      title: '班级类型',
      width: 150
    },
    {
      dataIndex: 'courseName',
      key: 'courseName',
      ...getCenterColumnConfig(),
      render: (courseName: string) => courseName || '暂无',
      title: '培训课程',
      width: 180
    },
    {
      key: 'trainingFee',
      ...getCenterColumnConfig(),
      render: (_: unknown, record: any) => {
        const fee = Number(record.trainingFee || 0);
        return `¥${fee.toFixed(2)}`;
      },
      title: '培训费',
      width: 150
    },
    {
      dataIndex: 'studentCount',
      key: 'studentCount',
      ...getCenterColumnConfig(),
      title: '学员人数',
      width: 100
    },
    {
      dataIndex: 'startDate',
      key: 'startDate',
      ...getCenterColumnConfig(),
      title: '开始日期',
      width: 120
    },
    {
      dataIndex: 'endDate',
      key: 'endDate',
      ...getCenterColumnConfig(),
      title: '结束日期',
      width: 120
    },
    {
      dataIndex: 'status',
      key: 'status',
      ...getCenterColumnConfig(),
      render: (status: ClassStatus) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      ...getCenterColumnConfig(),
      title: '创建时间',
      width: 180
    },
    {
      key: 'action',
      ...getActionColumnConfig(200),
      render: (_: unknown, record: any) => {
        // 权限判断：超级管理员或有EDIT_CLASS权限才显示编辑按钮
        const canEdit =
          isUserSuperAdmin || hasPermission(currentUserId, PermissionType.EDIT_CLASS, undefined, record.id);
        return (
          <Space size="middle">
            <Button
              size="small"
              type="link"
              onClick={() => handleViewDetail(record.id)}
            >
              查看
            </Button>
            {canEdit && (
              <Button
                size="small"
                type="link"
                onClick={() => handleEdit(record.id)}
              >
                编辑
              </Button>
            )}
            {isUserSuperAdmin && (
              <Button
                danger
                size="small"
                type="link"
                onClick={() => handleDelete(record.id)}
              >
                删除
              </Button>
            )}
          </Space>
        );
      },
      title: '操作'
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        title="班级列表"
        variant="borderless"
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="班级名称"
            style={{ width: 200 }}
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
          <Select
            allowClear
            options={categoryOptions}
            placeholder="班级类型"
            style={{ width: 200 }}
            value={selectedCategory}
            onChange={value => setSelectedCategory(value)}
          />
          <Select
            allowClear
            options={statusOptions}
            placeholder="班级状态"
            style={{ width: 200 }}
            value={selectedStatus}
            onChange={value => setSelectedStatus(value)}
          />
          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: 300 }}
            value={dateRange}
            onChange={dates => setDateRange(dates)}
          />
          <Button onClick={resetFilters}>重置</Button>
          <Button
            type="primary"
            onClick={showAddModal}
          >
            新增班级
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredList}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
        />

        <Modal
          confirmLoading={submitting}
          open={isModalOpen}
          title={editingClassId !== null ? '编辑班级' : '新增班级'}
          onCancel={handleCancel}
          onOk={handleAddClass}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            style={{ marginTop: 20 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="班级名称"
              name="name"
              rules={[{ message: '请输入班级名称', required: true }]}
            >
              <Input placeholder="请输入班级名称" />
            </Form.Item>
            <Form.Item
              label="班级类型"
              name="categoryId"
              rules={[{ message: '请选择班级类型', required: true }]}
            >
              <Select
                options={categoryOptions.filter(item => item.value !== '')}
                placeholder="请选择班级类型"
              />
            </Form.Item>
            <Form.Item
              label="培训课程"
              name="courseId"
            >
              <Select
                allowClear
                placeholder="请选择培训课程（可选）"
                options={availableCourses.map(course => ({
                  label: `${course.courseName} (¥${course.price})`,
                  value: course.id
                }))}
              />
            </Form.Item>
            <Form.Item
              label="开始日期"
              name="startDate"
              rules={[{ message: '请选择开始日期', required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              label="结束日期"
              name="endDate"
              rules={[{ message: '请选择结束日期', required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              label="班级描述"
              name="description"
            >
              <Input.TextArea
                placeholder="请输入班级描述"
                rows={4}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default ClassList;
