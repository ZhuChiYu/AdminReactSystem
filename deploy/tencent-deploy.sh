#!/bin/bash

# 腾讯云CVM自动化部署脚本
# 使用方法: ./deploy/tencent-deploy.sh

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

# 检查是否在CVM上运行
print_info "检查运行环境..."

# 更新系统
print_info "更新系统包..."
sudo apt-get update

# 安装必要的软件
print_info "安装必要软件..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    wget \
    unzip

# 安装Docker
print_info "检查Docker安装状态..."
if ! command -v docker &> /dev/null; then
    print_info "安装Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    print_success "Docker安装完成"
else
    print_success "Docker已安装"
fi

# 安装Docker Compose
print_info "检查Docker Compose安装状态..."
if ! command -v docker-compose &> /dev/null; then
    print_info "安装Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose安装完成"
else
    print_success "Docker Compose已安装"
fi

# 启动Docker服务
print_info "启动Docker服务..."
sudo systemctl start docker
sudo systemctl enable docker

# 配置防火墙
print_info "配置防火墙..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw allow 6379/tcp  # Redis

# 创建应用目录
APP_DIR="/opt/admin-system"
print_info "创建应用目录: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 如果项目代码不存在，提示用户上传
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
    print_warning "项目代码不存在，请将项目代码上传到 $APP_DIR"
    print_info "你可以使用以下方式上传代码:"
    print_info "1. 使用Git克隆: git clone <你的仓库地址> $APP_DIR"
    print_info "2. 使用scp上传: scp -r ./AdminReactSystem root@<服务器IP>:$APP_DIR"
    print_info "3. 使用rsync同步: rsync -avz --exclude node_modules ./AdminReactSystem/ root@<服务器IP>:$APP_DIR/"
    exit 1
fi

cd $APP_DIR

# 检查环境变量文件
if [ ! -f ".env" ]; then
    print_info "创建环境变量文件..."
    cp deploy/env.example .env
    print_warning "请编辑 .env 文件配置你的环境变量"
    print_info "使用命令: nano .env"
    read -p "按Enter继续，或Ctrl+C退出编辑环境变量..."
fi

# 给脚本执行权限
chmod +x deploy/*.sh

# 执行部署
print_info "开始部署应用..."
./deploy/deploy.sh

# 配置开机自启动
print_info "配置开机自启动..."
sudo tee /etc/systemd/system/admin-system.service > /dev/null <<EOF
[Unit]
Description=Admin System Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable admin-system.service

print_success "腾讯云部署完成！"
print_info "应用访问地址: http://$(curl -s ifconfig.me)"
print_info "管理命令:"
print_info "  查看服务状态: sudo systemctl status admin-system"
print_info "  重启服务: sudo systemctl restart admin-system"
print_info "  查看日志: cd $APP_DIR && docker-compose logs -f"
print_info "  进入应用目录: cd $APP_DIR"

print_warning "重要提醒:"
print_warning "1. 请修改 .env 文件中的默认密码"
print_warning "2. 建议配置SSL证书以启用HTTPS"
print_warning "3. 定期备份数据库数据"
