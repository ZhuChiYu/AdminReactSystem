#!/bin/bash

# 设置错误时退出
set -e

echo "开始部署开发环境..."

# 创建工作目录
WORK_DIR="/opt/admin-system"
mkdir -p $WORK_DIR
cd $WORK_DIR

# 安装必要的工具
if ! command -v pnpm &> /dev/null; then
    echo "安装 pnpm..."
    npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
    echo "安装 pm2..."
    npm install -g pm2
fi

# 安装前端依赖
echo "安装前端依赖..."
pnpm install

# 安装后端依赖
echo "安装后端依赖..."
cd backend
npm install
npx prisma generate

# 启动后端服务
echo "启动后端服务..."
pm2 delete backend 2>/dev/null || true
pm2 start "npm run dev" --name backend

cd ..

# 启动前端开发服务器
echo "启动前端开发服务器..."
pm2 delete frontend 2>/dev/null || true
pm2 start "pnpm run dev" --name frontend

echo "部署完成！"
echo "前端开发服务器运行在 http://localhost:9527"
echo "后端服务运行在 http://localhost:3000"
echo "可以使用 pm2 logs 查看日志"
