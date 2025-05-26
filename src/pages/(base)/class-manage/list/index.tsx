import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePermissionStore, { PermissionType } from '@/store/permissionStore';
import { getCurrentUserId, isSuperAdmin } from '@/utils/auth';
import { classService, type ClassApi } from '@/service/api';

/** 班级状态枚举 */
enum ClassStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2
}

/** 班级类型枚举 */
enum ClassCategory {
  TECHNICAL = 1,
  MANAGEMENT = 2,
  TRAINING = 3,
  OTHER = 4
}

/** 班级列表组件 */
const ClassList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classList, setClassList] = useState<ClassApi.ClassListItem[]>([]);
  const [filteredList, setFilteredList] = useState<ClassApi.ClassListItem[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0
  });

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

  // 获取课程列表数据
  useEffect(() => {
    const storedCourses = localStorage.getItem('courseList');
    if (storedCourses) {
      try {
        const courses = JSON.parse(storedCourses);
        setCourseList(courses);
      } catch (error) {
        console.error('解析课程列表数据失败', error);
        setCourseList([]);
      }
    }
  }, []);

  // 根据类别获取对应课程的价格
  const getCoursePrice = (categoryName: string) => {
    const course = courseList.find(c => c.category === categoryName);
    return course ? course.price : 0;
  };

  // 计算培训费用（课程价格 × 学员人数）
  const calculateTrainingFee = (categoryName: string, studentCount: number) => {
    const price = getCoursePrice(categoryName);
    return price * studentCount;
  };

  // 加载班级列表数据
  const loadClassList = async (params: ClassApi.ClassQueryParams = {}) => {
    try {
      setLoading(true);
      const response = await classService.getClassList({
        current: pagination.current,
        size: pagination.size,
        ...params
      });

      setClassList(response.records);
      setFilteredList(response.records);
      setPagination({
        current: response.current,
        size: response.size,
        total: response.total
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
    const params: ClassApi.ClassQueryParams = {
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

  // 处理分页变化
  const handleTableChange = (page: number, pageSize: number) => {
    const params: ClassApi.ClassQueryParams = {
      current: page,
      size: pageSize
    };

    if (searchName) params.name = searchName;
    if (selectedCategory !== '') params.categoryId = Number(selectedCategory);
    if (selectedStatus !== '') params.status = Number(selectedStatus);

    loadClassList(params);
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

  // 分类选项
  const categoryOptions = [
    { label: '全部类型', value: '' },
    { label: '技术培训', value: ClassCategory.TECHNICAL },
    { label: '管理课程', value: ClassCategory.MANAGEMENT },
    { label: '营销课程', value: ClassCategory.TRAINING },
    { label: '其他课程', value: ClassCategory.OTHER }
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
        name: classDetail.name,
        categoryId: classDetail.categoryId,
        teacher: classDetail.teacher,
        description: classDetail.description,
        startDate: dayjs(classDetail.startDate),
        endDate: dayjs(classDetail.endDate)
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

      const classData: ClassApi.CreateClassParams = {
        name: values.name,
        categoryId: values.categoryId,
        categoryName: categoryOptions.find(opt => opt.value === values.categoryId)?.label || '',
        teacher: values.teacher || '专业讲师',
        description: values.description,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD')
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
      title: 'ID',
      width: 50
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '班级名称',
      width: 180
    },
    {
      dataIndex: 'categoryName',
      key: 'categoryName',
      title: '班级类型',
      width: 150
    },
    {
      key: 'trainingFee',
      render: (_: unknown, record: any) => {
        const fee = calculateTrainingFee(record.categoryName, record.studentCount);
        return `¥${fee.toFixed(2)}`;
      },
      title: '培训费',
      width: 150
    },
    {
      dataIndex: 'studentCount',
      key: 'studentCount',
      title: '学员人数',
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
      render: (status: ClassStatus) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      title: '创建时间',
      width: 180
    },
    {
      fixed: 'right' as const,
      key: 'action',
      render: (_: unknown, record: any) => {
        // 权限判断：超级管理员或有EDIT_CLASS权限才显示编辑按钮
        const canEdit = isUserSuperAdmin || hasPermission(currentUserId, PermissionType.EDIT_CLASS, undefined, record.id);
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
      title: '操作',
      width: 200
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        variant="borderless"
        className="h-full"
        title="班级列表"
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
          scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条记录`,
            total: filteredList.length,
            current: pagination.current,
            pageSize: pagination.size,
            onChange: handleTableChange
          }}
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
              label="学员人数"
              name="studentCount"
              rules={[{ message: '请输入学员人数', required: true }]}
            >
              <Input
                placeholder="请输入学员人数"
                type="number"
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
