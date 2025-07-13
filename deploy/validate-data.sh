#!/bin/bash

# 数据验证脚本
# 用于验证导入的数据是否正确完整
# 使用方法: ./deploy/validate-data.sh

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

# 配置
DB_NAME="admin_system_local"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# 检查是否在项目根目录
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
}

# 检查数据库连接
check_database_connection() {
    print_info "检查数据库连接..."

    if ! command -v psql > /dev/null 2>&1; then
        print_error "PostgreSQL客户端未安装"
        exit 1
    fi

    if ! psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "\q" 2>/dev/null; then
        print_error "无法连接到数据库 ${DB_NAME}"
        print_info "请确认数据库服务正在运行且数据库已创建"
        exit 1
    fi

    print_success "数据库连接正常"
}

# 检查数据库表结构
check_database_tables() {
    print_info "检查数据库表结构..."

    # 获取所有表名
    TABLES=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null)

    if [ -z "$TABLES" ]; then
        print_error "未找到任何数据库表"
        exit 1
    fi

    # 检查关键表是否存在
    REQUIRED_TABLES=("User" "Customer" "Attachment" "Task" "ExpenseApplication" "Meeting" "Class" "Role" "Permission")

    for table in "${REQUIRED_TABLES[@]}"; do
        if echo "$TABLES" | grep -q "^[[:space:]]*$table[[:space:]]*$"; then
            print_success "表 $table 存在"
        else
            print_warning "表 $table 不存在"
        fi
    done
}

# 检查数据记录数量
check_data_counts() {
    print_info "检查数据记录数量..."

    # 定义要检查的表和预期的最小记录数
    declare -A TABLE_MIN_COUNTS=(
        ["User"]=1
        ["Role"]=1
        ["Permission"]=1
        ["Customer"]=0
        ["Attachment"]=0
        ["Task"]=0
        ["ExpenseApplication"]=0
        ["Meeting"]=0
        ["Class"]=0
    )

    for table in "${!TABLE_MIN_COUNTS[@]}"; do
        if psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" 2>/dev/null | grep -q 1; then
            count=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')

            if [ "$count" -ge "${TABLE_MIN_COUNTS[$table]}" ]; then
                print_success "表 $table 有 $count 条记录"
            else
                if [ "${TABLE_MIN_COUNTS[$table]}" -gt 0 ]; then
                    print_warning "表 $table 只有 $count 条记录（预期至少 ${TABLE_MIN_COUNTS[$table]} 条）"
                else
                    print_info "表 $table 有 $count 条记录"
                fi
            fi
        else
            print_warning "表 $table 不存在"
        fi
    done
}

# 检查用户数据
check_user_data() {
    print_info "检查用户数据..."

    # 检查是否有管理员用户
    admin_count=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"User\" u JOIN \"UserRole\" ur ON u.id = ur.\"userId\" JOIN \"Role\" r ON ur.\"roleId\" = r.id WHERE r.\"roleCode\" IN ('admin', 'super_admin');" 2>/dev/null | tr -d ' ')

    if [ "$admin_count" -gt 0 ]; then
        print_success "找到 $admin_count 个管理员用户"
    else
        print_warning "未找到管理员用户"
    fi

    # 检查用户是否有完整的基本信息
    incomplete_users=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"User\" WHERE \"userName\" IS NULL OR \"nickName\" IS NULL OR \"password\" IS NULL;" 2>/dev/null | tr -d ' ')

    if [ "$incomplete_users" -eq 0 ]; then
        print_success "所有用户都有完整的基本信息"
    else
        print_warning "有 $incomplete_users 个用户缺少基本信息"
    fi
}

# 检查权限数据
check_permissions() {
    print_info "检查权限数据..."

    # 检查角色权限关联
    role_permission_count=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"RolePermission\";" 2>/dev/null | tr -d ' ')

    if [ "$role_permission_count" -gt 0 ]; then
        print_success "角色权限关联数据: $role_permission_count 条"
    else
        print_warning "未找到角色权限关联数据"
    fi

    # 检查用户角色关联
    user_role_count=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"UserRole\";" 2>/dev/null | tr -d ' ')

    if [ "$user_role_count" -gt 0 ]; then
        print_success "用户角色关联数据: $user_role_count 条"
    else
        print_warning "未找到用户角色关联数据"
    fi
}

# 检查上传文件
check_uploaded_files() {
    print_info "检查上传文件..."

    if [ ! -d "backend/uploads" ]; then
        print_warning "上传目录不存在: backend/uploads"
        return
    fi

    # 检查各个上传目录
    UPLOAD_DIRS=("attachments" "avatars" "customer-imports" "expense-attachments" "task-attachments" "notification-attachments")

    for dir in "${UPLOAD_DIRS[@]}"; do
        if [ -d "backend/uploads/$dir" ]; then
            file_count=$(find "backend/uploads/$dir" -type f | wc -l)
            if [ "$file_count" -gt 0 ]; then
                total_size=$(du -sh "backend/uploads/$dir" 2>/dev/null | cut -f1)
                print_success "目录 $dir: $file_count 个文件 ($total_size)"
            else
                print_info "目录 $dir: 空"
            fi
        else
            print_warning "目录 $dir 不存在"
        fi
    done

    # 检查数据库中的附件记录与实际文件是否匹配
    if psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'Attachment';" 2>/dev/null | grep -q 1; then
        attachment_count=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"Attachment\";" 2>/dev/null | tr -d ' ')

        if [ "$attachment_count" -gt 0 ]; then
            print_info "数据库中的附件记录: $attachment_count 条"

            # 检查一些附件文件是否存在
            missing_files=0
            sample_files=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT \"filePath\" FROM \"Attachment\" LIMIT 5;" 2>/dev/null)

            while IFS= read -r file_path; do
                if [ -n "$file_path" ]; then
                    file_path=$(echo "$file_path" | tr -d ' ')
                    if [ ! -f "backend/$file_path" ]; then
                        missing_files=$((missing_files + 1))
                    fi
                fi
            done <<< "$sample_files"

            if [ "$missing_files" -eq 0 ]; then
                print_success "抽样检查的附件文件都存在"
            else
                print_warning "抽样检查发现 $missing_files 个附件文件缺失"
            fi
        else
            print_info "数据库中没有附件记录"
        fi
    fi
}

# 检查环境配置
check_environment() {
    print_info "检查环境配置..."

    if [ ! -f ".env" ]; then
        print_error ".env 文件不存在"
        return
    fi

    # 检查必要的环境变量
    REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET" "PORT")

    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env; then
            value=$(grep "^$var=" .env | cut -d'=' -f2- | tr -d '"')
            if [ -n "$value" ]; then
                print_success "环境变量 $var 已设置"
            else
                print_warning "环境变量 $var 为空"
            fi
        else
            print_warning "环境变量 $var 未设置"
        fi
    done
}

# 检查Prisma配置
check_prisma() {
    print_info "检查Prisma配置..."

    if [ ! -f "backend/prisma/schema.prisma" ]; then
        print_error "Prisma配置文件不存在"
        return
    fi

    cd backend

    # 检查Prisma客户端是否已生成
    if [ -d "node_modules/@prisma/client" ]; then
        print_success "Prisma客户端已生成"
    else
        print_warning "Prisma客户端未生成"
    fi

    # 检查数据库连接
    if npm run db:generate > /dev/null 2>&1; then
        print_success "Prisma配置正常"
    else
        print_warning "Prisma配置可能有问题"
    fi

    cd ..
}

# 检查应用启动
check_app_startup() {
    print_info "检查应用启动状态..."

    # 检查后端是否能正常启动（简单检查）
    cd backend

    if [ ! -d "node_modules" ]; then
        print_warning "后端依赖未安装"
    else
        print_success "后端依赖已安装"
    fi

    cd ..

    # 检查前端依赖
    if [ ! -d "node_modules" ]; then
        print_warning "前端依赖未安装"
    else
        print_success "前端依赖已安装"
    fi
}

# 生成验证报告
generate_report() {
    print_info "生成验证报告..."

    REPORT_FILE="data-validation-report-$(date +%Y%m%d_%H%M%S).txt"

    cat > $REPORT_FILE << EOF
数据验证报告
生成时间: $(date)
数据库: $DB_NAME
主机: $DB_HOST:$DB_PORT

=== 数据库表结构 ===
$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "\dt" 2>/dev/null || echo "无法获取表结构")

=== 数据记录数量 ===
$(for table in User Customer Attachment Task ExpenseApplication Meeting Class Role Permission; do
    if psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" 2>/dev/null | grep -q 1; then
        count=$(psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')
        echo "$table: $count 条记录"
    fi
done)

=== 上传文件统计 ===
$(for dir in attachments avatars customer-imports expense-attachments task-attachments notification-attachments; do
    if [ -d "backend/uploads/$dir" ]; then
        file_count=$(find "backend/uploads/$dir" -type f | wc -l)
        if [ "$file_count" -gt 0 ]; then
            total_size=$(du -sh "backend/uploads/$dir" 2>/dev/null | cut -f1)
            echo "$dir: $file_count 个文件 ($total_size)"
        else
            echo "$dir: 空"
        fi
    else
        echo "$dir: 目录不存在"
    fi
done)

=== 环境配置 ===
$(grep -E "^(DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET|PORT|NODE_ENV)" .env 2>/dev/null || echo "无法读取环境配置")

EOF

    print_success "验证报告已生成: $REPORT_FILE"
}

# 主要执行流程
main() {
    print_info "开始验证数据..."

    check_project_root
    check_database_connection
    check_database_tables
    check_data_counts
    check_user_data
    check_permissions
    check_uploaded_files
    check_environment
    check_prisma
    check_app_startup
    generate_report

    print_success "数据验证完成！"
    print_info ""
    print_info "验证摘要："
    print_info "- 数据库连接: 正常"
    print_info "- 数据表结构: 已检查"
    print_info "- 数据记录: 已统计"
    print_info "- 上传文件: 已检查"
    print_info "- 环境配置: 已验证"
    print_info ""
    print_info "如果有警告信息，请检查相关配置"
    print_info "详细报告已保存到当前目录"
}

main
