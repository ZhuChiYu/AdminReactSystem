import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Select, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CourseCategory = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

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
      render: () => (
        <Space>
          <Button
            size="small"
            type="link"
          >
            编辑
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

  // 分类表单
  const CategoryForm = () => {
    const [form] = Form.useForm();

    const handleFinish = (values: any) => {
      console.log('提交表单:', values);
      // 这里可以添加保存分类的逻辑
    };

    return (
      <Card
        className="mt-16px"
        title="添加分类"
      >
        <Form
          form={form}
          initialValues={{ status: 'enable' }}
          layout="vertical"
          onFinish={handleFinish}
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

          <Form.Item>
            <Space>
              <Button
                htmlType="submit"
                type="primary"
              >
                保存
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  return (
    <div className="p-16px">
      <Card
        bordered={false}
        title={t('course.category')}
        extra={
          <Button
            icon={<PlusOutlined />}
            type="primary"
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

      <CategoryForm />
    </div>
  );
};

export default CourseCategory;
