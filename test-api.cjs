const axios = require('axios');

async function testAPI() {
  try {
    // 1. 登录获取token
    console.log('1. 测试登录...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      userName: 'admin',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，token已获取');

    // 2. 测试员工列表API
    console.log('2. 测试员工列表API...');
    const employeeResponse = await axios.get('http://localhost:3001/api/users/employees?current=1&size=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 员工列表API成功');
    console.log(`   获取到 ${employeeResponse.data.data.records.length} 个员工记录`);

    // 3. 测试客户列表API
    console.log('3. 测试客户列表API...');
    const customerResponse = await axios.get('http://localhost:3001/api/customers?current=1&size=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 客户列表API成功');
    console.log(`   获取到 ${customerResponse.data.data.records.length} 个客户记录`);

    console.log('\n🎉 所有API测试通过！');

  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
  }
}

testAPI();
