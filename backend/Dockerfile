# ============================================================
# 后端构建阶段 - 使用 Maven 多阶段构建
# ============================================================
ARG DOCKER_REGISTRY=docker.io/library
FROM ${DOCKER_REGISTRY}/maven:3.8.6-openjdk-17 AS builder

# 仅在 Alpine 基础镜像下替换 apk 源；当前 Maven 镜像可能并不提供该文件
RUN if [ -f /etc/apk/repositories ]; then sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories; fi

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

# 为健康检查安装 curl，兼容不同基础镜像的包管理器
RUN if command -v apt-get >/dev/null 2>&1; then \
        apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*; \
    elif command -v apk >/dev/null 2>&1; then \
        apk add --no-cache curl; \
    elif command -v microdnf >/dev/null 2>&1; then \
        microdnf install -y curl && microdnf clean all; \
    else \
        echo "No supported package manager found to install curl" && exit 1; \
    fi

# 添加启动脚本
RUN printf '#!/bin/sh\nexec java -jar app.jar\n' > /start.sh && \
    chmod +x /start.sh

EXPOSE 8080

ENTRYPOINT ["/start.sh"]
