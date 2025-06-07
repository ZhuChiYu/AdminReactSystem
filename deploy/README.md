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

# 部署脚本使用说明

## 脚本列表

### 1. `quick-test-deploy.sh` - 完整部署脚本
**用途**: 首次部署或完整重新部署
**功能**:
- 安装所有依赖 (Node.js, pnpm, pm2)
- 启动数据库服务 (PostgreSQL + Redis)
- 配置环境变量 (使用服务器IP: 111.230.110.95)
- 安装前后端依赖
- 配置并启动服务
- 配置nginx反向代理

**使用方法**:
```bash
# 在服务器上执行
./deploy/quick-test-deploy.sh
```

### 2. `hot-update.sh` - 热更新脚本
**用途**: 代码更新后快速重启服务
**功能**:
- 更新环境变量配置
- 重新编译后端代码
- 重启前后端服务
- 不重新安装依赖，速度更快

**使用方法**:
```bash
# 代码push到服务器后执行
./deploy/hot-update.sh
```

## 环境配置

### 前端环境变量
- `VITE_API_BASE_URL`: API基础地址，设置为 `http://111.230.110.95:3000/api`
- `VITE_HTTP_PROXY`: 设置为 `N` (生产环境不使用代理)

### 后端环境变量
- `HOST`: 设置为 `0.0.0.0` 允许外部访问
- `PORT`: 设置为 `3000`
- `CORS_ORIGIN`: 允许的跨域地址，包含服务器IP的各种组合

## 访问地址

部署完成后可以通过以下地址访问：

- **主页面**: http://111.230.110.95 (通过nginx)
- **前端直接访问**: http://111.230.110.95:9527
- **后端API**: http://111.230.110.95:3000/api
- **API文档**: http://111.230.110.95:3000/api-docs

## 服务管理

### PM2 常用命令
```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs

# 重启所有服务
pm2 restart all

# 停止所有服务
pm2 stop all

# 删除所有服务
pm2 delete all
```

### 数据库管理
```bash
# 重启数据库容器
docker restart test-postgres test-redis

# 查看数据库状态
docker ps | grep test-

# 查看数据库日志
docker logs test-postgres
docker logs test-redis
```

## 故障排除

### CORS 错误
如果遇到跨域问题，检查：
1. 后端 `CORS_ORIGIN` 环境变量是否包含正确的域名
2. 前端请求的URL是否正确
3. 服务器防火墙是否开放相应端口

### 服务无法访问
1. 检查服务是否正常运行: `pm2 list`
2. 检查端口是否被占用: `netstat -tlnp | grep :3000`
3. 检查防火墙设置: `ufw status`

### 数据库连接问题
1. 检查Docker容器状态: `docker ps`
2. 检查数据库连接字符串是否正确
3. 检查数据库端口是否开放

## 工作流程建议

1. **首次部署**: 使用 `quick-test-deploy.sh`
2. **代码更新**:
   - 本地提交代码
   - push到服务器
   - 执行 `hot-update.sh`
3. **问题排查**: 使用 `pm2 logs` 查看错误信息
