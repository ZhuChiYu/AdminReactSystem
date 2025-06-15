import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { classService } from '@/service/api/class';
import type { ClassApi } from '@/service/api/types';
import { getEndDateDisabledDate, getStartDateDisabledDate, validateDateRange } from '@/utils/dateUtils';
import { isSuperAdmin } from '@/utils/auth';

interface ClassItem {
  categoryId: number;
  categoryName: string;
  createdAt: string;
  description: string;
  endDate: string;
  id: number;
  name: string;
  startDate: string;
  status: number;
  studentCount: number;
  teacher: string;
}

/** 班级状态枚举 */
enum ClassStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  SUSPENDED = 3
}

/** 班级类型枚举 */
enum ClassCategory {
  TECHNICAL = 1,
  MANAGEMENT = 2,
  TRAINING = 3
}

/** 班级列表组件 */
const ClassList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [filteredList, setFilteredList] = useState<ClassItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 新增：用于存储表单中的开始日期和结束日期
  const [formStartDate, setFormStartDate] = useState<Dayjs | null>(null);
  const [formEndDate, setFormEndDate] = useState<Dayjs | null>(null);

  // 获取班级列表
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await classService.getClassList({
        current: 1,
        size: 1000
      });

      // 转换API数据格式
      const formattedClasses: ClassItem[] = response.records.map((classItem: ClassApi.ClassListItem) => ({
        categoryId: classItem.categoryId || 0,
        categoryName: classItem.category?.name || '',
        createdAt: classItem.createTime || '',
        description: classItem.description || '',
        endDate: classItem.endDate || '',
        id: classItem.id,
        name: classItem.className,
        startDate: classItem.startDate || '',
        status: classItem.status || 0,
        studentCount: classItem.studentCount || 0,
        teacher: classItem.teacher || ''
      }));

      setClassList(formattedClasses);
      setFilteredList(formattedClasses);
    } catch (error) {
      message.error('获取班级列表失败');
      console.error('获取班级列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // 搜索处理
  const handleSearch = (value: string) => {
    if (!value) {
      setFilteredList(classList);
    } else {
      const filtered = classList.filter(
        item =>
          item.name.toLowerCase().includes(value.toLowerCase()) ||
          item.teacher.toLowerCase().includes(value.toLowerCase()) ||
          item.categoryName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredList(filtered);
    }
  };

  // 打开新增弹窗
  const showModal = () => {
    setIsModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setFormStartDate(null);
    setFormEndDate(null);
    form.resetFields();
  };

  // 提交新增表单
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const classData = {
        categoryId: values.categoryId,
        description: values.description,
        endDate: values.endDate,
        name: values.name,
        startDate: values.startDate,
        status: ClassStatus.NOT_STARTED,
        teacher: values.teacher
      };

      await classService.createClass(classData);
      message.success('班级创建成功');
      setIsModalVisible(false);
      setFormStartDate(null);
      setFormEndDate(null);
      form.resetFields();
      fetchClasses(); // 重新获取列表
    } catch (error) {
      message.error('创建班级失败');
      console.error('创建班级失败:', error);
    }
  };

  // 删除班级
  const handleDelete = async (id: number) => {
    try {
      await classService.deleteClass(id);
      message.success('删除成功');
      fetchClasses(); // 重新获取列表
    } catch (error) {
      message.error('删除失败');
      console.error('删除班级失败:', error);
    }
  };

  // 查看班级详情
  const handleViewDetail = (classId: number) => {
    navigate(`/class-manage/detail/${classId}`);
  };

  // 编辑班级
  const handleEdit = (classId: number) => {
    navigate(`/class-manage/edit/${classId}`);
  };

  // 获取状态标签
  const getStatusTag = (status: number) => {
    switch (status) {
      case ClassStatus.NOT_STARTED:
        return <Tag color="default">未开始</Tag>;
      case ClassStatus.IN_PROGRESS:
        return <Tag color="processing">进行中</Tag>;
      case ClassStatus.COMPLETED:
        return <Tag color="success">已完成</Tag>;
      case ClassStatus.SUSPENDED:
        return <Tag color="warning">已暂停</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '班级ID',
      width: 100
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '班级名称',
      width: 200
    },
    {
      dataIndex: 'categoryName',
      key: 'categoryName',
      title: '分类',
      width: 120
    },
    {
      dataIndex: 'teacher',
      key: 'teacher',
      title: '授课老师',
      width: 120
    },
    {
      dataIndex: 'studentCount',
      key: 'studentCount',
      title: '学员数量',
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
      render: (status: number) => getStatusTag(status),
      title: '状态',
      width: 100
    },
    {
      key: 'action',
      render: (_: any, record: ClassItem) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            type="link"
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          {isSuperAdmin() && (
            <>
              <Button
                icon={<EditOutlined />}
                size="small"
                type="link"
                onClick={() => handleEdit(record.id)}
              >
                编辑
              </Button>
              <Popconfirm
                cancelText="取消"
                okText="确定"
                title="确定要删除这个班级吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  type="link"
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
      title: '操作',
      width: 200
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">班级管理</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Input.Search
              allowClear
              placeholder="搜索班级名称、老师或分类"
              style={{ width: 300 }}
              onChange={e => !e.target.value && handleSearch('')}
              onSearch={handleSearch}
            />
            {isSuperAdmin() && (
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={showModal}
              >
                新增班级
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredList}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
          }}
        />
      </Card>

      {/* 新增班级弹窗 */}
      <Modal
        open={isModalVisible}
        title="新增班级"
        width={600}
        onCancel={handleCancel}
        onOk={handleOk}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={changedValues => {
            // 监听开始日期和结束日期的变化
            if (changedValues.startDate) {
              setFormStartDate(changedValues.startDate);
              // 如果结束日期早于新的开始日期，清空结束日期
              if (formEndDate && changedValues.startDate.isAfter(formEndDate)) {
                setFormEndDate(null);
                form.setFieldValue('endDate', null);
                message.warning('结束日期已重置，请重新选择结束日期');
              }
            }
            if (changedValues.endDate) {
              setFormEndDate(changedValues.endDate);
            }
          }}
        >
          <Form.Item
            label="班级名称"
            name="name"
            rules={[{ message: '请输入班级名称', required: true }]}
          >
            <Input placeholder="请输入班级名称" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="categoryId"
            rules={[{ message: '请选择分类', required: true }]}
          >
            <Select placeholder="请选择分类">
              <Select.Option value={ClassCategory.TECHNICAL}>技术培训</Select.Option>
              <Select.Option value={ClassCategory.MANAGEMENT}>管理课程</Select.Option>
              <Select.Option value={ClassCategory.TRAINING}>营销课程</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="授课老师"
            name="teacher"
            rules={[{ message: '请输入授课老师', required: true }]}
          >
            <Input placeholder="请输入授课老师" />
          </Form.Item>

          <Form.Item
            label="开始日期"
            name="startDate"
            rules={[
              { message: '请选择开始日期', required: true },
              {
                validator: (_, value) => {
                  const { isValid, message: errorMessage } = validateDateRange(value, formEndDate);
                  return isValid ? Promise.resolve() : Promise.reject(new Error(errorMessage));
                }
              }
            ]}
          >
            <DatePicker
              disabledDate={getStartDateDisabledDate(formEndDate, false)}
              placeholder="请选择开始日期"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="结束日期"
            name="endDate"
            rules={[
              { message: '请选择结束日期', required: true },
              {
                validator: (_, value) => {
                  const { isValid, message: errorMessage } = validateDateRange(formStartDate, value);
                  return isValid ? Promise.resolve() : Promise.reject(new Error(errorMessage));
                }
              }
            ]}
          >
            <DatePicker
              disabledDate={getEndDateDisabledDate(formStartDate)}
              placeholder="请选择结束日期"
              style={{ width: '100%' }}
            />
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
    </div>
  );
};

export default ClassList;
