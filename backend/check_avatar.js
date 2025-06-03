const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAvatar() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        userName: true,
        avatar: true
      }
    });

    console.log('All users and their avatars:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.userName}, Avatar: ${user.avatar}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvatar();
