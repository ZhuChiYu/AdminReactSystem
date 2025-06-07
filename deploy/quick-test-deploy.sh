#!/bin/bash

# 快速测试部署脚本（支持热更新）
# 使用方法: ./deploy/quick-test-deploy.sh

set -e

echo "🚀 开始快速测试部署（支持热更新）..."

# 安装Node.js和pnpm（如果未安装）
if ! command -v node &> /dev/null; then
    echo "📦 安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 安装pnpm..."
    npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 安装pm2..."
    npm install -g pm2
fi

# 启动PostgreSQL和Redis（使用Docker）
echo "🗄️ 启动数据库服务..."
sudo systemctl start docker || true

# 启动PostgreSQL (使用项目默认的数据库名)
docker run -d \
    --name test-postgres \
    --restart unless-stopped \
    -e POSTGRES_DB=soybean_admin \
    -e POSTGRES_USER=soybean \
    -e POSTGRES_PASSWORD=soybean123 \
    -p 5432:5432 \
    postgres:14 2>/dev/null || echo "PostgreSQL已运行"

# 启动Redis
docker run -d \
    --name test-redis \
    --restart unless-stopped \
    -p 6379:6379 \
    redis:7-alpine redis-server --requirepass redis123 2>/dev/null || echo "Redis已运行"

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 创建测试环境变量
echo "⚙️ 配置测试环境..."
cat > .env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://soybean:soybean123@localhost:5432/soybean_admin
POSTGRES_DB=soybean_admin
POSTGRES_USER=soybean
POSTGRES_PASSWORD=soybean123
REDIS_URL=redis://:redis123@localhost:6379
REDIS_PASSWORD=redis123
JWT_SECRET=test-jwt-secret-32-chars-for-development
JWT_REFRESH_SECRET=test-refresh-secret-32-chars-for-dev
RUN_SEED=true
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

# 同时为backend目录创建.env文件
echo "⚙️ 配置后端测试环境..."
cat > backend/.env << EOF
# 数据库配置
DATABASE_URL="postgresql://soybean:soybean123@localhost:5432/soybean_admin"

# Redis配置
REDIS_URL="redis://:redis123@localhost:6379"

# JWT配置
JWT_SECRET="test-jwt-secret-32-chars-for-development"
JWT_REFRESH_SECRET="test-refresh-secret-32-chars-for-dev"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# 服务器配置
NODE_ENV="development"
PORT=3000
HOST="0.0.0.0"

# CORS配置
CORS_ORIGIN="http://111.230.110.95:9527,http://111.230.110.95,https://111.230.110.95:9527,https://111.230.110.95"

# 文件上传配置
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760

# 邮件配置（测试环境可选）
SMTP_HOST="smtp.qq.com"
SMTP_PORT=587
SMTP_USER="test@example.com"
SMTP_PASS="test-password"

# 日志配置
LOG_LEVEL="debug"
LOG_FILE="./logs/app.log"

# 安全配置
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# API文档配置
API_DOC_ENABLED=true
API_DOC_PATH="/api-docs"
EOF

# 安装依赖
echo "📥 安装前端依赖..."
pnpm install

echo "📥 安装后端依赖..."
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed 2>/dev/null || echo "种子数据可能已存在"
cd ..

# 停止现有服务
pm2 delete all 2>/dev/null || true

# 重启Docker容器确保数据库服务正常
echo "🔄 重启数据库服务..."
docker restart test-postgres test-redis 2>/dev/null || true
sleep 3

# 启动服务
echo "🔥 启动后端服务（热更新）..."
cd backend
pm2 start "npm run dev" --name backend-test --watch

cd ..
echo "🔥 启动前端服务（热更新）..."
pm2 start "pnpm run dev" --name frontend-test

# 配置nginx反向代理（可选）
if command -v nginx &> /dev/null; then
    echo "🌐 配置nginx反向代理..."
    sudo tee /etc/nginx/sites-available/test-admin << 'EOF'
server {
    listen 80;
    server_name 111.230.110.95 _;

    location / {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/test-admin /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    sudo nginx -t && sudo systemctl reload nginx
fi

# 保存pm2配置
pm2 save

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo ""
echo "✅ 测试环境部署完成！"
echo "=========================="
echo "🌐 访问地址:"
echo "   主页面: http://$SERVER_IP (通过nginx)"
echo "   前端: http://$SERVER_IP:9527 (直接访问)"
echo "   后端: http://$SERVER_IP:3000/api"
echo ""
echo "📊 服务状态:"
pm2 list
echo ""
echo "🔧 管理命令:"
echo "   查看日志: pm2 logs"
echo "   重启服务: pm2 restart all"
echo "   停止服务: pm2 stop all"
echo "   删除服务: pm2 delete all"
echo ""
echo "🔄 现在可以修改代码，服务会自动热更新！"
echo "=========================="
