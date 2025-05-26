#!/bin/bash

# SoyBean Admin 后端部署脚本
# 使用方法: ./deploy.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
ENVIRONMENT=${1:-dev}
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log_error "环境参数错误，请使用 'dev' 或 'prod'"
    exit 1
fi

log_info "开始部署 SoyBean Admin 后端系统 (环境: $ENVIRONMENT)"

# 检查必要的命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

log_info "检查系统依赖..."
check_command "node"
check_command "npm"
check_command "docker"

# 检查Docker Compose (新版本使用 docker compose)
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose 未安装或不可用，请先安装"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js版本过低，需要18.0.0或更高版本"
    exit 1
fi

log_success "系统依赖检查通过"

# 创建必要的目录
log_info "创建必要的目录..."
mkdir -p logs
mkdir -p uploads
mkdir -p data/postgres
mkdir -p data/redis

# 复制环境配置文件
if [ ! -f ".env" ]; then
    log_info "创建环境配置文件..."
    cp env.example .env
    log_warning "请编辑 .env 文件配置数据库和其他参数"
fi

# 安装依赖
log_info "安装Node.js依赖..."
npm install

# 启动数据库服务
log_info "启动数据库服务..."
if [ "$ENVIRONMENT" = "dev" ]; then
    docker compose up -d postgres redis
else
    docker compose up -d
fi

# 等待数据库启动
log_info "等待数据库启动..."
sleep 10

# 检查数据库连接
log_info "检查数据库连接..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec soybean-postgres pg_isready -U soybean -d soybean_admin > /dev/null 2>&1; then
        log_success "PostgreSQL 连接成功"
        break
    fi

    if [ $attempt -eq $max_attempts ]; then
        log_error "PostgreSQL 连接失败，请检查配置"
        exit 1
    fi

    log_info "等待 PostgreSQL 启动... (尝试 $attempt/$max_attempts)"
    sleep 2
    ((attempt++))
done

# 检查Redis连接
if docker exec soybean-redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis 连接成功"
else
    log_error "Redis 连接失败，请检查配置"
    exit 1
fi

# 生成Prisma客户端
log_info "生成Prisma客户端..."
npx prisma generate

# 运行数据库迁移
log_info "运行数据库迁移..."
npx prisma migrate deploy

# 初始化数据
log_info "初始化基础数据..."
npm run db:seed

if [ "$ENVIRONMENT" = "dev" ]; then
    # 开发环境
    log_info "启动开发服务器..."
    log_success "部署完成！"
    log_info "开发服务器地址: http://localhost:3000"
    log_info "API文档地址: http://localhost:3000/api-docs"
    log_info "数据库管理: npx prisma studio"

    # 启动开发服务器
    npm run dev
else
    # 生产环境
    log_info "构建生产版本..."
    npm run build

    log_info "启动生产服务器..."
    docker compose up -d api

    log_success "生产环境部署完成！"
    log_info "服务器地址: http://localhost:3000"
    log_info "查看日志: docker compose logs -f api"
    log_info "停止服务: docker compose down"
fi

# 显示服务状态
log_info "服务状态:"
docker compose ps

log_success "SoyBean Admin 后端系统部署完成！"
