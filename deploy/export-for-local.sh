#!/bin/bash

# 云服务器数据导出脚本
# 用于将云服务器上的数据库和附件导出到本地进行调试
# 使用方法: ./deploy/export-for-local.sh

set -e

# 配置
EXPORT_DIR="/tmp/admin-system-export"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="soybean-postgres"
ARCHIVE_NAME="admin-system-data-${DATE}.tar.gz"

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

# 检查Docker是否运行
check_docker() {
    if ! docker ps > /dev/null 2>&1; then
        print_error "Docker未运行或权限不足"
        exit 1
    fi
}

# 检查数据库容器是否存在
check_container() {
    # 首先尝试预设的容器名
    if docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        # 检查容器是否正在运行
        if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
            print_warning "容器 ${CONTAINER_NAME} 未运行，正在尝试启动..."
            if docker start ${CONTAINER_NAME} > /dev/null 2>&1; then
                print_success "容器 ${CONTAINER_NAME} 启动成功"
                sleep 3  # 等待容器完全启动
            else
                print_error "无法启动容器 ${CONTAINER_NAME}"
                exit 1
            fi
        else
            print_success "容器 ${CONTAINER_NAME} 正在运行"
        fi
        return 0
    fi

    # 如果预设容器不存在，尝试自动检测PostgreSQL容器
    print_warning "预设容器 ${CONTAINER_NAME} 不存在，正在自动检测PostgreSQL容器..."

    # 查找所有postgres容器
    POSTGRES_CONTAINERS=$(docker ps -a --filter "ancestor=postgres" --format "{{.Names}}" 2>/dev/null)

    if [ -z "$POSTGRES_CONTAINERS" ]; then
        # 如果没找到基于postgres镜像的容器，尝试查找包含postgres的容器名
        POSTGRES_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -i postgres 2>/dev/null)
    fi

    if [ -z "$POSTGRES_CONTAINERS" ]; then
        print_error "未找到任何PostgreSQL容器"
        print_info "请检查以下内容："
        print_info "1. PostgreSQL容器是否已启动"
        print_info "2. 容器名称是否正确"
        print_info "3. 运行 'docker ps -a' 查看所有容器"
        exit 1
    fi

    # 如果只有一个postgres容器，自动使用它
    CONTAINER_COUNT=$(echo "$POSTGRES_CONTAINERS" | wc -l)
    if [ "$CONTAINER_COUNT" -eq 1 ]; then
        CONTAINER_NAME="$POSTGRES_CONTAINERS"
        print_success "自动检测到PostgreSQL容器: ${CONTAINER_NAME}"

        # 检查容器是否正在运行
        if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
            print_warning "容器 ${CONTAINER_NAME} 未运行，正在尝试启动..."
            if docker start ${CONTAINER_NAME} > /dev/null 2>&1; then
                print_success "容器 ${CONTAINER_NAME} 启动成功"
                sleep 3  # 等待容器完全启动
            else
                print_error "无法启动容器 ${CONTAINER_NAME}"
                exit 1
            fi
        else
            print_success "容器 ${CONTAINER_NAME} 正在运行"
        fi

        return 0
    fi

    # 如果有多个容器，让用户选择
    print_info "检测到多个PostgreSQL容器："
    echo "$POSTGRES_CONTAINERS"
    print_error "请在脚本中手动指定CONTAINER_NAME变量"
    exit 1
}

# 创建导出目录
create_export_dir() {
    print_info "创建导出目录 ${EXPORT_DIR}..."
    rm -rf ${EXPORT_DIR}
    mkdir -p ${EXPORT_DIR}
    mkdir -p ${EXPORT_DIR}/database
    mkdir -p ${EXPORT_DIR}/uploads
    mkdir -p ${EXPORT_DIR}/config
}

# 导出数据库
export_database() {
    print_info "正在导出PostgreSQL数据库..."

    # 获取数据库配置
    DB_NAME=$(grep "POSTGRES_DB=" .env | cut -d'=' -f2 | tr -d '"')
    DB_USER=$(grep "POSTGRES_USER=" .env | cut -d'=' -f2 | tr -d '"')

    if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
        print_warning "无法从.env文件获取数据库配置，使用默认值"
        DB_NAME="admin_system"
        DB_USER="postgres"
    fi

    print_info "数据库名: ${DB_NAME}, 用户: ${DB_USER}"

    # 导出完整数据库
    docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} --clean --if-exists > ${EXPORT_DIR}/database/database.sql

    # 导出数据库结构（无数据）
    docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} --schema-only > ${EXPORT_DIR}/database/schema.sql

    # 导出数据（无结构）
    docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} --data-only > ${EXPORT_DIR}/database/data.sql

    print_success "数据库导出完成"
}

# 导出上传文件
export_uploads() {
    print_info "正在导出上传文件..."

    if [ -d "./backend/uploads" ]; then
        cp -r ./backend/uploads/* ${EXPORT_DIR}/uploads/ 2>/dev/null || true

        # 计算文件数量和大小
        FILE_COUNT=$(find ${EXPORT_DIR}/uploads -type f | wc -l)
        TOTAL_SIZE=$(du -sh ${EXPORT_DIR}/uploads 2>/dev/null | cut -f1)

        print_success "上传文件导出完成 (${FILE_COUNT} 个文件, ${TOTAL_SIZE})"
    else
        print_warning "上传文件目录不存在: ./backend/uploads"
    fi
}

# 导出配置文件
export_config() {
    print_info "正在导出配置文件..."

    # 导出环境配置
    if [ -f ".env" ]; then
        cp .env ${EXPORT_DIR}/config/env.production
        print_success "环境配置文件已导出"
    else
        print_warning "环境配置文件不存在: .env"
    fi

    # 导出Docker配置
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml ${EXPORT_DIR}/config/
        print_success "Docker配置文件已导出"
    fi

    # 导出Prisma配置
    if [ -f "backend/prisma/schema.prisma" ]; then
        cp backend/prisma/schema.prisma ${EXPORT_DIR}/config/
        print_success "Prisma配置文件已导出"
    fi
}

# 生成导入脚本
generate_import_script() {
    print_info "生成本地导入脚本..."

    cat > ${EXPORT_DIR}/import-to-local.sh << 'EOF'
#!/bin/bash

# 本地数据导入脚本
# 在本地开发环境中运行此脚本来导入数据

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

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "请在项目根目录运行此脚本"
    exit 1
fi

# 检查PostgreSQL是否运行
check_postgres() {
    if ! command -v psql > /dev/null 2>&1; then
        print_error "PostgreSQL客户端未安装，请先安装PostgreSQL"
        exit 1
    fi
}

# 创建本地数据库
create_local_database() {
    print_info "创建本地数据库..."

    # 从环境配置获取数据库信息
    DB_NAME="admin_system_local"
    DB_USER="postgres"

    # 创建数据库（如果不存在）
    createdb -U ${DB_USER} ${DB_NAME} 2>/dev/null || true

    print_success "本地数据库创建完成: ${DB_NAME}"
}

# 导入数据库
import_database() {
    print_info "导入数据库数据..."

    if [ -f "database/database.sql" ]; then
        DB_NAME="admin_system_local"
        DB_USER="postgres"

        # 清空现有数据并导入
        psql -U ${DB_USER} -d ${DB_NAME} -f database/database.sql

        print_success "数据库数据导入完成"
    else
        print_error "数据库备份文件不存在: database/database.sql"
        exit 1
    fi
}

# 导入上传文件
import_uploads() {
    print_info "导入上传文件..."

    if [ -d "uploads" ]; then
        # 创建后端上传目录
        mkdir -p ../backend/uploads

        # 复制所有上传文件
        cp -r uploads/* ../backend/uploads/

        # 设置权限
        chmod -R 755 ../backend/uploads/

        FILE_COUNT=$(find ../backend/uploads -type f | wc -l)
        print_success "上传文件导入完成 (${FILE_COUNT} 个文件)"
    else
        print_warning "上传文件目录不存在"
    fi
}

# 更新本地环境配置
update_local_env() {
    print_info "更新本地环境配置..."

    # 创建本地环境配置
    cat > ../.env << 'LOCALENV'
# 本地开发环境配置
NODE_ENV=development

# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/admin_system_local"

# Redis配置（如果需要）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT密钥
JWT_SECRET=your-local-jwt-secret-key-min-32-characters-long
JWT_REFRESH_SECRET=your-local-refresh-secret-key-min-32-characters-long

# 端口配置
PORT=3000
FRONTEND_URL=http://localhost:5173

# 是否运行数据库种子
RUN_SEED=false

# 邮件配置（本地测试可以留空）
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
LOCALENV

    print_success "本地环境配置已更新"
}

# 更新Prisma配置
update_prisma_config() {
    print_info "更新Prisma配置..."

    cd ../backend

    # 生成Prisma客户端
    npm run db:generate

    print_success "Prisma配置更新完成"
}

# 主要执行流程
main() {
    print_info "开始导入数据到本地环境..."

    check_postgres
    create_local_database
    import_database
    import_uploads
    update_local_env
    update_prisma_config

    print_success "数据导入完成！"
    print_info "下一步操作："
    print_info "1. cd backend && npm install"
    print_info "2. npm run dev"
    print_info "3. 在新终端窗口中: cd .. && npm run dev"
    print_info "4. 访问 http://localhost:5173"
}

main
EOF

    chmod +x ${EXPORT_DIR}/import-to-local.sh
    print_success "本地导入脚本已生成"
}

# 创建README文件
create_readme() {
    print_info "创建操作说明文档..."

    cat > ${EXPORT_DIR}/README.md << 'EOF'
# 数据导出包使用说明

## 包含内容

- `database/` - 数据库备份文件
  - `database.sql` - 完整数据库备份（结构+数据）
  - `schema.sql` - 数据库结构
  - `data.sql` - 数据库数据
- `uploads/` - 所有上传的附件文件
- `config/` - 配置文件
- `import-to-local.sh` - 本地导入脚本

## 使用方法

### 1. 解压数据包
```bash
tar -xzf admin-system-data-*.tar.gz
cd admin-system-data-*
```

### 2. 准备本地环境
确保已安装：
- Node.js (>=18.0.0)
- PostgreSQL (>=13)
- npm

### 3. 导入数据
```bash
# 在解压后的数据目录中运行
./import-to-local.sh
```

### 4. 启动项目
```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端（新终端）
cd ../
npm install
npm run dev
```

### 5. 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3000

## 注意事项

1. **数据库配置**: 脚本会自动创建名为 `admin_system_local` 的本地数据库
2. **文件权限**: 上传文件会被复制到 `backend/uploads/` 目录
3. **环境变量**: 会自动创建适合本地开发的 `.env` 文件
4. **端口冲突**: 如果端口被占用，请修改 `.env` 文件中的端口配置

## 故障排除

### 数据库连接失败
- 检查PostgreSQL服务是否运行
- 确认数据库用户权限
- 检查 `.env` 文件中的数据库连接字符串

### 上传文件无法访问
- 检查 `backend/uploads/` 目录权限
- 确认文件路径在数据库中的记录是否正确

### 依赖安装失败
- 清除node_modules和lock文件后重新安装
- 检查Node.js版本是否符合要求

## 数据库表结构

主要表：
- `User` - 用户信息
- `Customer` - 客户信息
- `Attachment` - 附件信息
- `Task` - 任务信息
- `ExpenseApplication` - 费用申请
- `Meeting` - 会议信息
- `Class` - 班级信息

详细结构请参考 `config/schema.prisma` 文件。
EOF

    print_success "操作说明文档已创建"
}

# 打包数据
create_archive() {
    print_info "正在打包数据..."

    cd /tmp
    tar -czf ${ARCHIVE_NAME} admin-system-export/

    ARCHIVE_SIZE=$(du -sh ${ARCHIVE_NAME} | cut -f1)
    print_success "数据包已创建: /tmp/${ARCHIVE_NAME} (${ARCHIVE_SIZE})"
}

# 主要执行流程
main() {
    print_info "开始导出云服务器数据..."

    check_docker
    check_container
    create_export_dir
    export_database
    export_uploads
    export_config
    generate_import_script
    create_readme
    create_archive

    print_success "数据导出完成！"
    print_info ""
    print_info "导出文件: /tmp/${ARCHIVE_NAME}"
    print_info ""
    print_info "下载到本地的方法："
    print_info "scp user@server:/tmp/${ARCHIVE_NAME} ./"
    print_info "或者使用其他文件传输工具"
    print_info ""
    print_info "在本地解压后运行 ./import-to-local.sh 即可导入数据"

    # 清理临时目录
    rm -rf ${EXPORT_DIR}
}

main
