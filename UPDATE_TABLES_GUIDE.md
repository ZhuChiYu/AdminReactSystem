# 表格样式统一更新指南

## 已完成的更新

✅ **已更新的文件：**
1. `src/pages/(base)/course-manage/attachments/index.tsx` - 课程附件管理
2. `src/pages/(base)/course-manage/list/index.tsx` - 课程列表管理  
3. `src/pages/(base)/employee-manage/list/index.tsx` - 员工列表管理
4. `src/pages/(base)/customer-manage/info/index.tsx` - 客户信息管理
5. `src/pages/(base)/meeting-manage/list/index.tsx` - 会议列表管理

✅ **创建的通用组件和工具：**
1. `src/utils/table.ts` - 表格配置工具函数
2. `src/styles/table.css` - 表格统一样式
3. `src/components/CommonTable.tsx` - 通用表格组件

## 需要更新的剩余文件

📋 **待更新的表格文件列表：**

### 管理模块
- `src/pages/(base)/manage/employee-manager/index.tsx`
- `src/pages/(base)/manage/permission/index.tsx`
- `src/pages/(base)/manage/customer-assign/index.tsx`
- `src/pages/(base)/manage/role/index.tsx`
- `src/pages/(base)/manage/user/index.tsx`

### 课程和班级管理
- `src/pages/(base)/course-manage/class/index.tsx`
- `src/pages/(base)/course-manage/class/detail/index.tsx`
- `src/pages/(base)/course-manage/category/index.tsx`
- `src/pages/(base)/class-manage/list/index.tsx`
- `src/pages/(base)/class-manage/detail/index.tsx`

### 客户管理
- `src/pages/(base)/customer-manage/assign/index.tsx`
- `src/pages/(base)/customer-manage/follow/index.tsx`
- `src/pages/(base)/customer-manage/import/index.tsx`

### 会议管理
- `src/pages/(base)/meeting-manage/approve/index.tsx`
- `src/pages/(base)/meeting-manage/summary/index.tsx`

### 费用和项目管理
- `src/pages/(base)/expense-process/apply/index.tsx`
- `src/pages/(base)/expense-process/approve/index.tsx`
- `src/pages/(base)/project-manage/list/index.tsx`
- `src/pages/(base)/project-manage/task/index.tsx`
- `src/pages/(base)/project-manage/weekly-task/index.tsx`
- `src/pages/(base)/project-manage/monthly-task/index.tsx`

### 财务报表
- `src/pages/(base)/finance-dashboard/index.tsx`

## 更新步骤

### 方法一：使用通用组件（推荐）

对于每个表格文件，进行以下更改：

1. **导入通用组件：**
```tsx
import CommonTable from '@/components/CommonTable';
```

2. **替换 Table 组件：**
```tsx
// 原来的代码
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  pagination={...}
/>

// 修改为
<CommonTable
  columns={columns}
  dataSource={data}
  rowKey="id"
/>
```

3. **为操作列添加固定配置：**
```tsx
import { getActionColumnConfig } from '@/utils/table';

// 在操作列定义中添加
{
  title: '操作',
  key: 'action',
  ...getActionColumnConfig(120), // 宽度可自定义
  render: (_, record) => (
    // 操作按钮
  )
}
```

### 方法二：使用工具函数

1. **导入工具函数：**
```tsx
import { getCenterColumnConfig, getActionColumnConfig, getFullTableConfig } from '@/utils/table';
```

2. **为普通列添加居中：**
```tsx
{
  title: '列名',
  dataIndex: 'field',
  ...getCenterColumnConfig(),
}
```

3. **为操作列添加固定：**
```tsx
{
  title: '操作',
  key: 'action',
  ...getActionColumnConfig(120),
  render: ...
}
```

4. **使用统一表格配置：**
```tsx
<Table
  {...getFullTableConfig(10)}
  columns={columns}
  dataSource={data}
  rowKey="id"
/>
```

## 样式效果

通过这些更改，所有表格将获得：

✅ **内容居中对齐：** 所有单元格内容水平和垂直居中
✅ **操作列固定：** 操作列固定在表格右侧，不会随横向滚动消失
✅ **统一分页：** 标准化的分页配置和显示格式
✅ **响应式滚动：** 表格在小屏幕上支持横向滚动
✅ **一致的视觉体验：** 所有表格具有统一的外观和交互

## 注意事项

1. **导入路径：** 确保正确导入工具函数和组件
2. **类型安全：** 保持 TypeScript 类型定义的正确性
3. **现有功能：** 不要破坏表格的现有业务逻辑
4. **测试验证：** 更新后测试表格的功能是否正常

## 批量更新脚本

可以创建一个批量更新脚本来自动化这个过程：

```bash
# 查找所有包含表格的文件
find src/pages -name "*.tsx" -exec grep -l "columns.*=" {} \;

# 使用 sed 进行批量替换（需要根据具体情况调整）
# 这只是示例，实际使用时需要更精确的正则表达式
```

## 完成检查清单

- [ ] 所有表格内容居中显示
- [ ] 操作列固定在右侧
- [ ] 分页配置统一
- [ ] 响应式横向滚动
- [ ] 无控制台错误
- [ ] 功能测试通过 