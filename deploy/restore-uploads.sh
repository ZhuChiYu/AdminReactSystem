#!/bin/bash

# 上传文件恢复脚本
# 用于恢复通过接口上传的文件

# 设置工作目录为项目根目录
cd "$(dirname "$0")/.."

echo "📁 开始恢复上传文件..."

# 切换到后端目录
cd backend

echo "📂 创建上传目录结构..."
mkdir -p uploads/attachments
mkdir -p uploads/avatars
mkdir -p uploads/customer-imports
mkdir -p uploads/expense-attachments
mkdir -p uploads/task-attachments
mkdir -p uploads/temp
mkdir -p uploads/notification-attachments

echo "🔧 设置目录权限..."
chmod -R 755 uploads/
chown -R $(whoami):$(whoami) uploads/ 2>/dev/null || true

echo "📋 需要恢复的文件列表:"
echo "📎 附件文件:"
echo "  - attachment-1749268179136-780234928.docx"
echo "  - attachment-1749268213886-632105061.docx"
echo "  - attachment-1749360001874-517158454.docx"
echo "  - attachment-1749603093429-289551712.docx"
echo "  - attachment-1749995708465-548133532.docx"
echo "  - attachment-1749995708484-354292671.docx"
echo "  - attachment-1749998684362-409713235.docx"
echo "  - attachment-1749998684378-270468416.docx"

echo ""
echo "👤 头像文件:"
echo "  - avatar-1749267944404-767836424.jpg"
echo "  - avatar-1749268029998-958917356.jpg"
echo "  - avatar-1749978813680-599424277.jpg"

echo ""
echo "📊 客户导入文件:"
echo "  - customers-1749306189152-176408340.xlsx"
echo "  - customers-1749306193449-826402704.xlsx"
echo "  - customers-1749306242554-362431244.xlsx"
echo "  - customers-1749306367386-953421412.xlsx"
echo "  - customers-1749306370319-704477920.xlsx"
echo "  - customers-1749306630658-821733185.xlsx"
echo "  - customers-1749306802302-696026782.xlsx"
echo "  - customers-1749306804965-773478228.xlsx"
echo "  - customers-1749306884814-911914422.xlsx"
echo "  - customers-1749306886747-784507263.xlsx"
echo "  - customers-1749306934995-170358663.xlsx"
echo "  - customers-1749306936688-390657607.xlsx"
echo "  - customers-1749307202631-942308862.xlsx"
echo "  - customers-1749346965283-108311754.xlsx"
echo "  - customers-1749346969332-29920569.xlsx"
echo "  - customers-1749355672918-41176588.xlsx"
echo "  - customers-1749355675385-86406269.xlsx"
echo "  - customers-1749355679593-763692364.xlsx"
echo "  - customers-1749355709195-317734542.xlsx"
echo "  - customers-1749355711965-153227176.xlsx"
echo "  - customers-1749355733201-213013083.xlsx"
echo "  - customers-1749355734785-694252446.xlsx"
echo "  - customers-1749355735011-511706713.xlsx"
echo "  - customers-1749355749521-46179083.xlsx"
echo "  - customers-1749355750124-15302246.xlsx"
echo "  - customers-1749371724382-204277972.xlsx"
echo "  - customers-1749371726105-278678424.xlsx"
echo "  - customers-1749371731051-465827944.xlsx"
echo "  - customers-1749395800873-533833990.xlsx"

echo ""
echo "💰 费用附件:"
echo "  - expense-1749979583994-428624136.pdf"

echo ""
echo "📋 任务附件:"
echo "  - task-attachment-1749395173665-250724076.xlsx"
echo "  - task-attachment-1749974347727-95372700.pptx"
echo "  - task-attachment-1749974352669-512787697.pptx"
echo "  - task-attachment-1749974357790-491912592.pptx"
echo "  - task-attachment-1749974933772-671879926.docx"

echo ""
echo "🔄 未暂存的新文件:"
echo "  - avatar-1750608363477-534162178.jpg"
echo "  - avatar-1751126929776-888583972.jpg"
echo "  - task-attachment-1751129002599-698189577.pptx"
echo "  - task-attachment-1751129009110-145014936.pptx"
echo "  - task-attachment-1751129149433-438914407.pptx"

echo ""
echo "✅ 上传目录结构已创建完成！"
echo ""
echo "⚠️  下一步操作:"
echo "1. 从备份中复制实际文件到对应目录"
echo "2. 或者从git暂存区恢复文件:"
echo "   git checkout -- uploads/"
echo "3. 检查文件权限和所有者"
echo "4. 重启应用服务以确保文件访问正常"
