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

# 启动PostgreSQL
docker run -d \
    --name test-postgres \
    --restart unless-stopped \
    -e POSTGRES_DB=admin_system \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=test123456 \
    -p 5432:5432 \
    postgres:14 2>/dev/null || echo "PostgreSQL已运行"

# 启动Redis
docker run -d \
    --name test-redis \
    --restart unless-stopped \
    -p 6379:6379 \
    redis:7-alpine redis-server --requirepass test123456 2>/dev/null || echo "Redis已运行"

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 创建测试环境变量
echo "⚙️ 配置测试环境..."
cat > .env << EOF
NODE_ENV=development
DATABASE_URL=postgresql://postgres:test123456@localhost:5432/admin_system
POSTGRES_DB=admin_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=test123456
REDIS_URL=redis://:test123456@localhost:6379
REDIS_PASSWORD=test123456
JWT_SECRET=test-jwt-secret-32-chars-for-development
JWT_REFRESH_SECRET=test-refresh-secret-32-chars-for-dev
RUN_SEED=true
VITE_API_BASE_URL=http://localhost:3000/api
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
    server_name _;

    location / {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
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
