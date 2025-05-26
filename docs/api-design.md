# React SoybeanAdmin API接口设计文档

## 概述

本文档详细描述了React SoybeanAdmin系统的API接口设计，包含用户管理、权限控制、客户管理、课程管理、班级管理、员工管理、会议管理、财务管理、报销流程等核心功能模块的接口定义。

## API设计原则

1. **RESTful风格**：遵循REST API设计规范
2. **统一响应格式**：所有接口返回统一的响应结构
3. **分页规范**：列表接口统一分页参数和响应格式
4. **错误处理**：统一的错误码和错误信息
5. **安全认证**：JWT Token认证机制
6. **版本控制**：API版本化管理

## 接口通用规范

### 1. 基础URL

```
开发环境: http://localhost:3000/api/v1
生产环境: https://your-domain.com/api/v1
```

### 2. 请求头

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### 3. 统一响应格式

```typescript
interface ApiResponse<T = any> {
  code: number;          // 状态码: 0-成功, 其他-失败
  message: string;       // 响应消息
  data?: T;             // 响应数据
  timestamp: number;     // 时间戳
  path: string;         // 请求路径
}

// 分页响应格式
interface PageResponse<T = any> {
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
```

### 4. 分页参数

```typescript
interface PageParams {
  current?: number;      // 当前页码，默认1
  size?: number;         // 每页大小，默认10
  sort?: string;         // 排序字段
  order?: 'asc' | 'desc'; // 排序方向
}
```

### 5. 错误码定义

```typescript
enum ErrorCode {
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
```

## 1. 认证授权模块

### 1.1 用户登录

```http
POST /auth/login
```

**请求参数：**

```typescript
interface LoginRequest {
  userName: string;      // 用户名
  password: string;      // 密码
  captcha?: string;      // 验证码
  captchaId?: string;    // 验证码ID
  rememberMe?: boolean;  // 记住我
}
```

**响应数据：**

```typescript
interface LoginResponse {
  token: string;         // JWT Token
  refreshToken: string;  // 刷新Token
  userInfo: {
    id: number;
    userName: string;
    nickName: string;
    avatar: string;
    email: string;
    phone: string;
    roles: string[];
    permissions: string[];
  };
}
```

### 1.2 用户登出

```http
POST /auth/logout
```

### 1.3 刷新Token

```http
POST /auth/refresh
```

**请求参数：**

```typescript
interface RefreshTokenRequest {
  refreshToken: string;
}
```

### 1.4 获取用户信息

```http
GET /auth/user-info
```

**响应数据：**

```typescript
interface UserInfo {
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
```

### 1.5 获取路由菜单

```http
GET /auth/routes
```

**响应数据：**

```typescript
interface MenuRoute {
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
```

## 2. 用户管理模块

### 2.1 获取用户列表

```http
GET /users
```

**查询参数：**

```typescript
interface UserQueryParams extends PageParams {
  userName?: string;     // 用户名模糊查询
  nickName?: string;     // 昵称模糊查询
  email?: string;        // 邮箱模糊查询
  phone?: string;        // 手机号模糊查询
  status?: number;       // 状态筛选
  departmentId?: number; // 部门筛选
  roleId?: number;       // 角色筛选
}
```

**响应数据：**

```typescript
interface UserListItem {
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
```

### 2.2 获取用户详情

```http
GET /users/{id}
```

### 2.3 创建用户

```http
POST /users
```

**请求参数：**

```typescript
interface CreateUserRequest {
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
```

### 2.4 更新用户

```http
PUT /users/{id}
```

### 2.5 删除用户

```http
DELETE /users/{id}
```

### 2.6 批量删除用户

```http
DELETE /users/batch
```

**请求参数：**

```typescript
interface BatchDeleteRequest {
  ids: number[];
}
```

### 2.7 重置用户密码

```http
PUT /users/{id}/reset-password
```

**请求参数：**

```typescript
interface ResetPasswordRequest {
  newPassword: string;
}
```

### 2.8 修改用户状态

```http
PUT /users/{id}/status
```

**请求参数：**

```typescript
interface UpdateStatusRequest {
  status: number;
}
```

### 2.9 分配用户角色

```http
PUT /users/{id}/roles
```

**请求参数：**

```typescript
interface AssignRolesRequest {
  roleIds: number[];
}
```

## 3. 角色权限模块

### 3.1 获取角色列表

```http
GET /roles
```

**查询参数：**

```typescript
interface RoleQueryParams extends PageParams {
  roleName?: string;
  roleCode?: string;
  status?: number;
}
```

### 3.2 获取角色详情

```http
GET /roles/{id}
```

### 3.3 创建角色

```http
POST /roles
```

**请求参数：**

```typescript
interface CreateRoleRequest {
  roleCode: string;
  roleName: string;
  roleDesc?: string;
  roleHome?: string;
  permissionIds: number[];
}
```

### 3.4 更新角色

```http
PUT /roles/{id}
```

### 3.5 删除角色

```http
DELETE /roles/{id}
```

### 3.6 获取权限列表

```http
GET /permissions
```

**响应数据：**

```typescript
interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  permissionType: number;
  parentId: number;
  resourceUrl?: string;
  method?: string;
  icon?: string;
  sortOrder: number;
  children?: Permission[];
}
```

### 3.7 获取角色权限

```http
GET /roles/{id}/permissions
```

### 3.8 分配角色权限

```http
PUT /roles/{id}/permissions
```

**请求参数：**

```typescript
interface AssignPermissionsRequest {
  permissionIds: number[];
}
```

## 4. 部门管理模块

### 4.1 获取部门树

```http
GET /departments/tree
```

**响应数据：**

```typescript
interface DepartmentTree {
  id: number;
  deptName: string;
  deptCode: string;
  parentId: number;
  manager: {
    id: number;
    name: string;
  };
  children?: DepartmentTree[];
}
```

### 4.2 获取部门列表

```http
GET /departments
```

### 4.3 创建部门

```http
POST /departments
```

**请求参数：**

```typescript
interface CreateDepartmentRequest {
  deptName: string;
  deptCode: string;
  parentId: number;
  managerId?: number;
  phone?: string;
  email?: string;
  address?: string;
}
```

### 4.4 更新部门

```http
PUT /departments/{id}
```

### 4.5 删除部门

```http
DELETE /departments/{id}
```

## 5. 客户管理模块

### 5.1 获取客户列表

```http
GET /customers
```

**查询参数：**

```typescript
interface CustomerQueryParams extends PageParams {
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
```

**响应数据：**

```typescript
interface CustomerListItem {
  id: number;
  customerName: string;
  company: string;
  position: string;
  phone: string;
  mobile: string;
  email: string;
  wechat: string;
  followStatus: string;
  followContent: string;
  nextFollowTime: string;
  customerLevel: number;
  industry: string;
  source: string;
  employee: {
    id: number;
    name: string;
  };
  assignedBy: {
    id: number;
    name: string;
  };
  assignedTime: string;
  createTime: string;
  updateTime: string;
}
```

### 5.2 获取客户详情

```http
GET /customers/{id}
```

### 5.3 创建客户

```http
POST /customers
```

**请求参数：**

```typescript
interface CreateCustomerRequest {
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
  customerLevel?: number;
  followStatus: string;
  followContent?: string;
  nextFollowTime?: string;
}
```

### 5.4 更新客户

```http
PUT /customers/{id}
```

### 5.5 删除客户

```http
DELETE /customers/{id}
```

### 5.6 分配客户

```http
POST /customers/{id}/assign
```

**请求参数：**

```typescript
interface AssignCustomerRequest {
  employeeId: number;
  remark?: string;
}
```

### 5.7 获取客户跟进记录

```http
GET /customers/{id}/follow-records
```

**响应数据：**

```typescript
interface FollowRecord {
  id: number;
  followType: string;
  followContent: string;
  followResult?: string;
  nextFollowTime?: string;
  followUser: {
    id: number;
    name: string;
  };
  followTime: string;
  attachments?: FileInfo[];
}
```

### 5.8 添加跟进记录

```http
POST /customers/{id}/follow-records
```

**请求参数：**

```typescript
interface CreateFollowRecordRequest {
  followType: string;
  followContent: string;
  followResult?: string;
  nextFollowTime?: string;
  attachments?: string[];
}
```

## 6. 课程管理模块

### 6.1 获取课程分类树

```http
GET /course-categories/tree
```

### 6.2 获取课程列表

```http
GET /courses
```

**查询参数：**

```typescript
interface CourseQueryParams extends PageParams {
  courseName?: string;
  courseCode?: string;
  categoryId?: number;
  courseType?: number;
  teacherId?: number;
  status?: number;
  isFeatured?: boolean;
}
```

**响应数据：**

```typescript
interface CourseListItem {
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
```

### 6.3 获取课程详情

```http
GET /courses/{id}
```

### 6.4 创建课程

```http
POST /courses
```

### 6.5 更新课程

```http
PUT /courses/{id}
```

### 6.6 删除课程

```http
DELETE /courses/{id}
```

### 6.7 获取课程附件

```http
GET /courses/{id}/attachments
```

### 6.8 上传课程附件

```http
POST /courses/{id}/attachments
```

## 7. 班级管理模块

### 7.1 获取班级列表

```http
GET /classes
```

**查询参数：**

```typescript
interface ClassQueryParams extends PageParams {
  className?: string;
  classCode?: string;
  categoryId?: number;
  teacherId?: number;
  classStatus?: number;
  startDate?: string;
  endDate?: string;
}
```

### 7.2 获取班级详情

```http
GET /classes/{id}
```

### 7.3 创建班级

```http
POST /classes
```

### 7.4 更新班级

```http
PUT /classes/{id}
```

### 7.5 删除班级

```http
DELETE /classes/{id}
```

### 7.6 获取班级学员列表

```http
GET /classes/{id}/students
```

### 7.7 添加学员到班级

```http
POST /classes/{id}/students
```

**请求参数：**

```typescript
interface AddStudentToClassRequest {
  studentId: number;
  studentName: string;
  studentNo?: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
}
```

### 7.8 移除班级学员

```http
DELETE /classes/{classId}/students/{studentId}
```

### 7.9 获取班级通知公告

```http
GET /classes/{id}/announcements
```

### 7.10 发布班级通知

```http
POST /classes/{id}/announcements
```

**请求参数：**

```typescript
interface CreateAnnouncementRequest {
  title: string;
  content: string;
  importance: number;
  announcementType?: string;
  attachments?: string[];
}
```

### 7.11 获取班级课程安排

```http
GET /classes/{id}/courses
```

### 7.12 安排班级课程

```http
POST /classes/{id}/courses
```

## 8. 会议管理模块

### 8.1 获取会议列表

```http
GET /meetings
```

**查询参数：**

```typescript
interface MeetingQueryParams extends PageParams {
  meetingTitle?: string;
  meetingType?: string;
  organizerId?: number;
  meetingStatus?: number;
  startTimeBegin?: string;
  startTimeEnd?: string;
  isOnline?: boolean;
}
```

### 8.2 获取会议详情

```http
GET /meetings/{id}
```

### 8.3 创建会议

```http
POST /meetings
```

**请求参数：**

```typescript
interface CreateMeetingRequest {
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
```

### 8.4 更新会议

```http
PUT /meetings/{id}
```

### 8.5 删除会议

```http
DELETE /meetings/{id}
```

### 8.6 审核会议

```http
POST /meetings/{id}/approve
```

**请求参数：**

```typescript
interface ApproveMeetingRequest {
  approvalStatus: number;
  approvalComment?: string;
}
```

### 8.7 获取会议参与者

```http
GET /meetings/{id}/participants
```

### 8.8 确认参会

```http
PUT /meetings/{id}/participants/confirm
```

**请求参数：**

```typescript
interface ConfirmAttendanceRequest {
  attendanceStatus: number;
  remark?: string;
}
```

### 8.9 获取会议记录

```http
GET /meetings/{id}/records
```

### 8.10 添加会议记录

```http
POST /meetings/{id}/records
```

## 9. 财务管理模块

### 9.1 获取财务科目树

```http
GET /financial-subjects/tree
```

### 9.2 获取财务凭证列表

```http
GET /financial-vouchers
```

**查询参数：**

```typescript
interface VoucherQueryParams extends PageParams {
  voucherNo?: string;
  voucherType?: string;
  voucherStatus?: number;
  makerId?: number;
  voucherDateStart?: string;
  voucherDateEnd?: string;
}
```

### 9.3 获取财务凭证详情

```http
GET /financial-vouchers/{id}
```

### 9.4 创建财务凭证

```http
POST /financial-vouchers
```

**请求参数：**

```typescript
interface CreateVoucherRequest {
  voucherDate: string;
  voucherType: string;
  summary?: string;
  details: VoucherDetail[];
}

interface VoucherDetail {
  subjectId: number;
  summary?: string;
  debitAmount: number;
  creditAmount: number;
}
```

### 9.5 审核财务凭证

```http
PUT /financial-vouchers/{id}/check
```

### 9.6 过账财务凭证

```http
PUT /financial-vouchers/{id}/post
```

### 9.7 获取财务报表数据

```http
GET /financial/dashboard
```

**响应数据：**

```typescript
interface FinancialDashboard {
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
```

## 10. 报销管理模块

### 10.1 获取报销申请列表

```http
GET /expense-applications
```

**查询参数：**

```typescript
interface ExpenseApplicationQueryParams extends PageParams {
  applicationNo?: string;
  applicantId?: number;
  expenseType?: string;
  applicationStatus?: number;
  currentApproverId?: number;
  createTimeStart?: string;
  createTimeEnd?: string;
}
```

### 10.2 获取报销申请详情

```http
GET /expense-applications/{id}
```

### 10.3 创建报销申请

```http
POST /expense-applications
```

**请求参数：**

```typescript
interface CreateExpenseApplicationRequest {
  expenseType: string;
  applicationReason?: string;
  expensePeriodStart?: string;
  expensePeriodEnd?: string;
  remark?: string;
  items: ExpenseItem[];
}

interface ExpenseItem {
  itemName: string;
  itemType: string;
  expenseDate: string;
  amount: number;
  description?: string;
  receiptNo?: string;
  vendor?: string;
}
```

### 10.4 更新报销申请

```http
PUT /expense-applications/{id}
```

### 10.5 提交报销申请

```http
PUT /expense-applications/{id}/submit
```

### 10.6 审批报销申请

```http
POST /expense-applications/{id}/approve
```

**请求参数：**

```typescript
interface ApproveExpenseRequest {
  approvalStatus: number;
  approvalComment?: string;
  nextApproverId?: number;
}
```

### 10.7 撤回报销申请

```http
PUT /expense-applications/{id}/withdraw
```

### 10.8 上传报销附件

```http
POST /expense-applications/{id}/attachments
```

### 10.9 获取我的报销统计

```http
GET /expense-applications/my-statistics
```

**响应数据：**

```typescript
interface ExpenseStatistics {
  totalApplications: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  thisMonthAmount: number;
}
```

## 11. 任务管理模块

### 11.1 获取项目列表

```http
GET /projects
```

### 11.2 获取任务列表

```http
GET /tasks
```

**查询参数：**

```typescript
interface TaskQueryParams extends PageParams {
  taskName?: string;
  projectId?: number;
  assigneeId?: number;
  taskType?: string;
  taskStatus?: number;
  priority?: number;
  dueDateStart?: string;
  dueDateEnd?: string;
}
```

### 11.3 获取任务详情

```http
GET /tasks/{id}
```

### 11.4 创建任务

```http
POST /tasks
```

**请求参数：**

```typescript
interface CreateTaskRequest {
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
```

### 11.5 更新任务

```http
PUT /tasks/{id}
```

### 11.6 删除任务

```http
DELETE /tasks/{id}
```

### 11.7 更新任务进度

```http
PUT /tasks/{id}/progress
```

**请求参数：**

```typescript
interface UpdateTaskProgressRequest {
  progress: number;
  workHours?: number;
  actualCount?: number;
  remark?: string;
}
```

### 11.8 完成任务

```http
PUT /tasks/{id}/complete
```

### 11.9 获取任务日志

```http
GET /tasks/{id}/logs
```

### 11.10 添加任务日志

```http
POST /tasks/{id}/logs
```

### 11.11 获取我的任务统计

```http
GET /tasks/my-statistics
```

**响应数据：**

```typescript
interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
}
```

## 12. 系统管理模块

### 12.1 获取系统配置

```http
GET /system/configs
```

### 12.2 更新系统配置

```http
PUT /system/configs
```

### 12.3 获取数据字典

```http
GET /system/dictionaries
```

**查询参数：**

```typescript
interface DictionaryQueryParams {
  dictType?: string;
}
```

### 12.4 获取操作日志

```http
GET /system/operation-logs
```

### 12.5 文件上传

```http
POST /system/upload
```

**请求参数：**

```typescript
// FormData格式
interface UploadRequest {
  file: File;
  businessType?: string;
  businessId?: number;
}
```

**响应数据：**

```typescript
interface UploadResponse {
  id: number;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}
```

### 12.6 获取文件列表

```http
GET /system/files
```

### 12.7 删除文件

```http
DELETE /system/files/{id}
```

## 13. 员工管理关系模块

### 13.1 获取员工管理关系

```http
GET /employee-manager-relations
```

### 13.2 分配员工给管理员

```http
POST /employee-manager-relations
```

**请求参数：**

```typescript
interface AssignEmployeeRequest {
  employeeIds: number[];
  managerId: number;
  remark?: string;
}
```

### 13.3 取消员工管理关系

```http
DELETE /employee-manager-relations/{id}
```

### 13.4 获取管理员下属员工

```http
GET /managers/{id}/employees
```

### 13.5 获取员工的管理员

```http
GET /employees/{id}/managers
```

## 14. 统计分析模块

### 14.1 获取总览统计

```http
GET /statistics/overview
```

**响应数据：**

```typescript
interface OverviewStatistics {
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
```

### 14.2 获取客户统计

```http
GET /statistics/customers
```

### 14.3 获取课程统计

```http
GET /statistics/courses
```

### 14.4 获取财务统计

```http
GET /statistics/financial
```

### 14.5 获取任务统计

```http
GET /statistics/tasks
```

## 接口认证说明

### JWT Token格式

```typescript
interface JWTPayload {
  userId: number;
  userName: string;
  roles: string[];
  permissions: string[];
  iat: number;      // 签发时间
  exp: number;      // 过期时间
}
```

### 权限验证

- 接口级权限：检查用户是否有访问该接口的权限
- 数据级权限：检查用户是否有访问特定数据的权限
- 按钮级权限：检查用户是否有执行特定操作的权限

### 数据权限规则

1. **客户数据权限**：

   - 自己创建的客户：完全权限
   - 被分配的客户：根据分配的权限
   - 下属员工的客户：继承权限
2. **部门数据权限**：

   - 本部门数据：可查看
   - 下级部门数据：可查看
   - 其他部门数据：根据角色权限
3. **财务数据权限**：

   - 自己的报销：完全权限
   - 下属的报销：审批权限
   - 财务数据：根据角色权限

## 错误处理示例

```typescript
// 成功响应
{
  "code": 0,
  "message": "操作成功",
  "data": {...},
  "timestamp": 1704067200000,
  "path": "/api/v1/users"
}

// 错误响应
{
  "code": 1001,
  "message": "参数错误：用户名不能为空",
  "timestamp": 1704067200000,
  "path": "/api/v1/users"
}

// 权限错误
{
  "code": 1003,
  "message": "权限不足，无法访问该资源",
  "timestamp": 1704067200000,
  "path": "/api/v1/users/1"
}
```

## 接口调用示例

### JavaScript/TypeScript

```typescript
// 设置请求拦截器
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
});

// 请求拦截器 - 添加Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;
    if (code === 0) {
      return data;
    } else {
      throw new Error(message);
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 使用示例
async function getUserList(params: UserQueryParams) {
  try {
    const data = await api.get('/users', { params });
    return data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}
```

## 总结

本API接口设计文档涵盖了React SoybeanAdmin系统的所有核心功能模块，提供了：

1. **完整的RESTful API设计**：包含CRUD操作和业务逻辑接口
2. **统一的响应格式**：便于前端统一处理
3. **详细的权限控制**：支持多级权限验证
4. **灵活的查询参数**：支持复杂的筛选和分页
5. **完善的错误处理**：统一的错误码和错误信息
6. **实用的统计接口**：支持各种业务统计需求

该设计为前端开发提供了清晰的接口规范，有利于前后端协作开发和系统维护。
