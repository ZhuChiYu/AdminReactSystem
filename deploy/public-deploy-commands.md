# 公开仓库后的部署命令

## 1. 登录腾讯云服务器
```bash
ssh root@111.230.110.95
```

## 2. 克隆项目（无需认证）
```bash
# 删除之前失败的目录（如果存在）
rm -rf /opt/admin-system

# 克隆公开仓库
git clone https://github.com/ZhuChiYu/AdminReactSystem.git /opt/admin-system

# 进入项目目录
cd /opt/admin-system
```

## 3. 配置环境变量
```bash
# 复制环境变量配置
cp deploy/env.englishpartner .env

# 可选：编辑配置（如修改密码等）
nano .env
```

## 4. 执行自动部署
```bash
# 给脚本执行权限
chmod +x deploy/tencent-deploy.sh

# 运行自动部署脚本
./deploy/tencent-deploy.sh
```

## 5. 等待部署完成
部署脚本会自动：
- 安装Docker和Docker Compose
- 构建应用镜像
- 启动数据库和应用服务
- 配置nginx反向代理
- 运行数据库迁移

## 6. 访问应用
部署完成后访问：
- HTTP: http://111.230.110.95
- 域名: http://www.englishpartner.cn (需DNS配置)

## 7. 后续操作
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 配置SSL证书（可选）
./deploy/ssl-setup.sh www.englishpartner.cn
```
