import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useEffect, useState } from 'react';

/** 项目状态枚举 */
enum ProjectStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_STARTED = 'not_started',
  OVERDUE = 'overdue'
}

/** 项目状态名称 */
const projectStatusNames = {
  [ProjectStatus.COMPLETED]: '已完成',
  [ProjectStatus.IN_PROGRESS]: '进行中',
  [ProjectStatus.NOT_STARTED]: '未开始',
  [ProjectStatus.OVERDUE]: '已逾期'
};

/** 项目状态颜色 */
const projectStatusColors = {
  [ProjectStatus.COMPLETED]: 'success',
  [ProjectStatus.IN_PROGRESS]: 'processing',
  [ProjectStatus.NOT_STARTED]: 'default',
  [ProjectStatus.OVERDUE]: 'error'
};

/** 项目优先级枚举 */
enum ProjectPriority {
  HIGH = 'high',
  LOW = 'low',
  MEDIUM = 'medium'
}

/** 项目优先级名称 */
const projectPriorityNames = {
  [ProjectPriority.HIGH]: '高',
  [ProjectPriority.MEDIUM]: '中',
  [ProjectPriority.LOW]: '低'
};

/** 项目优先级颜色 */
const projectPriorityColors = {
  [ProjectPriority.HIGH]: 'red',
  [ProjectPriority.MEDIUM]: 'orange',
  [ProjectPriority.LOW]: 'blue'
};

/** 事项列表组件 */
const ProjectList = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    name: '',
    priority: '',
    status: ''
  });

  // 模拟获取项目列表
  const fetchProjects = () => {
    setLoading(true);

    // 模拟API请求
    setTimeout(() => {
      const mockData = [
        {
          assignee: '张三',
          createdAt: '2023-05-15 10:30:00',
          description: '设计新的营销方案，包括社交媒体推广和线下活动',
          dueDate: '2023-06-30',
          id: 1,
          name: '营销方案设计',
          priority: ProjectPriority.HIGH,
          status: ProjectStatus.IN_PROGRESS
        },
        {
          assignee: '李四',
          createdAt: '2023-05-10 09:15:00',
          description: '开发新版本的CRM系统，优化客户管理流程',
          dueDate: '2023-07-15',
          id: 2,
          name: 'CRM系统开发',
          priority: ProjectPriority.MEDIUM,
          status: ProjectStatus.NOT_STARTED
        },
        {
          assignee: '王五',
          createdAt: '2023-04-20 14:00:00',
          description: '设计并实施员工培训计划，提升团队技能',
          dueDate: '2023-05-10',
          id: 3,
          name: '员工培训计划',
          priority: ProjectPriority.LOW,
          status: ProjectStatus.OVERDUE
        },
        {
          assignee: '赵六',
          createdAt: '2023-04-15 11:20:00',
          description: '开展季度财务审计，确保账目准确性',
          dueDate: '2023-05-01',
          id: 4,
          name: '财务审计',
          priority: ProjectPriority.HIGH,
          status: ProjectStatus.COMPLETED
        },
        {
          assignee: '孙七',
          createdAt: '2023-05-05 09:00:00',
          description: '开发新产品原型，进行用户测试',
          dueDate: '2023-06-15',
          id: 5,
          name: '产品原型开发',
          priority: ProjectPriority.MEDIUM,
          status: ProjectStatus.IN_PROGRESS
        }
      ];

      // 添加更多随机数据
      const statuses = Object.values(ProjectStatus);
      const priorities = Object.values(ProjectPriority);
      const assignees = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];
      const projectNames = [
        '市场调研',
        '客户回访',
        '供应商管理',
        '质量控制',
        '库存盘点',
        '绩效评估',
        '战略规划',
        '风险评估',
        '预算编制',
        '团队建设'
      ];

      for (let i = 6; i <= 20; i += 1) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        const randomAssignee = assignees[Math.floor(Math.random() * assignees.length)];
        const randomName = `${projectNames[Math.floor(Math.random() * projectNames.length)]} ${i}`;

        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60));

        mockData.push({
          assignee: randomAssignee,
          createdAt: createdDate.toLocaleString(),
          description: `${randomName}的详细描述信息，说明项目的目标和要求`,
          dueDate: dueDate.toISOString().split('T')[0],
          id: i,
          name: randomName,
          priority: randomPriority,
          status: randomStatus
        });
      }

      setProjects(mockData);
      setFilteredProjects(mockData);
      setLoading(false);
    }, 1000);
  };

  // 组件初始化时获取项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const { name, priority, status } = searchParams;

    let filtered = [...projects];

    if (name) {
      filtered = filtered.filter(item => item.name.includes(name));
    }

    if (priority) {
      filtered = filtered.filter(item => item.priority === priority);
    }

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    setFilteredProjects(filtered);
  };

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      name: '',
      priority: '',
      status: ''
    });
    setFilteredProjects(projects);
  };

  // 打开添加项目弹窗
  const openAddModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 提交添加项目
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { assignee, description, dueDate, name, priority, status } = values;

      // 添加新项目
      const newProject = {
        assignee,
        createdAt: new Date().toLocaleString(),
        description,
        dueDate: dueDate.format('YYYY-MM-DD'),
        id: projects.length + 1,
        name,
        priority,
        status
      };

      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);

      message.success('添加成功');
      setIsModalVisible(false);
    });
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      width: 60
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '事项名称',
      width: 150
    },
    {
      dataIndex: 'description',
      ellipsis: true,
      key: 'description',
      title: '描述',
      width: 200
    },
    {
      dataIndex: 'assignee',
      key: 'assignee',
      title: '负责人',
      width: 100
    },
    {
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: ProjectPriority) => (
        <Tag color={projectPriorityColors[priority]}>{projectPriorityNames[priority]}</Tag>
      ),
      title: '优先级',
      width: 80
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => <Tag color={projectStatusColors[status]}>{projectStatusNames[status]}</Tag>,
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      title: '创建时间',
      width: 150
    },
    {
      dataIndex: 'dueDate',
      key: 'dueDate',
      title: '截止日期',
      width: 120
    },
    {
      key: 'action',
      render: () => (
        <Space size="small">
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
      width: 150
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
        className="h-full"
        title="事项列表"
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="事项名称"
            style={{ width: 200 }}
            value={searchParams.name}
            onChange={e => setSearchParams({ ...searchParams, name: e.target.value })}
          />
          <Select
            allowClear
            placeholder="优先级"
            style={{ width: 120 }}
            value={searchParams.priority}
            options={Object.values(ProjectPriority).map(priority => ({
              label: <Tag color={projectPriorityColors[priority]}>{projectPriorityNames[priority]}</Tag>,
              value: priority
            }))}
            onChange={value => setSearchParams({ ...searchParams, priority: value })}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 120 }}
            value={searchParams.status}
            options={Object.values(ProjectStatus).map(status => ({
              label: <Tag color={projectStatusColors[status]}>{projectStatusNames[status]}</Tag>,
              value: status
            }))}
            onChange={value => setSearchParams({ ...searchParams, status: value })}
          />
          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button onClick={resetSearch}>重置</Button>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={openAddModal}
          >
            新增事项
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProjects}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300, y: 'calc(100vh - 300px)' }}
        />

        <Modal
          open={isModalVisible}
          title="新增事项"
          onCancel={handleCancel}
          onOk={handleSubmit}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="事项名称"
              name="name"
              rules={[{ message: '请输入事项名称', required: true }]}
            >
              <Input placeholder="请输入事项名称" />
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
              label="负责人"
              name="assignee"
              rules={[{ message: '请输入负责人', required: true }]}
            >
              <Input placeholder="请输入负责人" />
            </Form.Item>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ message: '请选择优先级', required: true }]}
            >
              <Select
                placeholder="请选择优先级"
                options={Object.values(ProjectPriority).map(priority => ({
                  label: projectPriorityNames[priority],
                  value: priority
                }))}
              />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ message: '请选择状态', required: true }]}
            >
              <Select
                placeholder="请选择状态"
                options={Object.values(ProjectStatus).map(status => ({
                  label: projectStatusNames[status],
                  value: status
                }))}
              />
            </Form.Item>
            <Form.Item
              label="截止日期"
              name="dueDate"
              rules={[{ message: '请选择截止日期', required: true }]}
            >
              <DatePicker
                placeholder="请选择截止日期"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default ProjectList;
