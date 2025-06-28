const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswordDisplay() {
  try {
    console.log('🔧 测试密码显示功能...\n');

    // 1. 查看当前用户的密码信息
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          userRoles: {
            some: {
              role: {
                roleCode: 'super_admin'
              }
            }
          }
        }
      },
      select: {
        id: true,
        userName: true,
        nickName: true,
        password: true,
        displayPassword: true,
        updatedAt: true
      },
      take: 5
    });

    console.log('📋 当前用户密码信息:');
    console.table(users.map(user => ({
      ID: user.id,
      用户名: user.userName,
      昵称: user.nickName,
      哈希密码: user.password.substring(0, 20) + '...',
      显示密码: user.displayPassword,
      更新时间: user.updatedAt
    })));

    // 2. 测试employee398用户的密码
    const employee398 = await prisma.user.findFirst({
      where: { userName: 'employee398' }
    });

    if (employee398) {
      console.log('\n🧪 测试employee398密码验证:');
      const isOldPasswordValid = await bcrypt.compare('123456', employee398.password);
      const isNewPasswordValid = await bcrypt.compare('12345678', employee398.password);

      console.log(`- 原密码(123456)验证: ${isOldPasswordValid ? '✅' : '❌'}`);
      console.log(`- 新密码(12345678)验证: ${isNewPasswordValid ? '✅' : '❌'}`);
      console.log(`- 显示密码: ${employee398.displayPassword}`);
    } else {
      console.log('\n❌ 未找到employee398用户');
    }

    // 3. 模拟修改一个用户的密码
    const testUser = users[0];
    if (testUser) {
      console.log(`\n🔄 测试修改用户 ${testUser.userName} 的密码...`);

      const newPassword = 'testpassword123';
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          password: hashedNewPassword,
          displayPassword: newPassword,
          updatedAt: new Date()
        }
      });

      // 验证修改结果
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      const isNewPasswordCorrect = await bcrypt.compare(newPassword, updatedUser.password);

      console.log(`- 新密码验证: ${isNewPasswordCorrect ? '✅' : '❌'}`);
      console.log(`- 显示密码: ${updatedUser.displayPassword}`);
      console.log(`- 更新时间: ${updatedUser.updatedAt}`);

      // 恢复原密码
      const originalPassword = '123456';
      const hashedOriginalPassword = await bcrypt.hash(originalPassword, 10);

      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          password: hashedOriginalPassword,
          displayPassword: originalPassword
        }
      });

      console.log('✅ 已恢复原密码');
    }

    console.log('\n🎉 密码显示功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordDisplay();
