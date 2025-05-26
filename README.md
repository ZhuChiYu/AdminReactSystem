# React SoybeanAdmin - 企业级管理系统

## 项目简介

React SoybeanAdmin 是一个基于 React 19 + React Router V7 + Ant Design 构建的现代化企业级管理系统。系统专注于培训机构和企业的客户关系管理、课程管理、会议管理、财务管理等核心业务场景，提供完整的 RBAC 权限控制和数据权限管理。

## 🚀 技术栈

### 前端技术
- **React 19** - 最新的 React 版本，支持并发特性
- **React Router V7** - 最新的路由管理方案
- **Ant Design** - 企业级 UI 组件库
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite 6** - 快速的构建工具
- **UnoCSS** - 原子化 CSS 引擎
- **Zustand** - 轻量级状态管理

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Husky** - Git hooks 管理
- **Commitizen** - 规范化提交信息

## 📁 项目结构

```
src/
├── components/          # 公共组件
├── hooks/              # 自定义 Hooks
├── layouts/            # 布局组件
├── locales/            # 国际化配置
├── pages/              # 页面组件
│   ├── (base)/         # 基础功能页面
│   │   ├── customer-manage/  # 客户管理
│   │   ├── course-manage/    # 课程管理
│   │   ├── meeting-manage/   # 会议管理
│   │   ├── employee-manage/  # 员工管理
│   │   ├── finance-manage/   # 财务管理
│   │   └── system-manage/    # 系统管理
│   └── login/          # 登录页面
├── router/             # 路由配置
├── service/            # API 服务层
│   ├── api/            # API 接口定义
│   │   ├── types.ts    # 类型定义
│   │   ├── client.ts   # API 客户端
│   │   ├── auth.ts     # 认证服务
│   │   ├── customer.ts # 客户服务
│   │   ├── course.ts   # 课程服务
│   │   ├── meeting.ts  # 会议服务
│   │   └── index.ts    # 服务入口
│   └── request/        # 请求封装
├── store/              # 状态管理
├── styles/             # 样式文件
├── types/              # 类型定义
└── utils/              # 工具函数
```

## 🎯 核心功能

### 1. 用户权限管理
- **RBAC 权限模型**：基于角色的访问控制
- **数据权限控制**：支持部门级、个人级数据权限
- **菜单权限**：动态菜单生成和权限控制
- **按钮权限**：细粒度的操作权限控制

### 2. 客户关系管理 (CRM)
- **客户信息管理**：完整的客户档案管理
- **客户分配**：支持客户在员工间的分配和转移
- **跟进记录**：详细的客户跟进历史记录
- **客户统计**：多维度的客户数据统计分析
- **数据权限**：基于角色的客户数据访问控制

### 3. 课程管理系统
- **课程信息管理**：课程基本信息、大纲、目标等
- **课程分类**：多级课程分类管理
- **学员管理**：课程学员报名和管理
- **课程评价**：学员评价和反馈系统
- **课程统计**：收入、学员数等统计分析

### 4. 会议管理系统
- **会议创建**：支持定期会议和一次性会议
- **参会人员**：邀请管理和响应状态跟踪
- **会议室管理**：会议室预订和冲突检测
- **会议提醒**：自动提醒功能
- **会议纪要**：会议记录和文档管理

### 5. 员工管理系统
- **员工档案**：完整的员工信息管理
- **组织架构**：部门和岗位管理
- **上下级关系**：员工层级关系管理
- **权限分配**：角色和权限的分配管理

### 6. 财务管理系统
- **收入管理**：课程收入、咨询收入等
- **支出管理**：各类费用支出记录
- **报销流程**：多级审批的报销流程
- **财务报表**：收支统计和财务分析
- **预算管理**：预算制定和执行监控

### 7. 系统管理
- **用户管理**：系统用户的增删改查
- **角色管理**：角色定义和权限配置
- **菜单管理**：系统菜单的动态配置
- **字典管理**：系统字典数据管理
- **操作日志**：用户操作行为记录

## 🔧 API 设计

### 统一响应格式
```typescript
interface ApiResponse<T = any> {
  code: number;          // 状态码: 0-成功, 其他-失败
  message: string;       // 响应消息
  data?: T;             // 响应数据
  timestamp: number;     // 时间戳
  path: string;         // 请求路径
}

// 分页响应格式
interface PageResponse<T = any> {
  code: number;
  message: string;
  data: {
    records: T[];        // 数据列表
    total: number;       // 总记录数
    current: number;     // 当前页码
    size: number;        // 每页大小
    pages: number;       // 总页数
  };
  timestamp: number;
  path: string;
}
```

### 主要 API 模块

#### 认证模块 (Auth)
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新令牌
- `GET /api/v1/auth/user-info` - 获取用户信息

#### 客户管理 (Customer)
- `GET /api/v1/customers` - 获取客户列表
- `POST /api/v1/customers` - 创建客户
- `PUT /api/v1/customers/:id` - 更新客户
- `DELETE /api/v1/customers/:id` - 删除客户
- `POST /api/v1/customers/:id/assign` - 分配客户
- `GET /api/v1/customers/:id/follow-records` - 获取跟进记录

#### 课程管理 (Course)
- `GET /api/v1/courses` - 获取课程列表
- `POST /api/v1/courses` - 创建课程
- `PUT /api/v1/courses/:id` - 更新课程
- `DELETE /api/v1/courses/:id` - 删除课程
- `POST /api/v1/courses/:id/publish` - 发布课程
- `GET /api/v1/courses/categories` - 获取课程分类

#### 会议管理 (Meeting)
- `GET /api/v1/meetings` - 获取会议列表
- `POST /api/v1/meetings` - 创建会议
- `PUT /api/v1/meetings/:id` - 更新会议
- `DELETE /api/v1/meetings/:id` - 删除会议
- `POST /api/v1/meetings/:id/respond` - 响应会议邀请
- `GET /api/v1/meeting-rooms` - 获取会议室列表

## 🗄️ 数据库设计

### 核心数据表

#### 用户权限相关
- `users` - 用户表
- `roles` - 角色表
- `permissions` - 权限表
- `user_roles` - 用户角色关联表
- `role_permissions` - 角色权限关联表

#### 客户管理相关
- `customers` - 客户表
- `customer_assignments` - 客户分配表
- `customer_follow_records` - 客户跟进记录表

#### 课程管理相关
- `courses` - 课程表
- `course_categories` - 课程分类表
- `course_enrollments` - 课程报名表
- `course_reviews` - 课程评价表

#### 会议管理相关
- `meetings` - 会议表
- `meeting_participants` - 会议参与者表
- `meeting_rooms` - 会议室表
- `meeting_attachments` - 会议附件表

#### 财务管理相关
- `financial_records` - 财务记录表
- `expense_applications` - 报销申请表
- `expense_approvals` - 报销审批表

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发环境启动
```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 代码检查
```bash
npm run lint
# 或
yarn lint
```

## 📝 开发规范

### 代码提交规范
使用 Conventional Commits 规范：
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 组件开发规范
1. 使用 TypeScript 进行类型定义
2. 组件名使用 PascalCase
3. 文件名使用 kebab-case
4. 使用 ESLint 和 Prettier 保持代码风格一致

### API 调用规范
1. 统一使用 service 层进行 API 调用
2. 错误处理统一在 API 客户端层面处理
3. 使用 TypeScript 定义 API 请求和响应类型

## 🔒 安全特性

### 认证授权
- JWT Token 认证机制
- Token 自动刷新
- 路由级权限控制
- 组件级权限控制

### 数据安全
- 敏感数据脱敏显示
- 数据权限控制
- 操作日志记录
- XSS 防护

## 📊 性能优化

### 前端优化
- 路由懒加载
- 组件按需加载
- 图片懒加载
- 虚拟滚动（大数据量表格）

### 构建优化
- Vite 快速构建
- 代码分割
- 资源压缩
- CDN 加速

## 🌐 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 邮箱：[your-email@example.com]

---

**React SoybeanAdmin** - 让企业管理更简单、更高效！
