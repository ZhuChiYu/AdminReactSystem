// API通用响应格式
export interface ApiResponse<T = any> {
  code: number;          // 状态码: 0-成功, 其他-失败
  message: string;       // 响应消息
  data?: T;             // 响应数据
  timestamp: number;     // 时间戳
  path: string;         // 请求路径
}

// 分页响应格式
export interface PageResponse<T = any> {
  code: number;
  message: string;
  data: {
    records: T[];        // 数据列表
    total: number;       // 总记录数
    current: number;     // 当前页码
    size: number;        // 每页大小
    pages: number;       // 总页数
  };
  timestamp: number;
  path: string;
}

// 分页参数
export interface PageParams {
  current?: number;      // 当前页码，默认1
  size?: number;         // 每页大小，默认10
  sort?: string;         // 排序字段
  order?: 'asc' | 'desc'; // 排序方向
}

// 错误码定义
export enum ErrorCode {
  SUCCESS = 0,                    // 成功
  SYSTEM_ERROR = 1000,           // 系统错误
  PARAM_ERROR = 1001,            // 参数错误
  UNAUTHORIZED = 1002,           // 未授权
  FORBIDDEN = 1003,              // 禁止访问
  NOT_FOUND = 1004,              // 资源不存在
  METHOD_NOT_ALLOWED = 1005,     // 方法不允许

  // 业务错误码
  USER_NOT_EXIST = 2001,         // 用户不存在
  USER_PASSWORD_ERROR = 2002,    // 密码错误
  USER_DISABLED = 2003,          // 用户已禁用
  TOKEN_INVALID = 2004,          // Token无效
  TOKEN_EXPIRED = 2005,          // Token已过期

  CUSTOMER_NOT_EXIST = 3001,     // 客户不存在
  CUSTOMER_ASSIGNED = 3002,      // 客户已分配

  COURSE_NOT_EXIST = 4001,       // 课程不存在
  CLASS_FULL = 4002,             // 班级已满

  MEETING_CONFLICT = 5001,       // 会议冲突
  MEETING_APPROVED = 5002,       // 会议已审核

  EXPENSE_SUBMITTED = 6001,      // 报销已提交
  EXPENSE_APPROVED = 6002,       // 报销已审批
}

// 用户相关类型
export namespace UserApi {
  export interface LoginRequest {
    userName: string;
    password: string;
    captcha?: string;
    captchaId?: string;
    rememberMe?: boolean;
  }

  export interface LoginResponse {
    token: string;
    refreshToken: string;
    userInfo: UserInfo;
  }

  export interface UserInfo {
    id: number;
    userName: string;
    nickName: string;
    avatar: string;
    email: string;
    phone: string;
    gender: number;
    department: string;
    position: string;
    roles: Role[];
    permissions: string[];
    buttons: string[];
    routes: MenuRoute[];
  }

  export interface Role {
    id: number;
    roleCode: string;
    roleName: string;
    roleDesc?: string;
    status: number;
  }

  export interface MenuRoute {
    id: number;
    name: string;
    path: string;
    component?: string;
    icon?: string;
    title: string;
    i18nKey?: string;
    keepAlive?: boolean;
    constant?: boolean;
    hideInMenu?: boolean;
    order?: number;
    href?: string;
    children?: MenuRoute[];
  }

  export interface UserQueryParams extends PageParams {
    userName?: string;
    nickName?: string;
    email?: string;
    phone?: string;
    status?: number;
    departmentId?: number;
    roleId?: number;
  }

  export interface UserListItem {
    id: number;
    userName: string;
    nickName: string;
    email: string;
    phone: string;
    gender: number;
    avatar: string;
    status: number;
    department: {
      id: number;
      name: string;
    };
    manager: {
      id: number;
      name: string;
    };
    roles: Role[];
    createTime: string;
    updateTime: string;
  }

  export interface CreateUserRequest {
    userName: string;
    nickName: string;
    password: string;
    email?: string;
    phone?: string;
    gender?: number;
    avatar?: string;
    departmentId?: number;
    managerId?: number;
    position?: string;
    address?: string;
    roleIds: number[];
  }
}

// 客户相关类型
export namespace CustomerApi {
  export interface CustomerQueryParams extends PageParams {
    customerName?: string;
    company?: string;
    phone?: string;
    mobile?: string;
    followStatus?: string;
    employeeId?: number;
    industry?: string;
    customerLevel?: number;
    source?: string;
    assignedTimeStart?: string;
    assignedTimeEnd?: string;
  }

  export interface CustomerListItem {
    id: number;
    customerName: string;
    company: string;
    position: string;
    phone: string;
    mobile: string;
    email: string;
    wechat?: string;
    followStatus: string;
    followContent?: string;
    nextFollowTime?: string;
    level: number;
    industry: string;
    source: string;
    assignedTo?: {
      id: number;
      name: string;
    };
    createdBy?: {
      id: number;
      name: string;
    };
    assignedTime?: string;
    remark?: string;
    createdAt: string;
    updatedAt: string;
    // 权限相关字段（前端计算）
    canViewPhone?: boolean;
    canViewMobile?: boolean;
    canViewRealName?: boolean;
    canViewEmail?: boolean;
    // 兼容性字段
    createTime?: string;
    updateTime?: string;
    customerLevel?: number;
    employee?: {
      id: number;
      name: string;
    };
    assignedBy?: {
      id: number;
      name: string;
    };
  }

  export interface CreateCustomerRequest {
    customerName: string;
    company?: string;
    position?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    wechat?: string;
    qq?: string;
    address?: string;
    source?: string;
    industry?: string;
    level?: number;
    followStatus: string;
    followContent?: string;
    nextFollowTime?: string;
    remark?: string;
  }

  export interface FollowRecord {
    id: number;
    followType: string;
    followContent: string;
    followResult?: string;
    nextFollowTime?: string;
    followUser: {
      id: number;
      name: string;
    };
    followTime?: string;
    createdAt?: string;
    attachments?: FileInfo[];
  }
}

// 课程相关类型
export namespace CourseApi {
  export interface CourseQueryParams extends PageParams {
    courseName?: string;
    courseCode?: string;
    categoryId?: number;
    courseType?: number;
    teacherId?: number;
    status?: number;
    isFeatured?: boolean;
  }

  export interface CourseListItem {
    id: number;
    courseName: string;
    courseCode: string;
    category: {
      id: number;
      name: string;
    };
    courseType: number;
    price: number;
    duration: number;
    maxStudents: number;
    teacher: {
      id: number;
      name: string;
    };
    status: number;
    isFeatured: boolean;
    viewCount: number;
    enrollCount: number;
    rating: number;
    coverImage: string;
    createTime: string;
  }
}

// 会议相关类型
export namespace MeetingApi {
  export interface MeetingQueryParams extends PageParams {
    meetingTitle?: string;
    meetingType?: string;
    organizerId?: number;
    meetingStatus?: number;
    startTimeBegin?: string;
    startTimeEnd?: string;
    isOnline?: boolean;
  }

  export interface MeetingListItem {
    id: number;
    meetingTitle: string;
    meetingType: string;
    meetingRoom?: string;
    startTime: string;
    endTime: string;
    organizer: {
      id: number;
      name: string;
    };
    meetingStatus: number;
    isOnline: boolean;
    meetingUrl?: string;
    maxParticipants?: number;
    participantCount: number;
    createTime: string;
  }

  export interface CreateMeetingRequest {
    meetingTitle: string;
    meetingType: string;
    meetingRoom?: string;
    startTime: string;
    endTime: string;
    meetingDesc?: string;
    meetingAgenda?: string;
    isOnline: boolean;
    meetingUrl?: string;
    meetingPassword?: string;
    maxParticipants?: number;
    participantIds: number[];
  }
}

// 任务相关类型
export namespace TaskApi {
  export interface TaskQueryParams extends PageParams {
    taskName?: string;
    projectId?: number;
    assigneeId?: number;
    taskType?: string;
    taskStatus?: number;
    priority?: number;
    dueDateStart?: string;
    dueDateEnd?: string;
  }

  export interface TaskListItem {
    id: number;
    taskName: string;
    taskCode?: string;
    projectId?: number;
    projectName?: string;
    taskType: string;
    taskDesc?: string;
    assignee: {
      id: number;
      name: string;
    };
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: number;
    taskStatus: number;
    priority: number;
    progress: number;
    targetCount?: number;
    actualCount?: number;
    createTime: string;
    updateTime: string;
  }

  export interface CreateTaskRequest {
    taskName: string;
    projectId?: number;
    parentTaskId?: number;
    taskType: string;
    taskDesc?: string;
    assigneeId?: number;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    priority?: number;
    targetCount?: number;
  }
}

// 报销相关类型
export namespace ExpenseApi {
  export interface ExpenseApplicationQueryParams extends PageParams {
    applicationNo?: string;
    applicantId?: number;
    expenseType?: string;
    applicationStatus?: number;
    currentApproverId?: number;
    createTimeStart?: string;
    createTimeEnd?: string;
  }

  export interface ExpenseApplicationItem {
    id: number;
    applicationNo: string;
    applicant: {
      id: number;
      name: string;
    };
    department: {
      id: number;
      name: string;
    };
    expenseType: string;
    totalAmount: number;
    applicationReason?: string;
    applicationStatus: number;
    currentApprover?: {
      id: number;
      name: string;
    };
    createTime: string;
    updateTime: string;
  }

  export interface CreateExpenseApplicationRequest {
    expenseType: string;
    applicationReason?: string;
    expensePeriodStart?: string;
    expensePeriodEnd?: string;
    remark?: string;
    items: ExpenseItem[];
  }

  export interface ExpenseItem {
    itemName: string;
    itemType: string;
    expenseDate: string;
    amount: number;
    description?: string;
    receiptNo?: string;
    vendor?: string;
  }
}

// 统计相关类型
export namespace StatisticsApi {
  export interface OverviewStatistics {
    totalUsers: number;
    activeUsers: number;
    totalCustomers: number;
    newCustomers: number;
    totalCourses: number;
    activeCourses: number;
    totalClasses: number;
    activeClasses: number;
    todayMeetings: number;
    pendingExpenses: number;
    monthlyIncome: number;
    monthlyExpense: number;
  }

  export interface FinancialDashboard {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    monthlyData: {
      month: string;
      income: number;
      expense: number;
    }[];
    categoryData: {
      category: string;
      amount: number;
    }[];
  }
}

// 文件相关类型
export interface FileInfo {
  id: number;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadTime: string;
}

// 员工相关类型
export namespace EmployeeApi {
  /** 员工查询参数 */
  export interface EmployeeQueryParams {
    current?: number;
    size?: number;
    userName?: string;
    nickName?: string;
    department?: string;
    status?: string;
  }

  /** 员工列表项 */
  export interface EmployeeListItem {
    id: number;
    userName: string;
    nickName: string;
    email: string;
    phone?: string;
    gender?: 'male' | 'female';
    status: 'active' | 'inactive';
    position?: string;
    address?: string;
    bankCard?: string;
    idCard?: string;
    wechat?: string;
    tim?: string;
    contractYears?: number;
    contractStartDate?: string;
    contractEndDate?: string;
    createdAt: string;
    updatedAt: string;
    department?: {
      id: number;
      name: string;
    };
    roles: Array<{
      code: string;
      name: string;
    }>;
  }

  /** 导入结果 */
  export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    successList: Array<{
      row: number;
      data: {
        userName: string;
        nickName: string;
        email: string;
      };
    }>;
    errorList: Array<{
      row: number;
      data: any;
      error: string;
    }>;
  }

  export interface CreateEmployeeRequest {
    userName: string;
    nickName: string;
    email?: string;
    phone?: string;
    gender?: string;
    password: string;
    roles: string[];
    departmentId?: number;
  }

  export interface UpdateEmployeeRequest {
    nickName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    roles?: string[];
    departmentId?: number;
    status?: string;
  }
}
