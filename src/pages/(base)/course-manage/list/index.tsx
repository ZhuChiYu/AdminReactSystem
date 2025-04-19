import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const CourseList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);

  // 筛选条件
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // 添加课程相关状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    setLoading(true);

    // 检查是否有缓存的课程列表数据
    const storedCourses = localStorage.getItem('courseList');
    if (storedCourses) {
      try {
        const courses = JSON.parse(storedCourses);
        setCourseList(courses);
        setFilteredList(courses);
        setLoading(false);
        return;
      } catch (error) {
        console.error('解析课程列表数据失败', error);
      }
    }

    // 如果没有缓存数据，则加载模拟数据
    // 模拟API请求
    setTimeout(() => {
      const mockData = [
        {
          attachment: '无附件',
          attachmentCount: 0,
          category: '技术培训',
          createdAt: '2025-04-13 08:50:17',
          date: '2025-05-13',
          id: 1,
          name: '企业人才培训管理',
          price: 19999.0,
          status: '已上线'
        },
        {
          attachment: '无附件',
          attachmentCount: 0,
          category: '技术培训',
          createdAt: '2025-04-12 22:32:55',
          date: '2024-06-10',
          id: 2,
          name: 'Python数据分析',
          price: 3999.0,
          status: '已上线'
        },
        {
          attachment: '无附件',
          attachmentCount: 0,
          category: '管理课程',
          createdAt: '2025-04-12 22:32:55',
          date: '2024-05-20',
          id: 3,
          name: '高级项目管理',
          price: 5999.0,
          status: '已上线'
        },
        {
          attachment: '无附件',
          attachmentCount: 0,
          category: '营销课程',
          createdAt: '2025-04-12 22:32:55',
          date: '2024-07-15',
          id: 4,
          name: '数字营销策略',
          price: 4999.0,
          status: '已上线'
        },
        {
          attachment: '无附件',
          attachmentCount: 0,
          category: '财务课程',
          createdAt: '2025-04-12 22:32:55',
          date: '2024-08-10',
          id: 5,
          name: '财务分析与决策',
          price: 6999.0,
          status: '已上线'
        },
        {
          attachment: '无附件',
          attachmentCount: 0,
          category: '人力资源',
          createdAt: '2025-04-12 22:32:55',
          date: '2024-09-05',
          id: 6,
          name: '人才招聘与培养',
          price: 5499.0,
          status: '已上线'
        }
      ];
      setCourseList(mockData);
      setFilteredList(mockData);

      // 保存到localStorage
      localStorage.setItem('courseList', JSON.stringify(mockData));

      setLoading(false);
    }, 500);
  }, []);

  // 应用筛选
  const applyFilters = () => {
    let result = [...courseList];

    // 按课程名称筛选
    if (searchName) {
      result = result.filter(course => course.name.toLowerCase().includes(searchName.toLowerCase()));
    }

    // 按分类筛选
    if (selectedCategory) {
      result = result.filter(course => course.category === selectedCategory);
    }

    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      result = result.filter(course => {
        return course.date >= startDate && course.date <= endDate;
      });
    }

    setFilteredList(result);
  };

  // 监听筛选条件变化时应用筛选
  useEffect(() => {
    applyFilters();
  }, [searchName, selectedCategory, dateRange]);

  // 重置筛选
  const resetFilters = () => {
    setSearchName('');
    setSelectedCategory('');
    setDateRange(null);
    setFilteredList(courseList);
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    if (status === '已上线') return 'success';
    if (status === '未发布') return 'default';
    return 'error';
  };

  // 提取所有分类作为选项
  const categoryOptions = [
    { label: '全部分类', value: '' },
    ...Array.from(new Set(courseList.map(course => course.category))).map(category => ({
      label: category,
      value: category
    }))
  ];

  // 分类选项（不包含"全部分类"项）
  const categoryOptionsForForm = Array.from(new Set(courseList.map(course => course.category))).map(category => ({
    label: category,
    value: category
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

  // 跳转到附件管理页面
  const handleAttachment = (courseId: number) => {
    navigate(`/course-manage/attachments/${courseId}`);
  };

  // 提交添加课程表单
  const handleAddCourse = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 模拟API请求延迟
      setTimeout(() => {
        // 生成新课程对象
        const newCourse = {
          attachment: '无附件',
          attachmentCount: 0,
          category: values.category,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          date: values.date.format('YYYY-MM-DD'),
          id: courseList.length + 1,
          name: values.name,
          price: values.price,
          status: '已上线'
        };

        // 更新课程列表
        const updatedCourseList = [...courseList, newCourse];
        setCourseList(updatedCourseList);
        setFilteredList(updatedCourseList);

        // 更新本地存储
        localStorage.setItem('courseList', JSON.stringify(updatedCourseList));

        // 关闭模态框并重置状态
        setIsModalOpen(false);
        setSubmitting(false);
        form.resetFields();

        // 显示成功消息
        Modal.success({
          content: `课程"${values.name}"已成功添加`,
          title: '添加成功'
        });
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
      setSubmitting(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '课程ID',
      width: 80
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '课程名称',
      width: 200
    },
    {
      dataIndex: 'category',
      key: 'category',
      title: '分类',
      width: 120
    },
    {
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
      title: '价格',
      width: 120
    },
    {
      dataIndex: 'date',
      key: 'date',
      title: '日期',
      width: 120
    },
    {
      dataIndex: 'attachment',
      key: 'attachment',
      render: (_text: string, record: any) =>
        record.attachmentCount > 0 ? <Tag color="blue">{`${record.attachmentCount}个附件`}</Tag> : '无附件',
      title: '附件',
      width: 100
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
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
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            type="link"
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => handleAttachment(record.id)}
          >
            附件
          </Button>
          <Button
            danger
            size="small"
            type="link"
          >
            删除
          </Button>
        </Space>
      ),
      title: '操作',
      width: 160
    }
  ];

  return (
    <div className="p-16px">
      <Card
        bordered={false}
        title={t('course.list')}
      >
        <div className="mb-16px flex flex-wrap gap-16px">
          <Input.Search
            placeholder="请输入课程名称"
            style={{ width: 200 }}
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            onSearch={value => setSearchName(value)}
          />

          <Select
            options={categoryOptions}
            placeholder="选择分类"
            style={{ width: 150 }}
            value={selectedCategory}
            onChange={value => setSelectedCategory(value)}
          />

          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={value => setDateRange(value)}
          />

          <Button
            className="ml-auto"
            type="primary"
            onClick={showAddModal}
          >
            添加课程
          </Button>
          <Button onClick={resetFilters}>重置筛选</Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredList}
          loading={loading}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条记录`,
            total: filteredList.length
          }}
        />
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
    </div>
  );
};

export default CourseList;
