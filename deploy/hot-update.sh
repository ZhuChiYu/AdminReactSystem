#!/bin/bash

# 热更新脚本 - 仅重启服务，不重新安装依赖
# 使用方法: ./deploy/hot-update.sh

set -e

echo "🔥 开始热更新服务..."

# 停止现有服务
echo "⏹️ 停止现有服务..."
pm2 stop all || true

# 更新环境变量（如果需要）
echo "⚙️ 更新环境变量..."
cat > .env << EOF
NODE_ENV=development
VITE_API_BASE_URL=http://111.230.110.95:3000/api
VITE_SERVICE_BASE_URL=http://111.230.110.95:3000/api
VITE_HTTP_PROXY=N
VITE_BASE_URL=/
VITE_APP_TITLE=Admin
VITE_APP_DESC=Admin is a fresh and elegant admin template
VITE_ICON_PREFIX=icon
VITE_ICON_LOCAL_PREFIX=icon-local
VITE_AUTH_ROUTE_MODE=static
VITE_ROUTE_HOME=/home
VITE_MENU_ICON=mdi:menu
VITE_ROUTER_HISTORY_MODE=history
VITE_SERVICE_SUCCESS_CODE=0000
VITE_SERVICE_LOGOUT_CODES=8888,8889
VITE_SERVICE_MODAL_LOGOUT_CODES=7777,7778
VITE_SERVICE_EXPIRED_TOKEN_CODES=9999,9998,3333
VITE_STATIC_SUPER_ROLE=R_SUPER
VITE_SOURCE_MAP=N
VITE_STORAGE_PREFIX=SOY-REACT_
VITE_AUTOMATICALLY_DETECT_UPDATE=Y
VITE_OTHER_SERVICE_BASE_URL='{
  "demo": "http://111.230.110.95:9528"
}'
VITE_PROXY_LOG=Y
EOF

# 更新后端环境变量
echo "⚙️ 更新后端环境变量..."
cat > backend/.env << EOF
DATABASE_URL="postgresql://soybean:soybean123@localhost:5432/soybean_admin"
REDIS_URL="redis://:redis123@localhost:6379"
JWT_SECRET="test-jwt-secret-32-chars-for-development"
JWT_REFRESH_SECRET="test-refresh-secret-32-chars-for-dev"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
NODE_ENV="development"
PORT=3000
HOST="0.0.0.0"
CORS_ORIGIN="http://111.230.110.95:9527,http://111.230.110.95,https://111.230.110.95:9527,https://111.230.110.95"
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760
SMTP_HOST="smtp.qq.com"
SMTP_PORT=587
SMTP_USER="test@example.com"
SMTP_PASS="test-password"
LOG_LEVEL="debug"
LOG_FILE="./logs/app.log"
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
API_DOC_ENABLED=true
API_DOC_PATH="/api-docs"
EOF

# 重新编译后端（如果有TypeScript更改）
echo "🔨 重新编译后端..."
cd backend
npm run build 2>/dev/null || echo "编译跳过或失败，继续使用开发模式"
cd ..

# 重启服务
echo "🚀 重启服务..."
cd backend
pm2 restart backend-test || pm2 start "npm run dev" --name backend-test --watch
cd ..

pm2 restart frontend-test || pm2 start "pnpm run dev" --name frontend-test

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "111.230.110.95")

echo ""
echo "✅ 热更新完成！"
echo "=========================="
echo "🌐 访问地址:"
echo "   主页面: http://$SERVER_IP"
echo "   前端: http://$SERVER_IP:9527"
echo "   后端: http://$SERVER_IP:3000/api"
echo ""
echo "📊 服务状态:"
pm2 list
echo "=========================="
