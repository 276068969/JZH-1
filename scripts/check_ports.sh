#!/bin/bash

# ============================================================
# 车辆出租平台 - 验证脚本
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   端口冲突检查脚本${NC}"
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

check_port_conflict() {
    local port=$1
    local name=$2

    echo -e "${YELLOW}检查端口 $port ($name)...${NC}"

    # 使用 PowerShell 检查端口占用
    if command -v powershell > /dev/null; then
        local result=$(powershell -Command "Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess" 2>/dev/null || echo "")

        if [ -n "$result" ]; then
            echo -e "${RED}✗ 端口 $port 已被占用！${NC}"
            echo -e "${YELLOW}占用进程 PID: $result${NC}"

            # 获取进程名称
            local process_name=$(powershell -Command "(Get-Process -Id $result -ErrorAction SilentlyContinue).ProcessName" 2>/dev/null || echo "未知")
            echo -e "${YELLOW}进程名称: $process_name${NC}"

            return 1
        else
            echo -e "${GREEN}✓ 端口 $port 可用${NC}"
        fi
    else
        # 备选方案：使用 netstat
        if netstat -an 2>/dev/null | grep -q ":$port.*LISTEN"; then
            echo -e "${RED}✗ 端口 $port 已被占用！${NC}"
            return 1
        else
            echo -e "${GREEN}✓ 端口 $port 可用${NC}"
        fi
    fi

    echo ""
    return 0
}

echo -e "${GREEN}开始检查端口冲突...${NC}"
echo ""

FAILED=0

check_port_conflict $FRONTEND_PORT "前端" || FAILED=1
check_port_conflict $BACKEND_DOCKER_PORT "后端" || FAILED=1
check_port_conflict $MYSQL_PORT "MySQL" || FAILED=1
check_port_conflict $REDIS_PORT "Redis" || FAILED=1
check_port_conflict $NGINX_PORT "Nginx" || FAILED=1

if [ $FAILED -eq 1 ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}   端口冲突检查失败！${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   所有端口检查通过！${NC}"
echo -e "${GREEN}========================================${NC}"
exit 0
