// API通用响应格式
export interface ApiResponse<T = any> {
  code: number; // 响应消息
  data?: T; // 状态码: 0-成功, 其他-失败
  message: string; // 时间戳
  path: string; // 响应数据
  timestamp: number; // 请求路径
}

// 分页响应格式
export interface PageResponse<T = any> {
  code: number;
  data: {
    // 总记录数
    current: number; // 每页大小
    pages: number;
    records: T[]; // 当前页码
    size: number; // 数据列表
    total: number; // 总页数
  };
  message: string;
  path: string;
  timestamp: number;
}

// 分页参数
export interface PageParams {
  current?: number; // 排序字段
  order?: 'asc' | 'desc'; // 当前页码，默认1
  size?: number; // 每页大小，默认10
  sort?: string; // 排序方向
}

// 错误码定义
export enum ErrorCode {
  SUCCESS = 0, // 成功
  SYSTEM_ERROR = 1000, // 系统错误
  PARAM_ERROR = 1001, // 参数错误
  UNAUTHORIZED = 1002, // 未授权
  FORBIDDEN = 1003, // 禁止访问
  NOT_FOUND = 1004, // 资源不存在
  METHOD_NOT_ALLOWED = 1005, // 方法不允许

  // 业务错误码
  USER_NOT_EXIST = 2001, // 用户不存在
  USER_PASSWORD_ERROR = 2002, // 密码错误
  USER_DISABLED = 2003, // 用户已禁用
  TOKEN_INVALID = 2004, // Token无效
  TOKEN_EXPIRED = 2005, // Token已过期

  CUSTOMER_NOT_EXIST = 3001, // 客户不存在
  CUSTOMER_ASSIGNED = 3002, // 客户已分配

  COURSE_NOT_EXIST = 4001, // 课程不存在
  CLASS_FULL = 4002, // 班级已满

  MEETING_CONFLICT = 5001, // 会议冲突
  MEETING_APPROVED = 5002, // 会议已审核

  EXPENSE_SUBMITTED = 6001, // 报销已提交
  EXPENSE_APPROVED = 6002 // 报销已审批
}

// 用户相关类型
export namespace UserApi {
  export interface LoginRequest {
    captcha?: string;
    captchaId?: string;
    password: string;
    rememberMe?: boolean;
    userName: string;
  }

  export interface LoginResponse {
    refreshToken: string;
    token: string;
    userInfo: UserInfo;
  }

  export interface UserInfo {
    avatar: string;
    buttons: string[];
    department: string;
    email: string;
    gender: number;
    id: number;
    nickName: string;
    permissions: string[];
    phone: string;
    position: string;
    roles: Role[];
    routes: MenuRoute[];
    userName: string;
  }

  export interface Role {
    id: number;
    roleCode: string;
    roleDesc?: string;
    roleName: string;
    status: number;
  }

  export interface MenuRoute {
    children?: MenuRoute[];
    component?: string;
    constant?: boolean;
    hideInMenu?: boolean;
    href?: string;
    i18nKey?: string;
    icon?: string;
    id: number;
    keepAlive?: boolean;
    name: string;
    order?: number;
    path: string;
    title: string;
  }

  export interface UserQueryParams extends PageParams {
    departmentId?: number;
    email?: string;
    nickName?: string;
    phone?: string;
    roleId?: number;
    status?: number;
    userName?: string;
  }

  export interface UserListItem {
    avatar: string;
    createTime: string;
    department: {
      id: number;
      name: string;
    };
    email: string;
    gender: number;
    id: number;
    manager: {
      id: number;
      name: string;
    };
    nickName: string;
    phone: string;
    roles: Role[];
    status: number;
    updateTime: string;
    userName: string;
  }

  export interface CreateUserRequest {
    address?: string;
    avatar?: string;
    departmentId?: number;
    email?: string;
    gender?: number;
    managerId?: number;
    nickName: string;
    password: string;
    phone?: string;
    position?: string;
    roleIds: number[];
    userName: string;
  }
}

// 客户相关类型
export namespace CustomerApi {
  export interface CustomerQueryParams extends PageParams {
    assignedTimeEnd?: string;
    assignedTimeStart?: string;
    company?: string;
    customerLevel?: number;
    customerName?: string;
    employeeId?: number;
    followStatus?: string;
    industry?: string;
    mobile?: string;
    phone?: string;
    scope?: 'all' | 'own';
    source?: string; // 数据范围: all-所有数据, own-自己的数据
  }

  export interface CustomerListItem {
    assignedBy?: {
      id: number;
      name: string;
    };
    assignedTime?: string;
    assignedTo?: {
      id: number;
      name: string;
    };
    canViewEmail?: boolean;
    canViewMobile?: boolean;
    // 权限相关字段（前端计算）
    canViewPhone?: boolean;
    canViewRealName?: boolean;
    company: string;
    createdAt: string;
    createdBy?: {
      id: number;
      name: string;
    };
    // 兼容性字段
    createTime?: string;
    customerLevel?: number;
    customerName: string;
    email: string;
    employee?: {
      id: number;
      name: string;
    };
    followContent?: string;
    followStatus: string;
    id: number;
    industry: string;
    level: number;
    mobile: string;
    nextFollowTime?: string;
    phone: string;
    position: string;
    remark?: string;
    source: string;
    updatedAt: string;
    updateTime?: string;
    wechat?: string;
  }

  export interface CreateCustomerRequest {
    address?: string;
    company?: string;
    customerName: string;
    email?: string;
    followContent?: string;
    followStatus: string;
    industry?: string;
    level?: number;
    mobile?: string;
    nextFollowTime?: string;
    phone?: string;
    position?: string;
    qq?: string;
    remark?: string;
    source?: string;
    wechat?: string;
  }

  export interface FollowRecord {
    attachments?: FileInfo[];
    createdAt?: string;
    followContent: string;
    followResult?: string;
    followTime?: string;
    followType: string;
    followUser: {
      id: number;
      name: string;
    };
    id: number;
    nextFollowTime?: string;
  }
}

// 课程相关类型
export namespace CourseApi {
  export interface CourseQueryParams extends PageParams {
    categoryId?: number;
    courseCode?: string;
    courseName?: string;
    courseType?: number;
    isFeatured?: boolean;
    status?: number;
    teacherId?: number;
  }

  export interface CourseListItem {
    category: {
      id: number;
      name: string;
    };
    courseCode: string;
    courseName: string;
    courseType?: number;
    coverImage?: string;
    createdAt?: string;
    createTime?: string;
    currentStudents: number;
    description?: string;
    duration: number;
    endDate: string;
    enrollCount?: number;
    enrollmentCount?: number;
    id: number;
    instructor?: string;
    isFeatured?: boolean;
    location: string;
    maxStudents: number;
    price: number | string;
    rating: number | string;
    startDate: string;
    status: number;
    teacher?: {
      id: number;
      name: string;
    };
    updatedAt?: string;
    viewCount?: number;
  }

  export interface CreateCourseRequest {
    categoryId: number;
    courseCode: string;
    courseName: string;
    description?: string;
    duration: number;
    endDate: string;
    instructor: string;
    location: string;
    maxStudents: number;
    objectives?: any;
    originalPrice: number;
    outline?: any;
    price: number;
    startDate: string;
    tags?: any;
  }

  export interface CourseCategory {
    description?: string;
    id: number;
    name: string;
  }

  export interface CourseReview {
    comment: string;
    courseId: number;
    createTime: string;
    id: number;
    rating: number;
    userId: number;
    userName: string;
  }
}

// 会议相关类型
export namespace MeetingApi {
  export interface MeetingQueryParams extends PageParams {
    isOnline?: boolean;
    meetingStatus?: number;
    meetingTitle?: string;
    meetingType?: string;
    organizerId?: number;
    startTimeBegin?: string;
    startTimeEnd?: string;
  }

  export interface MeetingListItem {
    createTime: string;
    endTime: string;
    id: number;
    isOnline: boolean;
    maxParticipants?: number;
    meetingRoom?: string;
    meetingStatus: number;
    meetingTitle: string;
    meetingType: string;
    meetingUrl?: string;
    organizer: {
      id: number;
      name: string;
    };
    participantCount: number;
    startTime: string;
  }

  export interface CreateMeetingRequest {
    endTime: string;
    isOnline: boolean;
    maxParticipants?: number;
    meetingAgenda?: string;
    meetingDesc?: string;
    meetingPassword?: string;
    meetingRoom?: string;
    meetingTitle: string;
    meetingType: string;
    meetingUrl?: string;
    participantIds: number[];
    startTime: string;
  }

  export interface MeetingRoom {
    capacity: number;
    equipment: string[];
    id: number;
    location: string;
    name: string;
    status: 'available' | 'maintenance' | 'occupied';
  }
}

// 任务相关类型
export namespace TaskApi {
  export interface TaskQueryParams extends PageParams {
    assigneeId?: number;
    dueDateEnd?: string;
    dueDateStart?: string;
    priority?: number;
    projectId?: number;
    taskName?: string;
    taskStatus?: number;
    taskType?: string;
  }

  export interface TaskListItem {
    actualCount?: number;
    actualHours?: number;
    assignee: {
      id: number;
      name: string;
    };
    createTime: string;
    dueDate?: string;
    estimatedHours?: number;
    id: number;
    priority: number;
    progress: number;
    projectId?: number;
    projectName?: string;
    startDate?: string;
    targetCount?: number;
    taskCode?: string;
    taskDesc?: string;
    taskName: string;
    taskStatus: number;
    taskType: string;
    updateTime: string;
  }

  export interface CreateTaskRequest {
    assigneeId?: number;
    dueDate?: string;
    estimatedHours?: number;
    parentTaskId?: number;
    priority?: number;
    projectId?: number;
    projectName?: string;
    startDate?: string;
    targetCount?: number;
    taskDesc?: string;
    taskName: string;
    taskType: string;
  }
}

// 报销相关类型
export namespace ExpenseApi {
  export interface ExpenseApplicationQueryParams extends PageParams {
    applicantId?: number;
    applicationNo?: string;
    applicationStatus?: number;
    createTimeEnd?: string;
    createTimeStart?: string;
    currentApproverId?: number;
    expenseType?: string;
  }

  export interface ExpenseApplicationItem {
    applicant: {
      id: number;
      name: string;
    };
    applicationNo: string;
    applicationReason?: string;
    applicationStatus: number;
    createTime: string;
    currentApprover?: {
      id: number;
      name: string;
    };
    department: {
      id: number;
      name: string;
    };
    expenseType: string;
    id: number;
    totalAmount: number;
    updateTime: string;
  }

  export interface CreateExpenseApplicationRequest {
    applicationReason?: string;
    expensePeriodEnd?: string;
    expensePeriodStart?: string;
    expenseType: string;
    items: ExpenseItem[];
    remark?: string;
  }

  export interface ExpenseItem {
    amount: number;
    description?: string;
    expenseDate: string;
    itemName: string;
    itemType: string;
    receiptNo?: string;
    vendor?: string;
  }

  export interface ExpenseQueryParams extends PageParams {
    amount?: number;
    applicantId?: number;
    applicationTimeEnd?: string;
    applicationTimeStart?: string;
    expenseType?: string;
    status?: number;
  }

  export interface ExpenseListItem {
    amount: number;
    applicant: {
      id: number;
      name: string;
    };
    applicationTime: string;
    approvalTime?: string;
    approver?: {
      id: number;
      name: string;
    };
    attachments?: FileInfo[];
    department: string;
    description?: string;
    expenseType: string;
    id: number;
    remark?: string;
    status: number;
  }

  export interface CreateExpenseRequest {
    amount: number;
    attachments?: string[];
    description?: string;
    expenseDate?: string;
    expenseType: string;
    remark?: string;
  }

  export interface ApproveExpenseRequest {
    remark?: string;
    status: number;
  }
}

// 统计相关类型
export namespace StatisticsApi {
  export interface OverviewStatistics {
    activeClasses: number;
    activeCourses: number;
    activeUsers: number;
    monthlyExpense: number;
    monthlyIncome: number;
    newCustomers: number;
    pendingExpenses: number;
    todayMeetings: number;
    totalClasses: number;
    totalCourses: number;
    totalCustomers: number;
    totalUsers: number;
  }

  export interface FinancialDashboard {
    categoryData: {
      amount: number;
      category: string;
    }[];
    monthlyData: {
      expense: number;
      income: number;
      month: string;
    }[];
    netProfit: number;
    totalExpense: number;
    totalIncome: number;
  }
}

// 文件相关类型
export interface FileInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  id: number;
  originalName: string;
  uploadTime: string;
}

// 员工相关类型
export namespace EmployeeApi {
  /** 员工查询参数 */
  export interface EmployeeQueryParams {
    current?: number;
    department?: string;
    keyword?: string;
    nickName?: string;
    size?: number;
    status?: string;
    userName?: string;
  }

  /** 员工列表项 */
  export interface EmployeeListItem {
    address?: string;
    bankCard?: string;
    contractEndDate?: string;
    contractStartDate?: string;
    contractYears?: number;
    createdAt: string;
    department?: {
      id: number;
      name: string;
    };
    email: string;
    gender?: 'female' | 'male';
    id: number;
    idCard?: string;
    nickName: string;
    phone?: string;
    position?: string;
    roles: Array<{
      code: string;
      name: string;
    }>;
    status: 'active' | 'inactive';
    tim?: string;
    updatedAt: string;
    userName: string;
    wechat?: string;
  }

  /** 导入结果 */
  export interface ImportResult {
    errorList: Array<{
      data: any;
      error: string;
      row: number;
    }>;
    failed: number;
    success: number;
    successList: Array<{
      data: {
        email: string;
        nickName: string;
        userName: string;
      };
      row: number;
    }>;
    total: number;
  }

  export interface CreateEmployeeRequest {
    departmentId?: number;
    email?: string;
    gender?: string;
    nickName: string;
    password: string;
    phone?: string;
    roles: string[];
    userName: string;
  }

  export interface UpdateEmployeeRequest {
    departmentId?: number;
    email?: string;
    gender?: string;
    nickName?: string;
    phone?: string;
    roles?: string[];
    status?: string;
  }

  /** 员工-管理员关系 */
  export interface EmployeeManagerRelation {
    assignedById: number;
    assignedByName: string;
    assignedTime: string;
    employeeId: number;
    employeeName: string;
    id: number;
    managerId: number;
    managerName: string;
    remark?: string;
  }
}

// 通知相关类型
export namespace NotificationApi {
  export interface NotificationQueryParams extends PageParams {
    readStatus?: number;
    relatedId?: number;
    relatedType?: string;
    title?: string;
    type?: string;
  }

  export interface NotificationListItem {
    content: string;
    createTime: string;
    id: number;
    readStatus: number;
    readTime?: string;
    relatedId?: number;
    relatedType?: string;
    title: string;
    type: string;
    userId: number;
  }

  export interface CreateNotificationRequest {
    content: string;
    relatedId?: number;
    relatedType?: string;
    targetUserIds?: number[];
    title: string;
    type: string;
  }

  export interface MarkReadRequest {
    notificationIds: number[];
  }

  // 通知附件相关类型
  export interface NotificationAttachmentQueryParams extends PageParams {
    notificationId: number;
  }

  export interface NotificationAttachmentListItem {
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    id: number;
    notificationId: number;
    originalName?: string;
    uploader?: {
      id: number;
      name: string;
    };
    uploadTime: string;
  }

  export interface UploadNotificationAttachmentRequest {
    description?: string;
    file: File;
    notificationId: number;
  }
}

// 班级相关类型
export namespace ClassApi {
  export interface ClassQueryParams extends PageParams {
    categoryId?: number;
    className?: string;
    startDateBegin?: string;
    startDateEnd?: string;
    status?: number;
    teacherId?: number;
  }

  export interface ClassListItem {
    category?: {
      id: number;
      name: string;
    };
    categoryId?: number;
    classCode?: string;
    className: string;
    createTime: string;
    currentStudents?: number;
    description?: string;
    endDate?: string;
    id: number;
    location?: string;
    maxStudents?: number;
    price?: number;
    scheduleInfo?: string;
    startDate?: string;
    status: number;
    studentCount?: number;
    teacher?: string;
    teacherId?: number;
    updateTime?: string;
  }

  export interface CreateClassRequest {
    categoryId?: number;
    className: string;
    description?: string;
    endDate?: string;
    location?: string;
    maxStudents?: number;
    price?: number;
    scheduleInfo?: string;
    startDate?: string;
    status?: number;
    teacher?: string;
    teacherId?: number;
  }
}

// 课程附件相关类型
export namespace AttachmentApi {
  export interface AttachmentQueryParams extends PageParams {
    courseId?: number;
    fileName?: string;
    fileType?: string;
  }

  export interface AttachmentListItem {
    courseId: number;
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    id: number;
    originalName?: string;
    uploader?: {
      id: number;
      name: string;
    };
    uploadTime: string;
  }

  export interface UploadAttachmentRequest {
    courseId: number;
    description?: string;
    file: File;
  }

  export interface AttachmentStats {
    fileTypes: { count: number; type: string }[];
    totalCount: number;
    totalSize: number;
  }
}

export namespace Api.SystemManage {
  /** role search params */
  type RoleSearchParams = CommonType.RecordNullable<
    Pick<Role, 'roleCode' | 'roleName' | 'status'> & {
      roleType?: 'permission' | 'position';
    } & CommonSearchParams
  >;
}
