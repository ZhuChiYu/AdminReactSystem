# SoyBean Admin 后端系统

基于 Node.js + Express + TypeScript + Prisma + PostgreSQL 构建的企业级管理系统后端API。

## 🚀 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: PostgreSQL 15
- **ORM**: Prisma
- **缓存**: Redis 7
- **认证**: JWT
- **文档**: Swagger/OpenAPI 3.0
- **容器化**: Docker & Docker Compose
- **日志**: Winston
- **测试**: Jest
- **代码质量**: ESLint + Prettier

## 📁 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── index.ts      # 主配置
│   │   ├── database.ts   # 数据库配置
│   │   ├── redis.ts      # Redis配置
│   │   └── swagger.ts    # API文档配置
│   ├── controllers/      # 控制器
│   │   └── authController.ts
│   ├── middleware/       # 中间件
│   │   ├── auth.ts       # 认证中间件
│   │   ├── errorHandler.ts # 错误处理
│   │   └── log.ts        # 日志中间件
│   ├── routes/           # 路由
│   │   ├── auth.ts       # 认证路由
│   │   ├── user.ts       # 用户管理
│   │   ├── customer.ts   # 客户管理
│   │   ├── course.ts     # 课程管理
│   │   ├── meeting.ts    # 会议管理
│   │   └── system.ts     # 系统管理
│   ├── services/         # 业务服务
│   │   └── authService.ts
│   ├── utils/            # 工具函数
│   │   ├── errors.ts     # 错误处理
│   │   └── logger.ts     # 日志工具
│   ├── prisma/           # 数据库相关
│   │   └── seed.ts       # 数据初始化
│   ├── health-check.ts   # 健康检查
│   └── server.ts         # 服务器入口
├── prisma/
│   └── schema.prisma     # 数据库模型
├── docker-compose.yml    # Docker编排
├── Dockerfile           # Docker镜像
├── deploy.sh           # 部署脚本
├── package.json        # 依赖配置
└── tsconfig.json       # TypeScript配置
```

## 🛠️ 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose

### 1. 克隆项目

```bash
git clone <repository-url>
cd soybean-admin-react/backend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

```bash
# 复制环境配置文件
cp env.example .env

# 编辑配置文件
vim .env
```

### 4. 启动开发环境

```bash
# 使用部署脚本（推荐）
./deploy.sh dev

# 或手动启动
npm run docker:up
npm run db:migrate
npm run db:seed
npm run dev
```

### 5. 访问服务

- **API服务**: http://localhost:3000
- **API文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

## 🐳 Docker 部署

### 开发环境

```bash
# 启动开发环境
./deploy.sh dev

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境

```bash
# 部署生产环境
./deploy.sh prod

# 查看服务状态
docker-compose ps

# 查看API服务日志
docker-compose logs -f api
```

## 📊 数据库管理

### Prisma 命令

```bash
# 生成客户端
npm run db:generate

# 运行迁移
npm run db:migrate

# 重置数据库
npm run db:reset

# 初始化数据
npm run db:seed

# 数据库管理界面
npm run db:studio
```

### 默认账号

- **用户名**: admin
- **密码**: 123456
- **邮箱**: admin@soybean.com

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint
npm run lint:fix

# 代码格式化
npm run format

# 运行测试
npm test
npm run test:watch
npm run test:coverage
```

## 📝 API 文档

项目集成了 Swagger UI，提供完整的 API 文档：

- **开发环境**: http://localhost:3000/api-docs
- **JSON格式**: http://localhost:3000/api-docs.json

### API 规范

- **统一响应格式**:
```json
{
  "code": 0,
  "message": "操作成功",
  "data": {},
  "timestamp": 1672531200000,
  "path": "/api/users"
}
```

- **分页响应格式**:
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "records": [],
    "total": 100,
    "current": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": 1672531200000,
  "path": "/api/users"
}
```

## 🔐 认证授权

### JWT Token

- **访问令牌**: 7天有效期
- **刷新令牌**: 30天有效期
- **请求头**: `Authorization: Bearer <token>`

### 权限系统

- **RBAC模型**: 用户-角色-权限
- **数据权限**: 支持行级数据权限控制
- **接口权限**: 基于权限码的接口访问控制

## 📈 监控日志

### 日志级别

- **error**: 错误日志
- **warn**: 警告日志
- **info**: 信息日志
- **debug**: 调试日志

### 日志文件

- `logs/app.log`: 应用日志
- `logs/error.log`: 错误日志
- `logs/exceptions.log`: 异常日志
- `logs/rejections.log`: Promise拒绝日志

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 🚀 部署指南

### 环境变量

生产环境需要配置以下环境变量：

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://:password@host:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

### 性能优化

- **数据库连接池**: 配置合适的连接池大小
- **Redis缓存**: 用户信息和权限缓存
- **请求限流**: 防止API滥用
- **Gzip压缩**: 减少传输数据大小
- **静态资源**: 使用CDN加速

### 安全配置

- **Helmet**: HTTP安全头
- **CORS**: 跨域资源共享
- **Rate Limiting**: 请求频率限制
- **JWT黑名单**: Token失效机制
- **密码加密**: bcrypt加密存储

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 邮箱: admin@soybean.com
- 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)

---

**SoyBean Admin Team** ❤️
