# API 模式切换说明

本项目支持动态切换 API 基础地址，方便在本地开发和内网穿透之间切换。

## 使用方法

### 快速命令

```bash
# 切换到本地模式 (默认: http://localhost:3000/api)
pnpm api:local

# 切换到内网穿透模式 (http://111.230.110.95:8080/api)
pnpm api:remote

# 查看当前模式
pnpm api:switch
```

### 工作原理

系统通过环境变量 `VITE_USE_REMOTE_API` 来控制API地址：

- `VITE_USE_REMOTE_API=N` → 本地模式
- `VITE_USE_REMOTE_API=Y` → 内网穿透模式

### 环境变量配置

在 `.env` 文件中的相关配置：

```env
# API客户端配置
VITE_API_BASE_URL=http://localhost:3000/api          # 本地API地址
VITE_USE_REMOTE_API=N                                # 是否使用内网穿透
VITE_REMOTE_API_BASE_URL=http://111.230.110.95:8080/api  # 内网穿透API地址
```

### 使用场景

1. **本地开发**: 使用 `pnpm api:local`，连接本地后端服务
2. **远程调试**: 使用 `pnpm api:remote`，通过内网穿透连接远程服务器
3. **团队协作**: 不同开发者可以根据需要快速切换API目标

### 注意事项

- 切换模式后需要重启开发服务器 (`pnpm dev`) 才能生效
- 在浏览器控制台可以看到当前使用的API地址和模式
- 代理配置 (`VITE_HTTP_PROXY=Y`) 同时生效，可以避免CORS问题

### 自定义配置

如需修改内网穿透地址，请编辑 `.env` 文件中的 `VITE_REMOTE_API_BASE_URL` 变量。
