#!/usr/bin/env node

const axios = require('axios');

// 测试CORS配置
async function testCORS() {
  console.log('🧪 开始测试CORS配置...');

  const baseURL = 'http://111.230.110.95:3000/api';

  // 测试OPTIONS预检请求
  try {
    console.log('📋 测试OPTIONS预检请求...');
    const optionsResponse = await axios.options(`${baseURL}/auth/login`, {
      headers: {
        'Access-Control-Request-Headers': 'Content-Type',
        'Access-Control-Request-Method': 'POST',
        Origin: 'http://111.230.110.95:9527'
      }
    });

    console.log('✅ OPTIONS请求成功');
    console.log('响应头:', optionsResponse.headers);
  } catch (error) {
    console.error('❌ OPTIONS请求失败:', error.message);
  }

  // 测试实际的POST请求
  try {
    console.log('📋 测试POST登录请求...');
    const postResponse = await axios.post(
      `${baseURL}/auth/login`,
      {
        email: 'test@example.com',
        password: 'test123'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://111.230.110.95:9527'
        }
      }
    );

    console.log('✅ POST请求成功');
    console.log('响应数据:', postResponse.data);
  } catch (error) {
    console.log('⚠️ POST请求预期失败（因为测试用户不存在）');
    console.log('响应状态:', error.response?.status);
    console.log('响应头:', error.response?.headers);

    // 检查是否有CORS相关的错误
    if (error.response?.headers['access-control-allow-origin']) {
      console.log('✅ CORS头部正确设置');
    } else {
      console.log('❌ CORS头部缺失');
    }
  }

  // 测试健康检查
  try {
    console.log('📋 测试健康检查...');
    const healthResponse = await axios.get(`${baseURL.replace('/api', '')}/health`, {
      headers: {
        Origin: 'http://111.230.110.95:9527'
      }
    });

    console.log('✅ 健康检查成功');
    console.log('服务状态:', healthResponse.data);
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
  }
}

// 运行测试
testCORS().catch(console.error);
