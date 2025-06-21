#!/bin/bash

# 设置错误时退出
set -e

echo "开始处理 .env 文件冲突..."

# 检查是否在正确的目录
if [ ! -f ".env" ]; then
    echo "错误: 未找到 .env 文件，请确保在项目根目录运行此脚本"
    exit 1
fi

# 备份当前的 .env 文件
echo "备份当前的 .env 文件..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 重置 .env 文件的状态
echo "重置 .env 文件状态..."
git reset HEAD .env
git checkout -- .env

# 如果存在 .env.example，使用它作为基础
if [ -f ".env.example" ]; then
    echo "检测到 .env.example 文件，使用它作为基础..."
    cp .env.example .env
fi

echo "现在你可以重新编辑 .env 文件并添加你的配置"
echo "完成后，使用以下命令提交更改："
echo "git add .env"
echo "git commit -m 'update: 更新环境配置'"

# 显示备份文件位置
echo "你的原始 .env 文件已备份。你可以在需要时参考它"
ls -l .env.backup.*
