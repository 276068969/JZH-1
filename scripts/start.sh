#!/bin/bash

# ============================================================
# 车辆出租平台 - 启动脚本
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   车辆出租平台 - 启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 加载环境变量
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo -e "${GREEN}✓ 已加载 .env 配置${NC}"
else
    echo -e "${RED}错误: .env 文件不存在${NC}"
    exit 1
fi

# 检查端口占用
echo ""
echo -e "${YELLOW}检查端口占用...${NC}"

check_and_fail_port() {
    local port=$1
    local name=$2

    if lsof -nP -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
        echo -e "${RED}错误: 端口 $port ($name) 已被占用${NC}"
        echo -e "${YELLOW}请先关闭占用端口的程序，或修改 .env 中的端口配置${NC}"
        exit 1
    fi
}

check_and_fail_port $FRONTEND_PORT "前端"
check_and_fail_port $BACKEND_DOCKER_PORT "后端"
check_and_fail_port $MYSQL_PORT "MySQL"
check_and_fail_port $REDIS_PORT "Redis"
check_and_fail_port $NGINX_PORT "Nginx"

echo -e "${GREEN}✓ 所有端口可用${NC}"

# 启动服务
echo ""
echo -e "${GREEN}启动 Docker 服务...${NC}"
docker-compose up -d

# 等待服务启动
echo ""
echo -e "${YELLOW}等待服务启动（10秒）...${NC}"
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""

# 检查容器状态
echo ""
echo -e "${GREEN}容器状态:${NC}"
docker-compose ps

# 输出访问信息
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   服务已启动！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo -e "  前端: http://localhost:${FRONTEND_PORT}"
echo -e "  后端: http://localhost:${BACKEND_DOCKER_PORT}"
echo -e "  Nginx: http://localhost:${NGINX_PORT}"
echo ""
echo -e "${YELLOW}管理命令:${NC}"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
