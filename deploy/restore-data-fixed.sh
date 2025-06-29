#!/bin/bash

# 修复版数据恢复脚本
# 解决了外键约束问题

# 设置工作目录为项目根目录
cd "$(dirname "$0")/.."

echo "🔄 开始数据恢复流程（修复版）..."

# 检查必要的文件是否存在
if [ ! -f "backend/src/prisma/seed-real-data.ts" ]; then
    echo "❌ 错误: 种子数据文件不存在"
    exit 1
fi

if [ ! -f "backend/data/excel-import-data.json" ]; then
    echo "❌ 错误: Excel导入数据文件不存在"
    exit 1
fi

echo "📁 切换到后端目录..."
cd backend

echo "🗄️ 重新生成Prisma客户端..."
npm run db:generate

echo "🔄 应用数据库迁移..."
npm run db:migrate

echo "🌱 重新填充基础种子数据..."
npm run db:seed

echo "📋 填充真实业务数据（修复版）..."
npx tsx src/prisma/seed-real-data.ts

# 检查上一个命令是否成功
if [ $? -eq 0 ]; then
    echo "✅ 数据恢复成功！"
else
    echo "❌ 数据恢复失败，请检查错误信息"
    echo "🔧 尝试手动解决方案："
    echo "1. 检查数据库连接"
    echo "2. 清空数据库后重新运行"
    echo "3. 或者使用数据库重置命令: npm run db:reset"
    exit 1
fi

echo "📂 处理上传文件..."
# 确保上传目录存在
mkdir -p uploads/attachments
mkdir -p uploads/avatars
mkdir -p uploads/customer-imports
mkdir -p uploads/expense-attachments
mkdir -p uploads/task-attachments
mkdir -p uploads/temp
mkdir -p uploads/notification-attachments

# 设置上传目录权限
chmod -R 755 uploads/

echo "🔄 从Git恢复上传文件..."
# 如果文件在git中，尝试恢复
git checkout -- uploads/ 2>/dev/null || echo "⚠️  部分文件可能需要手动恢复"

echo "✅ 数据恢复完成！"
echo ""
echo "📊 恢复内容包括:"
echo "  - 数据库结构迁移"
echo "  - 基础系统数据（部门、角色、权限）"
echo "  - 用户数据"
echo "  - 客户数据"
echo "  - 上传文件目录结构"
echo "  - 尝试恢复上传文件"
echo ""
echo "⚠️  注意:"
echo "  - 请检查数据库连接和权限"
echo "  - 建议重启应用服务"
echo "  - 如果上传文件未完全恢复，请手动复制备份文件"
