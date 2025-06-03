const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    // 查找用户名为admin的用户
    const adminUser = await prisma.user.findUnique({
      where: { userName: 'admin' },
      select: {
        id: true,
        userName: true,
        avatar: true
      }
    });

    if (adminUser) {
      console.log('Admin user found:');
      console.log(`ID: ${adminUser.id}, Username: ${adminUser.userName}, Avatar: ${adminUser.avatar}`);
    } else {
      console.log('Admin user not found');
    }

    // 查找用户名为admin11的用户
    const admin11User = await prisma.user.findUnique({
      where: { userName: 'admin11' },
      select: {
        id: true,
        userName: true,
        avatar: true
      }
    });

    if (admin11User) {
      console.log('\nAdmin11 user found:');
      console.log(`ID: ${admin11User.id}, Username: ${admin11User.userName}, Avatar: ${admin11User.avatar}`);
    } else {
      console.log('\nAdmin11 user not found');
    }

    // 查看所有用户
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        userName: true,
        avatar: true
      },
      take: 10
    });

    console.log('\nAll users:');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.userName}, Avatar: ${user.avatar}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
