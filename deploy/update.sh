#!/bin/bash

# 更新脚本
# 使用方法: ./deploy/update.sh

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

# 应用目录
APP_DIR="/opt/admin-system"

# 检查目录是否存在
if [ ! -d "$APP_DIR" ]; then
    print_error "应用目录不存在: $APP_DIR"
    exit 1
fi

# 进入应用目录
cd $APP_DIR

print_info "开始更新应用..."

# 如果是 Git 仓库，尝试拉取更新
if [ -d ".git" ]; then
    print_info "检测到 Git 仓库，正在拉取更新..."
    git pull
    print_success "Git 更新完成"
fi

# 安装依赖
print_info "更新前端依赖..."
pnpm install

print_info "更新后端依赖..."
cd backend
npm install

# 数据库迁移
print_info "运行数据库迁移..."
npx prisma migrate dev || npx prisma db push
npx prisma generate

cd ..

# 重启服务
print_info "重启服务..."
pm2 restart frontend-dev
pm2 restart backend-dev

# 显示服务状态
print_info "服务状态："
pm2 list

print_success "更新完成！"
print_info "=========================================="
print_info "您可以使用以下命令查看服务日志："
print_info "  查看所有日志: pm2 logs"
print_info "  查看前端日志: pm2 logs frontend-dev"
print_info "  查看后端日志: pm2 logs backend-dev"
print_info "=========================================="
