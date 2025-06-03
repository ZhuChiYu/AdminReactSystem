const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearStudents() {
  try {
    console.log('🔄 开始清空班级学员数据...');

    // 1. 删除所有班级学员
    const deletedCount = await prisma.classStudent.deleteMany({});
    console.log(`✅ 删除了 ${deletedCount.count} 条学员记录`);

    // 2. 重置所有班级的学员数量
    const updatedClasses = await prisma.class.updateMany({
      data: {
        studentCount: 0
      }
    });
    console.log(`✅ 重置了 ${updatedClasses.count} 个班级的学员数量`);

    // 3. 验证数据
    const remainingStudents = await prisma.classStudent.count();
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        studentCount: true
      }
    });

    console.log(`📊 验证结果:`);
    console.log(`   - 剩余学员数量: ${remainingStudents}`);
    console.log(`   - 班级数量: ${classes.length}`);

    classes.forEach(cls => {
      console.log(`   - 班级 ${cls.id} (${cls.name}): ${cls.studentCount} 名学员`);
    });

    console.log('🎉 数据清空完成！');
  } catch (error) {
    console.error('❌ 清空数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearStudents();
