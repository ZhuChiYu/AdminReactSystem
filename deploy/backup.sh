#!/bin/bash

# 数据备份脚本
# 使用方法: ./deploy/backup.sh

set -e

# 配置
BACKUP_DIR="/opt/backups/admin-system"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="admin-postgres"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 创建备份目录
print_info "创建备份目录..."
sudo mkdir -p $BACKUP_DIR

# 备份数据库
print_info "备份PostgreSQL数据库..."
docker exec $CONTAINER_NAME pg_dumpall -U postgres > $BACKUP_DIR/database_$DATE.sql

# 备份上传文件
print_info "备份上传文件..."
if [ -d "./uploads" ]; then
    sudo tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/
fi

# 备份配置文件
print_info "备份配置文件..."
sudo cp .env $BACKUP_DIR/env_$DATE.backup 2>/dev/null || true
sudo cp docker-compose.yml $BACKUP_DIR/docker-compose_$DATE.yml

# 清理老备份（保留7天）
print_info "清理7天前的备份..."
sudo find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
sudo find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
sudo find $BACKUP_DIR -name "*.backup" -mtime +7 -delete
sudo find $BACKUP_DIR -name "*.yml" -mtime +7 -delete

print_success "备份完成！备份位置: $BACKUP_DIR"
print_info "备份文件:"
ls -la $BACKUP_DIR/*$DATE*
