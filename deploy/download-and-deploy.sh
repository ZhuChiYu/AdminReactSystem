#!/bin/bash

# 下载GitHub项目ZIP包并部署的脚本
# 使用方法: 在服务器上运行此脚本

set -e

PROJECT_URL="https://github.com/ZhuChiYu/AdminReactSystem"
ZIP_URL="$PROJECT_URL/archive/refs/heads/main.zip"
INSTALL_DIR="/opt/admin-system"
TEMP_DIR="/tmp/admin-system-download"

echo "🚀 开始下载和部署Admin React System..."

# 清理旧文件
rm -rf $INSTALL_DIR $TEMP_DIR
mkdir -p $TEMP_DIR

echo "📥 下载项目ZIP包..."
cd $TEMP_DIR

# 尝试多种下载方式
if command -v wget >/dev/null 2>&1; then
    wget -O project.zip $ZIP_URL
elif command -v curl >/dev/null 2>&1; then
    curl -L -o project.zip $ZIP_URL
else
    echo "❌ 未找到wget或curl，请安装其中一个"
    exit 1
fi

echo "📦 解压项目文件..."
unzip -q project.zip

# 移动文件到目标目录
mv AdminReactSystem-main $INSTALL_DIR

echo "🗑️ 清理临时文件..."
rm -rf $TEMP_DIR

echo "⚙️ 设置权限..."
cd $INSTALL_DIR
chmod +x deploy/*.sh

echo "🔧 配置环境变量..."
if [ -f "deploy/env.englishpartner" ]; then
    cp deploy/env.englishpartner .env
    echo "已复制englishpartner配置"
else
    cp deploy/env.example .env
    echo "已复制示例配置，请编辑 .env 文件"
fi

echo "✅ 下载完成！项目位置：$INSTALL_DIR"
echo ""
echo "🚀 现在开始自动部署..."
echo "如果需要修改配置，请先编辑 .env 文件："
echo "nano .env"
echo ""
echo "然后运行部署脚本："
echo "./deploy/tencent-deploy.sh"
echo ""

# 询问是否立即部署
read -p "是否立即开始部署？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 开始自动部署..."
    ./deploy/tencent-deploy.sh
else
    echo "💡 稍后可以手动运行部署："
    echo "cd $INSTALL_DIR"
    echo "./deploy/tencent-deploy.sh"
fi
