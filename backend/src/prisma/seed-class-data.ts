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
      name: '司库管理体系建设：从现金管理到产业赋能',
      categoryId: 2,
      categoryName: '管理培训',
      teacher: '张教授',
      description: '深入学习司库管理体系建设，从现金管理到产业赋能的全面培训课程',
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-17'),
      status: 2, // 已结束
      studentCount: 0
    }
  });

  // 财务数字化转型班级
  const digitalFinanceClass = await prisma.class.create({
    data: {
      name: '智能会计与财务数字化转型',
      categoryId: 1,
      categoryName: '技术培训',
      teacher: '李教授',
      description: '智能会计技术应用与财务数字化转型实践',
      startDate: new Date('2024-04-10'),
      endDate: new Date('2024-04-12'),
      status: 2, // 已结束
      studentCount: 0
    }
  });

  // 风险合规内控审计班级
  const riskComplianceClass = await prisma.class.create({
    data: {
      name: '构建数智化的风险合规内控审计法务五位一体化',
      categoryId: 2,
      categoryName: '管理培训',
      teacher: '王教授',
      description: '数智化风险合规内控审计法务一体化管理体系建设',
      startDate: new Date('2024-05-20'),
      endDate: new Date('2024-05-22'),
      status: 1, // 进行中
      studentCount: 0
    }
  });

  // 税务管理班级
  const taxManagementClass = await prisma.class.create({
    data: {
      name: '建筑施工企业税务管理与人工智能应用',
      categoryId: 1,
      categoryName: '技术培训',
      teacher: '赵教授',
      description: '建筑施工行业税务管理实务与人工智能技术应用',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-17'),
      status: 0, // 未开始
      studentCount: 0
    }
  });

  // 私募基金管理班级
  const fundManagementClass = await prisma.class.create({
    data: {
      name: '私募基金行业研究与投资管理',
      categoryId: 2,
      categoryName: '管理培训',
      teacher: '陈教授',
      description: '私募基金行业深度研究与专业投资管理实务',
      startDate: new Date('2024-07-10'),
      endDate: new Date('2024-07-12'),
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
      name: '康良福',
      company: '广州南方学院',
      position: '财务主管',
      phone: '13834639770',
      email: 'kanglf@gznfu.edu.cn',
      joinDate: new Date('2024-03-15'),
      attendanceRate: 100,
      status: 1
    },
    {
      name: '段誉',
      company: '中信建投证券',
      position: '财务经理',
      phone: '13871822155',
      email: 'duanyu@csc.com.cn',
      joinDate: new Date('2024-03-15'),
      attendanceRate: 95,
      status: 1
    },
    {
      name: '曹琼',
      company: '湘电集团',
      position: '审计主管',
      phone: '13892326946',
      email: 'caoqiong@xdgroup.com',
      joinDate: new Date('2024-03-15'),
      attendanceRate: 100,
      status: 1
    },
    {
      name: '陈加云',
      company: '无锡交通建设工程集团',
      position: '财务主任',
      phone: '13840964348',
      email: 'chenjiayun@wxtc.com',
      joinDate: new Date('2024-03-15'),
      attendanceRate: 90,
      status: 1
    },
    {
      name: '院芳',
      company: '国能包神铁路集团',
      position: '审计部长',
      phone: '13837110338',
      email: 'yuanfang@chnenergy.com.cn',
      joinDate: new Date('2024-03-15'),
      attendanceRate: 100,
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
      name: '李冰冰',
      company: '长春市新兴产业股权投资',
      position: '人力资源总监',
      phone: '13872439087',
      email: 'libingbing@ccxc.com',
      joinDate: new Date('2024-04-10'),
      attendanceRate: 95,
      status: 1
    },
    {
      name: '邹通',
      company: '郑州一建集团有限公司',
      position: '培训负责人',
      phone: '13849051937',
      email: 'zoutong@zzyjjt.com',
      joinDate: new Date('2024-04-10'),
      attendanceRate: 100,
      status: 1
    },
    {
      name: '崔霏',
      company: '通鼎互联信息股份有限公司',
      position: '财务副总经理',
      phone: '13837682051',
      email: 'cuifei@tonding.cn',
      joinDate: new Date('2024-04-10'),
      attendanceRate: 100,
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
      name: '郭曦',
      company: '深圳市奇偶潮乐文化传播有限公司',
      position: '负责人',
      phone: '13837046943',
      email: 'guoxi@qiou.com',
      joinDate: new Date('2024-05-20'),
      attendanceRate: 85,
      status: 1
    },
    {
      name: '张昕',
      company: '深圳市奇偶潮乐文化传播有限公司',
      position: '经理',
      phone: '13883230645',
      email: 'zhangxin@qiou.com',
      joinDate: new Date('2024-05-20'),
      attendanceRate: 90,
      status: 1
    },
    {
      name: '王崴',
      company: '内蒙古大学',
      position: '科长',
      phone: '13850458513',
      email: 'wangwei@imu.edu.cn',
      joinDate: new Date('2024-05-20'),
      attendanceRate: 100,
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
    where: { id: treasuryClass.id },
    data: { studentCount: treasuryStudents.length }
  });

  await prisma.class.update({
    where: { id: digitalFinanceClass.id },
    data: { studentCount: digitalFinanceStudents.length }
  });

  await prisma.class.update({
    where: { id: riskComplianceClass.id },
    data: { studentCount: riskComplianceStudents.length }
  });

  await prisma.class.update({
    where: { id: taxManagementClass.id },
    data: { studentCount: 0 }
  });

  await prisma.class.update({
    where: { id: fundManagementClass.id },
    data: { studentCount: 0 }
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
