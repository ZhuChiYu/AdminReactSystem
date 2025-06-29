#!/bin/bash

# 数据恢复脚本
# 用于恢复数据库迁移后丢失的数据

# 设置工作目录为项目根目录
cd "$(dirname "$0")/.."

echo "🔄 开始数据恢复流程..."

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

echo "🌱 重新填充种子数据..."
npm run db:seed

echo "📋 填充真实业务数据..."
npx tsx src/prisma/seed-real-data.ts

echo "📂 处理上传文件..."
# 确保上传目录存在
mkdir -p uploads/attachments
mkdir -p uploads/avatars
mkdir -p uploads/customer-imports
mkdir -p uploads/expense-attachments
mkdir -p uploads/task-attachments
mkdir -p uploads/temp

# 设置上传目录权限
chmod -R 755 uploads/

echo "✅ 数据恢复完成！"
echo ""
echo "📊 恢复内容包括:"
echo "  - 数据库结构迁移"
echo "  - 基础系统数据（部门、角色、权限）"
echo "  - 用户数据"
echo "  - 客户数据"
echo "  - 上传文件目录结构"
echo ""
echo "⚠️  注意:"
echo "  - 上传的文件内容需要从备份中恢复"
echo "  - 请检查数据库连接和权限"
echo "  - 建议重启应用服务"
