#!/bin/bash

# 设置工作目录为项目根目录
cd "$(dirname "$0")/.."

# 检查目录是否存在
if [ ! -d "src/pages/(base)/customer-manage/info" ]; then
    echo "错误: 目录不存在"
    exit 1
fi

# 恢复文件改动
git checkout src/pages/\(base\)/customer-manage/info/index.tsx

echo "文件已恢复到最新的git版本"
