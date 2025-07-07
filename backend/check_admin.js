const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    // 查找用户名为admin的用户
    const adminUser = await prisma.user.findUnique({
      select: {
        avatar: true,
        id: true,
        userName: true
      },
      where: { userName: 'admin' }
    });

    // 查找用户名为admin11的用户
    const admin11User = await prisma.user.findUnique({
      select: {
        avatar: true,
        id: true,
        userName: true
      },
      where: { userName: 'admin11' }
    });

    // 查看所有用户
    const allUsers = await prisma.user.findMany({
      select: {
        avatar: true,
        id: true,
        userName: true
      },
      take: 10
    });

  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
