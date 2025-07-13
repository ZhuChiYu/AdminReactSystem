#!/bin/bash

# 本地环境快速设置脚本
# 用于在本地快速设置开发环境
# 使用方法: ./deploy/setup-local-env.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# 检查操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get > /dev/null 2>&1; then
            DISTRO="debian"
        elif command -v yum > /dev/null 2>&1; then
            DISTRO="redhat"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
}

# 检查是否在项目根目录
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
}

# 检查并安装Node.js
check_nodejs() {
    print_info "检查Node.js..."

    if command -v node > /dev/null 2>&1; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js已安装: v$NODE_VERSION"
        else
            print_warning "Node.js版本过低 (v$NODE_VERSION)，建议升级到v18或以上"
        fi
    else
        print_error "Node.js未安装"
        install_nodejs
    fi
}

# 安装Node.js
install_nodejs() {
    print_info "正在安装Node.js..."

    case $OS in
        "macos")
            if command -v brew > /dev/null 2>&1; then
                brew install node
            else
                print_error "请先安装Homebrew或手动安装Node.js"
                exit 1
            fi
            ;;
        "linux")
            if [ "$DISTRO" = "debian" ]; then
                # 使用NodeSource仓库安装最新版本
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif [ "$DISTRO" = "redhat" ]; then
                # 使用NodeSource仓库安装最新版本
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install -y nodejs
            fi
            ;;
        *)
            print_error "不支持的操作系统，请手动安装Node.js"
            exit 1
            ;;
    esac
}

# 检查并安装PostgreSQL
check_postgresql() {
    print_info "检查PostgreSQL..."

    if command -v psql > /dev/null 2>&1; then
        PG_VERSION=$(psql --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
        print_success "PostgreSQL已安装: $PG_VERSION"

        # 检查服务是否运行
        if pg_isready -h localhost > /dev/null 2>&1; then
            print_success "PostgreSQL服务正在运行"
        else
            print_warning "PostgreSQL服务未运行，正在尝试启动..."
            start_postgresql
        fi
    else
        print_error "PostgreSQL未安装"
        install_postgresql
    fi
}

# 安装PostgreSQL
install_postgresql() {
    print_info "正在安装PostgreSQL..."

    case $OS in
        "macos")
            if command -v brew > /dev/null 2>&1; then
                brew install postgresql
                brew services start postgresql
            else
                print_error "请先安装Homebrew或手动安装PostgreSQL"
                exit 1
            fi
            ;;
        "linux")
            if [ "$DISTRO" = "debian" ]; then
                sudo apt update
                sudo apt install -y postgresql postgresql-contrib
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            elif [ "$DISTRO" = "redhat" ]; then
                sudo yum install -y postgresql-server postgresql-contrib
                sudo postgresql-setup initdb
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            fi
            ;;
        *)
            print_error "不支持的操作系统，请手动安装PostgreSQL"
            exit 1
            ;;
    esac
}

# 启动PostgreSQL服务
start_postgresql() {
    case $OS in
        "macos")
            if command -v brew > /dev/null 2>&1; then
                brew services start postgresql
            else
                pg_ctl -D /usr/local/var/postgres start
            fi
            ;;
        "linux")
            sudo systemctl start postgresql
            ;;
        *)
            print_error "无法启动PostgreSQL服务，请手动启动"
            exit 1
            ;;
    esac
}

# 创建PostgreSQL用户
setup_postgresql_user() {
    print_info "设置PostgreSQL用户..."

    # 检查用户是否存在
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$(whoami)'" 2>/dev/null | grep -q 1; then
        print_success "PostgreSQL用户已存在: $(whoami)"
    else
        print_info "创建PostgreSQL用户: $(whoami)"
        sudo -u postgres createuser --interactive --pwprompt $(whoami) || true

        # 如果交互式创建失败，创建超级用户
        sudo -u postgres psql -c "CREATE USER $(whoami) WITH SUPERUSER;" 2>/dev/null || true
    fi
}

# 创建本地环境配置
create_local_env() {
    print_info "创建本地环境配置..."

    if [ -f ".env" ]; then
        print_warning ".env文件已存在，备份为.env.backup"
        cp .env .env.backup
    fi

    cat > .env << 'EOF'
# 本地开发环境配置
NODE_ENV=development

# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/admin_system_local"

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT密钥
JWT_SECRET=your-local-jwt-secret-key-min-32-characters-long-for-development
JWT_REFRESH_SECRET=your-local-refresh-secret-key-min-32-characters-long-for-development

# 端口配置
PORT=3000
FRONTEND_URL=http://localhost:5173

# 是否运行数据库种子
RUN_SEED=true

# 邮件配置（本地测试可以留空）
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# 本地开发标识
LOCAL_DEV=true
DEBUG=true
LOG_LEVEL=debug
EOF

    print_success "本地环境配置已创建"
}

# 安装项目依赖
install_dependencies() {
    print_info "安装项目依赖..."

    # 安装根目录依赖
    if [ -f "package.json" ]; then
        print_info "安装前端依赖..."
        npm install
    fi

    # 安装后端依赖
    if [ -f "backend/package.json" ]; then
        print_info "安装后端依赖..."
        cd backend
        npm install
        cd ..
    fi

    print_success "依赖安装完成"
}

# 设置数据库
setup_database() {
    print_info "设置数据库..."

    cd backend

    # 生成Prisma客户端
    npm run db:generate

    # 运行数据库迁移
    npm run db:migrate

    # 运行种子数据
    if grep -q "RUN_SEED=true" ../.env; then
        print_info "运行种子数据..."
        npm run db:seed
    fi

    cd ..

    print_success "数据库设置完成"
}

# 创建上传目录
create_upload_dirs() {
    print_info "创建上传目录..."

    mkdir -p backend/uploads/attachments
    mkdir -p backend/uploads/avatars
    mkdir -p backend/uploads/customer-imports
    mkdir -p backend/uploads/expense-attachments
    mkdir -p backend/uploads/task-attachments
    mkdir -p backend/uploads/temp
    mkdir -p backend/uploads/notification-attachments

    chmod -R 755 backend/uploads/

    print_success "上传目录创建完成"
}

# 创建启动脚本
create_start_scripts() {
    print_info "创建启动脚本..."

    # 创建后端启动脚本
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "启动后端服务..."
cd backend
npm run dev
EOF

    # 创建前端启动脚本
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "启动前端服务..."
npm run dev
EOF

    # 创建完整启动脚本
    cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "启动开发环境..."

# 启动后端
echo "启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端
echo "启动前端服务..."
cd ..
npm run dev &
FRONTEND_PID=$!

# 等待用户输入
echo "开发环境已启动"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo "按 Ctrl+C 停止服务"

# 捕获退出信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 等待进程
wait
EOF

    chmod +x start-backend.sh start-frontend.sh start-dev.sh

    print_success "启动脚本创建完成"
}

# 主要执行流程
main() {
    print_info "开始设置本地开发环境..."

    detect_os
    check_project_root
    check_nodejs
    check_postgresql
    setup_postgresql_user
    create_local_env
    install_dependencies
    setup_database
    create_upload_dirs
    create_start_scripts

    print_success "本地环境设置完成！"
    print_info ""
    print_info "下一步操作："
    print_info "1. 启动开发环境: ./start-dev.sh"
    print_info "2. 或者分别启动:"
    print_info "   - 后端: ./start-backend.sh"
    print_info "   - 前端: ./start-frontend.sh"
    print_info "3. 访问应用: http://localhost:5173"
    print_info ""
    print_info "数据库连接信息:"
    print_info "- 数据库: admin_system_local"
    print_info "- 用户: postgres"
    print_info "- 主机: localhost"
    print_info "- 端口: 5432"
    print_info ""
    print_info "如果您有从生产环境导出的数据，请运行数据导入脚本"
}

main
