#!/bin/bash

# ============================================================
# 车辆出租平台 - 本地开发启动脚本
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   车辆出租平台 - 本地开发启动${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 加载环境变量
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
else
    echo -e "${RED}错误: .env 文件不存在${NC}"
    exit 1
fi

echo -e "${GREEN}[1/2] 启动 MySQL 和 Redis 容器...${NC}"
docker-compose up -d mysql redis

echo ""
echo -e "${GREEN}[2/2] 启动后端服务...${NC}"
echo -e "${YELLOW}后端将在 http://127.0.0.1:${BACKEND_DOCKER_PORT} 运行${NC}"

# 在后台启动后端（需要先编译）
cd backend
if [ ! -f "target/car-rental-platform-1.0.0.jar" ]; then
    echo -e "${YELLOW}编译后端项目...${NC}"
    mvn clean package -DskipTests
fi

java -jar target/car-rental-platform-1.0.0.jar &
BACKEND_PID=$!

cd ..

# 等待后端启动
echo ""
echo -e "${YELLOW}等待后端启动...${NC}"
for i in {1..30}; do
    if curl -s http://127.0.0.1:${BACKEND_DOCKER_PORT}/api/vehicles > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# 启动前端
echo ""
echo -e "${GREEN}启动前端开发服务器...${NC}"
echo -e "${YELLOW}前端将在 http://127.0.0.1:${FRONTEND_PORT} 运行${NC}"

cd frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   本地开发服务已启动！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo -e "  前端: http://127.0.0.1:${FRONTEND_PORT}"
echo -e "  后端: http://127.0.0.1:${BACKEND_DOCKER_PORT}"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose stop; exit 0" INT TERM

wait
