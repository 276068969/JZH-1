# ============================================================
# 后端构建阶段 - 使用 Maven 多阶段构建
# ============================================================
FROM ${DOCKER_REGISTRY}/maven:3.8.6-openjdk-17 AS builder

# 设置 Maven 镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

# 复制 pom.xml（利用 Docker 层缓存）
COPY pom.xml ./

# 创建 .m2 目录并配置镜像
RUN mkdir -p ~/.m2 && \
    echo '<?xml version="1.0" encoding="UTF-8"?>' > ~/.m2/settings.xml && \
    echo '<settings>' >> ~/.m2/settings.xml && \
    echo '  <mirrors>' >> ~/.m2/settings.xml && \
    echo '    <mirror>' >> ~/.m2/settings.xml && \
    echo '      <id>aliyun</id>' >> ~/.m2/settings.xml && \
    echo '      <mirrorOf>central</mirrorOf>' >> ~/.m2/settings.xml && \
    echo '      <name>Aliyun Maven</name>' >> ~/.m2/settings.xml && \
    echo '      <url>https://maven.aliyun.com/repository/public</url>' >> ~/.m2/settings.xml && \
    echo '    </mirror>' >> ~/.m2/settings.xml && \
    echo '  </mirrors>' >> ~/.m2/settings.xml && \
    echo '</settings>' >> ~/.m2/settings.xml

# 下载依赖（如果 pom.xml 未变则复用缓存）
RUN mvn dependency:go-offline -B || true

# 复制源代码
COPY src ./src

# 构建项目（跳过测试以加速）
RUN mvn clean package -DskipTests -B

# ============================================================
# 运行时阶段
# ============================================================
FROM ${DOCKER_REGISTRY}/openjdk:17-slim

WORKDIR /app

# 只复制 jar 文件
COPY --from=builder /app/target/*.jar app.jar

# 添加健康检查脚本
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 添加启动脚本
RUN echo '#!/bin/bash\n' \
    'echo "Waiting for MySQL..."\n' \
    'while ! curl -s http://mysql:3306 > /dev/null 2>&1; do\n' \
    '    sleep 2\n' \
    'done\n' \
    'echo "MySQL is ready!"\n' \
    'exec java -jar app.jar\n' > /start.sh && \
    chmod +x /start.sh

EXPOSE 8080

ENTRYPOINT ["/start.sh"]
