import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Modal, Progress, Select, Space, Table, Tag, message } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import type { CustomerInfo, TaskRecord } from '@/store/customerStore';
import useCustomerStore, { FollowUpStatus, TaskFollowUpStatus, TaskType } from '@/store/customerStore';
import { getActionColumnConfig, getCenterColumnConfig, getFullTableConfig } from '@/utils/table';
// 暂时注释掉未使用的导入
// import { getCurrentUserId, getCurrentUserName, isAdmin } from '@/utils/auth';

/** 任务类型名称 */
const taskTypeNames = {
  [TaskType.CONSULT]: '咨询',
  [TaskType.REGISTER]: '报名',
  [TaskType.DEVELOP]: '开发',
  [TaskType.FOLLOW_UP]: '回访'
};

/** 任务类型颜色 */
const taskTypeColors = {
  [TaskType.CONSULT]: 'blue',
  [TaskType.REGISTER]: 'green',
  [TaskType.DEVELOP]: 'purple',
  [TaskType.FOLLOW_UP]: 'orange'
};

/** 统计周期枚举 */
enum StatisticsPeriod {
  MONTH = 'month',
  WEEK = 'week'
}

/** 统计周期名称 */
const periodNames = {
  [StatisticsPeriod.WEEK]: '周统计',
  [StatisticsPeriod.MONTH]: '月统计'
};

/** 跟进状态名称 */
const followUpStatusNames = {
  [TaskFollowUpStatus.NOT_STARTED]: '未开始',
  [TaskFollowUpStatus.IN_PROGRESS]: '进行中',
  [TaskFollowUpStatus.COMPLETED]: '已完成'
};

/** 跟进状态颜色 */
const followUpStatusColors = {
  [TaskFollowUpStatus.NOT_STARTED]: 'default',
  [TaskFollowUpStatus.IN_PROGRESS]: 'processing',
  [TaskFollowUpStatus.COMPLETED]: 'success'
};

/** 任务管理组件 */
const TaskManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [isRemarkModalVisible, setIsRemarkModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [selectedTaskCustomers, setSelectedTaskCustomers] = useState<CustomerInfo[]>([]);
  const [customerModalTitle, setCustomerModalTitle] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<StatisticsPeriod>(StatisticsPeriod.WEEK);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [remark, setRemark] = useState('');
  const [form] = Form.useForm();
  const [targetForm] = Form.useForm();

  // 从状态管理器获取任务和客户数据
  const { addCustomer, calculateTaskCounts, customers, getCustomersByTaskId, tasks } = useCustomerStore();

  const [filteredTasks, setFilteredTasks] = useState<TaskRecord[]>(tasks);

  // 模拟当前用户信息
  const currentUser = {
    department: '销售部',
    id: 1,
    isAdmin: true,
    name: '张三'
  };

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    followUpStatus: '',
    keyword: '',
    timeRange: null as RangePickerProps['value'],
    type: ''
  });

  // 当任务数据变化时更新列表
  useEffect(() => {
    setFilteredTasks(tasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // 如果没有客户数据，添加一些示例数据
  useEffect(() => {
    if (customers.length === 0) {
      // 示例数据 - 各种跟进状态的客户
      const sampleCustomers: CustomerInfo[] = [
        // 咨询任务相关客户
        {
          company: '上海民用航空电源系统有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '客户咨询了企业培训方案',
          followStatus: FollowUpStatus.CONSULT,
          id: 1,
          mobile: '13801234567',
          name: '李经理',
          phone: '021-12345678',
          position: '培训主管',
          source: '网站'
        },
        {
          company: '北京智慧科技有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '已添加客户微信',
          followStatus: FollowUpStatus.WECHAT_ADDED,
          id: 2,
          mobile: '13902345678',
          name: '王总',
          phone: '010-23456789',
          position: '总经理',
          source: '展会'
        },
        // 开发任务相关客户
        {
          company: '广州数字科技有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '新客户需要定制开发方案',
          followStatus: FollowUpStatus.NEW_DEVELOP,
          id: 3,
          mobile: '13903456789',
          name: '张经理',
          phone: '020-34567890',
          position: '技术总监',
          source: '转介绍'
        },
        {
          company: '深圳创新企业管理咨询有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '早25客户，需高优先级跟进',
          followStatus: FollowUpStatus.EARLY_25,
          id: 4,
          mobile: '13904567890',
          name: '刘总',
          phone: '0755-45678901',
          position: '人力总监',
          source: '老客户'
        },
        // 回访任务相关客户
        {
          company: '武汉科教发展有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '有效回访，客户对课程很满意',
          followStatus: FollowUpStatus.EFFECTIVE_VISIT,
          id: 5,
          mobile: '13905678901',
          name: '陈总',
          phone: '027-56789012',
          position: '副总裁',
          source: '广告'
        },
        {
          company: '成都企业培训中心',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '大客户，需提供VIP服务',
          followStatus: FollowUpStatus.VIP,
          id: 6,
          mobile: '13906789012',
          name: '赵总',
          phone: '028-67890123',
          position: 'CEO',
          source: '展会'
        },
        // 报名任务相关客户
        {
          company: '杭州信息技术有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '客户已报名网络安全培训课程',
          followStatus: FollowUpStatus.REGISTERED,
          id: 7,
          mobile: '13907890123',
          name: '钱经理',
          phone: '0571-78901234',
          position: '安全主管',
          source: '广告'
        },
        {
          company: '南京教育科技有限公司',
          createTime: new Date().toLocaleString(),
          employeeId: '1',
          employeeName: '张三',
          followContent: '客户已实地到访并确认培训计划',
          followStatus: FollowUpStatus.ARRIVED,
          id: 8,
          mobile: '13908901234',
          name: '孙总',
          phone: '025-89012345',
          position: '培训经理',
          source: '网站'
        }
      ];

      // 添加示例客户数据
      sampleCustomers.forEach(customer => {
        addCustomer(customer);
      });
    }
  }, [addCustomer, customers.length]);

  // 初始化时计算任务数据
  useEffect(() => {
    calculateTaskCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取统计数据
  const getStatistics = (data: TaskRecord[], type: TaskType) => {
    const now = dayjs();
    const filtered = data.filter(task => {
      const taskTime = dayjs(task.eventTime);
      if (selectedPeriod === StatisticsPeriod.WEEK) {
        return taskTime.isSame(now, 'week');
      }
      return taskTime.isSame(now, 'month');
    });

    const typeRecords = filtered.filter(task => task.type === type);
    const totalCount = typeRecords.reduce((sum, task) => sum + task.count, 0);
    const completedCount = typeRecords
      .filter(task => task.followUpStatus === TaskFollowUpStatus.COMPLETED)
      .reduce((sum, task) => sum + task.count, 0);
    const target = typeRecords[0]?.target || 0;

    return {
      completedCount,
      count: totalCount,
      progress: target ? Math.min(100, (completedCount / target) * 100) : 0,
      target
    };
  };

  // 处理搜索
  const handleSearch = () => {
    const { followUpStatus, keyword, timeRange, type } = searchParams;
    let filtered = [...tasks];

    if (keyword) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(keyword.toLowerCase()) ||
          task.description.toLowerCase().includes(keyword.toLowerCase()) ||
          task.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
          task.remark?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (timeRange) {
      const [start, end] = timeRange;
      filtered = filtered.filter(task => {
        const taskTime = dayjs(task.eventTime);
        return taskTime.isAfter(start) && taskTime.isBefore(end);
      });
    }

    if (type) {
      filtered = filtered.filter(task => task.type === type);
    }

    if (followUpStatus) {
      filtered = filtered.filter(task => task.followUpStatus === followUpStatus);
    }

    setFilteredTasks(filtered);
  };

  // 重置搜索条件
  const resetSearch = () => {
    setSearchParams({
      followUpStatus: '',
      keyword: '',
      timeRange: null,
      type: ''
    });
    setFilteredTasks(tasks);
  };

  // 打开添加事项弹窗
  const openAddModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  // 打开目标设置弹窗
  const openTargetModal = () => {
    targetForm.resetFields();
    setIsTargetModalVisible(true);
  };

  // 打开备注设置弹窗
  const openRemarkModal = (task: TaskRecord) => {
    if (!currentUser.isAdmin) {
      message.warning('只有管理员可以设置备注');
      return;
    }
    setSelectedTask(task);
    setRemark(task.remark || '');
    setIsRemarkModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // 关闭目标设置弹窗
  const handleTargetCancel = () => {
    setIsTargetModalVisible(false);
  };

  // 关闭备注设置弹窗
  const handleRemarkCancel = () => {
    setIsRemarkModalVisible(false);
    setSelectedTask(null);
    setRemark('');
  };

  // 提交添加事项
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { count, description, eventTime, followUpStatus, name, projectName, type } = values;

      // 添加新事项
      const newTask: TaskRecord = {
        count: Number(count),
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        description,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        eventTime: eventTime.format('YYYY-MM-DD HH:mm:ss'),
        followUpStatus,
        id: tasks.length + 1,
        name,
        projectName,
        target: tasks.find((t: TaskRecord) => t.type === type)?.target || 0,
        type
      };

      // 这里应该调用状态管理器的方法来添加任务
      // 暂时只是更新本地状态
      message.success('添加成功');
      setIsModalVisible(false);
    });
  };

  // 提交目标设置
  const handleTargetSubmit = () => {
    targetForm.validateFields().then(values => {
      const { target, type } = values;

      // 这里应该调用状态管理器的方法来更新目标
      // 暂时只是显示成功消息
      message.success('目标设置成功');
      setIsTargetModalVisible(false);
    });
  };

  // 提交备注设置
  const handleRemarkSubmit = () => {
    if (!selectedTask) return;

    // 这里应该调用状态管理器的方法来更新备注
    // 暂时只是显示成功消息
    message.success('备注设置成功');
    setIsRemarkModalVisible(false);
    setSelectedTask(null);
    setRemark('');
  };

  // 处理点击数量跳转
  const handleCountClick = (task: TaskRecord) => {
    // 设置弹窗标题，显示员工姓名
    setCustomerModalTitle(`${task.employeeName}的客户资料`);
    const taskCustomers = getCustomersByTaskId(task.id);
    setSelectedTaskCustomers(taskCustomers);
    setIsCustomerModalVisible(true);
  };

  // 更新跟进状态
  const handleFollowUpStatusChange = (taskId: number, followUpStatus: TaskFollowUpStatus) => {
    // 这里应该调用状态管理器的方法来更新任务状态
    // 暂时只是显示成功消息
    message.success('状态更新成功');
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: '序号',
      width: 60
    },
    {
      dataIndex: 'type',
      key: 'type',
      ...getCenterColumnConfig(),
      render: (type: TaskType) => <Tag color={taskTypeColors[type]}>{taskTypeNames[type]}</Tag>,
      title: '类型',
      width: 100
    },
    {
      dataIndex: 'projectName',
      key: 'projectName',
      ...getCenterColumnConfig(),
      title: '培训项目',
      width: 180
    },
    {
      dataIndex: 'name',
      key: 'name',
      ...getCenterColumnConfig(),
      title: '任务名称',
      width: 150
    },
    {
      dataIndex: 'description',
      ellipsis: true,
      key: 'description',
      ...getCenterColumnConfig(),
      title: '描述',
      width: 200
    },
    {
      dataIndex: 'count',
      key: 'count',
      ...getCenterColumnConfig(),
      render: (count: number, record: TaskRecord) => (
        <Button
          type="link"
          onClick={() => handleCountClick(record)}
        >
          {count}
        </Button>
      ),
      title: '数量',
      width: 80
    },
    {
      dataIndex: 'target',
      key: 'target',
      ...getCenterColumnConfig(),
      title: '目标',
      width: 80
    },
    {
      key: 'progress',
      ...getCenterColumnConfig(),
      render: (_: any, record: TaskRecord) => {
        const { count, target } = record;
        const progress = target ? Math.min(100, (count / target) * 100) : 0;
        return (
          <div>
            <Progress
              percent={Math.floor(progress)}
              status={record.followUpStatus === TaskFollowUpStatus.COMPLETED ? 'success' : 'normal'}
            />
            <div className="text-xs text-gray-500">{`${count}/${target}`}</div>
          </div>
        );
      },
      title: '完成进度',
      width: 150
    },
    {
      dataIndex: 'followUpStatus',
      key: 'followUpStatus',
      ...getCenterColumnConfig(),
      render: (status: TaskFollowUpStatus) => (
        <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>
      ),
      title: '跟进状态',
      width: 100
    },
    {
      dataIndex: 'eventTime',
      key: 'eventTime',
      ...getCenterColumnConfig(),
      title: '事件时间',
      width: 180
    },
    {
      dataIndex: 'remark',
      ellipsis: true,
      key: 'remark',
      ...getCenterColumnConfig(),
      render: (text: string, record: TaskRecord) => (
        <div className="flex items-center">
          <span
            className="mr-2 truncate"
            style={{ maxWidth: '150px' }}
          >
            {text || '-'}
          </span>
          {currentUser.isAdmin && (
            <Button
              size="small"
              type="link"
              onClick={() => openRemarkModal(record)}
            >
              {text ? '编辑' : '添加'}
            </Button>
          )}
        </div>
      ),
      title: '备注',
      width: 200
    },
    {
      key: 'action',
      ...getActionColumnConfig(150),
      render: (_: unknown, record: TaskRecord) => (
        <Space size="small">
          {record.followUpStatus !== TaskFollowUpStatus.COMPLETED && (
            <Button
              size="small"
              type="link"
              onClick={() => handleFollowUpStatusChange(record.id, TaskFollowUpStatus.COMPLETED)}
            >
              完成
            </Button>
          )}
          {record.followUpStatus === TaskFollowUpStatus.NOT_STARTED && (
            <Button
              size="small"
              type="link"
              onClick={() => handleFollowUpStatusChange(record.id, TaskFollowUpStatus.IN_PROGRESS)}
            >
              进行中
            </Button>
          )}
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
      title: '操作'
    }
  ];

  // 客户列表弹窗的列定义
  const customerColumns = [
    {
      dataIndex: 'id',
      key: 'id',
      ...getCenterColumnConfig(),
      title: '序号',
      width: 60
    },
    {
      dataIndex: 'company',
      key: 'company',
      ...getCenterColumnConfig(),
      title: '单位',
      width: 200
    },
    {
      dataIndex: 'name',
      key: 'name',
      ...getCenterColumnConfig(),
      title: '姓名',
      width: 100
    },
    {
      dataIndex: 'position',
      key: 'position',
      ...getCenterColumnConfig(),
      title: '职位',
      width: 150
    },
    {
      dataIndex: 'phone',
      key: 'phone',
      ...getCenterColumnConfig(),
      title: '电话',
      width: 150
    },
    {
      dataIndex: 'mobile',
      key: 'mobile',
      ...getCenterColumnConfig(),
      title: '手机',
      width: 150
    },
    {
      dataIndex: 'source',
      key: 'source',
      ...getCenterColumnConfig(),
      title: '来源',
      width: 100
    },
    {
      dataIndex: 'followContent',
      key: 'followContent',
      ...getCenterColumnConfig(),
      title: '跟进内容',
      width: 200
    },
    {
      dataIndex: 'followStatus',
      key: 'followStatus',
      ...getCenterColumnConfig(),
      render: (status: string) => {
        let color = 'default';
        if (status === '已加微信') {
          color = 'success';
        } else if (status === '已联系') {
          color = 'processing';
        } else if (status === '待跟进') {
          color = 'warning';
        } else if (status === '已报名') {
          color = 'blue';
        }
        return <Tag color={color}>{status}</Tag>;
      },
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'createTime',
      key: 'createTime',
      ...getCenterColumnConfig(),
      title: '创建时间',
      width: 180
    },
    {
      key: 'action',
      ...getActionColumnConfig(120),
      render: () => (
        <Button
          size="small"
          type="link"
        >
          修改跟进状态
        </Button>
      ),
      title: '操作'
    }
  ];

  // 统计卡片
  const StatisticsCards = () => {
    const types = Object.values(TaskType);
    return (
      <div className="grid grid-cols-4 mb-4 gap-4">
        {types.map(type => {
          const { completedCount, count, progress, target } = getStatistics(tasks, type);
          const typeLabel = taskTypeNames[type];
          let typeIcon = '';
          if (type === TaskType.CONSULT) typeIcon = '咨询';
          else if (type === TaskType.DEVELOP) typeIcon = '开发';
          else if (type === TaskType.FOLLOW_UP) typeIcon = '回访';
          else typeIcon = '报名';
          return (
            <Card
              className="flex flex-col"
              key={type}
              size="small"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Tag
                    className="mr-2"
                    color={taskTypeColors[type]}
                  >
                    {typeIcon}
                  </Tag>
                  <span className="text-lg font-medium">{typeLabel}任务</span>
                </div>
              </div>
              <div className="mt-2 flex-1">
                <div className="mb-2 text-sm text-gray-500">完成进度</div>
                <Progress percent={Math.floor(progress)} />
                <div className="grid grid-cols-3 mt-3 text-center">
                  <div>
                    <div className="text-lg font-medium">{completedCount}</div>
                    <div className="text-xs text-gray-500">已完成</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium">{count}</div>
                    <div className="text-xs text-gray-500">总客户</div>
                  </div>
                  <div>
                    <div className="text-lg font-medium">{target}</div>
                    <div className="text-xs text-gray-500">目标</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        className="h-full"
        variant="borderless"
        extra={
          <Space>
            <Select
              style={{ width: 100 }}
              value={selectedPeriod}
              options={Object.values(StatisticsPeriod).map(period => ({
                label: periodNames[period],
                value: period
              }))}
              onChange={value => setSelectedPeriod(value)}
            />
            {currentUser.isAdmin && (
              <Button
                type="primary"
                onClick={openTargetModal}
              >
                设置目标
              </Button>
            )}
          </Space>
        }
        title={
          <div className="flex items-center">
            <span className="mr-2 text-lg font-medium">任务管理</span>
            <div className="flex gap-2">
              {selectedPeriod === StatisticsPeriod.WEEK ? <Tag color="blue">本周</Tag> : <Tag color="green">本月</Tag>}
            </div>
          </div>
        }
      >
        <StatisticsCards />

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Input
            allowClear
            placeholder="关键词搜索"
            style={{ width: 200 }}
            value={searchParams.keyword}
            onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
          />
          <Select
            allowClear
            placeholder="任务类型"
            style={{ width: 120 }}
            value={searchParams.type}
            options={Object.values(TaskType).map(type => ({
              label: <Tag color={taskTypeColors[type]}>{taskTypeNames[type]}</Tag>,
              value: type
            }))}
            onChange={value => setSearchParams({ ...searchParams, type: value })}
          />
          <Select
            allowClear
            placeholder="完成进度"
            style={{ width: 120 }}
            value={searchParams.followUpStatus}
            options={Object.values(TaskFollowUpStatus).map(status => ({
              label: followUpStatusNames[status],
              value: status
            }))}
            onChange={value => setSearchParams({ ...searchParams, followUpStatus: value })}
          />
          <DatePicker.RangePicker
            showTime
            style={{ width: 380 }}
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
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={openAddModal}
          >
            新增任务
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          {...getFullTableConfig(10)}
        />

        <Modal
          open={isModalVisible}
          title="新增任务"
          onCancel={handleCancel}
          onOk={handleSubmit}
        >
          <Form
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="任务类型"
              name="type"
              rules={[{ message: '请选择任务类型', required: true }]}
            >
              <Select
                placeholder="请选择任务类型"
                options={Object.values(TaskType).map(type => ({
                  label: taskTypeNames[type],
                  value: type
                }))}
              />
            </Form.Item>
            <Form.Item
              label="培训项目"
              name="projectName"
              rules={[{ message: '请输入培训项目名称', required: true }]}
            >
              <Input placeholder="请输入培训项目名称" />
            </Form.Item>
            <Form.Item
              label="任务名称"
              name="name"
              rules={[{ message: '请输入任务名称', required: true }]}
            >
              <Input placeholder="请输入任务名称" />
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
              label="数量"
              name="count"
              rules={[{ message: '请输入数量', required: true }]}
            >
              <Input
                min={1}
                placeholder="请输入数量"
                type="number"
              />
            </Form.Item>
            <Form.Item
              initialValue={TaskFollowUpStatus.NOT_STARTED}
              label="跟进状态"
              name="followUpStatus"
              rules={[{ message: '请选择跟进状态', required: true }]}
            >
              <Select
                placeholder="请选择跟进状态"
                options={Object.values(TaskFollowUpStatus).map(status => ({
                  label: followUpStatusNames[status],
                  value: status
                }))}
              />
            </Form.Item>
            <Form.Item
              label="事件时间"
              name="eventTime"
              rules={[{ message: '请选择事件时间', required: true }]}
            >
              <DatePicker
                showTime
                placeholder="请选择事件时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          open={isTargetModalVisible}
          title="设置目标"
          onCancel={handleTargetCancel}
          onOk={handleTargetSubmit}
        >
          <Form
            form={targetForm}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="任务类型"
              name="type"
              rules={[{ message: '请选择任务类型', required: true }]}
            >
              <Select
                placeholder="请选择任务类型"
                options={Object.values(TaskType).map(type => ({
                  label: taskTypeNames[type],
                  value: type
                }))}
              />
            </Form.Item>
            <Form.Item
              label="目标数量"
              name="target"
              rules={[{ message: '请输入目标数量', required: true }]}
            >
              <Input
                min={1}
                placeholder="请输入目标数量"
                type="number"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 备注编辑弹窗 */}
        <Modal
          open={isRemarkModalVisible}
          title="设置备注"
          onCancel={handleRemarkCancel}
          onOk={handleRemarkSubmit}
        >
          <Form
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
          >
            <Form.Item label="备注">
              <Input.TextArea
                placeholder="请输入备注"
                rows={4}
                value={remark}
                onChange={e => setRemark(e.target.value)}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 客户列表弹窗 */}
        <Modal
          footer={null}
          open={isCustomerModalVisible}
          title={customerModalTitle}
          width={1200}
          onCancel={() => setIsCustomerModalVisible(false)}
        >
          <Table
            columns={customerColumns}
            dataSource={selectedTaskCustomers}
            rowKey="id"
            {...getFullTableConfig(10)}
          />
        </Modal>
      </Card>
    </div>
  );
};

export default TaskManagement;
