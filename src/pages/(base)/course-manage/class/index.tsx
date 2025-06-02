import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { classService } from '@/service/api';
import type { ClassApi } from '@/service/api/types';

interface ClassItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  teacher: string;
  studentCount: number;
  startDate: string;
  endDate: string;
  status: number;
  description: string;
  createdAt: string;
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
        id: classItem.id,
        name: classItem.className,
        categoryId: classItem.categoryId || 0,
        categoryName: classItem.category?.name || '',
        teacher: classItem.teacher || '',
        studentCount: classItem.studentCount || 0,
        startDate: classItem.startDate || '',
        endDate: classItem.endDate || '',
        status: classItem.status || 0,
        description: classItem.description || '',
        createdAt: classItem.createTime || ''
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
      const filtered = classList.filter(item =>
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
    form.resetFields();
  };

  // 提交新增表单
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const classData = {
        className: values.name,
        categoryId: values.categoryId,
        teacher: values.teacher,
        startDate: values.startDate,
        endDate: values.endDate,
        description: values.description,
        status: ClassStatus.NOT_STARTED
      };

      await classService.createClass(classData);
      message.success('班级创建成功');
      setIsModalVisible(false);
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
      title: '班级ID',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 120
    },
    {
      title: '授课老师',
      dataIndex: 'teacher',
      key: 'teacher',
      width: 120
    },
    {
      title: '学员数量',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 100
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个班级吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
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
        </Space>
      )
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
              placeholder="搜索班级名称、老师或分类"
            allowClear
            style={{ width: 300 }}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
          />
          <Button
            type="primary"
              icon={<PlusOutlined />}
              onClick={showModal}
          >
            新增班级
          </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
          }}
        />
      </Card>

      {/* 新增班级弹窗 */}
        <Modal
          title="新增班级"
        open={isModalVisible}
        onOk={handleOk}
          onCancel={handleCancel}
        width={600}
        >
          <Form
            form={form}
          layout="vertical"
          >
            <Form.Item
              label="班级名称"
              name="name"
            rules={[{ required: true, message: '请输入班级名称' }]}
            >
              <Input placeholder="请输入班级名称" />
            </Form.Item>

            <Form.Item
            label="分类"
              name="categoryId"
            rules={[{ required: true, message: '请选择分类' }]}
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
            rules={[{ required: true, message: '请输入授课老师' }]}
            >
            <Input placeholder="请输入授课老师" />
            </Form.Item>

            <Form.Item
              label="开始日期"
              name="startDate"
            rules={[{ required: true, message: '请选择开始日期' }]}
            >
            <Input type="date" />
            </Form.Item>

            <Form.Item
              label="结束日期"
              name="endDate"
            rules={[{ required: true, message: '请选择结束日期' }]}
            >
            <Input type="date" />
            </Form.Item>

            <Form.Item
              label="班级描述"
              name="description"
            >
            <Input.TextArea placeholder="请输入班级描述" rows={4} />
            </Form.Item>
          </Form>
        </Modal>
    </div>
  );
};

export default ClassList;
