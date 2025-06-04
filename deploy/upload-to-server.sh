#!/bin/bash

# 上传代码到腾讯云服务器的脚本
# 使用方法: ./deploy/upload-to-server.sh

SERVER_IP="111.230.110.95"
SERVER_USER="root"
REMOTE_PATH="/opt/admin-system"

echo "准备上传代码到腾讯云服务器..."
echo "服务器: $SERVER_IP"
echo "远程路径: $REMOTE_PATH"

# 确保远程目录存在
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_PATH"

# 排除不需要的文件
rsync -avz --progress \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'dist/' \
  --exclude '.env' \
  --exclude '*.log' \
  ./ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/

echo "代码上传完成！"
echo "现在可以登录服务器执行部署："
echo "ssh $SERVER_USER@$SERVER_IP"
echo "cd $REMOTE_PATH"
echo "./deploy/tencent-deploy.sh"
