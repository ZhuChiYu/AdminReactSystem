/** 事项类型枚举 */
export enum TaskType {
  CONSULT = 'consult', // 咨询
  DEVELOP = 'develop', // 开发
  FOLLOW_UP = 'follow_up', // 回访
  REGISTER = 'register' // 报名
}

/** 事项状态枚举 */
export enum TaskStatus {
  COMPLETED = 'completed',
  PENDING = 'pending'
}

/** 跟进状态枚举 */
export enum FollowUpStatus {
  // 已联系
  ADDED_WECHAT = 'added_wechat', // 未开始
  // 进行中
  COMPLETED = 'completed', // 已联系
  // 未开始
  CONTACTED = 'contacted', // 已加微信
  IN_PROGRESS = 'in_progress', // 进行中
  NOT_STARTED = 'not_started', // 已完成
  PENDING = 'pending' // 待跟进
}

/** 统计周期枚举 */
export enum StatisticsPeriod {
  MONTH = 'month',
  WEEK = 'week'
}

/** 事项类型名称 */
export const taskTypeNames = {
  [TaskType.CONSULT]: '咨询',
  [TaskType.REGISTER]: '报名',
  [TaskType.DEVELOP]: '开发',
  [TaskType.FOLLOW_UP]: '回访'
};

/** 事项类型颜色 */
export const taskTypeColors = {
  [TaskType.CONSULT]: 'blue',
  [TaskType.REGISTER]: 'green',
  [TaskType.DEVELOP]: 'purple',
  [TaskType.FOLLOW_UP]: 'orange'
};

/** 跟进状态名称 */
export const followUpStatusNames = {
  [FollowUpStatus.ADDED_WECHAT]: '已加微信',
  [FollowUpStatus.CONTACTED]: '已联系',
  [FollowUpStatus.NOT_STARTED]: '未开始',
  [FollowUpStatus.IN_PROGRESS]: '进行中',
  [FollowUpStatus.COMPLETED]: '已完成',
  [FollowUpStatus.PENDING]: '待跟进'
};

/** 跟进状态颜色 */
export const followUpStatusColors = {
  [FollowUpStatus.ADDED_WECHAT]: 'success',
  [FollowUpStatus.CONTACTED]: 'processing',
  [FollowUpStatus.NOT_STARTED]: 'default',
  [FollowUpStatus.IN_PROGRESS]: 'blue',
  [FollowUpStatus.COMPLETED]: 'success',
  [FollowUpStatus.PENDING]: 'warning'
};

/** 统计周期名称 */
export const periodNames = {
  [StatisticsPeriod.WEEK]: '周统计',
  [StatisticsPeriod.MONTH]: '月统计'
};

/** 项目事项记录类型 */
export interface ProjectItem {
  count: number;
  createdAt: string;
  description: string;
  employeeId: number | string;
  employeeName: string;
  eventTime: string;
  followUpStatus: FollowUpStatus;
  id: number;
  name: string;
  projectName: string; // 培训项目名称
  remark?: string;
  target: number;
  type: TaskType;
}

/** 任务记录类型 */
export interface TaskRecord {
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

/** 统计数据类型 */
export interface StatisticsData {
  completedCount: number;
  count: number;
  progress: number;
  target: number;
}

/** 当前用户类型 */
export interface CurrentUser {
  department: string;
  id: string | number;
  isAdmin: boolean;
  name: string;
}
