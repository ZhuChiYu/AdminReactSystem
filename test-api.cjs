const http = require('node:http');

const loginData = JSON.stringify({ password: '123456', userName: 'admin' });
const loginReq = http.request(
  {
    headers: { 'Content-Type': 'application/json' },
    hostname: 'localhost',
    method: 'POST',
    path: '/api/auth/login',
    port: 3001
  },
  res => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => {
      try {
        const loginResponse = JSON.parse(data);
        if (loginResponse.code === 0) {
          const token = loginResponse.data.token;
          console.log('✅ 登录成功，token:', `${token.substring(0, 20)}...`);
          const expenseReq = http.request(
            {
              headers: { Authorization: `Bearer ${token}` },
              hostname: 'localhost',
              method: 'GET',
              path: '/api/expense/list?current=1&size=10&status=0',
              port: 3001
            },
            res => {
              let expenseData = '';
              res.on('data', chunk => (expenseData += chunk));
              res.on('end', () => {
                try {
                  const expenseResponse = JSON.parse(expenseData);
                  console.log('✅ 费用申请接口响应:', JSON.stringify(expenseResponse, null, 2));
                } catch (err) {
                  console.error('❌ 解析费用申请响应失败:', err);
                }
              });
            }
          );
          expenseReq.on('error', err => console.error('❌ 费用申请请求失败:', err));
          expenseReq.end();
        }
      } catch (err) {
        console.error('❌ 解析登录响应失败:', err);
      }
    });
  }
);
loginReq.on('error', err => console.error('❌ 登录请求失败:', err));
loginReq.write(loginData);
loginReq.end();
