#!/bin/bash

# 使用SSH密钥上传代码到腾讯云服务器的脚本
# 使用方法: ./deploy/upload-to-server-with-key.sh

SERVER_IP="111.230.110.95"
SERVER_USER="root"
REMOTE_PATH="/opt/admin-system"
SSH_KEY="$HOME/.ssh/tencent_cloud_key"

echo "准备使用SSH密钥上传代码到腾讯云服务器..."
echo "服务器: $SERVER_IP"
echo "远程路径: $REMOTE_PATH"
echo "SSH密钥: $SSH_KEY"

# 测试SSH连接
echo "测试SSH连接..."
ssh -i $SSH_KEY -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'SSH连接成功！'"

if [ $? -ne 0 ]; then
    echo "❌ SSH连接失败，请检查密钥配置"
    echo "请确保已将以下公钥添加到服务器的 ~/.ssh/authorized_keys："
    cat $SSH_KEY.pub
    exit 1
fi

# 确保远程目录存在
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_PATH"

# 排除不需要的文件
rsync -avz --progress \
  -e "ssh -i $SSH_KEY" \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude 'dist/' \
  --exclude '.env' \
  --exclude '*.log' \
  ./ $SERVER_USER@$SERVER_IP:$REMOTE_PATH/

echo "✅ 代码上传完成！"
echo "现在可以登录服务器执行部署："
echo "ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "cd $REMOTE_PATH"
echo "./deploy/tencent-deploy.sh"
