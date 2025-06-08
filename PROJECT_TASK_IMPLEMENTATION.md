# 项目事项管理系统实现说明

## 概述

本系统将原有的简单任务管理重新设计为完整的项目事项管理流程，支持7个阶段的项目管理流程，每个阶段有对应的负责人和具体操作。

## 项目流程设计

### 7个阶段流程

1. **客户询价** (`customer_inquiry`)
   - 负责人：项目负责人
   - 操作：发起项目，填写基础信息

2. **方案申报** (`proposal_submission`)
   - 负责人：咨询部人员
   - 操作：上传方案附件，确认客户是否同意方案

3. **师资确定** (`teacher_confirmation`)
   - 负责人：咨询部人员
   - 操作：确认授课老师信息

4. **项目审批** (`project_approval`)
   - 负责人：市场部经理
   - 操作：审批项目，通过或拒绝

5. **签订合同** (`contract_signing`)
   - 负责人：咨询部人员
   - 操作：确认客户已签合同

6. **项目进行** (`project_execution`)
   - 负责人：咨询部人员
   - 操作：跟进项目过程，确认项目完成

7. **项目结算** (`project_settlement`)
   - 负责人：项目负责人
   - 操作：确认收款，项目完成后归档

## 数据库设计

### Task表结构

```sql
-- 项目基础信息
id: 主键
project_type: 项目类型
project_name: 项目名称
current_stage: 当前阶段
stage_history: 阶段历史(JSON)

-- 人员配置
responsible_person_id: 负责人ID
executor_id: 执行人ID
consultant_id: 咨询部人员ID
market_manager_id: 市场部经理ID

-- 项目信息
priority: 优先级(1-高, 2-中, 3-低)
start_time: 开始时间
end_time: 结束时间
remark: 备注

-- 各阶段详细信息
proposal_attachments: 方案附件(JSON)
proposal_upload_time: 方案上传时间
customer_approval_time: 客户确认时间
teacher_info: 师资信息(JSON)
teacher_confirm_time: 师资确认时间
approval_time: 审批时间
contract_sign_time: 合同签订时间
project_completion_time: 项目完成时间
payment_time: 收款时间
payment_amount: 收款金额

-- 项目状态
is_completed: 是否已完成
completion_time: 完成时间
is_archived: 是否已归档
archive_time: 归档时间
```

## 后端API设计

### 基础CRUD接口

- `GET /api/tasks` - 获取项目事项列表
- `GET /api/tasks/:id` - 获取项目事项详情
- `POST /api/tasks` - 创建项目事项
- `PUT /api/tasks/:id` - 更新项目事项
- `DELETE /api/tasks/:id` - 删除项目事项

### 特殊查询接口

- `GET /api/tasks/my` - 获取我的项目事项
- `GET /api/tasks/archived` - 获取历史项目列表
- `GET /api/tasks/statistics` - 获取项目统计信息

### 阶段操作接口

- `POST /api/tasks/upload-proposal` - 上传方案附件
- `POST /api/tasks/confirm-proposal` - 确认客户同意方案
- `POST /api/tasks/confirm-teacher` - 确认授课老师
- `POST /api/tasks/:id/approve` - 项目审批
- `POST /api/tasks/:id/confirm-contract` - 确认合同签订
- `POST /api/tasks/:id/confirm-completion` - 确认项目完成
- `POST /api/tasks/:id/confirm-payment` - 确认收款
- `POST /api/tasks/:id/archive` - 归档项目

## 前端界面设计

### 主要功能

1. **项目事项列表**
   - 显示所有项目事项
   - 支持按阶段、优先级、负责人筛选
   - 支持关键词搜索
   - 显示当前阶段和可执行操作

2. **创建/编辑项目事项**
   - 填写项目基础信息
   - 选择各角色人员
   - 设置时间和优先级

3. **项目详情查看**
   - 完整的项目信息展示
   - 阶段历史记录
   - 各阶段详细信息

4. **阶段操作**
   - 根据当前阶段和用户权限显示可用操作
   - 模态框形式进行具体操作

### 权限控制

- 只有对应角色的人员才能执行相应阶段的操作
- 负责人可以创建项目和确认收款
- 咨询部人员负责方案、师资、合同、项目进行
- 市场部经理负责项目审批

## 技术实现要点

### 后端

1. **控制器分离**
   - `taskController.ts` - 基础CRUD操作
   - `taskStageController.ts` - 阶段操作逻辑

2. **数据验证**
   - 使用express-validator进行参数验证
   - 阶段状态验证，确保操作合法性

3. **权限验证**
   - JWT认证中间件
   - 阶段操作权限检查

4. **阶段流程管理**
   - 阶段历史记录跟踪
   - 自动阶段推进逻辑

### 前端

1. **类型定义**
   - 完整的TypeScript类型定义
   - 枚举和常量定义

2. **状态管理**
   - React Hook状态管理
   - 表单状态处理

3. **界面组件**
   - Ant Design组件库
   - 响应式布局设计

4. **权限展示**
   - 根据用户角色动态显示操作按钮
   - 阶段状态可视化

## 部署和使用

### 数据库迁移

1. 更新Prisma schema
2. 运行数据库迁移
3. 更新现有数据（如需要）

### 后端部署

1. 安装新的依赖
2. 添加路由到主应用
3. 确保认证中间件正常工作

### 前端部署

1. 更新API类型定义
2. 替换现有事项列表组件
3. 测试各项功能

## 扩展性考虑

1. **阶段自定义**
   - 可配置的阶段流程
   - 动态阶段定义

2. **通知系统**
   - 阶段变更通知
   - 待办事项提醒

3. **报表统计**
   - 项目进度报表
   - 阶段效率分析

4. **附件管理**
   - 文件上传下载
   - 版本控制

这个实现提供了完整的项目事项管理功能，支持复杂的业务流程，同时保持了良好的扩展性和maintainability。 