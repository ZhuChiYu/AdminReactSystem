import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type EmployeeApi, employeeService } from '@/service/api';
import type { EmployeeApi as EmployeeApiType } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Title } = Typography;
const { Option } = Select;

const Component: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    size: 10,
    total: 0
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 获取员工列表
  const fetchEmployees = async (params?: EmployeeApi.EmployeeQueryParams) => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployeeList({
        current: pagination.current,
        size: pagination.size,
        ...params
      });

      setEmployees(response.records);
      setPagination({
        current: response.current,
        size: response.size,
        total: response.total
      });
    } catch (error) {
      console.error('获取员工列表失败:', error);
      message.error('获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    fetchEmployees();
  }, []);

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
    // 这里应该调用删除API
    message.success('员工删除成功');
    fetchEmployees(); // 重新加载数据
  };

  // 搜索员工
  const handleSearch = (values: any) => {
    fetchEmployees(values);
  };

  // 重置搜索
  const resetSearch = () => {
    form.resetFields();
    fetchEmployees();
  };

  // 分页变化处理
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, size: pageSize }));
    fetchEmployees({ ...form.getFieldsValue(), current: page, size: pageSize });
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '在职' },
      inactive: { color: 'red', text: '离职' },
      suspended: { color: 'orange', text: '停职' }
    };
    return statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
  };

  // 获取性别显示
  const getGenderText = (gender: string) => {
    return gender === 'male' ? '男' : gender === 'female' ? '女' : '-';
  };

  // 表格列配置
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      ...getCenterColumnConfig(),
      width: 80
    },
    {
      dataIndex: 'nickName',
      key: 'nickName',
      title: '员工姓名',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-'
    },
    {
      dataIndex: 'userName',
      key: 'userName',
      title: '用户名',
      ...getCenterColumnConfig()
    },
    {
      dataIndex: 'gender',
      key: 'gender',
      title: '性别',
      ...getCenterColumnConfig(),
      render: (gender: string) => getGenderText(gender),
      width: 80
    },
    {
      dataIndex: 'roleNames',
      key: 'roleNames',
      title: '角色',
      ...getCenterColumnConfig(),
      render: (roleNames: string[]) => roleNames?.join(', ') || '-',
      width: 150
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      width: 120
    },
    {
      dataIndex: ['department', 'name'],
      key: 'department',
      title: '部门',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      width: 120
    },
    {
      dataIndex: 'contractYears',
      key: 'contractYears',
      title: '合同年限',
      ...getCenterColumnConfig(),
      render: (years: number) => (years ? `${years}年` : '-'),
      width: 100
    },
    {
      dataIndex: 'contractStartDate',
      key: 'contractStartDate',
      title: '合同开始',
      ...getCenterColumnConfig(),
      render: (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('zh-CN');
      },
      width: 120
    },
    {
      dataIndex: 'contractEndDate',
      key: 'contractEndDate',
      title: '合同结束',
      ...getCenterColumnConfig(),
      render: (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('zh-CN');
      },
      width: 120
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      title: '电话',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      width: 120
    },
    {
      dataIndex: 'email',
      key: 'email',
      title: '邮箱',
      ...getCenterColumnConfig(),
      render: (text: string) => text || '-',
      width: 200
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: string) => {
        const { color, text } = getStatusTag(status);
        return <span style={{ color }}>{text}</span>;
      },
      width: 100
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      title: '入职日期',
      ...getCenterColumnConfig(),
      render: (text: string) => {
        if (!text) return '-';
        const date = new Date(text);
        return date.toLocaleDateString('zh-CN');
      },
      width: 120
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(320),
      render: (_: any, record: EmployeeApiType.EmployeeListItem) => (
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
      )
    }
  ];

  return (
    <div className="p-4">
      <Card>
        <Title level={4}>员工列表</Title>

        {/* 搜索表单 */}
        <Form
          form={form}
          layout="inline"
          style={{ marginBottom: 16 }}
          onFinish={handleSearch}
        >
          <Form.Item name="nickName">
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
          <Form.Item name="userName">
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="department">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="请选择状态"
              style={{ width: 120 }}
            >
              <Option value="">全部</Option>
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
              <Option value="suspended">停职</Option>
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

        <Table
          columns={columns}
          dataSource={employees}
          loading={loading}
          rowKey="id"
          {...getFullTableConfig(10)}
          pagination={{
            ...getFullTableConfig(10).pagination,
            current: pagination.current,
            onChange: handlePaginationChange,
            onShowSizeChange: handlePaginationChange,
            pageSize: pagination.size,
            total: pagination.total
          }}
        />
      </Card>
    </div>
  );
};

export default Component;
