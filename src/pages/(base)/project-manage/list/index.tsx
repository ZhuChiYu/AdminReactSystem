import { SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Pagination,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useEffect, useState } from 'react';

import type { CustomerApi } from '@/service/api';
import { customerService } from '@/service/api';
import { taskStatsService } from '@/service/api/taskStats';
import type { EmployeeTaskStats } from '@/service/api/taskStats';
import { getCurrentUserId, isAdmin, isSuperAdmin } from '@/utils/auth';
import { localStg } from '@/utils/storage';
import { getActionColumnConfig, getCenterColumnConfig } from '@/utils/table';

// 扩展dayjs插件
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

/** 跟进状态枚举 */
export enum FollowUpStatus {
  ARRIVED = 'arrived',
  CONSULT = 'consult',
  EARLY_25 = 'early_25',
  EFFECTIVE_VISIT = 'effective_visit',
  NEW_DEVELOP = 'new_develop',
  NOT_ARRIVED = 'not_arrived',
  REGISTERED = 'registered',
  REJECTED = 'rejected',
  VIP = 'vip',
  WECHAT_ADDED = 'wechat_added'
}

/** 跟进状态中文映射 */
const followUpStatusNames = {
  [FollowUpStatus.ARRIVED]: '已到访',
  [FollowUpStatus.CONSULT]: '咨询中',
  [FollowUpStatus.EARLY_25]: '提前25%',
  [FollowUpStatus.EFFECTIVE_VISIT]: '有效回访',
  [FollowUpStatus.NEW_DEVELOP]: '新开发',
  [FollowUpStatus.NOT_ARRIVED]: '未到访',
  [FollowUpStatus.REGISTERED]: '已报名',
  [FollowUpStatus.REJECTED]: '已拒绝',
  [FollowUpStatus.VIP]: 'VIP客户',
  [FollowUpStatus.WECHAT_ADDED]: '已加微信',
  empty: '-'
};

/** 跟进状态颜色映射 */
const followUpStatusColors = {
  [FollowUpStatus.ARRIVED]: 'success',
  [FollowUpStatus.CONSULT]: 'blue',
  [FollowUpStatus.EARLY_25]: 'orange',
  [FollowUpStatus.EFFECTIVE_VISIT]: 'cyan',
  [FollowUpStatus.NEW_DEVELOP]: 'purple',
  [FollowUpStatus.NOT_ARRIVED]: 'default',
  [FollowUpStatus.REGISTERED]: 'green',
  [FollowUpStatus.REJECTED]: 'red',
  [FollowUpStatus.VIP]: 'gold',
  [FollowUpStatus.WECHAT_ADDED]: 'lime'
};

/** 客户来源中文映射 */
const customerSourceNames = {
  import: '导入',
  manual: '手动录入',
  offline: '线下获取',
  online: '线上获取',
  phone: '电话',
  referral: '推荐',
  visit: '拜访',
  wechat: '微信'
};

// 工具函数：根据年份和周数获取日期范围
const getWeekDateRange = (
  year: number,
  weekNumber: number
): { end: dayjs.Dayjs; endDate: string; start: dayjs.Dayjs; startDate: string } => {
  // 获取指定年份第一天
  const firstDayOfYear = dayjs().year(year).startOf('year');

  // 计算指定周的开始日期（周一）
  const weekStart = firstDayOfYear.isoWeek(weekNumber).startOf('isoWeek');
  const weekEnd = weekStart.endOf('isoWeek');

  return {
    end: weekEnd,
    endDate: weekEnd.format('MM月DD日'),
    start: weekStart,
    startDate: weekStart.format('MM月DD日')
  };
};

/** 统计周期枚举 */
enum StatisticsPeriod {
  MONTH = 'month',
  WEEK = 'week'
}

/** 任务类型枚举 */
enum TaskType {
  CONSULT = 'consult', // 咨询任务
  FOLLOW_UP = 'effective_visit', // 回访任务
  DEVELOP = 'new_develop', // 开发任务
  REGISTER = 'registered' // 报名任务
}

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

// 工具函数：获取当前周期显示信息
const getCurrentPeriodInfo = (period: StatisticsPeriod): string => {
  const now = dayjs();
  const year = now.year();

  if (period === StatisticsPeriod.MONTH) {
    const month = now.month() + 1;
    return `${year}年${month}月`;
  }
  const week = now.isoWeek();
  const { endDate, startDate } = getWeekDateRange(year, week);
  return `${year}年第${week}周 (${startDate}-${endDate})`;
};

/** 统计周期名称 */
const periodNames = {
  [StatisticsPeriod.WEEK]: '周统计',
  [StatisticsPeriod.MONTH]: '月统计'
};

/** 任务跟进状态枚举 */
enum TaskFollowUpStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_STARTED = 'not_started'
}

/** 跟进状态名称 */
const taskFollowUpStatusNames = {
  [TaskFollowUpStatus.NOT_STARTED]: '未开始',
  [TaskFollowUpStatus.IN_PROGRESS]: '进行中',
  [TaskFollowUpStatus.COMPLETED]: '已完成'
};

/** 跟进状态颜色 */
const taskFollowUpStatusColors = {
  [TaskFollowUpStatus.NOT_STARTED]: 'default',
  [TaskFollowUpStatus.IN_PROGRESS]: 'processing',
  [TaskFollowUpStatus.COMPLETED]: 'success'
};

/** 任务记录接口 */
interface TaskRecord {
  completedCount: number;
  customers: CustomerApi.CustomerListItem[];
  description: string;
  dueDate: string;
  followUpStatus: TaskFollowUpStatus;
  id: number;
  name: string;
  remark?: string;
  targetCount: number;
  totalCount: number;
  type: TaskType;
}

/** 任务管理组件 */
const TaskManagement = () => {
  const [isRemarkModalVisible, setIsRemarkModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isFollowUpModalVisible, setIsFollowUpModalVisible] = useState(false);
  const [selectedTaskCustomers, setSelectedTaskCustomers] = useState<CustomerApi.CustomerListItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerApi.CustomerListItem | null>(null);
  const [customerModalTitle, setCustomerModalTitle] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<StatisticsPeriod>(StatisticsPeriod.WEEK);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [remark, setRemark] = useState('');
  const [taskTargets, setTaskTargets] = useState<Record<TaskType, number>>({
    [TaskType.CONSULT]: 0,
    [TaskType.DEVELOP]: 0,
    [TaskType.FOLLOW_UP]: 0,
    [TaskType.REGISTER]: 0
  });
  const [followUpForm] = Form.useForm();

  // 任务数据
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskRecord[]>([]);

  // 团队任务统计数据
  const [teamTaskStats, setTeamTaskStats] = useState<EmployeeTaskStats[]>([]);
  const [teamStatsLoading, setTeamStatsLoading] = useState(false);
  const [showTeamStats, setShowTeamStats] = useState(true);
  const [teamSearchKeyword, setTeamSearchKeyword] = useState('');
  const [teamPagination, setTeamPagination] = useState({
    current: 1,
    pages: 0,
    size: 6,
    // 每页显示6个员工
    total: 0
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    followUpStatus: '',
    keyword: '',
    timeRange: null as RangePickerProps['value'],
    type: ''
  });

  // 用户权限检查
  const userInfo = localStg.get('userInfo');
  const currentUserId = getCurrentUserId();
  const isManagerOrAdmin = isAdmin() || isSuperAdmin();
  const canViewTeamStats = isManagerOrAdmin;

  // 获取当前周数（ISO周数）
  const getCurrentWeekNumber = (): number => {
    const now = dayjs();
    return now.isoWeek();
  };

  // 根据客户数据生成任务统计
  const generateTasksFromCustomers = (
    customerList: CustomerApi.CustomerListItem[],
    currentTargets?: Record<TaskType, number>
  ) => {
    const currentDate = dayjs();
    const weekEnd = currentDate.endOf('week');

    // 使用传入的目标或当前状态中的目标
    const targets = currentTargets || taskTargets;

    // 按状态分组客户
    const consultCustomers = customerList.filter(c => c.followStatus === FollowUpStatus.CONSULT);
    const developCustomers = customerList.filter(c => c.followStatus === FollowUpStatus.NEW_DEVELOP);
    const followUpCustomers = customerList.filter(c => c.followStatus === FollowUpStatus.EFFECTIVE_VISIT);
    const registerCustomers = customerList.filter(c => c.followStatus === FollowUpStatus.REGISTERED);

    const generatedTasks: TaskRecord[] = [
      {
        completedCount: 0,
        customers: consultCustomers,
        description: '处理新客户咨询课程情况',
        dueDate: weekEnd.format('YYYY-MM-DD'),
        followUpStatus: TaskFollowUpStatus.IN_PROGRESS,
        id: 1,
        name: '咨询任务',
        targetCount: targets[TaskType.CONSULT],
        totalCount: consultCustomers.length,
        type: TaskType.CONSULT
      },
      {
        completedCount: 0,
        customers: developCustomers,
        description: '开发新课程计划',
        dueDate: weekEnd.format('YYYY-MM-DD'),
        followUpStatus: TaskFollowUpStatus.IN_PROGRESS,
        id: 2,
        name: '开发任务',
        targetCount: targets[TaskType.DEVELOP],
        totalCount: developCustomers.length,
        type: TaskType.DEVELOP
      },
      {
        completedCount: 0,
        customers: followUpCustomers,
        description: '进行客户回访和跟进',
        dueDate: weekEnd.format('YYYY-MM-DD'),
        followUpStatus: TaskFollowUpStatus.IN_PROGRESS,
        id: 3,
        name: '回访任务',
        targetCount: targets[TaskType.FOLLOW_UP],
        totalCount: followUpCustomers.length,
        type: TaskType.FOLLOW_UP
      },
      {
        completedCount: 0,
        customers: registerCustomers,
        description: '培训课程报名审核',
        dueDate: weekEnd.format('YYYY-MM-DD'),
        followUpStatus: TaskFollowUpStatus.IN_PROGRESS,
        id: 4,
        name: '报名任务',
        targetCount: targets[TaskType.REGISTER],
        totalCount: registerCustomers.length,
        type: TaskType.REGISTER
      }
    ];

    setTasks(generatedTasks);
    setFilteredTasks(generatedTasks);
  };

  // 获取客户数据
  const fetchCustomerData = async (currentTargets?: Record<TaskType, number>) => {
    try {
      // 获取当前用户管理的所有客户数据
      const customerData = await customerService.getCustomerList({
        current: 1,
        scope: 'own', // 只获取当前用户管理的客户
        size: 1000
      });

      // 转换数据格式以匹配前端类型
      const formattedCustomers = customerData.records.map(customer => ({
        ...customer,
        canViewEmail: true,
        canViewMobile: true,
        canViewPhone: true,
        canViewRealName: true,
        // 兼容性映射
        createTime: customer.createdAt,
        customerLevel: customer.level,
        employee: customer.assignedTo,
        followContent: customer.remark || '暂无跟进内容',
        updateTime: customer.updatedAt
      }));

      // 根据客户数据生成任务统计，传入最新的目标数据
      generateTasksFromCustomers(formattedCustomers, currentTargets);
    } catch (error) {
      message.error('获取数据失败');
    }
  };

  // 修改客户跟进状态
  const updateCustomerFollowStatus = async (customerId: number, newStatus: FollowUpStatus) => {
    try {
      // 这里应该调用后端API更新客户跟进状态
      // 暂时模拟API调用

      // 模拟API调用成功
      message.success('跟进状态更新成功');

      // 重新获取客户数据以更新统计
      await fetchCustomerData();

      // 关闭弹窗
      setIsFollowUpModalVisible(false);
      setSelectedCustomer(null);
      followUpForm.resetFields();
    } catch (error) {
      console.error('❌ 更新跟进状态失败:', error);
      message.error('更新失败，请重试');
    }
  };

  // 加载任务目标数据（支持周/月统计）
  const loadTaskTargets = async () => {
    try {
      // 调用新的API获取用户的任务目标和统计
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const week = getCurrentWeekNumber();

      const stats = await taskStatsService.getUserTaskStats(
        year,
        selectedPeriod === 'month' ? month : undefined,
        selectedPeriod === 'week' ? week : undefined,
        selectedPeriod
      );

      const newTargets = {
        [TaskType.CONSULT]: stats.targets.consultTarget,
        [TaskType.FOLLOW_UP]: stats.targets.followUpTarget,
        [TaskType.DEVELOP]: stats.targets.developTarget,
        [TaskType.REGISTER]: stats.targets.registerTarget
      };

      setTaskTargets(newTargets);
      return newTargets;
    } catch (error) {
      console.error('❌ 加载目标数据失败:', error);
      // 如果API调用失败，使用默认值
      const defaultTargets = {
        [TaskType.CONSULT]: 0,
        [TaskType.DEVELOP]: 0,
        [TaskType.FOLLOW_UP]: 0,
        [TaskType.REGISTER]: 0
      };
      setTaskTargets(defaultTargets);
      return defaultTargets;
    }
  };

  // 获取团队任务统计（支持周/月统计）
  const loadTeamTaskStats = async (current?: number, size?: number, keyword?: string) => {
    if (!canViewTeamStats) return;

    setTeamStatsLoading(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const week = getCurrentWeekNumber();

      const searchCurrent = current || teamPagination.current;
      const searchSize = size || teamPagination.size;
      const searchKeyword = keyword !== undefined ? keyword : teamSearchKeyword;

      const response = await taskStatsService.getTeamTaskStats(
        year,
        selectedPeriod === 'month' ? month : undefined,
        selectedPeriod === 'week' ? week : undefined,
        selectedPeriod,
        searchCurrent,
        searchSize,
        searchKeyword
      );

      setTeamTaskStats(response.teamStats);
      setTeamPagination({
        current: response.pagination.current,
        pages: response.pagination.pages,
        size: response.pagination.size,
        total: response.pagination.total
      });
    } catch (error) {
      message.error('获取团队任务统计失败');
    } finally {
      setTeamStatsLoading(false);
    }
  };

  // 处理团队搜索
  const handleTeamSearch = () => {
    setTeamPagination(prev => ({ ...prev, current: 1 })); // 搜索时重置到第一页
    loadTeamTaskStats(1, teamPagination.size, teamSearchKeyword);
  };

  // 重置团队搜索
  const resetTeamSearch = () => {
    setTeamSearchKeyword('');
    setTeamPagination(prev => ({ ...prev, current: 1 })); // 重置时重置到第一页
    loadTeamTaskStats(1, teamPagination.size, '');
  };

  // 处理团队分页变化
  const handleTeamPaginationChange = (page: number, pageSize: number) => {
    loadTeamTaskStats(page, pageSize, teamSearchKeyword);
  };

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      // 先加载目标数据
      const currentTargets = await loadTaskTargets();
      // 再获取客户数据并生成任务
      await fetchCustomerData(currentTargets);
      // 如果是管理员，加载团队任务统计
      if (canViewTeamStats) {
        await loadTeamTaskStats();
      }
    };

    initializeData();
  }, []);

  // 监听周期变化，重新加载数据
  useEffect(() => {
    const reloadDataOnPeriodChange = async () => {
      // 重新加载目标数据
      const currentTargets = await loadTaskTargets();
      // 重新获取客户数据并生成任务
      await fetchCustomerData(currentTargets);
      // 如果是管理员，重新加载团队任务统计
      if (canViewTeamStats) {
        // 重置分页到第一页
        setTeamPagination(prev => ({ ...prev, current: 1 }));
        await loadTeamTaskStats(1, teamPagination.size, teamSearchKeyword);
      }
    };

    // 跳过初始化时的调用，只在周期真正改变时重新加载
    if (selectedPeriod) {
      reloadDataOnPeriodChange();
    }
  }, [selectedPeriod]);

  // 当任务数据变化时更新列表和分页
  useEffect(() => {
    setFilteredTasks(tasks);
    setPagination(prev => ({
      ...prev,
      total: tasks.length
    }));
  }, [tasks]);

  // 处理分页变化
  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize
    }));
  };

  // 获取当前页的数据
  const getCurrentPageData = () => {
    const { current, pageSize } = pagination;
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTasks.slice(startIndex, endIndex);
  };

  // 获取统计数据
  const getStatistics = (data: TaskRecord[], type: TaskType) => {
    const now = dayjs();
    const filtered = data.filter(task => {
      const taskTime = dayjs(task.dueDate);
      if (selectedPeriod === StatisticsPeriod.WEEK) {
        return taskTime.isSame(now, 'week');
      }
      return taskTime.isSame(now, 'month');
    });

    const typeRecords = filtered.filter(task => task.type === type);
    const totalCount = typeRecords.reduce((sum, task) => sum + task.totalCount, 0);
    const completedCount = typeRecords
      .filter(task => task.followUpStatus === TaskFollowUpStatus.COMPLETED)
      .reduce((sum, task) => sum + task.completedCount, 0);

    // 直接使用当前周期的目标值，确保显示的是周目标或月目标
    const target = taskTargets[type];

    return {
      completedCount,
      count: totalCount,
      progress: target && target > 0 ? (totalCount / target) * 100 : 0,
      target
    };
  };

  // 搜索功能
  const handleSearch = () => {
    let filtered = tasks;

    // 关键词搜索
    if (searchParams.keyword) {
      filtered = filtered.filter(
        task => task.name.includes(searchParams.keyword) || task.description.includes(searchParams.keyword)
      );
    }

    // 类型筛选
    if (searchParams.type) {
      filtered = filtered.filter(task => task.type === searchParams.type);
    }

    // 跟进状态筛选
    if (searchParams.followUpStatus) {
      filtered = filtered.filter(task => task.followUpStatus === searchParams.followUpStatus);
    }

    // 时间范围筛选
    if (searchParams.timeRange && searchParams.timeRange.length === 2) {
      const [start, end] = searchParams.timeRange;
      filtered = filtered.filter(task => {
        const dueDate = dayjs(task.dueDate);
        return dueDate.isAfter(start) && dueDate.isBefore(end);
      });
    }

    setFilteredTasks(filtered);
    // 重置分页到第一页
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: filtered.length
    }));
  };

  const resetSearch = () => {
    setSearchParams({
      followUpStatus: '',
      keyword: '',
      timeRange: null,
      type: ''
    });
    setFilteredTasks(tasks);
    // 重置分页
    setPagination(prev => ({
      ...prev,
      current: 1,
      total: tasks.length
    }));
  };

  // 打开备注弹窗
  const openRemarkModal = (task: TaskRecord) => {
    setSelectedTask(task);
    setRemark(task.remark || '');
    setIsRemarkModalVisible(true);
  };

  // 查看客户列表
  const handleCountClick = (task: TaskRecord) => {
    setCustomerModalTitle(`${task.name} - 客户列表`);
    setSelectedTaskCustomers(task.customers);
    setIsCustomerModalVisible(true);
  };

  // 打开跟进状态修改弹窗
  const handleEditFollowUpStatus = (customer: CustomerApi.CustomerListItem) => {
    setSelectedCustomer(customer);
    followUpForm.setFieldsValue({
      followStatus: customer.followStatus
    });
    setIsFollowUpModalVisible(true);
  };

  const handleRemarkCancel = () => {
    setIsRemarkModalVisible(false);
    setSelectedTask(null);
    setRemark('');
  };

  const handleFollowUpCancel = () => {
    setIsFollowUpModalVisible(false);
    setSelectedCustomer(null);
    followUpForm.resetFields();
  };

  // 提交跟进状态修改
  const handleFollowUpSubmit = () => {
    followUpForm
      .validateFields()
      .then(async values => {
        if (selectedCustomer) {
          await updateCustomerFollowStatus(selectedCustomer.id, values.followStatus);
        }
      })
      .catch(info => {});
  };

  // 提交备注
  const handleRemarkSubmit = () => {
    if (selectedTask) {
      // 更新任务备注
      const updatedTasks = tasks.map(task => (task.id === selectedTask.id ? { ...task, remark } : task));
      setTasks(updatedTasks);
      message.success('备注修改成功');
      setIsRemarkModalVisible(false);
      setSelectedTask(null);
      setRemark('');
    }
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
      width: 120
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
      dataIndex: 'totalCount',
      key: 'totalCount',
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
      dataIndex: 'targetCount',
      key: 'targetCount',
      ...getCenterColumnConfig(),
      title: '目标',
      width: 80
    },
    {
      key: 'progress',
      ...getCenterColumnConfig(),
      render: (_: any, record: TaskRecord) => {
        const { targetCount, totalCount } = record;
        const progress = targetCount && targetCount > 0 ? (totalCount / targetCount) * 100 : 0;
        const displayProgress = Math.floor(progress);
        const status = progress >= 100 ? 'success' : 'normal';

        return (
          <div>
            <Progress
              percent={displayProgress}
              status={status}
            />
            <div className="text-xs text-gray-500">{`${totalCount}/${targetCount}`}</div>
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
        <Tag color={taskFollowUpStatusColors[status]}>{taskFollowUpStatusNames[status]}</Tag>
      ),
      title: '跟进状态',
      width: 100
    },
    {
      dataIndex: 'dueDate',
      key: 'dueDate',
      ...getCenterColumnConfig(),
      title: '截止时间',
      width: 180
    },
    {
      dataIndex: 'remark',
      key: 'remark',
      ...getCenterColumnConfig(),
      render: (text: string, record: TaskRecord) => (
        <div className="flex items-center justify-center">
          <span
            className="mr-2 truncate"
            style={{ maxWidth: '150px' }}
          >
            {text || '-'}
          </span>
          <Button
            size="small"
            type="link"
            onClick={() => openRemarkModal(record)}
          >
            {text ? '编辑' : '添加'}
          </Button>
        </div>
      ),
      title: '备注',
      width: 200
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
      dataIndex: 'customerName',
      key: 'customerName',
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
      render: (source: string) => customerSourceNames[source as keyof typeof customerSourceNames] || source,
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
      render: (status: FollowUpStatus) => {
        if (status === 'empty') {
          return <span style={{ color: '#8c8c8c' }}>-</span>;
        }
        const statusText = followUpStatusNames[status] || status;
        const color = followUpStatusColors[status] || 'default';
        return <Tag color={color}>{statusText}</Tag>;
      },
      title: '状态',
      width: 100
    },
    {
      dataIndex: 'updateTime',
      key: 'updateTime',
      ...getCenterColumnConfig(),
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
      title: '修改时间',
      width: 180
    },
    {
      key: 'action',
      ...getActionColumnConfig(120),
      render: (_: unknown, record: CustomerApi.CustomerListItem) => (
        <Button
          size="small"
          type="link"
          onClick={() => handleEditFollowUpStatus(record)}
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
    <div className="space-y-6">
      <Card
        className="shadow-md"
        extra={
          <Space>
            <Select
              style={{ width: 280 }}
              value={selectedPeriod}
              options={[
                {
                  label: `本周 (${(() => {
                    const now = dayjs();
                    const { endDate, startDate } = getWeekDateRange(now.year(), now.isoWeek());
                    return `${startDate}-${endDate}`;
                  })()})`,
                  value: StatisticsPeriod.WEEK
                },
                {
                  label: `本月 (${dayjs().format('YYYY年MM月')})`,
                  value: StatisticsPeriod.MONTH
                }
              ]}
              onChange={value => setSelectedPeriod(value)}
            />
          </Space>
        }
        title={
          <div className="flex items-center">
            <span className="mr-2 text-lg font-medium">任务管理</span>
            <div className="flex gap-2">
              <Tag color={selectedPeriod === StatisticsPeriod.WEEK ? 'blue' : 'green'}>
                {getCurrentPeriodInfo(selectedPeriod)}
              </Tag>
            </div>
          </div>
        }
      >
        <StatisticsCards />

        {/* 团队任务统计 */}
        {canViewTeamStats && (
          <Card className="mt-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg font-medium">团队任务统计</span>
                <Tag
                  className="ml-2"
                  color="blue"
                >
                  {isSuperAdmin() ? '全部员工' : '管理员工'}
                </Tag>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  allowClear
                  placeholder="搜索员工姓名"
                  style={{ width: 200 }}
                  value={teamSearchKeyword}
                  onChange={e => setTeamSearchKeyword(e.target.value)}
                  onPressEnter={handleTeamSearch}
                />
                <Button
                  icon={<SearchOutlined />}
                  onClick={handleTeamSearch}
                >
                  搜索
                </Button>
                <Button onClick={resetTeamSearch}>重置</Button>
                <Button
                  loading={teamStatsLoading}
                  size="small"
                  type="primary"
                  onClick={() => loadTeamTaskStats()}
                >
                  刷新统计
                </Button>
                <Button
                  size="small"
                  type="text"
                  onClick={() => setShowTeamStats(!showTeamStats)}
                >
                  {showTeamStats ? '隐藏' : '显示'}
                </Button>
              </div>
            </div>

            {showTeamStats && (
              <div className="space-y-4">
                {teamTaskStats.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    {teamStatsLoading ? '加载中...' : teamSearchKeyword ? '未找到匹配的员工' : '暂无团队数据'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
                    {teamTaskStats.map((stat, index) => (
                      <Card
                        className="border border-gray-200"
                        key={stat.employee.id}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{stat.employee.nickName}</div>
                              <div className="text-sm text-gray-500">{stat.employee.roleName}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded bg-blue-50 p-2 text-center">
                              <div className="text-sm text-blue-600">咨询</div>
                              <div className="text-lg font-medium">{stat.completions.consultCount}</div>
                              <div className="text-xs text-gray-500">/{stat.targets.consultTarget}</div>
                              <Progress
                                percent={stat.progress.consultProgress}
                                showInfo={false}
                                size="small"
                                strokeColor="#1890ff"
                              />
                            </div>

                            <div className="rounded bg-green-50 p-2 text-center">
                              <div className="text-sm text-green-600">报名</div>
                              <div className="text-lg font-medium">{stat.completions.registerCount}</div>
                              <div className="text-xs text-gray-500">/{stat.targets.registerTarget}</div>
                              <Progress
                                percent={stat.progress.registerProgress}
                                showInfo={false}
                                size="small"
                                strokeColor="#52c41a"
                              />
                            </div>

                            <div className="rounded bg-purple-50 p-2 text-center">
                              <div className="text-sm text-purple-600">开发</div>
                              <div className="text-lg font-medium">{stat.completions.developCount}</div>
                              <div className="text-xs text-gray-500">/{stat.targets.developTarget}</div>
                              <Progress
                                percent={stat.progress.developProgress}
                                showInfo={false}
                                size="small"
                                strokeColor="#722ed1"
                              />
                            </div>

                            <div className="rounded bg-orange-50 p-2 text-center">
                              <div className="text-sm text-orange-600">回访</div>
                              <div className="text-lg font-medium">{stat.completions.followUpCount}</div>
                              <div className="text-xs text-gray-500">/{stat.targets.followUpTarget}</div>
                              <Progress
                                percent={stat.progress.followUpProgress}
                                showInfo={false}
                                size="small"
                                strokeColor="#fa8c16"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* 分页组件 */}
                {teamPagination.total > 0 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      showQuickJumper
                      showSizeChanger
                      current={teamPagination.current}
                      pageSize={teamPagination.size}
                      pageSizeOptions={['6', '12', '18', '24']}
                      showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`}
                      total={teamPagination.total}
                      onChange={handleTeamPaginationChange}
                      onShowSizeChange={handleTeamPaginationChange}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

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
              label: taskFollowUpStatusNames[status],
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
        </div>

        <Table
          columns={columns}
          dataSource={getCurrentPageData()}
          rowKey="id"
          pagination={{
            current: pagination.current,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            total: pagination.total
          }}
        />

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
            pagination={{
              pageSize: 10,
              pageSizeOptions: ['10', '20', '50', '100'],
              showQuickJumper: true,
              showSizeChanger: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
            }}
          />
        </Modal>

        {/* 跟进状态修改弹窗 */}
        <Modal
          open={isFollowUpModalVisible}
          title="修改跟进状态"
          onCancel={handleFollowUpCancel}
          onOk={handleFollowUpSubmit}
        >
          <Form
            form={followUpForm}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item label="客户信息">
              <span>
                {selectedCustomer?.customerName} - {selectedCustomer?.company}
              </span>
            </Form.Item>
            <Form.Item
              label="跟进状态"
              name="followStatus"
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
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default TaskManagement;
