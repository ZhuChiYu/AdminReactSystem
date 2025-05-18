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
  createdAt: string;
  employeeId: string;
  employeeName: string;
  eventTime: string;
  followUpContent: string;
  followUpStatus: FollowUpStatus;
  followUpTime: string;
  id: number;
  mobile: string;
  name: string;
  position: string;
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

  // 模拟获取事项列表
  const fetchTasks = () => {
    setLoading(true);

    // 模拟API请求
    setTimeout(() => {
      const mockData: TaskRecord[] = [
        {
          company: '上海民用航空电源系统有限公司',
          createdAt: '2024-03-20 10:30:00',
          employeeId: 'emp001',
          employeeName: '张三',
          eventTime: '2024-04-15 14:00:00',
          followUpContent:
            '发计划教智化简章微信（15802910xxx）发计划教智化简章微信（15802910xxx）发计划教智化简章微信（15802910xxx）发计划教智化简章微信（15802910xxx）发计划教智化简章微信（15802910xxx）发计划教智化简章微信（15802910xxx）',
          followUpStatus: FollowUpStatus.ADDED_WECHAT,
          followUpTime: '2024-03-20 10:30:00',
          id: 1,
          mobile: '15802910000',
          name: '马芳',
          position: '财务负责培训',
          telephone: '029-81112543'
        }
      ];

      // 生成更多示例数据
      for (let i = 2; i <= 20; i += 1) {
        const date = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
        const getFollowUpStatus = (index: number) => {
          if (index % 4 === 0) return FollowUpStatus.ADDED_WECHAT;
          if (index % 4 === 1) return FollowUpStatus.CONTACTED;
          if (index % 4 === 2) return FollowUpStatus.NOT_STARTED;
          return FollowUpStatus.PENDING;
        };
        // 随机分配员工ID，确保部分任务属于当前登录员工
        const employeeId = i % 3 === 0 ? 'emp001' : `emp00${(i % 3) + 2}`;
        const employeeName = employeeId === 'emp001' ? '张三' : `员工${(i % 3) + 2}`;
        mockData.push({
          company: `公司${i}`,
          createdAt: date.format('YYYY-MM-DD HH:mm:ss'),
          employeeId,
          employeeName,
          eventTime: date.add(30, 'day').format('YYYY-MM-DD HH:mm:ss'),
          followUpContent: `跟进内容${i}`.repeat(10), // 生成长内容以测试展开功能
          followUpStatus: getFollowUpStatus(i),
          followUpTime: date.format('YYYY-MM-DD HH:mm:ss'),
          id: i,
          mobile: `1380000${String(i).padStart(4, '0')}`,
          name: `客户${i}`,
          position: `职位${i}`,
          telephone: `029-8111${String(i).padStart(4, '0')}`
        });
      }

      // 只显示当前登录员工的任务，除非是管理员
      const filteredMockData = currentUser.isAdmin
        ? mockData
        : mockData.filter(task => task.employeeId === currentUser.id);

      setTasks(filteredMockData);
      setFilteredTasks(filteredMockData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const { keyword } = searchParams;
    let filtered = [...tasks];

    if (keyword) {
      filtered = filtered.filter(
        task =>
          task.company.includes(keyword) ||
          task.name.includes(keyword) ||
          task.position.includes(keyword) ||
          task.followUpContent.includes(keyword)
      );
    }

    setFilteredTasks(filtered);
  };

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      keyword: '',
      status: ''
    });
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

  // 表格列定义
  const columns = [
    {
      dataIndex: 'company',
      key: 'company',
      title: '单位',
      width: 200
    },
    {
      dataIndex: 'name',
      key: 'name',
      title: '姓名',
      width: 100
    },
    {
      dataIndex: 'position',
      key: 'position',
      title: '职位',
      width: 150
    },
    {
      dataIndex: 'telephone',
      key: 'telephone',
      title: '电话',
      width: 150
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      title: '手机',
      width: 150
    },
    {
      dataIndex: 'followUpContent',
      ellipsis: true,
      key: 'followUpContent',
      render: (content: string) => (
        <Space>
          <Paragraph
            ellipsis={{ rows: 2, tooltip: false }}
            style={{ marginBottom: 0, width: 180 }}
          >
            {content}
          </Paragraph>
          <Tooltip title="查看完整内容">
            <Button
              icon={<EyeOutlined />}
              size="small"
              type="link"
              onClick={() => showFullContent(content)}
            />
          </Tooltip>
        </Space>
      ),
      title: '跟进内容',
      width: 250
    },
    {
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '跟进状态',
      width: 120
    },
    {
      dataIndex: 'followUpTime',
      key: 'followUpTime',
      title: '跟进时间',
      width: 180
    },
    {
      dataIndex: 'eventTime',
      key: 'eventTime',
      title: '举办时间',
      width: 180
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      title: '创建时间',
      width: 180
    },
    {
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text: string, record: TaskRecord) =>
        record.employeeId === currentUser.id ? <Tag color="blue">{text}</Tag> : text,
      title: '负责人',
      width: 100
    },
    {
      key: 'action',
      render: (_: unknown, record: TaskRecord) =>
        // 只能编辑自己的任务，管理员可以编辑所有任务
        record.employeeId === currentUser.id || currentUser.isAdmin ? (
          <Space size="small">
            <Button
              size="small"
              type="link"
              onClick={() => openModal(record)}
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
          </Space>
        ) : null,
      title: '操作',
      width: 150
    }
  ];

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        bordered={false}
        className="h-full"
        title={
          <Space>
            <span>事项列表</span>
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
            onClick={() => openModal()}
          >
            新增事项
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1800, y: 'calc(100vh - 300px)' }}
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
