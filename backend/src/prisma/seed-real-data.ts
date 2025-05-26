import process from 'node:process';
import fs from 'fs';
import path from 'path';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// 读取Excel导入的数据
const excelDataPath = path.join(__dirname, '../../data/excel-import-data.json');
const excelData = JSON.parse(fs.readFileSync(excelDataPath, 'utf8'));

async function main() {
  logger.info('开始使用真实数据初始化数据库...');

  // 清理现有数据
  logger.info('🧹 清理现有数据...');
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.department.deleteMany();

  // 创建部门
  logger.info('📁 创建部门数据...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        code: 'admin',
        level: 1,
        name: '管理部',
        remark: '系统管理部门',
        sort: 1,
        status: 1
      }
    }),
    prisma.department.create({
      data: {
        code: 'sales',
        level: 1,
        name: '销售部',
        remark: '销售业务部门',
        sort: 2,
        status: 1
      }
    }),
    prisma.department.create({
      data: {
        code: 'marketing',
        level: 1,
        name: '市场部',
        remark: '市场推广部门',
        sort: 3,
        status: 1
      }
    }),
    prisma.department.create({
      data: {
        code: 'hr',
        level: 1,
        name: '人力资源部',
        remark: '人力资源管理部门',
        sort: 4,
        status: 1
      }
    })
  ]);

  logger.info('部门数据初始化完成');

  // 创建角色
  logger.info('👥 创建角色数据...');
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        remark: '系统超级管理员，拥有所有权限',
        roleCode: 'super_admin',
        roleName: '超级管理员',
        sort: 1,
        status: 1
      }
    }),
    prisma.role.create({
      data: {
        remark: '系统管理员',
        roleCode: 'admin',
        roleName: '管理员',
        sort: 2,
        status: 1
      }
    }),
    prisma.role.create({
      data: {
        remark: '负责提供专业咨询和建议',
        roleCode: 'consultant',
        roleName: '顾问',
        sort: 3,
        status: 1
      }
    }),
    prisma.role.create({
      data: {
        remark: '负责销售团队管理和业绩',
        roleCode: 'sales_manager',
        roleName: '销售经理',
        sort: 4,
        status: 1
      }
    }),
    prisma.role.create({
      data: {
        remark: '负责市场部门的管理工作',
        roleCode: 'marketing_manager',
        roleName: '市场部经理',
        sort: 5,
        status: 1
      }
    }),
    prisma.role.create({
      data: {
        remark: '负责人力资源日常事务',
        roleCode: 'hr_specialist',
        roleName: '人力专员',
        sort: 6,
        status: 1
      }
    })
  ]);

  logger.info('角色数据初始化完成');

  // 创建权限
  logger.info('🔐 创建权限数据...');
  const permissions = await Promise.all([
    // 系统管理权限
    prisma.permission.create({
      data: {
        code: 'system:user:list',
        name: '用户查询',
        sort: 1,
        status: 1,
        type: 'api'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'system:user:create',
        name: '用户新增',
        sort: 2,
        status: 1,
        type: 'api'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'system:user:update',
        name: '用户修改',
        sort: 3,
        status: 1,
        type: 'api'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'system:user:delete',
        name: '用户删除',
        sort: 4,
        status: 1,
        type: 'api'
      }
    }),
    // 客户管理权限
    prisma.permission.create({
      data: {
        code: 'customer:list',
        name: '客户查询',
        sort: 10,
        status: 1,
        type: 'api'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'customer:create',
        name: '客户新增',
        sort: 11,
        status: 1,
        type: 'api'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'customer:update',
        name: '客户修改',
        sort: 12,
        status: 1,
        type: 'api'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'customer:delete',
        name: '客户删除',
        sort: 13,
        status: 1,
        type: 'api'
      }
    })
  ]);

  logger.info('权限数据初始化完成');

  // 为超级管理员角色分配所有权限
  logger.info('🔗 分配角色权限...');
  const superAdminRole = roles[0]; // super_admin
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id
      }
    });
  }

  logger.info('角色权限分配完成');

  // 添加超级管理员
  logger.info('👤 创建超级管理员...');
  const superAdmin = await prisma.user.create({
    data: {
      userName: 'admin',
      password: await bcrypt.hash('123456', 10),
      nickName: '超级管理员',
      email: 'admin@soybean.com',
      phone: '13800000001',
      avatar: 'https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_1.webp',
      gender: 1,
      status: 1,
      departmentId: departments[0].id,
      position: '超级管理员'
    }
  });

  // 分配超级管理员角色
  await prisma.userRole.create({
    data: {
      userId: superAdmin.id,
      roleId: roles[0].id // super_admin
    }
  });

  // 创建真实员工数据
  logger.info('👥 创建真实员工数据...');
  const createdUsers = [];

  for (const employeeData of excelData.employees) {
    // 找到对应的部门
    const department = departments.find(d => d.code === employeeData.departmentCode) || departments[1];

    const user = await prisma.user.create({
      data: {
        userName: employeeData.userName,
        password: employeeData.password,
        nickName: employeeData.nickName,
        email: employeeData.email,
        phone: employeeData.phone,
        avatar: employeeData.avatar,
        gender: employeeData.gender,
        status: employeeData.status,
        departmentId: department.id,
        position: employeeData.position
      }
    });

    createdUsers.push(user);

    // 分配角色
    const role = roles.find(r => r.roleCode === employeeData.roleCode) || roles[2]; // 默认consultant
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id
      }
    });
  }

  logger.info(`成功创建 ${createdUsers.length} 个员工账户`);

  // 创建真实客户数据
  logger.info('👥 创建真实客户数据...');
  const createdCustomers = [];

  for (const customerData of excelData.customers) {
    const customer = await prisma.customer.create({
      data: {
        customerName: customerData.name,
        company: customerData.company,
        position: customerData.position,
        phone: customerData.phone,
        mobile: customerData.mobile,
        email: customerData.email,
        industry: customerData.industry,
        source: customerData.source,
        followStatus: customerData.followStatus,
        level: 1, // 默认普通客户
        createdById: superAdmin.id, // 由超级管理员创建
        remark: customerData.followNotes
      }
    });

    createdCustomers.push(customer);
  }

  logger.info(`成功创建 ${createdCustomers.length} 个客户记录`);

  logger.info('✅ 真实数据初始化完成！');
  logger.info('📋 登录信息：');
  logger.info('   超级管理员:');
  logger.info('     用户名: admin');
  logger.info('     密码: 123456');
  logger.info('   员工账号:');

  excelData.userCredentials.forEach((cred: any) => {
    logger.info(`     ${cred.name}: ${cred.username} / ${cred.password} (${cred.role})`);
  });
}

main()
  .catch(e => {
    logger.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
