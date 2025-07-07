const fs = require('node:fs');
const path = require('node:path');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserAvatar() {
  try {
    const user = await prisma.user.findUnique({
      select: {
        avatar: true,
        email: true,
        id: true,
        nickName: true,
        phone: true,
        userName: true
      },
      where: { id: 1 }
    });

    // 检查上传的头像文件是否存在
    if (user?.avatar) {
      const avatarPath = path.join(__dirname, user.avatar.replace('/', ''));

      if (fs.existsSync(avatarPath)) {
        const stats = fs.statSync(avatarPath);
      }
    } else {
    }

    // 检查uploads/avatars目录
    const uploadsDir = path.join(__dirname, 'uploads/avatars');

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);】
    }

    await prisma.$disconnect();
  } catch (error) {
    process.exit(1);
  }
}

checkUserAvatar();
