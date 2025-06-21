const axios = require('axios');

async function testManager1Login() {
  try {
    console.log('🔄 开始测试manager1账号登录...');

    // 1. 登录
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      userName: 'manager1',
      password: '123456'
    });

    console.log('✅ 登录成功！');
    console.log('📋 用户信息:', {
      id: loginResponse.data.data.userInfo.id,
      userName: loginResponse.data.data.userInfo.userName,
      roles: loginResponse.data.data.userInfo.roles
    });

    const token = loginResponse.data.data.token;
    console.log('🔑 Token:', token.substring(0, 30) + '...');

    // 2. 测试用户权限验证
    const userInfoResponse = await axios.get('http://localhost:3001/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 权限验证成功！');
    console.log('👤 用户角色:', userInfoResponse.data.data.roles);

    // 3. 测试员工目标管理API访问权限
    const employeeTargetsResponse = await axios.get('http://localhost:3001/api/employee-targets?current=1&size=10&targetYear=2025&targetMonth=6', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 员工目标管理API访问成功！');
    console.log('📊 员工目标数据条数:', employeeTargetsResponse.data.data.records.length);

    // 4. 测试管理的员工列表
    const managedUsersResponse = await axios.get('http://localhost:3001/api/users/managed', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 管理员工列表获取成功！');
    console.log('👥 管理的员工数量:', managedUsersResponse.data.data.length);

    console.log('\n🎉 所有测试通过！manager1账号具有正确的团队管理权限。');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.error('🚫 权限不足 - 可能是角色配置问题');
    } else if (error.response?.status === 401) {
      console.error('🔑 认证失败 - 可能是账号密码错误');
    }
  }
}

testManager1Login();
