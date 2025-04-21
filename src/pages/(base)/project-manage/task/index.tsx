import { CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Input, Select, Space, Table, Tag, message } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useEffect, useState } from 'react';

/** 任务状态枚举 */
enum TaskStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_STARTED = 'not_started',
  OVERDUE = 'overdue'
}

/** 任务状态名称映射 */
const taskStatusNames = {
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.NOT_STARTED]: '未开始',
  [TaskStatus.OVERDUE]: '已逾期'
};

/** 任务状态颜色映射 */
const taskStatusColors = {
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.NOT_STARTED]: 'default',
  [TaskStatus.OVERDUE]: 'error'
};

/** 任务优先级枚举 */
enum TaskPriority {
  HIGH = 'high',
  LOW = 'low',
  MEDIUM = 'medium'
}

/** 任务优先级名称映射 */
const taskPriorityNames = {
  [TaskPriority.HIGH]: '高',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.LOW]: '低'
};

/** 任务优先级颜色映射 */
const taskPriorityColors = {
  [TaskPriority.HIGH]: 'red',
  [TaskPriority.MEDIUM]: 'orange',
  [TaskPriority.LOW]: 'blue'
};

/** 任务管理组件 */
const TaskManagement = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    name: '',
    priority: '',
    status: ''
  });

  // 模拟获取任务列表
  const fetchTasks = () => {
    setLoading(true);

    // 模拟API请求
    setTimeout(() => {
      const mockData = [
        {
          assignee: '张三',
          completed: false,
          createdAt: '2023-05-15 10:30:00',
          description: '完成营销方案初稿设计',
          dueDate: '2023-06-20',
          id: 1,
          name: '营销方案初稿',
          priority: TaskPriority.HIGH,
          projectName: '营销方案设计',
          status: TaskStatus.IN_PROGRESS
        },
        {
          assignee: '李四',
          completed: false,
          createdAt: '2023-05-12 09:15:00',
          description: '实现CRM系统的用户管理模块',
          dueDate: '2023-07-05',
          id: 2,
          name: '用户管理模块开发',
          priority: TaskPriority.MEDIUM,
          projectName: 'CRM系统开发',
          status: TaskStatus.NOT_STARTED
        },
        {
          assignee: '王五',
          completed: true,
          createdAt: '2023-04-18 14:00:00',
          description: '制定新员工培训课程表',
          dueDate: '2023-05-01',
          id: 3,
          name: '培训课程表制定',
          priority: TaskPriority.LOW,
          projectName: '员工培训计划',
          status: TaskStatus.COMPLETED
        },
        {
          assignee: '赵六',
          completed: false,
          createdAt: '2023-04-10 11:20:00',
          description: '完成第一季度财务报表审计',
          dueDate: '2023-04-30',
          id: 4,
          name: '第一季度审计',
          priority: TaskPriority.HIGH,
          projectName: '财务审计',
          status: TaskStatus.OVERDUE
        },
        {
          assignee: '孙七',
          completed: false,
          createdAt: '2023-05-03 09:00:00',
          description: '设计新产品的用户界面原型',
          dueDate: '2023-06-10',
          id: 5,
          name: 'UI原型设计',
          priority: TaskPriority.MEDIUM,
          projectName: '产品原型开发',
          status: TaskStatus.IN_PROGRESS
        }
      ];

      // 添加更多随机数据
      const statuses = Object.values(TaskStatus);
      const priorities = Object.values(TaskPriority);
      const assignees = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'];
      const projectNames = ['营销方案设计', 'CRM系统开发', '员工培训计划', '财务审计', '产品原型开发'];
      const taskNames = [
        '需求分析',
        '概要设计',
        '详细设计',
        '编码实现',
        '单元测试',
        '集成测试',
        '系统测试',
        '文档编写',
        '项目验收',
        '项目总结'
      ];

      for (let i = 6; i <= 20; i += 1) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        const randomAssignee = assignees[Math.floor(Math.random() * assignees.length)];
        const randomProject = projectNames[Math.floor(Math.random() * projectNames.length)];
        const randomTask = taskNames[Math.floor(Math.random() * taskNames.length)];
        const completed = randomStatus === TaskStatus.COMPLETED;

        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60));

        mockData.push({
          assignee: randomAssignee,
          completed,
          createdAt: createdDate.toLocaleString(),
          description: `${randomProject} - ${randomTask}的描述信息`,
          dueDate: dueDate.toISOString().split('T')[0],
          id: i,
          name: `${randomTask} ${i}`,
          priority: randomPriority,
          projectName: randomProject,
          status: randomStatus
        });
      }

      setTasks(mockData);
      setFilteredTasks(mockData);
      setLoading(false);
    }, 1000);
  };

  // 组件初始化时获取任务列表
  useEffect(() => {
    fetchTasks();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const { name, priority, status } = searchParams;

    let filtered = [...tasks];

    if (name) {
      filtered = filtered.filter(item => item.name.includes(name) || item.projectName.includes(name));
    }

    if (priority) {
      filtered = filtered.filter(item => item.priority === priority);
    }

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    setFilteredTasks(filtered);
  };

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      name: '',
      priority: '',
      status: ''
    });
    setFilteredTasks(tasks);
  };

  // 获取任务新状态
  const getNewTaskStatus = (completed: boolean, currentStatus: TaskStatus): TaskStatus => {
    if (completed) {
      return TaskStatus.COMPLETED;
    }

    return currentStatus === TaskStatus.COMPLETED ? TaskStatus.IN_PROGRESS : currentStatus;
  };

  // 处理完成状态变更
  const handleCompletedChange = (taskId: number, e: CheckboxChangeEvent) => {
    const completed = e.target.checked;

    // 更新任务列表
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed,
          status: getNewTaskStatus(completed, task.status)
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    // 更新过滤后的列表
    setFilteredTasks(
      filteredTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            completed,
            status: getNewTaskStatus(completed, task.status)
          };
        }
        return task;
      })
    );

    message.success(`任务已${completed ? '完成' : '重新打开'}`);
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'completed',
      key: 'completed',
      render: (completed: boolean, record: any) => (
        <Checkbox
          checked={completed}
          onChange={e => handleCompletedChange(record.id, e)}
        />
      ),
      title: ' ',
      width: 40
    },
    {
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <span style={{ textDecoration: record.completed ? 'line-through' : 'none' }}>{text}</span>
      ),
      title: '任务名称',
      width: 150
    },
    {
      dataIndex: 'projectName',
      key: 'projectName',
      title: '所属事项',
      width: 130
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
      render: (priority: TaskPriority) => <Tag color={taskPriorityColors[priority]}>{taskPriorityNames[priority]}</Tag>,
      title: '优先级',
      width: 80
    },
    {
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => <Tag color={taskStatusColors[status]}>{taskStatusNames[status]}</Tag>,
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'dueDate',
      key: 'dueDate',
      title: '截止日期',
      width: 120
    },
    {
      key: 'action',
      render: (_: unknown, record: any) => (
        <Space size="small">
          {record.status !== TaskStatus.COMPLETED && (
            <Button
              icon={<CheckCircleOutlined />}
              size="small"
              type="link"
              onClick={() => handleCompletedChange(record.id, { target: { checked: true } } as CheckboxChangeEvent)}
            >
              完成
            </Button>
          )}
          <Button
            size="small"
            type="link"
          >
            编辑
          </Button>
        </Space>
      ),
      title: '操作',
      width: 120
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
        className="h-full"
        title="任务管理"
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="任务名称/所属事项"
            style={{ width: 200 }}
            value={searchParams.name}
            onChange={e => setSearchParams({ ...searchParams, name: e.target.value })}
          />
          <Select
            allowClear
            placeholder="优先级"
            style={{ width: 120 }}
            value={searchParams.priority}
            options={Object.values(TaskPriority).map(priority => ({
              label: <Tag color={taskPriorityColors[priority]}>{taskPriorityNames[priority]}</Tag>,
              value: priority
            }))}
            onChange={value => setSearchParams({ ...searchParams, priority: value })}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 120 }}
            value={searchParams.status}
            options={Object.values(TaskStatus).map(status => ({
              label: <Tag color={taskStatusColors[status]}>{taskStatusNames[status]}</Tag>,
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
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300, y: 'calc(100vh - 300px)' }}
        />
      </Card>
    </div>
  );
};

export default TaskManagement;
