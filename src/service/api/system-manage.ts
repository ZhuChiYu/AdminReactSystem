import { apiClient } from './client';
import type { PageResponse, UserApi } from './types';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  try {
    return apiClient.get('/system/roles', { params });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return {
      current: params?.current || 1,
      pages: 0,
      records: [],
      size: params?.size || 10,
      total: 0
    };
  }
}

/**
 * get all roles
 *
 * these roles are all enabled
 */
export function fetchGetAllRoles() {
  // 返回所有启用的角色
  const allRoles: Api.SystemManage.AllRole[] = [
    {
      id: 1,
      roleCode: 'consultant',
      roleName: '顾问'
    },
    {
      id: 2,
      roleCode: 'marketing_manager',
      roleName: '经理（市场部）'
    },
    {
      id: 3,
      roleCode: 'hr_specialist',
      roleName: '人力专员'
    },
    {
      id: 4,
      roleCode: 'hr_bp',
      roleName: '人力BP'
    },
    {
      id: 5,
      roleCode: 'sales_manager',
      roleName: '销售经理'
    },
    {
      id: 6,
      roleCode: 'sales_director',
      roleName: '销售总监'
    }
  ];

  return Promise.resolve({
    data: allRoles
  });

  // 原始API调用
  /*
  return request<Api.SystemManage.AllRole[]>({
    method: 'get',
    url: '/systemManage/getAllRoles'
  });
  */
}

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  try {
    return apiClient.get('/system/users', { params });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      current: params?.current || 1,
      pages: 0,
      records: [],
      size: params?.size || 10,
      total: 0
    };
  }
}

/** get menu list */
export function fetchGetMenuList() {
  try {
    return apiClient.get('/system/menus');
  } catch (error) {
    console.error('获取菜单列表失败:', error);
    return [];
  }
}

/** get all pages */
export function fetchGetAllPages() {
  try {
    return apiClient.get('/system/pages');
  } catch (error) {
    console.error('获取页面列表失败:', error);
    return [];
  }
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    method: 'get',
    url: '/systemManage/getMenuTree'
  });
}

/** get user detail */
export function fetchGetUserDetail(id: number) {
  try {
    return apiClient.get(`/system/users/${id}`);
  } catch (error) {
    console.error('获取用户详情失败:', error);
    throw error;
  }
}

/** create user */
export function fetchCreateUser(data: UserApi.CreateUserRequest) {
  try {
    return apiClient.post('/system/users', data);
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

/** update user */
export function fetchUpdateUser(id: number, data: Partial<UserApi.CreateUserRequest>) {
  try {
    return apiClient.put(`/system/users/${id}`, data);
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

/** delete user */
export function fetchDeleteUser(id: number) {
  try {
    return apiClient.delete(`/system/users/${id}`);
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
}

/** get department list */
export function fetchGetDepartmentList() {
  try {
    return apiClient.get('/system/departments');
  } catch (error) {
    console.error('获取部门列表失败:', error);
    return [];
  }
}

/** get system statistics */
export function fetchGetSystemStatistics() {
  try {
    return apiClient.get('/system/statistics');
  } catch (error) {
    console.error('获取系统统计失败:', error);
    return {
      activeUsers: 0,
      todayLoginUsers: 0,
      totalDepartments: 0,
      totalRoles: 0,
      totalUsers: 0
    };
  }
}
