# ============================================================
# 前端构建阶段 - 使用多阶段构建优化缓存
# ============================================================
ARG DOCKER_REGISTRY=docker.io/library
FROM ${DOCKER_REGISTRY}/node:18-alpine AS builder

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

# 复制依赖文件（利用 Docker 层缓存）
COPY package.json package-lock.json* ./

# 安装依赖（如果 package-lock.json 未变则复用缓存）
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# ============================================================
# Nginx 运行阶段
# ============================================================
FROM ${DOCKER_REGISTRY}/nginx:alpine

# 移除默认配置
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# 从构建阶段复制静态文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
