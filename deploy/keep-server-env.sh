#!/bin/bash

# 设置错误时退出
set -e

echo "开始处理 .env 文件冲突，保留服务器上的修改..."

# 检查是否在正确的目录
if [ ! -f ".env" ]; then
    echo "错误: 未找到 .env 文件，请确保在项目根目录运行此脚本"
    exit 1
fi

# 使用 git checkout --ours 保留当前（服务器端）的修改
echo "保留服务器端的 .env 修改..."
git checkout --ours .env

# 将文件标记为已解决
echo "将 .env 文件标记为已解决..."
git add .env

echo "✅ 完成！已保留服务器端的 .env 修改"
echo "现在你可以继续其他操作，比如："
echo "git stash pop  # 继续处理其他文件的合并"
echo "或"
echo "git commit -m 'update: 更新环境配置'  # 直接提交更改"
