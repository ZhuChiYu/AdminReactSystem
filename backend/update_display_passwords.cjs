const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDisplayPasswords() {
  try {
    console.log('🔄 更新现有用户的显示密码字段...\n');

    // 获取所有displayPassword为空的用户
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { displayPassword: null },
          { displayPassword: '' }
        ]
      },
      select: {
        id: true,
        userName: true,
        nickName: true,
        displayPassword: true
      }
    });

    console.log(`找到 ${users.length} 个需要更新的用户:`);
    console.table(users);

    // 为所有用户设置默认显示密码为123456
    const defaultDisplayPassword = '123456';

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          displayPassword: defaultDisplayPassword
        }
      });
      console.log(`✅ 更新用户 ${user.userName} (${user.nickName}) 的显示密码`);
    }

    console.log('\n🎉 所有用户的显示密码已更新为：123456');

    // 验证更新结果
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        userName: true,
        nickName: true,
        displayPassword: true
      },
      take: 5
    });

    console.log('\n📋 更新后的用户信息:');
    console.table(updatedUsers);

  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDisplayPasswords();
