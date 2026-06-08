#!/bin/bash

# ============================================================
# 车辆出租平台 - Docker 构建脚本
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   车辆出租平台 - Docker 构建脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}错误: Docker 未运行，请先启动 Docker Desktop${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: .env 文件不存在${NC}"
    exit 1
fi

# 加载环境变量
set -a
source .env
set +a

echo -e "${GREEN}[1/4] 检查端口占用...${NC}"
check_port() {
    local port=$1
    local name=$2
    if lsof -nP -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
        echo -e "${RED}错误: 端口 $port ($name) 已被占用${NC}"
        echo -e "${YELLOW}占用端口的进程:${NC}"
        lsof -nP -iTCP:$port -sTCP:LISTEN
        exit 1
    fi
    echo -e "${GREEN}✓ 端口 $port ($name) 可用${NC}"
}

check_port $FRONTEND_PORT "前端"
check_port $BACKEND_DOCKER_PORT "后端"
check_port $MYSQL_PORT "MySQL"
check_port $REDIS_PORT "Redis"
check_port $NGINX_PORT "Nginx"

echo ""
echo -e "${GREEN}[2/4] 拉取基础镜像...${NC}"
docker pull ${DOCKER_REGISTRY}/mysql:8.0 || true
docker pull ${DOCKER_REGISTRY}/redis:7-alpine || true
docker pull ${DOCKER_REGISTRY}/node:18-alpine || true
docker pull ${DOCKER_REGISTRY}/maven:3.8.6-openjdk-17 || true
docker pull ${DOCKER_REGISTRY}/nginx:alpine || true
docker pull ${DOCKER_REGISTRY}/openjdk:17-slim || true

echo ""
echo -e "${GREEN}[3/4] 构建 Docker 镜像...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${GREEN}[4/4] 启动容器...${NC}"
docker-compose up -d

# 等待服务启动
echo ""
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 检查容器状态
echo ""
echo -e "${GREEN}[检查] 容器状态:${NC}"
docker-compose ps

# 输出访问信息
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   构建成功！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}前端访问地址:${NC}"
echo -e "  http://127.0.0.1:${FRONTEND_PORT}"
echo -e "  http://localhost:${FRONTEND_PORT}"
echo ""
echo -e "${YELLOW}后端 API 地址:${NC}"
echo -e "  http://127.0.0.1:${BACKEND_DOCKER_PORT}"
echo ""
echo -e "${YELLOW}Nginx 反向代理:${NC}"
echo -e "  http://127.0.0.1:${NGINX_PORT}"
echo ""
echo -e "${YELLOW}服务状态检查:${NC}"
echo -e "  MySQL: 127.0.0.1:${MYSQL_PORT}"
echo -e "  Redis: 127.0.0.1:${REDIS_PORT}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "  查看日志: docker-compose logs -f"
echo -e "  停止服务: docker-compose down"
echo -e "  重新构建: docker-compose up --build -d"
echo -e "${BLUE}========================================${NC}"
