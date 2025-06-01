#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');

function switchApiMode(mode) {
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 文件不存在');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  if (mode === 'remote') {
    // 切换到内网穿透模式
    envContent = envContent.replace(/VITE_USE_REMOTE_API=N/g, 'VITE_USE_REMOTE_API=Y');
    console.log('🌐 已切换到内网穿透模式 (http://111.230.110.95:8080/api)');
  } else {
    // 切换到本地模式
    envContent = envContent.replace(/VITE_USE_REMOTE_API=Y/g, 'VITE_USE_REMOTE_API=N');
    console.log('🏠 已切换到本地模式 (http://localhost:3000/api)');
  }

  fs.writeFileSync(envPath, envContent);
  console.log('💡 请重启开发服务器以使更改生效');
}

const args = process.argv.slice(2);
const mode = args[0];

if (mode === 'remote' || mode === 'r') {
  switchApiMode('remote');
} else if (mode === 'local' || mode === 'l') {
  switchApiMode('local');
} else {
  console.log('用法:');
  console.log('  pnpm api:remote   # 切换到内网穿透模式');
  console.log('  pnpm api:local    # 切换到本地模式');
  console.log('');
  console.log('当前模式检查:');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const isRemote = envContent.includes('VITE_USE_REMOTE_API=Y');
    console.log(`  当前模式: ${isRemote ? '🌐 内网穿透模式' : '🏠 本地模式'}`);
  }
}
