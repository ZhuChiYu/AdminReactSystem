import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';

import { classService } from '@/service/api';
import type { ClassApi } from '@/service/api/class';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

interface CategoryItem {
  code: string;
  createdAt: string;
  description: string;
  id: number;
  name: string;
  sort: number;
  status: string;
  updatedAt: string;
}

const ClassCategory = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [currentCategory, setCurrentCategory] = useState<CategoryItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  // 获取分类列表
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await classService.getClassCategories();

      // 转换API数据格式
      const formattedCategories: CategoryItem[] = (response || []).map((category: ClassApi.ClassCategory) => ({
        code: category.code,
        createdAt: category.createdAt || new Date().toISOString(),
        description: category.description || '',
        id: category.id,
        name: category.name,
        sort: category.sort,
        status: category.status === 1 ? '启用' : '禁用',
        updatedAt: category.updatedAt || new Date().toISOString()
      }));

      setCategories(formattedCategories);
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
      code: category.code,
      description: category.description,
      name: category.name,
      sort: category.sort,
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
        code: values.code,
        description: values.description || '',
        name: values.name,
        sort: values.sort || 0,
        status: values.status === 'enable' ? 1 : 0
      };

      if (currentCategory) {
        // 编辑分类
        await classService.updateCategory(currentCategory.id, categoryData);
        message.success('分类更新成功');
      } else {
        // 新增分类
        await classService.createCategory(categoryData);
        message.success('分类创建成功');
      }

      setModalVisible(false);
      fetchCategories(); // 重新获取列表
    } catch (error) {
      if (currentCategory) {
        message.error('分类更新失败');
      } else {
        message.error('分类创建失败');
      }
      console.error('保存分类失败:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  // 删除分类
  const handleDelete = async (id: number) => {
    try {
      await classService.deleteCategory(id);
      message.success('删除成功');
      fetchCategories(); // 重新获取列表
    } catch (error) {
      message.error('删除失败');
      console.error('删除分类失败:', error);
    }
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: '序号',
      width: 80
    },
    {
      dataIndex: 'name',
      key: 'name',
      ...getCenterColumnConfig(),
      title: '分类名称'
    },
    {
      dataIndex: 'code',
      key: 'code',
      ...getCenterColumnConfig(),
      title: '分类编码'
    },
    {
      dataIndex: 'description',
      key: 'description',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      title: '描述'
    },
    {
      dataIndex: 'sort',
      key: 'sort',
      ...getCenterColumnConfig(),
      title: '排序'
    },
    {
      dataIndex: 'status',
      key: 'status',
      ...getCenterColumnConfig(),
      render: (status: string) => <Tag color={status === '启用' ? 'green' : 'red'}>{status}</Tag>,
      title: '状态'
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      ...getCenterColumnConfig(),
      render: (text: string) => new Date(text).toLocaleString(),
      title: '创建时间'
    },
    {
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      ...getCenterColumnConfig(),
      render: (text: string) => new Date(text).toLocaleString(),
      title: '更新时间'
    },
    {
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_: any, record: CategoryItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            cancelText="取消"
            okText="确定"
            title="确定要删除这个分类吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              type="link"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      title: '操作'
    }
  ];

  return (
    <div className="p-16px">
      <Card
        title="班级分类"
        variant="borderless"
        extra={
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={showAddModal}
          >
            新增分类
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
        />
      </Card>

      {/* 分类编辑/新增模态框 */}
      <Modal
        confirmLoading={confirmLoading}
        open={modalVisible}
        title={modalTitle}
        onCancel={handleCancel}
        onOk={handleSave}
      >
        <Form
          form={form}
          layout="vertical"
          name="categoryForm"
        >
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ message: '请输入分类名称', required: true }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            label="分类编码"
            name="code"
            rules={[{ message: '请输入分类编码', required: true }]}
          >
            <Input placeholder="请输入分类编码" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sort"
          >
            <InputNumber
              min={0}
              placeholder="请输入排序值"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            rules={[{ message: '请选择状态', required: true }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="enable">启用</Select.Option>
              <Select.Option value="disable">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassCategory;
