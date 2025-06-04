#!/bin/bash

# 部署脚本 - 腾讯云CVM部署
# 使用方法: ./deploy/deploy.sh [环境]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
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

# 检查参数
ENVIRONMENT=${1:-production}
print_info "部署环境: $ENVIRONMENT"

# 检查必要文件
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml 文件不存在"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile 文件不存在"
    exit 1
fi

# 创建.env文件（如果不存在）
if [ ! -f ".env" ]; then
    print_warning ".env 文件不存在，复制示例文件..."
    cp deploy/env.example .env
    print_warning "请修改 .env 文件中的配置后重新运行部署脚本"
    exit 1
fi

print_info "开始部署..."

# 1. 停止现有容器
print_info "停止现有容器..."
docker-compose down || true

# 2. 清理旧镜像（可选）
read -p "是否清理旧的Docker镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "清理旧镜像..."
    docker system prune -f
fi

# 3. 构建新镜像
print_info "构建Docker镜像..."
docker-compose build --no-cache

# 4. 启动服务
print_info "启动服务..."
docker-compose up -d

# 5. 等待服务启动
print_info "等待服务启动..."
sleep 30

# 6. 检查服务状态
print_info "检查服务状态..."
docker-compose ps

# 7. 检查应用健康状态
print_info "检查应用健康状态..."
sleep 10

# 检查前端
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "前端服务运行正常"
else
    print_error "前端服务异常"
fi

# 检查后端API
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_success "后端API服务运行正常"
else
    print_warning "后端API服务检查失败，请检查日志"
fi

# 8. 显示日志
print_info "显示服务日志（最近50行）..."
docker-compose logs --tail=50

print_success "部署完成！"
print_info "访问地址: http://your-server-ip"
print_info "查看日志: docker-compose logs -f"
print_info "停止服务: docker-compose down"

# 9. 可选：显示数据库连接信息
print_info "数据库连接信息:"
print_info "主机: localhost"
print_info "端口: 5432"
print_info "数据库: admin_system"
print_info "用户名: postgres"
