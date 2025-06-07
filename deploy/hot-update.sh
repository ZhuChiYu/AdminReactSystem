#!/bin/bash

# 热更新部署脚本
# 用于快速更新服务器上的代码并重启服务

echo "🚀 开始热更新部署..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 服务器配置
SERVER_IP="111.230.110.95"
SERVER_USER="root"
SERVER_PATH="/opt/admin-system"

echo "📦 同步前端代码..."
# 同步前端重要文件
rsync -av --delete \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude=logs \
    src/ \
    .env.test \
    package.json \
    vite.config.ts \
    tsconfig.json \
    ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

echo "📦 同步后端代码..."
# 同步后端代码（重点是server.ts的CORS修复）
rsync -av --delete \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude=logs \
    backend/src/ \
    backend/package.json \
    backend/tsconfig.json \
    ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/backend/src/

# 在服务器上执行更新操作
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd /opt/admin-system

echo "🔄 重启后端服务..."
pm2 restart backend-test || pm2 start backend/src/server.ts --name backend-test --interpreter tsx

echo "🔄 重启前端服务..."
pm2 restart frontend-test || pm2 start "npm run dev" --name frontend-test

echo "📊 检查服务状态..."
pm2 list

echo "📝 查看后端日志..."
pm2 logs backend-test --lines 10

echo "✅ 热更新完成！"
echo "🌐 前端访问: http://111.230.110.95:9527"
echo "🔧 后端API: http://111.230.110.95:3000/api"
echo "📚 API文档: http://111.230.110.95:3000/api-docs"
EOF

echo "✅ 热更新部署完成！"
