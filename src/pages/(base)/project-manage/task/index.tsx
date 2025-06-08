import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, Tooltip, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { employeeService, projectService } from '@/service/api';
import type { EmployeeApi, TaskApi } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

/** 任务状态枚举 */
enum TaskStatus {
  NOT_STARTED = 0, // 未开始
  IN_PROGRESS = 1, // 进行中
  COMPLETED = 2, // 已完成
  PAUSED = 3, // 已暂停
  CANCELLED = 4 // 已取消
}

/** 任务状态名称 */
const taskStatusNames = {
  [TaskStatus.NOT_STARTED]: '未开始',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.PAUSED]: '已暂停',
  [TaskStatus.CANCELLED]: '已取消'
};

/** 任务状态颜色 */
const taskStatusColors = {
  [TaskStatus.NOT_STARTED]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.PAUSED]: 'warning',
  [TaskStatus.CANCELLED]: 'error'
};

/** 优先级枚举 */
enum Priority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

/** 优先级名称 */
const priorityNames = {
  [Priority.HIGH]: '高',
  [Priority.MEDIUM]: '中',
  [Priority.LOW]: '低'
};

interface TaskRecord {
  actualCount?: number;
  assignee?: {
    id: number;
    name: string;
  };
  createTime: string;
  dueDate?: string;
  id: number;
  priority: number;
  progress: number;
  projectName?: string;
  targetCount?: number;
  taskDesc?: string;
  taskName: string;
  taskStatus: number;
  taskType: string;
  updateTime?: string;
}

/** 事项列表组件 */
const ItemList = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskRecord[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isContentModalVisible, setIsContentModalVisible] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [employees, setEmployees] = useState<EmployeeApi.EmployeeListItem[]>([]);
  const [form] = Form.useForm();

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    priority: '',
    status: '',
    timeRange: null as any
  });

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const employeeList = await employeeService.getAllEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  // 获取任务列表
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await projectService.getTaskList({
        current: 1,
        size: 1000
      });

      // 将API返回的数据转换为组件需要的格式
      const formattedTasks: TaskRecord[] = response.records.map((task: TaskApi.TaskListItem) => ({
        actualCount: task.actualCount || 0,
        assignee: task.assignee,
        createTime: task.createTime || '',
        dueDate: task.dueDate || '',
        id: task.id,
        priority: task.priority,
        progress: task.progress,
        projectName: task.projectName || '',
        targetCount: task.targetCount || 0,
        taskDesc: task.taskDesc || '',
        taskName: task.taskName || '',
        taskStatus: task.taskStatus,
        taskType: task.taskType,
        updateTime: task.updateTime || ''
      }));

      setTasks(formattedTasks);
      setFilteredTasks(formattedTasks);
    } catch (error) {
      message.error('获取任务列表失败');
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees(); // 获取员工列表
  }, []);

  // 搜索处理
  const handleSearch = () => {
    let filtered = [...tasks];

    if (searchParams.keyword) {
      filtered = filtered.filter(
        task =>
          task.taskName.includes(searchParams.keyword) ||
          task.projectName?.includes(searchParams.keyword) ||
          task.assignee?.name?.includes(searchParams.keyword) ||
          task.taskDesc?.includes(searchParams.keyword)
      );
    }

    if (searchParams.status) {
      filtered = filtered.filter(task => task.taskStatus.toString() === searchParams.status);
    }

    if (searchParams.priority) {
      filtered = filtered.filter(task => task.priority.toString() === searchParams.priority);
    }

    if (searchParams.timeRange && searchParams.timeRange.length === 2) {
      const [start, end] = searchParams.timeRange;
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = dayjs(task.dueDate);
        return dueDate.isAfter(start) && dueDate.isBefore(end);
      });
    }

    setFilteredTasks(filtered);
  };

  // 重置搜索
  const resetSearch = () => {
    setSearchParams({ keyword: '', priority: '', status: '', timeRange: null });
    setFilteredTasks(tasks);
  };

  // 打开新增/编辑弹窗
  const openModal = (task?: TaskRecord) => {
    form.resetFields();
    if (task) {
      setEditingTask(task);
      form.setFieldsValue({
        ...task,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null
      });
    } else {
      setEditingTask(null);
    }
    setIsModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTask(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        assigneeId: values.assigneeId || null,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD HH:mm:ss') : null
      };

      if (editingTask) {
        // 更新任务
        await projectService.updateTask(editingTask.id, formData);
        message.success('更新任务成功');
      } else {
        // 创建任务
        await projectService.createTask(formData);
        message.success('创建任务成功');
      }

      setIsModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      await fetchTasks(); // 重新获取数据
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  // 删除任务
  const handleDelete = (id: number) => {
    Modal.confirm({
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await projectService.deleteTask(id);
          message.success('删除成功');
          await fetchTasks(); // 重新获取数据
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败，请重试');
        }
      },
      title: '删除确认'
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的任务');
      return;
    }

    Modal.confirm({
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: async () => {
        try {
          // 批量删除任务
          const deletePromises = selectedRowKeys.map(id => projectService.deleteTask(id));
          await Promise.all(deletePromises);
          message.success(`成功删除 ${selectedRowKeys.length} 条记录`);
          setSelectedRowKeys([]);
          await fetchTasks(); // 重新获取数据
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败，请重试');
        }
      },
      title: '批量删除确认'
    });
  };

  // 查看详情
  const handleViewDetail = (task: TaskRecord) => {
    setCurrentContent(`
任务名称：${task.taskName}
项目名称：${task.projectName || '无'}
任务类型：${task.taskType}
任务描述：${task.taskDesc || '无'}
负责人：${task.assignee?.name || '未分配'}
优先级：${priorityNames[task.priority as Priority]}
状态：${taskStatusNames[task.taskStatus as TaskStatus]}
完成进度：${task.progress}%
目标数量：${task.targetCount || 0}
实际完成：${task.actualCount || 0}
截止时间：${task.dueDate || '无'}
创建时间：${task.createTime || '无'}
更新时间：${task.updateTime || '无'}
    `);
    setIsContentModalVisible(true);
  };

  // 获取状态标签
  const getStatusTag = (status: number) => (
    <Tag color={taskStatusColors[status as TaskStatus]}>{taskStatusNames[status as TaskStatus] || '未知'}</Tag>
  );

  // 表格行选择配置
  const rowSelection = {
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[]);
    },
    selectedRowKeys
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      title: '序号',
      ...getCenterColumnConfig(),
      width: 60
    },
    {
      dataIndex: 'taskName',
      key: 'taskName',
      title: '任务名称',
      ...getCenterColumnConfig(),
      width: 150
    },
    {
      dataIndex: 'projectName',
      key: 'projectName',
      title: '项目名称',
      ...getCenterColumnConfig(),
      width: 180
    },
    {
      dataIndex: 'assignee',
      key: 'assignee',
      title: '负责人',
      ...getCenterColumnConfig(),
      render: (assignee: any) => assignee?.name || '未分配',
      width: 100
    },
    {
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: number) => getStatusTag(status),
      width: 100
    },
    {
      dataIndex: 'actualCount',
      key: 'actualCount',
      title: '完成数量',
      ...getCenterColumnConfig(),
      width: 80
    },
    {
      dataIndex: 'targetCount',
      key: 'targetCount',
      title: '目标数量',
      ...getCenterColumnConfig(),
      width: 80
    },
    {
      dataIndex: 'dueDate',
      key: 'dueDate',
      title: '截止时间',
      ...getCenterColumnConfig(),
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '无'),
      width: 150
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(200),
      render: (_: any, record: TaskRecord) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              icon={<EyeOutlined />}
              size="small"
              type="link"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              icon={<EditOutlined />}
              size="small"
              type="link"
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              type="link"
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        title="事项列表"
        variant="borderless"
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => openModal()}
            >
              新建任务
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="请输入关键词搜索"
            style={{ width: 200 }}
            value={searchParams.keyword}
            onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
          />
          <Select
            allowClear
            placeholder="请选择状态"
            style={{ width: 120 }}
            value={searchParams.status}
            onChange={value => setSearchParams({ ...searchParams, status: value || '' })}
          >
            {Object.entries(taskStatusNames).map(([key, value]) => (
              <Select.Option
                key={key}
                value={key}
              >
                {value}
              </Select.Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="请选择优先级"
            style={{ width: 120 }}
            value={searchParams.priority}
            onChange={value => setSearchParams({ ...searchParams, priority: value || '' })}
          >
            {Object.entries(priorityNames).map(([key, value]) => (
              <Select.Option
                key={key}
                value={key}
              >
                {value}
              </Select.Option>
            ))}
          </Select>
          <DatePicker.RangePicker
            placeholder={['开始时间', '结束时间']}
            style={{ width: 280 }}
            value={searchParams.timeRange}
            onChange={value => setSearchParams({ ...searchParams, timeRange: value })}
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
          rowSelection={rowSelection}
          {...getFullTableConfig(10)}
        />

        <Modal
          open={isModalVisible}
          title={editingTask ? '编辑任务' : '新建任务'}
          width={700}
          onCancel={handleCancel}
          onOk={handleSubmit}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="任务名称"
              name="taskName"
              rules={[{ message: '请输入任务名称', required: true }]}
            >
              <Input placeholder="请输入任务名称" />
            </Form.Item>
            <Form.Item
              label="项目名称"
              name="projectName"
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item
              label="任务类型"
              name="taskType"
              rules={[{ message: '请输入任务类型', required: true }]}
            >
              <Input placeholder="请输入任务类型" />
            </Form.Item>
            <Form.Item
              label="任务描述"
              name="taskDesc"
            >
              <Input.TextArea
                placeholder="请输入任务描述"
                rows={3}
              />
            </Form.Item>
            <Form.Item
              label="负责人"
              name="assigneeId"
              rules={[{ message: '请选择负责人', required: true }]}
            >
              <Select
                showSearch
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                placeholder="请选择负责人"
                options={employees.map(emp => ({
                  label: `${emp.nickName || emp.userName} (${emp.userName})`,
                  value: emp.id
                }))}
              />
            </Form.Item>
            <Form.Item
              initialValue={Priority.MEDIUM}
              label="优先级"
              name="priority"
              rules={[{ message: '请选择优先级', required: true }]}
            >
              <Select placeholder="请选择优先级">
                {Object.entries(priorityNames).map(([key, value]) => (
                  <Select.Option
                    key={key}
                    value={Number(key)}
                  >
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="目标数量"
              name="targetCount"
            >
              <Input
                min={0}
                placeholder="请输入目标数量"
                type="number"
              />
            </Form.Item>
            <Form.Item
              label="截止时间"
              name="dueDate"
            >
              <DatePicker
                showTime
                placeholder="请选择截止时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 查看详情弹窗 */}
        <Modal
          footer={null}
          open={isContentModalVisible}
          title="任务详情"
          width={600}
          onCancel={() => setIsContentModalVisible(false)}
        >
          <div className="whitespace-pre-wrap break-all">{currentContent}</div>
        </Modal>
      </Card>
    </div>
  );
};

export default ItemList;
