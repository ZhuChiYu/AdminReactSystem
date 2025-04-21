import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Typography, message } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

interface Employee {
  age: number;
  department: string;
  entryDate: string;
  gender: 'female' | 'male';
  id: number;
  name: string;
  position: string;
  status: 'active' | 'leave' | 'retired';
}

// 模拟数据
const mockEmployees: Employee[] = [
  {
    age: 28,
    department: '技术部',
    entryDate: '2020-06-15',
    gender: 'male',
    id: 1,
    name: '张三',
    position: '前端开发',
    status: 'active'
  },
  {
    age: 32,
    department: '市场部',
    entryDate: '2018-03-22',
    gender: 'female',
    id: 2,
    name: '李四',
    position: '市场经理',
    status: 'active'
  },
  {
    age: 45,
    department: '行政部',
    entryDate: '2015-08-11',
    gender: 'male',
    id: 3,
    name: '王五',
    position: '行政总监',
    status: 'active'
  },
  {
    age: 26,
    department: '人力资源',
    entryDate: '2021-11-03',
    gender: 'female',
    id: 4,
    name: '赵六',
    position: 'HR专员',
    status: 'active'
  },
  {
    age: 35,
    department: '技术部',
    entryDate: '2019-05-20',
    gender: 'male',
    id: 5,
    name: '钱七',
    position: '后端开发',
    status: 'leave'
  }
];

const Component: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 查看员工详情
  const viewEmployeeDetails = (id: number) => {
    message.info(`查看员工ID: ${id}的详情`);
    // 实际项目中可能会导航到详情页
    // navigate(`/employee-manage/detail/${id}`);
  };

  // 查看员工身份证信息
  const viewIdentityInfo = (id: number) => {
    navigate(`/employee-manage/identity?id=${id}`);
  };

  // 查看员工地址信息
  const viewAddressInfo = (id: number) => {
    navigate(`/employee-manage/address?id=${id}`);
  };

  // 查看员工联系方式
  const viewContactInfo = (id: number) => {
    navigate(`/employee-manage/contact?id=${id}`);
  };

  // 删除员工
  const deleteEmployee = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    message.success('员工删除成功');
  };

  // 搜索员工
  const handleSearch = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      let filteredEmployees = [...mockEmployees];

      if (values.name) {
        filteredEmployees = filteredEmployees.filter(emp => emp.name.includes(values.name));
      }

      if (values.department) {
        filteredEmployees = filteredEmployees.filter(emp => emp.department === values.department);
      }

      if (values.status) {
        filteredEmployees = filteredEmployees.filter(emp => emp.status === values.status);
      }

      setEmployees(filteredEmployees);
      setLoading(false);
    }, 500);
  };

  // 重置搜索
  const resetSearch = () => {
    form.resetFields();
    setEmployees(mockEmployees);
  };

  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '员工ID'
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名'
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (gender === 'male' ? '男' : '女'),
      title: '性别'
    },
    {
      dataIndex: 'age',
      key: 'age',
      title: '年龄'
    },
    {
      dataIndex: 'department',
      key: 'department',
      title: '部门'
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位'
    },
    {
      dataIndex: 'entryDate',
      key: 'entryDate',
      title: '入职日期'
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'active') return '在职';
        if (status === 'leave') return '离职';
        if (status === 'retired') return '退休';
        return status;
      },
      title: '状态'
    },
    {
      key: 'action',
      render: (_: any, record: Employee) => (
        <Space size="small">
          <Button
            type="link"
            onClick={() => viewEmployeeDetails(record.id)}
          >
            详情
          </Button>
          <Button
            type="link"
            onClick={() => viewIdentityInfo(record.id)}
          >
            身份信息
          </Button>
          <Button
            type="link"
            onClick={() => viewAddressInfo(record.id)}
          >
            住址
          </Button>
          <Button
            type="link"
            onClick={() => viewContactInfo(record.id)}
          >
            联系方式
          </Button>
          <Popconfirm
            cancelText="取消"
            okText="确定"
            title="确定要删除此员工吗?"
            onConfirm={() => deleteEmployee(record.id)}
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
    <div className="p-4">
      <Card className="mb-4">
        <Title level={4}>员工列表</Title>

        <Form
          className="mb-4"
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="name">
            <Input
              allowClear
              placeholder="员工姓名"
            />
          </Form.Item>

          <Form.Item name="department">
            <Select
              allowClear
              placeholder="选择部门"
              style={{ width: 150 }}
            >
              <Option value="技术部">技术部</Option>
              <Option value="市场部">市场部</Option>
              <Option value="行政部">行政部</Option>
              <Option value="人力资源">人力资源</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status">
            <Select
              allowClear
              placeholder="员工状态"
              style={{ width: 150 }}
            >
              <Option value="active">在职</Option>
              <Option value="leave">离职</Option>
              <Option value="retired">退休</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                htmlType="submit"
                type="primary"
              >
                搜索
              </Button>
              <Button onClick={resetSearch}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Button
          className="mb-4"
          type="primary"
          onClick={() => message.info('新增员工功能将在此实现')}
        >
          新增员工
        </Button>

        <Table
          columns={columns}
          dataSource={employees}
          loading={loading}
          rowKey="id"
          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  );
};

export default Component;
