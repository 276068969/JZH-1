# 车辆出租平台

多种车辆出租的平台，支持电动车、轿车、SUV、跑车等多种车型。

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design - UI组件库
- Axios - HTTP请求
- React Router - 路由管理
- Leaflet - 地图服务
- Vite - 构建工具

### 后端
- Spring Boot 2.7
- Spring Security + JWT
- MySQL 8.0 - 主数据库
- Redis - 缓存和会话
- MyBatis Plus - ORM框架
- Maven - 项目构建

### 算法与智能调度
- 价格动态调整算法 - 基于供需关系
- 车辆推荐算法 - 基于协同过滤
- 订单分配算法 - 最小化等待时间
- 路径优化算法 - 基于Dijkstra

### 部署
- Docker + Docker Compose
- Nginx - 反向代理

## 项目结构

```
car-rental-platform/
├── .env                      # 全局环境配置
├── docker-compose.yml        # Docker Compose 配置
├── README.md                 # 项目文档
├── scripts/                  # 构建脚本
│   ├── build.sh             # Docker 构建脚本
│   ├── start.sh             # 启动脚本
│   ├── stop.sh              # 停止脚本
│   ├── dev.sh               # 本地开发脚本
│   └── check_ports.sh       # 端口检查脚本
├── frontend/                 # 前端项目
│   ├── Dockerfile           # 前端 Docker 镜像
│   ├── nginx.conf           # Nginx 配置
│   ├── vite.config.ts       # Vite 配置
│   └── src/                 # 前端源代码
├── backend/                  # 后端项目
│   ├── Dockerfile           # 后端 Docker 镜像
│   ├── pom.xml              # Maven 配置
│   └── src/                 # 后端源代码
├── nginx/                    # Nginx 配置
│   └── nginx.conf
└── database/                  # 数据库脚本
    └── init.sql
```

## 端口配置

所有端口统一在 `.env` 文件中管理：

| 服务       | 端口  | 说明           |
| ---------- | ----- | -------------- |
| 前端       | 3008  | Vite 开发服务器 |
| 后端       | 8088  | Spring Boot    |
| MySQL      | 3309  | 数据库         |
| Redis      | 6380  | 缓存服务       |
| Nginx      | 3080  | 反向代理       |

## 快速开始

### 方式一：Docker 部署（推荐）

1. 检查端口占用
```bash
./scripts/check_ports.sh
```

2. 构建并启动
```bash
./scripts/build.sh
```

3. 访问应用
- 前端：http://localhost:3008
- Nginx：http://localhost:3080

### 方式二：本地开发

1. 安装依赖
```bash
# 前端
cd frontend
npm install

# 后端（需要 Maven 和 JDK 17）
cd backend
mvn clean install
```

2. 启动 MySQL 和 Redis
```bash
docker-compose up -d mysql redis
```

3. 启动后端
```bash
cd backend
mvn spring-boot:run
```

4. 启动前端
```bash
cd frontend
npm run dev
```

### 方式三：本地完整启动脚本

```bash
./scripts/dev.sh
```

## 管理命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建（不重新下载依赖）
docker-compose up -d

# 完全重新构建
docker-compose build --no-cache
docker-compose up -d
```

## 环境变量说明

`.env` 文件包含以下配置：

### 镜像源配置
- `DOCKER_REGISTRY` - Docker 镜像仓库地址
- `NPM_REGISTRY` - npm 镜像源
- `MAVEN_REPO` - Maven 镜像源

### 端口配置
- `FRONTEND_PORT` - 前端端口
- `BACKEND_DOCKER_PORT` - 后端 Docker 端口
- `MYSQL_PORT` - MySQL 端口
- `REDIS_PORT` - Redis 端口
- `NGINX_PORT` - Nginx 端口

### 数据库配置
- `MYSQL_ROOT_PASSWORD` - MySQL root 密码
- `MYSQL_DATABASE` - 数据库名称
- `MYSQL_USER` - 数据库用户
- `MYSQL_PASSWORD` - 数据库密码

### Redis 配置
- `REDIS_PASSWORD` - Redis 密码

### JWT 配置
- `JWT_SECRET` - JWT 密钥
- `JWT_EXPIRATION` - JWT 过期时间

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 车辆接口
- `GET /api/vehicles` - 获取车辆列表
- `GET /api/vehicles/{id}` - 获取车辆详情
- `GET /api/vehicles/locations` - 获取车辆位置
- `GET /api/vehicles/search` - 搜索车辆

### 订单接口
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取用户订单
- `DELETE /api/orders/{id}` - 取消订单

## 功能特性

1. **用户模块**
   - 用户注册/登录
   - JWT 认证
   - 个人中心

2. **车辆管理**
   - 车辆列表展示
   - 车辆详情查看
   - 地图位置展示
   - 车辆类型筛选

3. **订单管理**
   - 在线预订
   - 订单列表
   - 订单取消

4. **智能推荐**
   - 基于用户行为的车辆推荐
   - 价格动态调整

## 测试账号

- 用户名：admin
- 密码：admin123

## 注意事项

1. 首次构建会下载所有依赖，请耐心等待
2. 后续构建会利用 Docker 缓存加速
3. 如遇端口冲突，请检查 `.env` 文件中的端口配置
4. 数据库会自动初始化，无需手动创建

## License

MIT License
