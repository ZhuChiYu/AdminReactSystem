import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增分类');
  const [form] = Form.useForm();
  const [currentCategory, setCurrentCategory] = useState<CategoryItem | null>(null);

  // 模拟数据加载
  useEffect(() => {
    setLoading(true);
    // 模拟API请求
    setTimeout(() => {
      const mockData = [
        {
          createdAt: '2025/4/12 22:32:55',
          description: '各类技术相关的培训课程',
          id: 1,
          name: '技术培训',
          status: '启用',
          updatedAt: '2025/4/12 22:32:55'
        },
        {
          createdAt: '2025/4/12 22:32:55',
          description: '企业管理相关的培训课程',
          id: 2,
          name: '管理课程',
          status: '启用',
          updatedAt: '2025/4/12 22:32:55'
        },
        {
          createdAt: '2025/4/12 22:32:55',
          description: '市场营销相关的培训课程',
          id: 3,
          name: '营销课程',
          status: '启用',
          updatedAt: '2025/4/12 22:32:55'
        },
        {
          createdAt: '2025/4/12 22:32:55',
          description: '财务管理相关的培训课程',
          id: 4,
          name: '财务课程',
          status: '启用',
          updatedAt: '2025/4/12 22:32:55'
        },
        {
          createdAt: '2025/4/12 22:32:55',
          description: '人力资源管理相关的培训课程',
          id: 5,
          name: '人力资源',
          status: '启用',
          updatedAt: '2025/4/12 22:32:55'
        },
        {
          createdAt: '2025/4/12 23:01:35',
          description: '',
          id: 6,
          name: '1',
          status: '启用',
          updatedAt: '2025/4/12 23:01:35'
        }
      ];
      setCategories(mockData);
      setLoading(false);
    }, 500);
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

  // 处理表单提交
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);

      // 模拟API请求
      setTimeout(() => {
        if (currentCategory) {
          // 编辑已有分类
          const newCategories = categories.map(item => {
            if (item.id === currentCategory.id) {
              return {
                ...item,
                description: values.description || '',
                name: values.name,
                status: values.status === 'enable' ? '启用' : '禁用',
                updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(',', '')
              };
            }
            return item;
          });
          setCategories(newCategories);
          message.success('分类编辑成功');
        } else {
          // 新增分类
          const newId = Math.max(...categories.map(item => item.id)) + 1;
          const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(',', '');
          const newCategory: CategoryItem = {
            createdAt: now,
            description: values.description || '',
            id: newId,
            name: values.name,
            status: values.status === 'enable' ? '启用' : '禁用',
            updatedAt: now
          };
          setCategories([...categories, newCategory]);
          message.success('分类添加成功');
        }

        setConfirmLoading(false);
        setModalVisible(false);
      }, 500);
    } catch (error) {
      console.log('验证失败:', error);
    }
  };

  // 处理删除分类
  const handleDelete = (id: number) => {
    // 模拟API请求
    setTimeout(() => {
      const newCategories = categories.filter(item => item.id !== id);
      setCategories(newCategories);
      message.success('分类删除成功');
    }, 500);
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '分类ID',
      width: 100
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '分类名称',
      width: 150
    },
    {
      dataIndex: 'description',
      key: 'description',
      title: '描述',
      width: 300
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === '启用' ? 'success' : 'error'}>{status}</Tag>,
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
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      title: '更新时间',
      width: 180
    },
    {
      fixed: 'right' as const,
      key: 'action',
      render: (_: any, record: CategoryItem) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="link"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            cancelText="取消"
            description="删除后不可恢复，相关课程将失去分类关联"
            okText="确定"
            title="确定要删除该分类吗?"
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
        title={t('course.category')}
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
          scroll={{ x: 'max-content' }}
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条记录`,
            total: categories.length
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
        onOk={handleOk}
      >
        <Form
          form={form}
          initialValues={{ status: 'enable' }}
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
            label="状态"
            name="status"
            rules={[{ message: '请选择状态', required: true }]}
          >
            <Select
              options={[
                { label: '启用', value: 'enable' },
                { label: '禁用', value: 'disable' }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="分类描述"
            name="description"
          >
            <Input.TextArea
              placeholder="请输入分类描述"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseCategory;
