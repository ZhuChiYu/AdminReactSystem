const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAvatar() {
  try {
    const users = await prisma.user.findMany({
      select: {
        avatar: true,
        id: true,
        userName: true
      }
    });
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

checkAvatar();
