import { request } from '../request';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  // 使用模拟数据替代API调用，展示新的角色列表
  const roles: Api.SystemManage.Role[] = [
    {
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 1,
      roleCode: 'consultant',
      roleDesc: '负责提供专业咨询和建议',
      roleName: '顾问',
      status: '1',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00'
    },
    {
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 2,
      roleCode: 'marketing_manager',
      roleDesc: '负责市场部门的管理工作',
      roleName: '经理（市场部）',
      status: '1',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00'
    },
    {
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 3,
      roleCode: 'hr_specialist',
      roleDesc: '负责人力资源日常事务',
      roleName: '人力专员',
      status: '1',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00'
    },
    {
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 4,
      roleCode: 'hr_bp',
      roleDesc: '负责人力资源业务合作伙伴工作',
      roleName: '人力BP',
      status: '1',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00'
    },
    {
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 5,
      roleCode: 'sales_manager',
      roleDesc: '负责销售团队管理和业绩',
      roleName: '销售经理',
      status: '1',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00'
    },
    {
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 6,
      roleCode: 'sales_director',
      roleDesc: '负责销售战略和整体销售业绩',
      roleName: '销售总监',
      status: '1',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00'
    }
  ];

  // 处理分页逻辑
  const current = params?.current || 1;
  const size = params?.size || 10;
  const total = roles.length;

  // 处理搜索过滤
  const filteredRoles = roles.filter(role => {
    if (params?.roleCode && !role.roleCode.includes(params.roleCode)) return false;
    if (params?.roleName && !role.roleName.includes(params.roleName)) return false;
    if (params?.status && role.status !== params.status) return false;
    return true;
  });

  // 添加索引
  const records = filteredRoles.map((role, index) => ({
    ...role,
    index: (current - 1) * size + index + 1
  }));

  // 模拟返回数据
  return Promise.resolve({
    data: {
      current,
      records,
      size,
      total
    }
  });

  // 原始API调用
  /*
  return request<Api.SystemManage.RoleList>({
    method: 'get',
    params,
    url: '/systemManage/getRoleList'
  });
  */
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
  // 使用模拟数据替代API调用，展示实际可登录的用户
  const users: Api.SystemManage.User[] = [
    {
      address: '北京市朝阳区',
      bankCard: '6200000000000001',
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 1,
      idCard: '110101199001011234',
      nickName: '超级管理员',
      status: '1',
      tim: 'tim_super',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00',
      userEmail: 'super@example.com',
      userGender: '1',
      userName: 'Super',
      userPhone: '13800000001',
      userRoles: ['super'],
      wechat: 'wx_super'
    },
    {
      address: '上海市浦东新区',
      bankCard: '6200000000000002',
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 2,
      idCard: '310101199001012345',
      nickName: '管理员',
      status: '1',
      tim: 'tim_admin',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00',
      userEmail: 'admin@example.com',
      userGender: '1',
      userName: 'Admin',
      userPhone: '13800000002',
      userRoles: ['admin'],
      wechat: 'wx_admin'
    },
    {
      address: '广州市天河区',
      bankCard: '6200000000000003',
      createBy: 'system',
      createTime: '2023-01-01 00:00:00',
      id: 3,
      idCard: '440101199001013456',
      nickName: '普通用户',
      status: '1',
      tim: 'tim_user',
      updateBy: 'system',
      updateTime: '2023-01-01 00:00:00',
      userEmail: 'user@example.com',
      userGender: '2',
      userName: 'User',
      userPhone: '13800000003',
      userRoles: ['user'],
      wechat: 'wx_user'
    }
  ];

  // 处理分页逻辑
  const current = params?.current || 1;
  const size = params?.size || 10;
  const total = users.length;
  const filteredUsers = users.filter(user => {
    // 处理搜索条件
    if (params?.userName && !user.userName.includes(params.userName)) return false;
    if (params?.nickName && !user.nickName.includes(params.nickName)) return false;
    if (params?.userPhone && !user.userPhone.includes(params.userPhone)) return false;
    if (params?.userEmail && !user.userEmail.includes(params.userEmail)) return false;
    if (params?.userGender && user.userGender !== params.userGender) return false;
    if (params?.status && user.status !== params.status) return false;
    return true;
  });

  // 添加索引
  const records = filteredUsers.map((user, index) => ({
    ...user,
    index: (current - 1) * size + index + 1
  }));

  // 模拟返回数据
  return Promise.resolve({
    data: {
      current,
      records,
      size,
      total
    }
  });

  // 原始API调用
  /*
  return request<Api.SystemManage.UserList>({
    method: 'get',
    params,
    url: '/systemManage/getUserList'
  });
  */
}

/** get menu list */
export function fetchGetMenuList() {
  return request<Api.SystemManage.MenuList>({
    method: 'get',
    url: '/systemManage/getMenuList/v2'
  });
}

/** get all pages */
export function fetchGetAllPages() {
  return request<string[]>({
    method: 'get',
    url: '/systemManage/getAllPages'
  });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuTree[]>({
    method: 'get',
    url: '/systemManage/getMenuTree'
  });
}
