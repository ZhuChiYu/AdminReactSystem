// 测试 manager1 用户登录和权限检查
const fetch = require('node-fetch');

async function testLogin() {
  const baseURL = 'http://localhost:3001';

  try {
    console.log('🔍 测试 manager1 用户登录...');

    // 1. 登录
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      body: JSON.stringify({
        password: '123456',
        userName: 'manager1'
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    const loginData = await loginResponse.json();
    console.log('📋 登录响应:', JSON.stringify(loginData, null, 2));

    if (loginData.code === 0) {
      const { token, userInfo } = loginData.data;
      console.log('✅ 登录成功');
      console.log('👤 用户信息:');
      console.log('   - 用户名:', userInfo.userName);
      console.log('   - 昵称:', userInfo.nickName);
      console.log('   - 角色:', userInfo.roles);

      // 2. 获取当前用户信息
      console.log('\n🔍 获取当前用户信息...');
      const userResponse = await fetch(`${baseURL}/api/auth/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const userData = await userResponse.json();
      console.log('📋 当前用户信息响应:', JSON.stringify(userData, null, 2));

      if (userData.code === 0) {
        console.log('✅ 获取用户信息成功');
        console.log('👤 当前用户角色:', userData.data.roles);

        // 检查是否包含admin角色
        const hasAdminRole = userData.data.roles.includes('admin');
        console.log('🔐 是否有admin角色:', hasAdminRole);

        if (hasAdminRole) {
          console.log('✅ manager1 用户具有admin角色，应该能访问团队管理页面');
        } else {
          console.log('❌ manager1 用户没有admin角色，无法访问团队管理页面');
        }
      }
    } else {
      console.log('❌ 登录失败:', loginData.message);
    }
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testLogin();
