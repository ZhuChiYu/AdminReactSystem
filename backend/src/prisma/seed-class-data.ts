import process from 'node:process';

import { PrismaClient } from '@prisma/client';

import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('开始初始化班级数据...');

  // 清理现有班级数据
  logger.info('🧹 清理现有班级数据...');
  await prisma.classStudent.deleteMany();
  await prisma.class.deleteMany();

  // 创建班级数据
  logger.info('📚 创建班级数据...');

  // 司库管理体系建设班级
  const treasuryClass = await prisma.class.create({
    data: {
      categoryId: 2,
      description: '深入学习司库管理体系建设，从现金管理到产业赋能的全面培训课程',
      endDate: new Date('2024-03-17'),
      name: '司库管理体系建设：从现金管理到产业赋能',
      startDate: new Date('2024-03-15'),
      status: 2, // 已结束
      studentCount: 0
    }
  });

  // 财务数字化转型班级
  const digitalFinanceClass = await prisma.class.create({
    data: {
      categoryId: 1,
      description: '智能会计技术应用与财务数字化转型实践',
      endDate: new Date('2024-04-12'),
      name: '智能会计与财务数字化转型',
      startDate: new Date('2024-04-10'),
      status: 2, // 已结束
      studentCount: 0
    }
  });

  // 风险合规内控审计班级
  const riskComplianceClass = await prisma.class.create({
    data: {
      categoryId: 2,
      description: '数智化风险合规内控审计法务一体化管理体系建设',
      endDate: new Date('2024-05-22'),
      name: '构建数智化的风险合规内控审计法务五位一体化',
      startDate: new Date('2024-05-20'),
      status: 1, // 进行中
      studentCount: 0
    }
  });

  // 税务管理班级
  const taxManagementClass = await prisma.class.create({
    data: {
      categoryId: 1,
      description: '建筑施工行业税务管理实务与人工智能技术应用',
      endDate: new Date('2024-06-17'),
      name: '建筑施工企业税务管理与人工智能应用',
      startDate: new Date('2024-06-15'),
      status: 0, // 未开始
      studentCount: 0
    }
  });

  // 私募基金管理班级
  const fundManagementClass = await prisma.class.create({
    data: {
      categoryId: 2,
      description: '私募基金行业深度研究与专业投资管理实务',
      endDate: new Date('2024-07-12'),
      name: '私募基金行业研究与投资管理',
      startDate: new Date('2024-07-10'),
      status: 0, // 未开始
      studentCount: 0
    }
  });

  logger.info('班级数据创建完成');

  // 创建学员数据
  logger.info('👥 创建学员数据...');

  // 司库管理体系建设班级学员
  const treasuryStudents = [
    {
      attendanceRate: 100,
      company: '广州南方学院',
      email: 'kanglf@gznfu.edu.cn',
      joinDate: new Date('2024-03-15'),
      name: '康良福',
      phone: '13834639770',
      position: '财务主管',
      status: 1
    },
    {
      attendanceRate: 95,
      company: '中信建投证券',
      email: 'duanyu@csc.com.cn',
      joinDate: new Date('2024-03-15'),
      name: '段誉',
      phone: '13871822155',
      position: '财务经理',
      status: 1
    },
    {
      attendanceRate: 100,
      company: '湘电集团',
      email: 'caoqiong@xdgroup.com',
      joinDate: new Date('2024-03-15'),
      name: '曹琼',
      phone: '13892326946',
      position: '审计主管',
      status: 1
    },
    {
      attendanceRate: 90,
      company: '无锡交通建设工程集团',
      email: 'chenjiayun@wxtc.com',
      joinDate: new Date('2024-03-15'),
      name: '陈加云',
      phone: '13840964348',
      position: '财务主任',
      status: 1
    },
    {
      attendanceRate: 100,
      company: '国能包神铁路集团',
      email: 'yuanfang@chnenergy.com.cn',
      joinDate: new Date('2024-03-15'),
      name: '院芳',
      phone: '13837110338',
      position: '审计部长',
      status: 1
    }
  ];

  for (const student of treasuryStudents) {
    await prisma.classStudent.create({
      data: {
        classId: treasuryClass.id,
        ...student
      }
    });
  }

  // 财务数字化转型班级学员
  const digitalFinanceStudents = [
    {
      attendanceRate: 95,
      company: '长春市新兴产业股权投资',
      email: 'libingbing@ccxc.com',
      joinDate: new Date('2024-04-10'),
      name: '李冰冰',
      phone: '13872439087',
      position: '人力资源总监',
      status: 1
    },
    {
      attendanceRate: 100,
      company: '郑州一建集团有限公司',
      email: 'zoutong@zzyjjt.com',
      joinDate: new Date('2024-04-10'),
      name: '邹通',
      phone: '13849051937',
      position: '培训负责人',
      status: 1
    },
    {
      attendanceRate: 100,
      company: '通鼎互联信息股份有限公司',
      email: 'cuifei@tonding.cn',
      joinDate: new Date('2024-04-10'),
      name: '崔霏',
      phone: '13837682051',
      position: '财务副总经理',
      status: 1
    }
  ];

  for (const student of digitalFinanceStudents) {
    await prisma.classStudent.create({
      data: {
        classId: digitalFinanceClass.id,
        ...student
      }
    });
  }

  // 风险合规内控审计班级学员
  const riskComplianceStudents = [
    {
      attendanceRate: 85,
      company: '深圳市奇偶潮乐文化传播有限公司',
      email: 'guoxi@qiou.com',
      joinDate: new Date('2024-05-20'),
      name: '郭曦',
      phone: '13837046943',
      position: '负责人',
      status: 1
    },
    {
      attendanceRate: 90,
      company: '深圳市奇偶潮乐文化传播有限公司',
      email: 'zhangxin@qiou.com',
      joinDate: new Date('2024-05-20'),
      name: '张昕',
      phone: '13883230645',
      position: '经理',
      status: 1
    },
    {
      attendanceRate: 100,
      company: '内蒙古大学',
      email: 'wangwei@imu.edu.cn',
      joinDate: new Date('2024-05-20'),
      name: '王崴',
      phone: '13850458513',
      position: '科长',
      status: 1
    }
  ];

  for (const student of riskComplianceStudents) {
    await prisma.classStudent.create({
      data: {
        classId: riskComplianceClass.id,
        ...student
      }
    });
  }

  // 更新班级学员数量
  await prisma.class.update({
    data: { studentCount: treasuryStudents.length },
    where: { id: treasuryClass.id }
  });

  await prisma.class.update({
    data: { studentCount: digitalFinanceStudents.length },
    where: { id: digitalFinanceClass.id }
  });

  await prisma.class.update({
    data: { studentCount: riskComplianceStudents.length },
    where: { id: riskComplianceClass.id }
  });

  await prisma.class.update({
    data: { studentCount: 0 },
    where: { id: taxManagementClass.id }
  });

  await prisma.class.update({
    data: { studentCount: 0 },
    where: { id: fundManagementClass.id }
  });

  logger.info('学员数据创建完成');
  logger.info('班级数据初始化完成！');
  logger.info('📋 创建的班级：');
  logger.info(`   1. ${treasuryClass.name} - ${treasuryStudents.length}名学员`);
  logger.info(`   2. ${digitalFinanceClass.name} - ${digitalFinanceStudents.length}名学员`);
  logger.info(`   3. ${riskComplianceClass.name} - ${riskComplianceStudents.length}名学员`);
  logger.info(`   4. ${taxManagementClass.name} - 0名学员`);
  logger.info(`   5. ${fundManagementClass.name} - 0名学员`);
}

main()
  .catch(e => {
    logger.error('❌ 班级数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
