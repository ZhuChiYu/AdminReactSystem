import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import {
  FollowUpStatus,
  type ProjectItem,
  type StatisticsData,
  StatisticsPeriod,
  TaskType,
  followUpStatusColors,
  followUpStatusNames,
  periodNames,
  taskTypeColors,
  taskTypeNames
} from '../types';

/** 我的事项组件 */
const MyTasks = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<ProjectItem[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ProjectItem[]>([]);
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<StatisticsPeriod>(StatisticsPeriod.WEEK);
  const [targetForm] = Form.useForm();

  // 模拟当前用户信息
  const currentUser = {
    department: '销售部',
    id: 1,
    isAdmin: false,
    name: '张三'
  };

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    followUpStatus: '',
    keyword: '',
    timeRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    type: ''
  });

  // 获取统计数据
  const getStatistics = (data: ProjectItem[], type: TaskType): StatisticsData => {
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
      .filter(task => task.followUpStatus === FollowUpStatus.COMPLETED)
      .reduce((sum, task) => sum + task.count, 0);
    const target = typeRecords[0]?.target || 0;

    return {
      completedCount,
      count: totalCount,
      progress: target ? Math.min(100, (completedCount / target) * 100) : 0,
      target
    };
  };

  // 模拟获取事项列表
  const fetchTasks = () => {
    setLoading(true);

    // 模拟API请求
    setTimeout(() => {
      const mockData: ProjectItem[] = [
        {
          count: 5,
          createdAt: '2024-03-20 14:30:00',
          description: '接待新客户咨询课程情况',
          employeeId: 1,
          employeeName: '张三',
          eventTime: '2024-03-20 14:30:00',
          followUpStatus: FollowUpStatus.COMPLETED,
          id: 1,
          name: '新客户咨询',
          projectName: '企业定制培训项目A',
          remark: '本周表现优秀，奖励',
          target: 50,
          type: TaskType.CONSULT
        },
        {
          count: 2,
          createdAt: '2024-03-20 15:45:00',
          description: '处理新学员报名事宜',
          employeeId: 1,
          employeeName: '张三',
          eventTime: '2024-03-20 15:45:00',
          followUpStatus: FollowUpStatus.IN_PROGRESS,
          id: 2,
          name: '课程报名',
          projectName: '北京大学专项培训',
          target: 20,
          type: TaskType.REGISTER
        },
        {
          count: 3,
          createdAt: '2024-03-21 09:30:00',
          description: '开发新课程计划',
          employeeId: 1,
          employeeName: '张三',
          eventTime: '2024-03-21 09:30:00',
          followUpStatus: FollowUpStatus.NOT_STARTED,
          id: 3,
          name: '新课程开发',
          projectName: '企业培训项目B',
          target: 30,
          type: TaskType.DEVELOP
        },
        {
          count: 4,
          createdAt: '2024-03-22 11:00:00',
          description: '回访客户了解需求',
          employeeId: 1,
          employeeName: '张三',
          eventTime: '2024-03-22 11:00:00',
          followUpStatus: FollowUpStatus.COMPLETED,
          id: 4,
          name: '客户回访',
          projectName: '上海企业培训项目',
          target: 40,
          type: TaskType.FOLLOW_UP
        }
      ];

      // 只显示当前用户的事项
      const filteredData = mockData.filter(task => task.employeeId === currentUser.id);

      setTasks(filteredData);
      setFilteredTasks(filteredData);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const { followUpStatus, keyword, timeRange, type } = searchParams;
    let filtered = [...tasks];

    if (keyword) {
      filtered = filtered.filter(
        task =>
          task.name.toLowerCase().includes(keyword.toLowerCase()) ||
          task.description.toLowerCase().includes(keyword.toLowerCase()) ||
          task.projectName.toLowerCase().includes(keyword.toLowerCase())
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

  // 打开目标设置弹窗
  const openTargetModal = () => {
    targetForm.resetFields();
    setIsTargetModalVisible(true);
  };

  // 关闭目标设置弹窗
  const handleTargetCancel = () => {
    setIsTargetModalVisible(false);
  };

  // 提交目标设置
  const handleTargetSubmit = () => {
    targetForm.validateFields().then(_values => {
      // 向后端发送目标设置请求
      message.success('目标设置申请已提交，等待管理员审核');
      setIsTargetModalVisible(false);
    });
  };

  // 更新任务状态
  const handleStatusChange = (taskId: number, followUpStatus: FollowUpStatus) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, followUpStatus };
      }
      return task;
    });

    setTasks(updatedTasks);
    setFilteredTasks(updatedTasks);
    message.success('状态更新成功');
  };

  // 周/月统计摘要
  const getSummary = () => {
    const types = Object.values(TaskType);
    const summary = types.map(type => getStatistics(tasks, type));

    // 计算总计
    const totalCount = summary.reduce((sum, data) => sum + data.count, 0);
    const totalCompleted = summary.reduce((sum, data) => sum + data.completedCount, 0);
    const totalTarget = summary.reduce((sum, data) => sum + data.target, 0);
    const totalProgress = totalTarget ? Math.min(100, (totalCompleted / totalTarget) * 100) : 0;

    return {
      summary,
      total: {
        completedCount: totalCompleted,
        count: totalCount,
        progress: totalProgress,
        target: totalTarget
      }
    };
  };

  // 表格列定义
  const columns = [
    {
      dataIndex: 'type',
      key: 'type',
      render: (type: TaskType) => <Tag color={taskTypeColors[type]}>{taskTypeNames[type]}</Tag>,
      title: '类型',
      width: 100
    },
    {
      dataIndex: 'projectName',
      key: 'projectName',
      title: '培训项目',
      width: 180
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
      dataIndex: 'count',
      key: 'count',
      title: '数量',
      width: 80
    },
    {
      dataIndex: 'target',
      key: 'target',
      title: '目标',
      width: 80
    },
    {
      key: 'progress',
      render: (_: any, record: ProjectItem) => {
        const { count, target } = record;
        const progress = target ? Math.min(100, (count / target) * 100) : 0;
        return (
          <div>
            <Progress
              percent={Math.floor(progress)}
              status={record.followUpStatus === FollowUpStatus.COMPLETED ? 'success' : 'normal'}
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
      render: (status: FollowUpStatus) => <Tag color={followUpStatusColors[status]}>{followUpStatusNames[status]}</Tag>,
      title: '跟进状态',
      width: 100
    },
    {
      dataIndex: 'eventTime',
      key: 'eventTime',
      title: '事件时间',
      width: 180
    },
    {
      dataIndex: 'remark',
      ellipsis: true,
      key: 'remark',
      title: '管理员备注',
      width: 200
    },
    {
      key: 'action',
      render: (_: unknown, record: ProjectItem) => (
        <Space size="small">
          {record.followUpStatus !== FollowUpStatus.COMPLETED && (
            <Button
              size="small"
              type="link"
              onClick={() => handleStatusChange(record.id, FollowUpStatus.COMPLETED)}
            >
              完成
            </Button>
          )}
          {record.followUpStatus === FollowUpStatus.NOT_STARTED && (
            <Button
              size="small"
              type="link"
              onClick={() => handleStatusChange(record.id, FollowUpStatus.IN_PROGRESS)}
            >
              进行中
            </Button>
          )}
        </Space>
      ),
      title: '操作',
      width: 150
    }
  ];

  // 统计卡片
  const StatisticsCards = () => {
    const types = Object.values(TaskType);
    const { summary, total } = getSummary();

    return (
      <>
        <Card
          className="mb-4"
          title={`${selectedPeriod === StatisticsPeriod.WEEK ? '本周' : '本月'}总计`}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总数量"
                value={total.count}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="完成数量"
                value={total.completedCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="目标数量"
                value={total.target}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                suffix="%"
                title="完成率"
                value={total.progress.toFixed(1)}
                valueStyle={{ color: total.progress >= 100 ? '#52c41a' : '#1890ff' }}
              />
            </Col>
          </Row>
          <div className="mt-4">
            <Progress
              percent={Math.floor(total.progress)}
              status={total.progress >= 100 ? 'success' : 'active'}
            />
          </div>
        </Card>

        <div className="grid grid-cols-4 mb-4 gap-4">
          {types.map((type, index) => {
            const { completedCount, count, progress, target } = summary[index];
            return (
              <Card
                key={type}
                size="small"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">{taskTypeNames[type]}</span>
                  <Tag color={taskTypeColors[type]}>{selectedPeriod === StatisticsPeriod.WEEK ? '本周' : '本月'}</Tag>
                </div>
                <div className="mt-2">
                  <Progress percent={Math.floor(progress)} />
                  <div className="mt-1 text-sm text-gray-500">
                    <div>{`总数：${count}`}</div>
                    <div>{`已完成：${completedCount}`}</div>
                    <div>{`目标：${target}`}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="h-full bg-white dark:bg-[#141414]">
      <Card
        variant="borderless"
        className="h-full"
        title="我的事项"
        extra={
          <Button
            icon={<SettingOutlined />}
            type="primary"
            onClick={openTargetModal}
          >
            申请设置目标
          </Button>
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
            placeholder="事项类型"
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
            placeholder="跟进状态"
            style={{ width: 120 }}
            value={searchParams.followUpStatus}
            options={Object.values(FollowUpStatus).map(status => ({
              label: followUpStatusNames[status],
              value: status
            }))}
            onChange={value => setSearchParams({ ...searchParams, followUpStatus: value })}
          />
          <DatePicker.RangePicker
            style={{ width: 280 }}
            value={searchParams.timeRange}
            onChange={value =>
              setSearchParams({ ...searchParams, timeRange: value as [dayjs.Dayjs, dayjs.Dayjs] | null })
            }
          />
          <Select
            style={{ width: 100 }}
            value={selectedPeriod}
            options={Object.values(StatisticsPeriod).map(period => ({
              label: periodNames[period],
              value: period
            }))}
            onChange={value => setSelectedPeriod(value)}
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
          scroll={{ x: 1800, y: 'calc(100vh - 550px)' }}
        />

        <Modal
          open={isTargetModalVisible}
          title="申请设置目标"
          onCancel={handleTargetCancel}
          onOk={handleTargetSubmit}
        >
          <Form
            form={targetForm}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              label="事项类型"
              name="type"
              rules={[{ message: '请选择事项类型', required: true }]}
            >
              <Select
                placeholder="请选择事项类型"
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
            <Form.Item
              label="申请理由"
              name="reason"
              rules={[{ message: '请输入申请理由', required: true }]}
            >
              <Input.TextArea
                placeholder="请输入申请理由"
                rows={3}
              />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default MyTasks;
