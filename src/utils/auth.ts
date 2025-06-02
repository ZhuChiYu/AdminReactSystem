import { localStg } from '@/utils/storage';

/** 用户角色类型 */
export enum UserRole {
  // 超级管理员
  // 管理员
  ADMIN = 'admin',
  // 管理员
  // 顾问
  CONSULTANT = 'consultant',
  // 顾问
  // 人力BP
  HR_BP = 'hr_bp',
  // 市场部经理
  // 人力专员
  HR_SPECIALIST = 'hr_specialist',
  // 人力专员
  // 市场部经理
  MARKETING_MANAGER = 'marketing_manager',
  // 人力BP
  // 销售总监
  SALES_DIRECTOR = 'sales_director',
  // 销售经理
  SALES_MANAGER = 'sales_manager',
  // 销售总监
  // 超级管理员
  SUPER_ADMIN = 'super_admin'
}

/**
 * 判断当前用户是否为超级管理员
 *
 * @returns 如果是超级管理员返回true，否则返回false
 */
export function isSuperAdmin(): boolean {
  const userInfo = localStg.get('userInfo');
  if (!userInfo) return false;

  // 检查是否有super_admin角色
  return userInfo.roles.includes(UserRole.SUPER_ADMIN);
}

/**
 * 判断当前用户是否为管理员
 *
 * @returns 如果是管理员返回true，否则返回false
 */
export function isAdmin(): boolean {
  const userInfo = localStg.get('userInfo');
  if (!userInfo) return false;

  return userInfo.roles.includes(UserRole.ADMIN);
}

/**
 * 判断当前用户是否为管理员或超级管理员
 *
 * @returns 如果是管理员或超级管理员返回true，否则返回false
 */
export function isAdminOrSuperAdmin(): boolean {
  return isAdmin() || isSuperAdmin();
}

/**
 * 判断当前用户是否为员工（包括各种员工角色）
 *
 * @returns 如果是员工返回true，否则返回false
 */
export function isEmployee(): boolean {
  const userInfo = localStg.get('userInfo');
  if (!userInfo) return false;

  const employeeRoles = [
    UserRole.CONSULTANT,
    UserRole.MARKETING_MANAGER,
    UserRole.HR_SPECIALIST,
    UserRole.HR_BP,
    UserRole.SALES_MANAGER,
    UserRole.SALES_DIRECTOR
  ];

  return userInfo.roles.some((role: string) => employeeRoles.includes(role as UserRole));
}

/**
 * 获取当前用户ID
 *
 * @returns 当前用户ID，如果未登录则返回空字符串
 */
export function getCurrentUserId(): string {
  const userInfo = localStg.get('userInfo');
  if (!userInfo) return '';

  return userInfo.userId;
}

/**
 * 获取当前用户名
 *
 * @returns 当前用户名，如果未登录则返回空字符串
 */
export function getCurrentUserName(): string {
  const userInfo = localStg.get('userInfo');
  if (!userInfo) return '';

  return userInfo.userName;
}

/**
 * 获取当前用户信息
 *
 * @returns 当前用户信息，如果未登录则返回null
 */
export function getCurrentUserInfo(): Api.Auth.UserInfo | null {
  return localStg.get('userInfo');
}

/**
 * 检查用户是否可以管理指定员工
 *
 * @param employeeId 员工ID
 * @returns 是否可以管理
 */
export function canManageEmployee(employeeId: number): boolean {
  // 超级管理员可以管理所有员工
  if (isSuperAdmin()) {
    return true;
  }

  // 管理员只能管理分配给自己的员工
  if (isAdmin()) {
    // 这里应该从后端API获取管理关系
    // 暂时返回false，实际项目中需要实现具体的检查逻辑
    return false;
  }

  return false;
}

/**
 * 检查用户是否可以分配客户给指定员工
 *
 * @param employeeId 员工ID
 * @returns 是否可以分配
 */
export function canAssignCustomerToEmployee(employeeId: number): boolean {
  // 超级管理员可以分配给任何员工
  if (isSuperAdmin()) {
    return true;
  }

  // 管理员只能分配给自己管理的员工
  if (isAdmin()) {
    return canManageEmployee(employeeId);
  }

  return false;
}
