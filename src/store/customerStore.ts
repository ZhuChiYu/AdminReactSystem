import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 跟进状态枚举
export enum FollowUpStatus {
  ARRIVED = 'arrived', // 已实到
  CONSULT = 'consult', // 咨询
  EARLY_25 = 'early_25', // 早25客户
  EFFECTIVE_VISIT = 'effective_visit', // 有效回访
  NEW_DEVELOP = 'new_develop', // 新开发
  NOT_ARRIVED = 'not_arrived', // 未实到
  REGISTERED = 'registered', // 已报名
  REJECTED = 'rejected', // 未通过
  VIP = 'vip', // 大客户
  WECHAT_ADDED = 'wechat_added' // 已加微信
}

// 客户信息接口
export interface CustomerInfo {
  assignedBy?: string;
  // 分配该客户的管理员ID
  assignedTime?: string;
  company: string;
  createTime: string;
  employeeId: string;
  employeeName: string;
  followContent: string;
  followStatus: FollowUpStatus;
  id: number;
  mobile: string;
  name: string;
  phone: string;
  position: string;
  source: string; // 分配时间
}

// 任务类型枚举
export enum TaskType {
  CONSULT = 'consult', // 咨询
  // 报名
  DEVELOP = 'develop', // 报名
  // 开发
  FOLLOW_UP = 'follow_up', // 开发
  // 咨询
  REGISTER = 'register' // 回访
}

// 任务跟进状态枚举
export enum TaskFollowUpStatus {
  COMPLETED = 'completed', // 已完成
  IN_PROGRESS = 'in_progress', // 进行中
  NOT_STARTED = 'not_started' // 未开始
}

// 任务记录接口
export interface TaskRecord {
  count: number;
  createdAt: string;
  description: string;
  employeeId: number;
  employeeName: string;
  eventTime: string;
  followUpStatus: TaskFollowUpStatus;
  id: number;
  name: string;
  projectName: string;
  remark?: string;
  target: number;
  type: TaskType;
}

interface CustomerState {
  addCustomer: (customer: CustomerInfo) => void;
  assignCustomersToEmployee: (customerIds: number[], employeeId: string, assignedBy: string) => void;
  assignCustomerToEmployee: (customerId: number, employeeId: string, assignedBy: string) => void;
  calculateTaskCounts: () => TaskRecord[];
  customers: CustomerInfo[];
  getCustomersByEmployeeId: (employeeId: string) => CustomerInfo[];
  getCustomersByTaskId: (taskId: number) => CustomerInfo[];
  getUnassignedCustomers: () => CustomerInfo[];
  removeCustomer: (id: number) => void;
  tasks: TaskRecord[];
  updateCustomer: (customer: CustomerInfo) => void;
}

const useCustomerStore = create<CustomerState>()(
  devtools(
    persist(
      (set, get) => ({
        // 添加客户信息
        addCustomer: (customer: CustomerInfo) => {
          set(state => {
            const newCustomers = [...state.customers, customer];
            return {
              customers: newCustomers,
              tasks: updateTasksBasedOnCustomers(newCustomers)
            };
          });
        },
        // 批量分配客户给员工
        assignCustomersToEmployee: (customerIds: number[], employeeId: string, assignedBy: string) => {
          set(state => {
            const newCustomers = state.customers.map(customer => {
              if (customerIds.includes(customer.id)) {
                return {
                  ...customer,
                  assignedBy,
                  assignedTime: new Date().toLocaleString(),
                  employeeId
                };
              }
              return customer;
            });

            return {
              customers: newCustomers,
              tasks: updateTasksBasedOnCustomers(newCustomers)
            };
          });
        },

        // 分配客户给员工
        assignCustomerToEmployee: (customerId: number, employeeId: string, assignedBy: string) => {
          set(state => {
            const newCustomers = state.customers.map(customer => {
              if (customer.id === customerId) {
                return {
                  ...customer,
                  assignedBy,
                  assignedTime: new Date().toLocaleString(),
                  employeeId
                };
              }
              return customer;
            });

            return {
              customers: newCustomers,
              tasks: updateTasksBasedOnCustomers(newCustomers)
            };
          });
        },

        // 根据客户信息重新计算任务数据
        calculateTaskCounts: () => {
          const tasks = updateTasksBasedOnCustomers(get().customers);
          set({ tasks });
          return tasks;
        },

        customers: [],

        // 获取特定员工的客户信息
        getCustomersByEmployeeId: (employeeId: string) => {
          return get().customers.filter(c => c.employeeId === employeeId);
        },

        // 获取特定任务相关的客户信息
        getCustomersByTaskId: (taskId: number) => {
          const task = get().tasks.find(t => t.id === taskId);
          if (!task) return [];

          // 根据任务类型过滤客户
          const taskTypeToFollowStatusMap: Record<TaskType, FollowUpStatus[]> = {
            [TaskType.CONSULT]: [FollowUpStatus.CONSULT, FollowUpStatus.WECHAT_ADDED],
            [TaskType.REGISTER]: [FollowUpStatus.REGISTERED, FollowUpStatus.ARRIVED],
            [TaskType.DEVELOP]: [FollowUpStatus.NEW_DEVELOP, FollowUpStatus.EARLY_25],
            [TaskType.FOLLOW_UP]: [FollowUpStatus.EFFECTIVE_VISIT]
          };

          const relevantStatuses = taskTypeToFollowStatusMap[task.type] || [];
          return get().customers.filter(
            c => c.employeeId === String(task.employeeId) && relevantStatuses.includes(c.followStatus)
          );
        },

        // 获取未分配的客户列表
        getUnassignedCustomers: () => {
          return get().customers.filter(customer => !customer.employeeId || customer.employeeId === '');
        },

        // 删除客户信息
        removeCustomer: (id: number) => {
          set(state => {
            const filteredCustomers = state.customers.filter(c => c.id !== id);
            return {
              customers: filteredCustomers,
              tasks: updateTasksBasedOnCustomers(filteredCustomers)
            };
          });
        },

        tasks: [],

        // 更新客户信息
        updateCustomer: (customer: CustomerInfo) => {
          set(state => {
            const updatedCustomers = state.customers.map(c => (c.id === customer.id ? customer : c));
            return {
              customers: updatedCustomers,
              tasks: updateTasksBasedOnCustomers(updatedCustomers)
            };
          });
        }
      }),
      {
        name: 'customer-storage'
      }
    )
  )
);

// 根据客户信息更新任务数据的辅助函数
function updateTasksBasedOnCustomers(customers: CustomerInfo[]): TaskRecord[] {
  // 用于存储员工+任务类型的组合
  type TaskKey = string; // 格式: employeeId_taskType
  const taskMap = new Map<TaskKey, TaskRecord>();

  // 定义任务类型与客户跟进状态的映射
  const followStatusToTaskType: Record<FollowUpStatus, TaskType> = {
    [FollowUpStatus.CONSULT]: TaskType.CONSULT,
    [FollowUpStatus.WECHAT_ADDED]: TaskType.CONSULT,
    [FollowUpStatus.REGISTERED]: TaskType.REGISTER,
    [FollowUpStatus.ARRIVED]: TaskType.REGISTER,
    [FollowUpStatus.NEW_DEVELOP]: TaskType.DEVELOP,
    [FollowUpStatus.EARLY_25]: TaskType.DEVELOP,
    [FollowUpStatus.EFFECTIVE_VISIT]: TaskType.FOLLOW_UP,
    [FollowUpStatus.NOT_ARRIVED]: TaskType.FOLLOW_UP,
    [FollowUpStatus.REJECTED]: TaskType.FOLLOW_UP,
    [FollowUpStatus.VIP]: TaskType.FOLLOW_UP
  };

  // 任务类型对应的项目名称
  const taskTypeToProjectName: Record<TaskType, string> = {
    [TaskType.CONSULT]: '企业定制培训咨询',
    [TaskType.REGISTER]: '培训课程报名',
    [TaskType.DEVELOP]: '新课程开发',
    [TaskType.FOLLOW_UP]: '客户跟进回访'
  };

  // 任务类型对应的任务描述
  const taskTypeToDescription: Record<TaskType, string> = {
    [TaskType.CONSULT]: '接待新客户咨询课程情况',
    [TaskType.REGISTER]: '处理新学员报名事宜',
    [TaskType.DEVELOP]: '开发新课程计划',
    [TaskType.FOLLOW_UP]: '进行客户回访和跟进'
  };

  // 根据客户记录创建或更新任务
  customers.forEach(customer => {
    const taskType = followStatusToTaskType[customer.followStatus];
    const taskKey = `${customer.employeeId}_${taskType}`;

    if (!taskMap.has(taskKey)) {
      // 创建新任务记录
      taskMap.set(taskKey, {
        count: 1,
        createdAt: new Date().toISOString(),
        description: taskTypeToDescription[taskType],
        employeeId: Number(customer.employeeId),
        employeeName: customer.employeeName,
        eventTime: new Date().toISOString(),
        followUpStatus: TaskFollowUpStatus.IN_PROGRESS,
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: `${customer.employeeName}的${taskTypeToProjectName[taskType]}任务`,
        projectName: taskTypeToProjectName[taskType],
        target: 50,
        type: taskType
      });
    } else {
      // 更新现有任务记录
      const task = taskMap.get(taskKey)!;
      taskMap.set(taskKey, {
        ...task,
        count: task.count + 1
      });
    }
  });

  return Array.from(taskMap.values());
}

export default useCustomerStore;
