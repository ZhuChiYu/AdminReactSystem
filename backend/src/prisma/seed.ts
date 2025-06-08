import process from 'node:process';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('开始初始化数据库数据...');

  // 创建部门
  logger.info('📁 创建部门数据...');
  const departments = await Promise.all([
    prisma.department.upsert({
      create: {
        code: 'admin',
        level: 1,
        name: '管理部',
        remark: '系统管理部门',
        sort: 1,
        status: 1
      },
      update: {},
      where: { code: 'admin' }
    }),
    prisma.department.upsert({
      create: {
        code: 'sales',
        level: 1,
        name: '销售部',
        remark: '销售业务部门',
        sort: 2,
        status: 1
      },
      update: {},
      where: { code: 'sales' }
    }),
    prisma.department.upsert({
      create: {
        code: 'education',
        level: 1,
        name: '教学部',
        remark: '教学培训部门',
        sort: 3,
        status: 1
      },
      update: {},
      where: { code: 'education' }
    }),
    prisma.department.upsert({
      create: {
        code: 'finance',
        level: 1,
        name: '财务部',
        remark: '财务管理部门',
        sort: 4,
        status: 1
      },
      update: {},
      where: { code: 'finance' }
    })
  ]);

  logger.info('部门数据初始化完成');

  // 创建权限
  logger.info('🔐 创建权限数据...');
  const permissions = await Promise.all([
    // 系统管理权限
    prisma.permission.upsert({
      create: {
        code: 'system:user:list',
        name: '用户查询',
        sort: 1,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'system:user:list' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'system:user:create',
        name: '用户新增',
        sort: 2,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'system:user:create' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'system:user:update',
        name: '用户修改',
        sort: 3,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'system:user:update' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'system:user:delete',
        name: '删除用户',
        sort: 4,
        status: 1,
        type: 'button'
      },
      update: {},
      where: { code: 'system:user:delete' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'system:user:import',
        name: '导入用户',
        sort: 5,
        status: 1,
        type: 'button'
      },
      update: {},
      where: { code: 'system:user:import' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'system:user:manage',
        name: '用户管理',
        sort: 6,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'system:user:manage' }
    }),
    // 客户管理权限
    prisma.permission.upsert({
      create: {
        code: 'customer:list',
        name: '客户查询',
        sort: 10,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'customer:list' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'customer:create',
        name: '客户新增',
        sort: 11,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'customer:create' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'customer:update',
        name: '客户修改',
        sort: 12,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'customer:update' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'customer:delete',
        name: '客户删除',
        sort: 13,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'customer:delete' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'customer:assign',
        name: '客户分配',
        sort: 14,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'customer:assign' }
    }),
    // 课程管理权限
    prisma.permission.upsert({
      create: {
        code: 'course:list',
        name: '课程查询',
        sort: 20,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'course:list' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'course:create',
        name: '课程新增',
        sort: 21,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'course:create' }
    }),
    // 会议管理权限
    prisma.permission.upsert({
      create: {
        code: 'meeting:list',
        name: '会议查询',
        sort: 30,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'meeting:list' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'meeting:create',
        name: '会议新增',
        sort: 31,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'meeting:create' }
    }),
    // 系统管理权限
    prisma.permission.upsert({
      create: {
        code: 'system:config',
        name: '系统配置',
        sort: 40,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'system:config' }
    }),
    prisma.permission.upsert({
      create: {
        code: 'system:dict',
        name: '数据字典',
        sort: 41,
        status: 1,
        type: 'api'
      },
      update: {},
      where: { code: 'system:dict' }
    })
  ]);

  logger.info('权限数据初始化完成');

  // 创建角色数据
  logger.info('👥 创建角色数据...');
  const roles = await Promise.all([
    // 权限角色
    prisma.role.upsert({
      create: {
        remark: '系统超级管理员，拥有所有权限',
        roleCode: 'super_admin',
        roleName: '超级管理员',
        roleType: 'permission',
        sort: 1,
        status: 1
      },
      update: {},
      where: { roleCode: 'super_admin' }
    }),
    prisma.role.upsert({
      create: {
        remark: '系统管理员，拥有大部分权限',
        roleCode: 'admin',
        roleName: '管理员',
        roleType: 'permission',
        sort: 2,
        status: 1
      },
      update: {},
      where: { roleCode: 'admin' }
    }),
    prisma.role.upsert({
      create: {
        remark: '普通员工，基础权限',
        roleCode: 'employee',
        roleName: '员工',
        roleType: 'permission',
        sort: 3,
        status: 1
      },
      update: {},
      where: { roleCode: 'employee' }
    }),
    // 职位角色
    prisma.role.upsert({
      create: {
        remark: '负责公司整体运营',
        roleCode: 'general_manager',
        roleName: '总经理',
        roleType: 'position',
        sort: 4,
        status: 1
      },
      update: {},
      where: { roleCode: 'general_manager' }
    }),
    prisma.role.upsert({
      create: {
        remark: '负责销售战略和整体销售业绩',
        roleCode: 'sales_director',
        roleName: '销售总监',
        roleType: 'position',
        sort: 5,
        status: 1
      },
      update: {},
      where: { roleCode: 'sales_director' }
    }),
    prisma.role.upsert({
      create: {
        remark: '负责销售团队管理和业绩',
        roleCode: 'sales_manager',
        roleName: '销售经理',
        roleType: 'position',
        sort: 6,
        status: 1
      },
      update: {},
      where: { roleCode: 'sales_manager' }
    }),
    prisma.role.upsert({
      create: {
        remark: '负责市场部门的管理工作',
        roleCode: 'marketing_manager',
        roleName: '市场部经理',
        roleType: 'position',
        sort: 7,
        status: 1
      },
      update: {},
      where: { roleCode: 'marketing_manager' }
    }),
    prisma.role.upsert({
      create: {
        remark: '负责人力资源业务合作伙伴工作',
        roleCode: 'hr_bp',
        roleName: '人力BP',
        roleType: 'position',
        sort: 8,
        status: 1
      },
      update: {},
      where: { roleCode: 'hr_bp' }
    }),
    prisma.role.upsert({
      create: {
        remark: '负责人力资源日常事务',
        roleCode: 'hr_specialist',
        roleName: '人力专员',
        roleType: 'position',
        sort: 9,
        status: 1
      },
      update: {},
      where: { roleCode: 'hr_specialist' }
    }),
    prisma.role.upsert({
      create: {
        remark: '专业咨询顾问',
        roleCode: 'consultant',
        roleName: '顾问',
        roleType: 'position',
        sort: 10,
        status: 1
      },
      update: {},
      where: { roleCode: 'consultant' }
    })
  ]);

  logger.info('角色数据初始化完成');

  // 创建用户数据
  logger.info('👤 创建用户数据...');

  const users = [
    // 1个超级管理员
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_1.webp',
      // 1-启用
      departmentId: departments[0].id,
      email: 'admin@soybean.com',
      gender: 1,
      nickName: '超级管理员',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000001', // 总公司
      position: '超级管理员', // 1-男
      status: 1,
      userName: 'admin'
    },
    // 2个管理员
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_2.webp',
      // 1-启用
      departmentId: departments[1].id,
      email: 'manager1@soybean.com',
      gender: 1,
      nickName: '技术部经理',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000002', // 技术部
      position: '部门经理', // 1-男
      status: 1,
      userName: 'manager1'
    },
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_3.webp',
      // 1-启用
      departmentId: departments[2].id,
      email: 'manager2@soybean.com',
      gender: 2,
      nickName: '市场部经理',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000003', // 市场部
      position: '部门经理', // 2-女
      status: 1,
      userName: 'manager2'
    },
    // 4名员工
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_4.webp',
      // 1-启用
      departmentId: departments[1].id,
      email: 'employee1@soybean.com',
      gender: 1,
      nickName: '前端开发工程师',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000004', // 技术部
      position: '前端工程师', // 1-男
      status: 1,
      userName: 'employee1'
    },
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_5.webp',
      // 1-启用
      departmentId: departments[1].id,
      email: 'employee2@soybean.com',
      gender: 1,
      nickName: '后端开发工程师',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000005', // 技术部
      position: '后端工程师', // 1-男
      status: 1,
      userName: 'employee2'
    },
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_6.webp',
      // 1-启用
      departmentId: departments[2].id,
      email: 'employee3@soybean.com',
      gender: 2,
      nickName: '市场专员',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000006', // 市场部
      position: '市场专员', // 2-女
      status: 1,
      userName: 'employee3'
    },
    {
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_7.webp',
      // 1-启用
      departmentId: departments[3].id,
      email: 'employee4@soybean.com',
      gender: 2,
      nickName: '销售代表',
      password: await bcrypt.hash('123456', 10),
      phone: '13800000007', // 销售部
      position: '销售代表', // 2-女
      status: 1,
      userName: 'employee4'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      create: userData,
      update: userData,
      where: { userName: userData.userName }
    });
    createdUsers.push(user);
  }

  // 分配用户角色
  logger.info('🎭 分配用户角色...');
  await Promise.all([
    // 超级管理员
    prisma.userRole.upsert({
      create: {
        roleId: roles[0].id, // super_admin
        userId: createdUsers[0].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[0].id,
          userId: createdUsers[0].id
        }
      }
    }),
    // 技术部经理 - 管理员角色
    prisma.userRole.upsert({
      create: {
        roleId: roles[1].id, // admin
        userId: createdUsers[1].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[1].id,
          userId: createdUsers[1].id
        }
      }
    }),
    // 市场部经理 - 管理员角色
    prisma.userRole.upsert({
      create: {
        roleId: roles[1].id, // admin
        userId: createdUsers[2].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[1].id,
          userId: createdUsers[2].id
        }
      }
    }),
    // 员工1 - employee权限角色
    prisma.userRole.upsert({
      create: {
        roleId: roles[2].id, // employee
        userId: createdUsers[3].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[2].id,
          userId: createdUsers[3].id
        }
      }
    }),
    // 员工2 - 销售经理角色
    prisma.userRole.upsert({
      create: {
        roleId: roles[6].id, // sales_manager
        userId: createdUsers[4].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[6].id,
          userId: createdUsers[4].id
        }
      }
    }),
    // 员工3 - 人力专员角色
    prisma.userRole.upsert({
      create: {
        roleId: roles[7].id, // hr_specialist
        userId: createdUsers[5].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[7].id,
          userId: createdUsers[5].id
        }
      }
    }),
    // 员工4 - 市场部经理角色
    prisma.userRole.upsert({
      create: {
        roleId: roles[5].id, // marketing_manager
        userId: createdUsers[6].id
      },
      update: {},
      where: {
        userId_roleId: {
          roleId: roles[5].id,
          userId: createdUsers[6].id
        }
      }
    })
  ]);

  logger.info('用户角色分配完成');

  // 分配角色权限
  logger.info('🔗 分配角色权限...');

  // 为超级管理员角色分配所有权限
  const superAdminRole = roles[0]; // super_admin
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      create: {
        permissionId: permission.id,
        roleId: superAdminRole.id
      },
      update: {},
      where: {
        roleId_permissionId: {
          permissionId: permission.id,
          roleId: superAdminRole.id
        }
      }
    });
  }

  // 为管理员角色分配基本权限
  const adminRole = roles[1]; // admin
  const adminPermissions = permissions.filter(
    p =>
      p.code.includes('customer:') ||
      p.code.includes('course:') ||
      p.code.includes('meeting:') ||
      p.code.includes('system:user:')
  );

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      create: {
        permissionId: permission.id,
        roleId: adminRole.id
      },
      update: {},
      where: {
        roleId_permissionId: {
          permissionId: permission.id,
          roleId: adminRole.id
        }
      }
    });
  }

  // 为员工权限角色分配基本客户权限（只能操作自己创建的客户）
  const employeeRole = roles[2]; // employee
  const employeePermissions = permissions.filter(
    p =>
      p.code === 'customer:create' ||
      p.code === 'customer:list' ||
      p.code === 'customer:update'
  );

  for (const permission of employeePermissions) {
    await prisma.rolePermission.upsert({
      create: {
        permissionId: permission.id,
        roleId: employeeRole.id
      },
      update: {},
      where: {
        roleId_permissionId: {
          permissionId: permission.id,
          roleId: employeeRole.id
        }
      }
    });
  }

  // 为相关职位角色也分配客户权限（销售相关、市场相关、顾问等）
  const positionRolesWithCustomerAccess = [
    roles[5], // marketing_manager 市场部经理
    roles[6], // sales_manager 销售经理
    roles[7], // hr_specialist 人力专员
    roles[8]  // consultant 顾问
  ];

  for (const role of positionRolesWithCustomerAccess) {
    for (const permission of employeePermissions) {
      await prisma.rolePermission.upsert({
        create: {
          permissionId: permission.id,
          roleId: role.id
        },
        update: {},
        where: {
          roleId_permissionId: {
            permissionId: permission.id,
            roleId: role.id
          }
        }
      });
    }
  }

  logger.info('角色权限分配完成');

  // 创建课程分类
  logger.info('📚 创建课程分类...');
  await Promise.all([
    prisma.courseCategory.upsert({
      create: {
        code: 'tech',
        description: '技术相关培训课程',
        name: '技术培训',
        sort: 1,
        status: 1
      },
      update: {},
      where: { code: 'tech' }
    }),
    prisma.courseCategory.upsert({
      create: {
        code: 'management',
        description: '管理技能培训课程',
        name: '管理培训',
        sort: 2,
        status: 1
      },
      update: {},
      where: { code: 'management' }
    }),
    prisma.courseCategory.upsert({
      create: {
        code: 'sales',
        description: '销售技能培训课程',
        name: '销售培训',
        sort: 3,
        status: 1
      },
      update: {},
      where: { code: 'sales' }
    })
  ]);

  logger.info('课程分类数据初始化完成');

  // 创建会议室
  logger.info('🏢 创建会议室数据...');
  await Promise.all([
    prisma.meetingRoom.upsert({
      create: {
        capacity: 50,
        equipment: ['投影仪', '音响', '白板', '空调'],
        location: '1楼101室',
        name: '大会议室',
        status: 1
      },
      update: {},
      where: { id: 1 }
    }),
    prisma.meetingRoom.upsert({
      create: {
        capacity: 10,
        equipment: ['电视', '白板', '空调'],
        location: '2楼201室',
        name: '小会议室A',
        status: 1
      },
      update: {},
      where: { id: 2 }
    }),
    prisma.meetingRoom.upsert({
      create: {
        capacity: 8,
        equipment: ['电视', '白板'],
        location: '2楼202室',
        name: '小会议室B',
        status: 1
      },
      update: {},
      where: { id: 3 }
    })
  ]);

  logger.info('会议室数据初始化完成');

  // 创建系统字典
  logger.info('📖 创建系统字典...');
  const dictData = [
    // 客户跟进状态
    { label: '咨询', type: 'follow_status', value: 'consult' },
    { label: '已加微信', type: 'follow_status', value: 'wechat_added' },
    { label: '已报名', type: 'follow_status', value: 'registered' },
    { label: '已到访', type: 'follow_status', value: 'arrived' },
    { label: '新开发', type: 'follow_status', value: 'new_develop' },
    { label: '早期25%', type: 'follow_status', value: 'early_25' },
    { label: '有效到访', type: 'follow_status', value: 'effective_visit' },
    { label: '未到访', type: 'follow_status', value: 'not_arrived' },
    { label: '已拒绝', type: 'follow_status', value: 'rejected' },
    { label: 'VIP', type: 'follow_status', value: 'vip' },

    // 客户来源
    { label: '网络推广', type: 'customer_source', value: 'online' },
    { label: '电话营销', type: 'customer_source', value: 'telemarketing' },
    { label: '朋友介绍', type: 'customer_source', value: 'referral' },
    { label: '展会', type: 'customer_source', value: 'exhibition' },
    { label: '其他', type: 'customer_source', value: 'other' },

    // 行业类型
    { label: 'IT互联网', type: 'industry', value: 'it' },
    { label: '制造业', type: 'industry', value: 'manufacturing' },
    { label: '金融', type: 'industry', value: 'finance' },
    { label: '教育', type: 'industry', value: 'education' },
    { label: '医疗', type: 'industry', value: 'medical' },
    { label: '其他', type: 'industry', value: 'other' }
  ];

  const dictPromises = dictData.map(dict =>
    prisma.systemDict.upsert({
      create: {
        dictLabel: dict.label,
        dictType: dict.type,
        dictValue: dict.value,
        sort: 0,
        status: 1
      },
      update: {},
      where: {
        dictType_dictValue: {
          dictType: dict.type,
          dictValue: dict.value
        }
      }
    })
  );

  await Promise.all(dictPromises);

  logger.info('系统字典数据初始化完成');

  logger.info('数据库初始化完成！');
  logger.info('📋 默认账号信息：');
  logger.info('   超级管理员:');
  logger.info('     用户名: admin');
  logger.info('     密码: 123456');
  logger.info('     邮箱: admin@soybean.com');
  logger.info('   管理员账号:');
  logger.info('     用户名: manager1 / manager2');
  logger.info('     密码: 123456');
  logger.info('   员工账号:');
  logger.info('     用户名: employee1 / employee2 / employee3 / employee4');
  logger.info('     密码: 123456');
}

main()
  .catch(e => {
    logger.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
