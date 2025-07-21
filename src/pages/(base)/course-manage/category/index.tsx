import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { courseService } from '@/service/api';
import { isSuperAdmin } from '@/utils/auth';

interface CategoryItem {
  createdAt: string;
  description: string;
  id: number;
  name: string;
  status: string;
  updatedAt: string;
}

const CourseCategory = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增分类');
  const [form] = Form.useForm();
  const [currentCategory, setCurrentCategory] = useState<CategoryItem | null>(null);

  // 获取分类列表
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourseCategories();

      // 转换API数据格式
      const formattedCategories: CategoryItem[] = response.map((category: any) => ({
        createdAt: category.createdAt,
        description: category.description || '',
        id: category.id,
        name: category.name,
        status: category.status === 1 ? '启用' : '禁用',
        updatedAt: category.updatedAt
      }));

      setCategories(formattedCategories);

      // 更新分页总数
      setPagination(prev => ({
        ...prev,
        total: formattedCategories.length
      }));
    } catch (error) {
      message.error('获取分类列表失败');
      console.error('获取分类列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 打开新增分类模态框
  const showAddModal = () => {
    setModalTitle('新增分类');
    setCurrentCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑分类模态框
  const showEditModal = (category: CategoryItem) => {
    setModalTitle('编辑分类');
    setCurrentCategory(category);
    form.setFieldsValue({
      description: category.description,
      name: category.name,
      status: category.status === '启用' ? 'enable' : 'disable'
    });
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setModalVisible(false);
  };

  // 保存分类
  const handleSave = async () => {
    try {
      setConfirmLoading(true);
      const values = await form.validateFields();

      const categoryData = {
        description: values.description || '',
        name: values.name,
        status: values.status === 'enable' ? 1 : 0
      };

      if (currentCategory) {
        // 编辑分类
        await courseService.updateCategory(currentCategory.id, categoryData);
        message.success('分类更新成功');
      } else {
        // 新增分类
        await courseService.createCategory(categoryData);
        message.success('分类创建成功');
      }

      setModalVisible(false);
      fetchCategories(); // 重新获取列表
    } catch (err) {
      console.error('操作分类失败:', err);
      if (currentCategory) {
        message.error('分类更新失败');
      } else {
        message.error('分类创建失败');
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  // 删除分类
  const handleDelete = async (id: number) => {
    try {
      await courseService.deleteCategory(id);
      message.success('删除成功');
      fetchCategories(); // 重新获取列表
    } catch (err) {
      console.error('删除分类失败:', err);
      message.error('删除失败');
    }
  };

  // 表格列定义
  const columns: ColumnType<CategoryItem>[] = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      width: 80
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '分类名称'
    },
    {
      dataIndex: 'description',
      key: 'description',
      title: '描述'
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === '启用' ? 'success' : 'default'}>{status}</Tag>,
      title: '状态'
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      title: '创建时间'
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      title: '更新时间'
    },
    {
      key: 'action',
      render: (_: any, record: CategoryItem) => (
        <Space>
          {isSuperAdmin() && (
            <>
              <Button
                size="small"
                type="link"
                onClick={() => showEditModal(record)}
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
            </>
          )}
        </Space>
      ),
      title: '操作',
      width: 150
    }
  ];

  return (
    <div className="p-16px">
      <Card
        title={t('course.category')}
        variant="borderless"
        extra={
          isSuperAdmin() && (
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={showAddModal}
            >
              新增分类
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            onChange: (page, size) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: size || prev.pageSize
              }));
            },
            pageSize: pagination.pageSize,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            total: pagination.total
          }}
        />
      </Card>

      {/* 分类编辑/新增模态框 */}
      <Modal
        confirmLoading={confirmLoading}
        maskClosable={false}
        open={modalVisible}
        title={modalTitle}
        onCancel={handleCancel}
        onOk={handleSave}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ message: '请输入分类名称', required: true }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            initialValue="enable"
            label="状态"
            name="status"
            rules={[{ message: '请选择状态', required: true }]}
          >
            <Select>
              <Select.Option value="enable">启用</Select.Option>
              <Select.Option value="disable">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseCategory;
