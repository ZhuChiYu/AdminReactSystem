const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearStudents() {
  try {

    // 1. 删除所有班级学员
    const deletedCount = await prisma.classStudent.deleteMany({});

    // 2. 重置所有班级的学员数量
    const updatedClasses = await prisma.class.updateMany({
      data: {
        studentCount: 0
      }
    });

    // 3. 验证数据
    const remainingStudents = await prisma.classStudent.count();
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        studentCount: true
      }
    });

  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

clearStudents();
