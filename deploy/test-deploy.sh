#!/bin/bash

# 腾讯云测试环境部署脚本（支持热更新）
# 使用方法: ./deploy/test-deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    print_warning "建议使用非root用户运行此脚本"
fi

print_info "开始腾讯云测试环境部署（支持热更新）..."

# 更新系统
print_info "更新系统包..."
sudo apt-get update

# 安装必要软件
print_info "安装必要软件..."
sudo apt-get install -y curl wget git build-essential

# 安装Node.js 18+
print_info "检查Node.js版本..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    print_info "安装Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js安装完成"
else
    print_success "Node.js已安装: $(node -v)"
fi

# 安装pnpm
print_info "安装pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
    print_success "pnpm安装完成"
else
    print_success "pnpm已安装: $(pnpm -v)"
fi

# 安装pm2
print_info "安装pm2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "pm2安装完成"
else
    print_success "pm2已安装"
fi

# 安装Docker和PostgreSQL（用于数据库）
print_info "安装Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_success "Docker安装完成"
else
    print_success "Docker已安装"
fi

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 配置防火墙
print_info "配置防火墙..."
sudo ufw allow 80/tcp      # Nginx
sudo ufw allow 9527/tcp    # 前端开发服务器
sudo ufw allow 3000/tcp    # 后端API
sudo ufw allow 5432/tcp    # PostgreSQL
sudo ufw allow 6379/tcp    # Redis
sudo ufw allow 22/tcp      # SSH

# 创建应用目录
APP_DIR="/opt/admin-system"
print_info "创建应用目录: $APP_DIR"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
fi

# 检查项目代码
if [ ! -f "$APP_DIR/package.json" ]; then
    print_error "项目代码不存在，请先上传项目代码到 $APP_DIR"
    print_info "上传方式："
    print_info "1. Git克隆: git clone <仓库地址> $APP_DIR"
    print_info "2. SCP上传: scp -r ./AdminReactSystem root@<服务器IP>:$APP_DIR"
    print_info "3. Rsync同步: rsync -avz ./AdminReactSystem/ root@<服务器IP>:$APP_DIR/"
    exit 1
fi

cd $APP_DIR

# 启动数据库服务（使用Docker）
print_info "启动PostgreSQL数据库..."
docker run -d \
    --name test-postgres \
    --restart unless-stopped \
    -e POSTGRES_DB=admin_system \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=test123456 \
    -p 5432:5432 \
    -v postgres_data:/var/lib/postgresql/data \
    postgres:14 || print_warning "PostgreSQL容器可能已存在"

print_info "启动Redis缓存..."
docker run -d \
    --name test-redis \
    --restart unless-stopped \
    -p 6379:6379 \
    redis:7-alpine redis-server --requirepass test123456 || print_warning "Redis容器可能已存在"

# 等待数据库启动
print_info "等待数据库启动..."
sleep 10

# 创建测试环境变量文件
print_info "创建测试环境变量文件..."
cat > .env << EOF
# 测试环境配置
NODE_ENV=development

# 数据库配置
DATABASE_URL=postgresql://postgres:test123456@localhost:5432/admin_system
POSTGRES_DB=admin_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=test123456

# Redis配置
REDIS_URL=redis://:test123456@localhost:6379
REDIS_PASSWORD=test123456

# JWT密钥（测试环境）
JWT_SECRET=test-jwt-secret-key-for-development-32chars
JWT_REFRESH_SECRET=test-refresh-secret-key-for-development-32chars

# 邮件配置（测试环境可选）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=test-password

# 运行种子数据
RUN_SEED=true

# 测试环境端口配置
VITE_API_BASE_URL=http://localhost:3000/api
BACKEND_PORT=3000
FRONTEND_PORT=9527
EOF

# 安装项目依赖
print_info "安装前端依赖..."
pnpm install

print_info "安装后端依赖..."
cd backend
npm install

# 数据库迁移
print_info "运行数据库迁移..."
npx prisma migrate dev --name init || npx prisma db push
npx prisma generate

# 可选：运行种子数据
if [ "$RUN_SEED" = "true" ]; then
    print_info "运行种子数据..."
    npm run seed || print_warning "种子数据运行失败，但继续部署"
fi

cd ..

# 安装nginx（用于反向代理）
print_info "安装nginx..."
sudo apt-get install -y nginx

# 配置nginx（测试环境）
print_info "配置nginx..."
sudo tee /etc/nginx/sites-available/admin-test << EOF
server {
    listen 80;
    server_name _;

    # 前端开发服务器
    location / {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 支持热更新
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态文件上传目录
    location /uploads {
        alias $APP_DIR/backend/uploads;
        expires 1d;
        add_header Cache-Control "public, no-transform";
    }

    # WebSocket支持（用于热更新）
    location /ws {
        proxy_pass http://localhost:9527;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# 启用nginx配置
sudo ln -sf /etc/nginx/sites-available/admin-test /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 停止现有的pm2进程
print_info "停止现有的pm2进程..."
pm2 delete all 2>/dev/null || true

# 启动后端开发服务器
print_info "启动后端开发服务器（支持热更新）..."
cd backend
pm2 start npm --name "backend-dev" -- run dev

cd ..

# 启动前端开发服务器
print_info "启动前端开发服务器（支持热更新）..."
pm2 start pnpm --name "frontend-dev" -- run dev

# 配置pm2开机自启动
print_info "配置pm2开机自启动..."
pm2 startup
pm2 save

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "your-server-ip")

print_success "测试环境部署完成！"
print_info "=========================================="
print_info "访问信息："
print_info "  主页面: http://$SERVER_IP"
print_info "  前端开发服务器: http://$SERVER_IP:9527"
print_info "  后端API: http://$SERVER_IP:3000/api"
print_info "  API文档: http://$SERVER_IP:3000/api/docs"
print_info ""
print_info "数据库信息："
print_info "  PostgreSQL: localhost:5432"
print_info "  Redis: localhost:6379"
print_info "  数据库名: admin_system"
print_info "  用户名: postgres"
print_info "  密码: test123456"
print_info ""
print_info "管理命令："
print_info "  查看所有服务: pm2 list"
print_info "  查看日志: pm2 logs"
print_info "  重启前端: pm2 restart frontend-dev"
print_info "  重启后端: pm2 restart backend-dev"
print_info "  停止所有服务: pm2 stop all"
print_info "  启动所有服务: pm2 start all"
print_info ""
print_success "现在您可以直接修改代码，服务器会自动热更新！"
print_info "=========================================="