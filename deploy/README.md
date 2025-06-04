# 腾讯云部署指南

本文档详细介绍如何将Admin React System部署到腾讯云CVM。

## 📋 前置要求

### 腾讯云资源
- **CVM实例**: 至少2核4GB内存，推荐4核8GB
- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **硬盘空间**: 至少40GB SSD
- **网络**: 公网IP，开放80、443、22端口

### 本地要求
- Git
- SSH客户端

## 🚀 快速部署

### 方法一：一键自动部署（推荐）

1. **登录到腾讯云CVM**
```bash
ssh root@your-server-ip
```

2. **下载项目代码**
```bash
git clone <your-repository-url> /opt/admin-system
cd /opt/admin-system
```

3. **运行自动部署脚本**
```bash
chmod +x deploy/tencent-deploy.sh
./deploy/tencent-deploy.sh
```

### 方法二：手动部署

1. **准备服务器环境**
```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **上传项目代码**
```bash
# 方式1: 通过Git
git clone <your-repository-url> /opt/admin-system

# 方式2: 通过scp上传
scp -r ./AdminReactSystem root@your-server-ip:/opt/admin-system
```

3. **配置环境变量**
```bash
cd /opt/admin-system
cp deploy/env.example .env
nano .env  # 编辑配置
```

4. **执行部署**
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

## ⚙️ 配置说明

### 环境变量配置 (.env)

```bash
# 数据库配置
POSTGRES_DB=admin_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-strong-password-here

# Redis配置
REDIS_PASSWORD=your-redis-password-here

# JWT密钥（重要：请使用强密码）
JWT_SECRET=your-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret-32-chars-minimum

# 邮件配置（可选）
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-app-password

# 首次部署是否运行种子数据
RUN_SEED=true  # 首次部署设为true，后续设为false
```

### 端口配置

- **80**: HTTP访问端口
- **443**: HTTPS访问端口（配置SSL后）
- **5432**: PostgreSQL数据库端口
- **6379**: Redis缓存端口
- **3000**: 后端API端口（内部使用）

## 🔒 SSL证书配置（HTTPS）

### 配置域名SSL证书

1. **确保域名DNS指向服务器IP**

2. **运行SSL配置脚本**
```bash
chmod +x deploy/ssl-setup.sh
./deploy/ssl-setup.sh your-domain.com
```

3. **验证HTTPS访问**
```bash
curl -I https://your-domain.com
```

## 📊 服务管理

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 启动服务
docker-compose up -d

# 查看系统资源使用
docker stats
```

### 系统服务管理

```bash
# 查看自启动服务状态
sudo systemctl status admin-system

# 重启服务
sudo systemctl restart admin-system

# 查看服务日志
sudo journalctl -u admin-system -f
```

## 💾 数据备份

### 自动备份

```bash
# 运行备份脚本
./deploy/backup.sh

# 设置定时备份（每天凌晨2点）
echo "0 2 * * * cd /opt/admin-system && ./deploy/backup.sh" | sudo crontab -
```

### 手动备份

```bash
# 备份数据库
docker exec admin-postgres pg_dumpall -U postgres > backup_$(date +%Y%m%d).sql

# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🔧 故障排除

### 常见问题

1. **容器启动失败**
```bash
# 查看详细日志
docker-compose logs app

# 检查端口占用
sudo netstat -tlnp | grep :80
```

2. **数据库连接失败**
```bash
# 检查数据库容器状态
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres
```

3. **前端页面无法访问**
```bash
# 检查nginx状态
docker-compose logs app | grep nginx

# 检查防火墙
sudo ufw status
```

4. **内存不足**
```bash
# 查看内存使用
free -h

# 清理Docker缓存
docker system prune -f
```

### 性能优化

1. **数据库性能优化**
```bash
# 调整PostgreSQL配置
# 编辑 docker-compose.yml 中的postgres环境变量
```

2. **Redis缓存配置**
```bash
# 监控Redis性能
docker exec admin-redis redis-cli info memory
```

3. **Nginx缓存配置**
```bash
# 已在 deploy/nginx.conf 中配置了静态资源缓存
```

## 📈 监控和日志

### 日志查看

```bash
# 应用日志
docker-compose logs -f app

# 数据库日志
docker-compose logs -f postgres

# Redis日志
docker-compose logs -f redis

# 系统日志
sudo journalctl -f
```

### 性能监控

```bash
# 容器资源使用
docker stats

# 磁盘使用
df -h

# 网络连接
sudo netstat -tlnp
```

## 🔄 更新部署

### 更新应用代码

```bash
cd /opt/admin-system

# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 数据库迁移

```bash
# 运行数据库迁移
docker exec admin-app-backend npx prisma migrate deploy
```

## 📞 技术支持

### 联系方式
- 邮箱: support@yourcompany.com
- 文档: [项目文档地址]
- 仓库: [Git仓库地址]

### 紧急联系
如遇紧急问题，请联系系统管理员。

---

**重要提醒**：
1. 首次部署后请立即修改所有默认密码
2. 定期更新系统和应用
3. 定期备份重要数据
4. 监控系统资源使用情况
5. 及时更新SSL证书
