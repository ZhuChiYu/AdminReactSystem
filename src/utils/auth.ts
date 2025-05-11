import { localStg } from '@/utils/storage';

/** 用户角色类型 */
export enum UserRole {
  // 管理员
  ADMIN = 'admin',
  // 普通员工
  EMPLOYEE = 'employee',
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

  // 检查是否有super_admin角色或R_SUPER角色
  return userInfo.roles.includes(UserRole.SUPER_ADMIN) || userInfo.roles.includes('R_SUPER');
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
 * 判断当前用户是否为员工
 *
 * @returns 如果是员工返回true，否则返回false
 */
export function isEmployee(): boolean {
  const userInfo = localStg.get('userInfo');
  if (!userInfo) return false;

  return userInfo.roles.includes(UserRole.EMPLOYEE);
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
