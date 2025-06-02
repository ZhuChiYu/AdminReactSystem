import http from 'node:http';

const options = {
  hostname: 'localhost',
  method: 'GET',
  path: '/health',
  port: process.env.PORT || 3000,
  timeout: 2000
};

const req = http.request(options, res => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`健康检查失败: HTTP ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', error => {
  console.error('健康检查失败:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('健康检查超时');
  req.destroy();
  process.exit(1);
});

req.end();
