# 使用多阶段构建
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

# 首先安装所有依赖
RUN pnpm install --frozen-lockfile

# 安装额外的必要依赖
RUN pnpm add -w \
    @ant-design/icons \
    axios \
    classnames \
    @iconify/utils \
    @iconify/json \
    @types/classnames \
    lodash-es \
    @types/lodash-es \
    @dnd-kit/core@6.3.1 \
    @dnd-kit/sortable@10.0.0 \
    @dnd-kit/utilities@3.2.2

# 复制源代码和配置文件
COPY src/ ./src/
COPY public/ ./public/
COPY build/ ./build/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY uno.config.ts ./
COPY eslint.config.js ./

# 设置构建环境变量
ENV VITE_ICON_PREFIX=icon
ENV VITE_ICON_LOCAL_PREFIX=icon-local
ENV VITE_APP_TITLE=一品华信管理系统

# 构建前端
RUN pnpm run build

# 后端构建阶段
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端package.json和相关文件
COPY backend/package.json backend/package-lock.json ./

# 安装所有依赖，包括开发依赖
RUN npm ci

# 复制后端源码
COPY backend/ ./

# 生成Prisma客户端
RUN npx prisma generate

# 构建后端TypeScript代码
RUN npm run build

# 生产环境镜像
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache nginx supervisor postgresql-client

# 创建应用目录
WORKDIR /app

# 复制后端构建产物和依赖
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/package.json ./backend/package.json

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./frontend/dist

# 复制nginx配置
COPY deploy/nginx.conf /etc/nginx/nginx.conf

# 复制supervisor配置
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 复制启动脚本
COPY deploy/start.sh /start.sh
RUN chmod +x /start.sh

# 创建日志目录
RUN mkdir -p /var/log/supervisor /var/log/nginx

# 暴露端口
EXPOSE 80 3000

# 启动服务
CMD ["/start.sh"]
