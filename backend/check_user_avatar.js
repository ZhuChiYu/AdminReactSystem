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

    console.log('=== 用户信息 ===');
    console.log('ID:', user?.id);
    console.log('用户名:', user?.userName);
    console.log('头像路径:', user?.avatar);
    console.log('昵称:', user?.nickName);
    console.log('邮箱:', user?.email);
    console.log('电话:', user?.phone);

    // 检查上传的头像文件是否存在
    if (user?.avatar) {
      const avatarPath = path.join(__dirname, user.avatar.replace('/', ''));
      console.log('\n=== 头像文件检查 ===');
      console.log('头像文件路径:', avatarPath);
      console.log('头像文件是否存在:', fs.existsSync(avatarPath));

      if (fs.existsSync(avatarPath)) {
        const stats = fs.statSync(avatarPath);
        console.log('文件大小:', stats.size, 'bytes');
        console.log('修改时间:', stats.mtime);
      }
    } else {
      console.log('\n用户没有设置头像');
    }

    // 检查uploads/avatars目录
    const uploadsDir = path.join(__dirname, 'uploads/avatars');
    console.log('\n=== 头像目录检查 ===');
    console.log('头像上传目录:', uploadsDir);
    console.log('目录是否存在:', fs.existsSync(uploadsDir));

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('目录中的文件:', files);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserAvatar();
