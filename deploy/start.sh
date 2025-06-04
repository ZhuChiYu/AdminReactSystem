#!/bin/bash

# 设置环境变量
export NODE_ENV=production

# 等待数据库连接
echo "等待数据库连接..."
cd /app/backend

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate deploy

# 生成Prisma客户端
echo "生成Prisma客户端..."
npx prisma generate

# 可选：运行数据库种子
if [ "$RUN_SEED" = "true" ]; then
    echo "运行数据库种子..."
    npm run db:seed
fi

# 启动supervisor管理所有服务
echo "启动服务..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
