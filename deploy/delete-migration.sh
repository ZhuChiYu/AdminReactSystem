#!/bin/bash

# 设置工作目录为项目根目录
cd "$(dirname "$0")/.."

# 检查文件是否存在
MIGRATION_FILE="prisma/migrations/20250615091131_init/migration.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "错误: 迁移文件不存在"
    exit 1
fi

# 取消暂存文件
git restore --staged "$MIGRATION_FILE"

# 删除文件
rm -rf "prisma/migrations/20250615091131_init"

echo "迁移文件已成功删除"
