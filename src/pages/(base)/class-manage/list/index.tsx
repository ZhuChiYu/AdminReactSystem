import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [classList, setClassList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);

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

  // 模拟数据加载
  useEffect(() => {
    setLoading(true);

    // 检查是否有缓存的班级列表数据
    const storedClasses = localStorage.getItem('classList');
    console.log('从 localStorage 获取的班级列表数据：', storedClasses);

    if (storedClasses) {
      try {
        const classes = JSON.parse(storedClasses);
        console.log('解析后的班级列表数据：', classes);
        setClassList(classes);
        setFilteredList(classes);
        setLoading(false);
        return;
      } catch (error) {
        console.error('解析班级列表数据失败', error);
      }
    }

    // 如果没有缓存数据，则加载模拟数据
    // 模拟API请求
    setTimeout(() => {
      const mockData = [
        {
          categoryId: ClassCategory.TECHNICAL,
          categoryName: '技术培训',
          createdAt: '2024-02-15 14:30:00',
          description: '2024年春季常规课程',
          endDate: '2024-06-30',
          id: 1,
          name: '2024春季班',
          startDate: '2024-03-01',
          status: ClassStatus.IN_PROGRESS,
          studentCount: 30,
          teacher: '张老师'
        },
        {
          categoryId: ClassCategory.MANAGEMENT,
          categoryName: '管理课程',
          createdAt: '2024-03-15 10:20:00',
          description: '2024年夏季管理课程',
          endDate: '2024-08-31',
          id: 2,
          name: '2024夏季班',
          startDate: '2024-07-01',
          status: ClassStatus.NOT_STARTED,
          studentCount: 25,
          teacher: '李老师'
        },
        {
          categoryId: ClassCategory.TRAINING,
          categoryName: '营销课程',
          createdAt: '2023-08-10 09:15:00',
          description: '2023年秋季营销培训',
          endDate: '2023-12-31',
          id: 3,
          name: '2023秋季班',
          startDate: '2023-09-01',
          status: ClassStatus.COMPLETED,
          studentCount: 28,
          teacher: '王老师'
        }
      ];
      console.log('加载的模拟数据：', mockData);
      setClassList(mockData);
      setFilteredList(mockData);

      // 保存到localStorage
      localStorage.setItem('classList', JSON.stringify(mockData));
      console.log('成功保存数据到 localStorage');

      setLoading(false);
    }, 500);
  }, []);

  // 应用筛选
  const applyFilters = () => {
    let result = [...classList];

    // 按班级名称筛选
    if (searchName) {
      result = result.filter(classItem => classItem.name.toLowerCase().includes(searchName.toLowerCase()));
    }

    // 按分类筛选
    if (selectedCategory !== '') {
      result = result.filter(classItem => classItem.categoryId === selectedCategory);
    }

    // 按状态筛选
    if (selectedStatus !== '') {
      result = result.filter(classItem => classItem.status === selectedStatus);
    }

    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      result = result.filter(classItem => {
        return classItem.startDate >= startDate && classItem.startDate <= endDate;
      });
    }

    setFilteredList(result);
  };

  // 监听筛选条件变化时应用筛选
  useEffect(() => {
    applyFilters();
  }, [searchName, selectedCategory, selectedStatus, dateRange, classList]);

  // 重置筛选
  const resetFilters = () => {
    setSearchName('');
    setSelectedCategory('');
    setSelectedStatus('');
    setDateRange(null);
    setFilteredList(classList);
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
  const handleEdit = (classId: number) => {
    // 查找要编辑的班级
    const classToEdit = classList.find(c => c.id === classId);
    if (!classToEdit) return;

    // 打开编辑模态框并填充表单
    form.setFieldsValue({
      categoryId: classToEdit.categoryId,
      description: classToEdit.description,
      endDate: dayjs(classToEdit.endDate),
      name: classToEdit.name,
      startDate: dayjs(classToEdit.startDate),
      studentCount: classToEdit.studentCount
    });

    // 设置编辑模式并保存当前编辑的班级ID
    setEditingClassId(classId);
    setIsModalOpen(true);
    console.log('编辑班级:', classId);
  };

  // 删除班级
  const handleDelete = (classId: number) => {
    Modal.confirm({
      content: '确定要删除该班级吗？此操作不可恢复。',
      onOk: () => {
        // 过滤掉要删除的班级
        const updatedClassList = classList.filter(c => c.id !== classId);

        // 更新状态和本地存储
        setClassList(updatedClassList);
        setFilteredList(updatedClassList);
        localStorage.setItem('classList', JSON.stringify(updatedClassList));

        // 显示成功消息
        Modal.success({
          content: '班级已成功删除',
          title: '删除成功'
        });
        console.log('删除班级:', classId);
      },
      title: '确认删除'
    });
  };

  // 提交添加班级表单
  const handleAddClass = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      setTimeout(() => {
        // 如果是编辑模式
        if (editingClassId !== null) {
          // 查找要编辑的班级
          const updatedClassList = classList.map(classItem => {
            if (classItem.id === editingClassId) {
              // 根据表单数据更新班级信息
              return {
                ...classItem,
                categoryId: values.categoryId,
                categoryName: categoryOptions.find(opt => opt.value === values.categoryId)?.label || '',
                description: values.description,
                endDate: values.endDate.format('YYYY-MM-DD'),
                name: values.name,
                startDate: values.startDate.format('YYYY-MM-DD'),
                status: dayjs(values.startDate).isAfter(dayjs())
                  ? ClassStatus.NOT_STARTED
                  : dayjs(values.endDate).isBefore(dayjs())
                    ? ClassStatus.COMPLETED
                    : ClassStatus.IN_PROGRESS,
                studentCount: values.studentCount
              };
            }
            return classItem;
          });

          // 更新状态和本地存储
          setClassList(updatedClassList);
          setFilteredList(updatedClassList);
          localStorage.setItem('classList', JSON.stringify(updatedClassList));

          // 显示成功消息
          Modal.success({
            content: '班级信息已成功更新',
            title: '更新成功'
          });
        } else {
          // 添加新班级
          const newClass = {
            categoryId: values.categoryId,
            categoryName: categoryOptions.find(opt => opt.value === values.categoryId)?.label || '',
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            description: values.description || '',
            endDate: values.endDate.format('YYYY-MM-DD'),
            id: classList.length + 1,
            name: values.name,
            startDate: values.startDate.format('YYYY-MM-DD'),
            status: dayjs(values.startDate).isAfter(dayjs())
              ? ClassStatus.NOT_STARTED
              : dayjs(values.endDate).isBefore(dayjs())
                ? ClassStatus.COMPLETED
                : ClassStatus.IN_PROGRESS,
            studentCount: values.studentCount
          };

          // 更新状态和本地存储
          const updatedClassList = [...classList, newClass];
          setClassList(updatedClassList);
          setFilteredList(updatedClassList);
          localStorage.setItem('classList', JSON.stringify(updatedClassList));

          // 显示成功消息
          Modal.success({
            content: '班级已成功添加',
            title: '添加成功'
          });
        }

        // 重置状态和关闭模态框
        setIsModalOpen(false);
        setSubmitting(false);
        setEditingClassId(null);
        form.resetFields();
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
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
      render: (_: unknown, record: any) => (
        <Space size="middle">
          <Button
            size="small"
            type="link"
            onClick={() => handleViewDetail(record.id)}
          >
            查看
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            type="link"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
      title: '操作',
      width: 200
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
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
            total: filteredList.length
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
