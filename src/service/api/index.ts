export { attachmentService } from './attachment';
export * from './auth';

// 导出所有API服务
export {
  authService,
  fetchGetUserInfo,
  fetchLogin,
  fetchLogout,
  fetchRefreshToken,
  fetchRoutes,
  fetchUserInfo
} from './auth';
export { avatarService } from './avatar';

export { classService } from './class';
// 班级相关导出
export * from './class';
// 导出客户端
export { apiClient, createMockPageResponse, createMockResponse, fetchCustomBackendError } from './client';
export { courseService } from './course';
export { customerService } from './customer';

// 员工相关导出
export * from './employee';

export { expenseService } from './expense';

export { meetingService } from './meeting';

export { notificationService } from './notification';

export * from './project';

export { projectService } from './project';

export * from './route';

export { statisticsService } from './statistics';

export * from './system-manage';

export { taskAttachmentService } from './taskAttachment';

// 导出类型定义
export * from './types';

export type * from './types';

export { userService } from './user';
