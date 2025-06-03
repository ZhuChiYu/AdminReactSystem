import { EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { projectService } from '@/service/api';
import type { TaskApi } from '@/service/api/types';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';

const { Paragraph } = Typography;

/** 跟进状态枚举 */
enum FollowUpStatus {
  // 已联系
  ADDED_WECHAT = 'added_wechat', // 未开始
  CONTACTED = 'contacted', // 已联系
  NOT_STARTED = 'not_started', // 已加微信
  PENDING = 'pending' // 待跟进
}

/** 跟进状态名称 */
const followUpStatusNames = {
  [FollowUpStatus.ADDED_WECHAT]: '已加微信',
  [FollowUpStatus.CONTACTED]: '已联系',
  [FollowUpStatus.NOT_STARTED]: '未开始',
  [FollowUpStatus.PENDING]: '待跟进'
};

/** 跟进状态颜色 */
const followUpStatusColors = {
  [FollowUpStatus.ADDED_WECHAT]: 'success',
  [FollowUpStatus.CONTACTED]: 'processing',
  [FollowUpStatus.NOT_STARTED]: 'default',
  [FollowUpStatus.PENDING]: 'warning'
};

interface TaskRecord {
  company: string;
  count: number;
  createdAt: string;
  description: string;
  employeeId: string;
  employeeName: string;
  eventTime: string;
  followUpContent: string;
  followUpStatus: number;
  followUpTime: string;
  id: number;
  mobile: string;
  name: string;
  position: string;
  projectName: string;
  target: number;
  telephone: string;
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
  const [form] = Form.useForm();

  // 模拟当前登录用户信息
  const currentUser = {
    department: '销售部',
    id: 'emp001',
    isAdmin: true,
    name: '张三'
  };

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: ''
  });

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
        company: '',
        count: task.actualCount || 0,
        createdAt: task.createTime || '',
        description: task.taskDesc || '',
        employeeId: task.assignee?.id?.toString() || '',
        employeeName: task.assignee?.name || '',
        eventTime: task.dueDate || '',
        followUpContent: task.taskDesc || '',
        followUpStatus: task.taskStatus,
        followUpTime: task.updateTime || '',
        id: task.id,
        // 这些字段在任务表中可能不存在，需要根据实际业务调整
        mobile: '',
        name: task.taskName || '',
        position: '',
        projectName: task.projectName || '',
        target: task.targetCount || 0,
        telephone: ''
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
  }, []);

  // 搜索处理
  const handleSearch = () => {
    let filtered = [...tasks];

    if (searchParams.keyword) {
      filtered = filtered.filter(
        task =>
          task.name.includes(searchParams.keyword) ||
          task.projectName.includes(searchParams.keyword) ||
          task.employeeName.includes(searchParams.keyword) ||
          task.description.includes(searchParams.keyword)
      );
    }

    if (searchParams.status) {
      filtered = filtered.filter(task => task.followUpStatus.toString() === searchParams.status);
    }

    setFilteredTasks(filtered);
  };

  // 重置搜索
  const resetSearch = () => {
    setSearchParams({ keyword: '', status: '' });
    setFilteredTasks(tasks);
  };

  // 打开新增/编辑弹窗
  const openModal = (task?: TaskRecord) => {
    form.resetFields();
    if (task) {
      setEditingTask(task);
      form.setFieldsValue({
        ...task,
        eventTime: dayjs(task.eventTime),
        followUpTime: dayjs(task.followUpTime)
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
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const formData = {
        ...values,
        createdAt: editingTask ? editingTask.createdAt : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        eventTime: values.eventTime.format('YYYY-MM-DD HH:mm:ss'),
        followUpTime: values.followUpTime.format('YYYY-MM-DD HH:mm:ss'),
        id: editingTask ? editingTask.id : tasks.length + 1
      };

      if (editingTask) {
        // 更新任务
        const updatedTasks = tasks.map(task => (task.id === editingTask.id ? formData : task));
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        message.success('更新成功');
      } else {
        // 新增任务
        const newTasks = [...tasks, formData];
        setTasks(newTasks);
        setFilteredTasks(newTasks);
        message.success('添加成功');
      }

      setIsModalVisible(false);
      setEditingTask(null);
      form.resetFields();
    });
  };

  // 删除任务
  const handleDelete = (id: number) => {
    Modal.confirm({
      content: '确定要删除这条记录吗？',
      onOk: () => {
        const updatedTasks = tasks.filter(task => task.id !== id);
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        message.success('删除成功');
      },
      title: '删除确认'
    });
  };

  // 显示完整跟进内容
  const showFullContent = (content: string) => {
    setCurrentContent(content);
    setIsContentModalVisible(true);
  };

  // 状态映射
  const getStatusTag = (status: number) => {
    const statusMap = {
      [FollowUpStatus.NOT_STARTED]: { color: 'default', text: '未开始' },
      [FollowUpStatus.CONTACTED]: { color: 'processing', text: '已联系' },
      [FollowUpStatus.ADDED_WECHAT]: { color: 'success', text: '已加微信' },
      [FollowUpStatus.PENDING]: { color: 'warning', text: '待处理' }
    };

    const config = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
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
      dataIndex: 'name',
      key: 'name',
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
      dataIndex: 'employeeName',
      key: 'employeeName',
      title: '负责人',
      ...getCenterColumnConfig(),
      width: 100
    },
    {
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      title: '状态',
      ...getCenterColumnConfig(),
      render: (status: number) => getStatusTag(status),
      width: 100
    },
    {
      dataIndex: 'count',
      key: 'count',
      title: '完成数量',
      ...getCenterColumnConfig(),
      width: 80
    },
    {
      dataIndex: 'target',
      key: 'target',
      title: '目标数量',
      ...getCenterColumnConfig(),
      width: 80
    },
    {
      dataIndex: 'eventTime',
      key: 'eventTime',
      title: '截止时间',
      ...getCenterColumnConfig(),
      width: 150
    },
    {
      key: 'action',
      title: '操作',
      ...getActionColumnConfig(200),
      render: (_: any, record: TaskRecord) => (
        <Space>
          <Button
            size="small"
            type="link"
          >
            查看详情
          </Button>
          <Button
            size="small"
            type="link"
          >
            编辑
          </Button>
          {currentUser.isAdmin && (
            <Button
              danger
              size="small"
              type="link"
            >
              删除
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        variant="borderless"
        title={
          <Space>
            <span>任务列表</span>
            {currentUser.isAdmin && <Tag color="gold">管理员</Tag>}
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
            <Select.Option value="0">未开始</Select.Option>
            <Select.Option value="1">已联系</Select.Option>
            <Select.Option value="2">已加微信</Select.Option>
            <Select.Option value="3">待处理</Select.Option>
          </Select>
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
          {...getFullTableConfig(10)}
        />

        <Modal
          open={isModalVisible}
          title={editingTask ? '编辑事项' : '新增事项'}
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
              label="单位"
              name="company"
              rules={[{ message: '请输入单位名称', required: true }]}
            >
              <Input placeholder="请输入单位名称" />
            </Form.Item>
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ message: '请输入姓名', required: true }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              label="职位"
              name="position"
              rules={[{ message: '请输入职位', required: true }]}
            >
              <Input placeholder="请输入职位" />
            </Form.Item>
            <Form.Item
              label="电话"
              name="telephone"
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
            <Form.Item
              label="手机"
              name="mobile"
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item
              label="跟进内容"
              name="followUpContent"
              rules={[{ message: '请输入跟进内容', required: true }]}
            >
              <Input.TextArea
                placeholder="请输入跟进内容"
                rows={3}
              />
            </Form.Item>
            <Form.Item
              label="跟进状态"
              name="followUpStatus"
              rules={[{ message: '请选择跟进状态', required: true }]}
            >
              <Select
                placeholder="请选择跟进状态"
                options={Object.values(FollowUpStatus).map(status => ({
                  label: followUpStatusNames[status],
                  value: status
                }))}
              />
            </Form.Item>
            <Form.Item
              label="跟进时间"
              name="followUpTime"
              rules={[{ message: '请选择跟进时间', required: true }]}
            >
              <DatePicker
                showTime
                placeholder="请选择跟进时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="举办时间"
              name="eventTime"
              rules={[{ message: '请选择举办时间', required: true }]}
            >
              <DatePicker
                showTime
                placeholder="请选择举办时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 查看完整内容弹窗 */}
        <Modal
          footer={null}
          open={isContentModalVisible}
          title="跟进内容详情"
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
