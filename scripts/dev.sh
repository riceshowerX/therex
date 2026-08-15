#!/bin/bash
set -Eeuo pipefail

PORT=5000
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
NODE_ENV=development
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-${PORT}}"

cd "${COZE_WORKSPACE_PATH}"

# 跨平台检测端口占用（P1-11）：
# - Windows Git Bash / cmd 环境：netstat -ano
# - Linux：ss 或 netstat
# 为避免误杀与本项目无关的进程，默认只提示，不再自动 kill -9。
check_port_in_use() {
    local port="$1"
    if command -v netstat >/dev/null 2>&1; then
        netstat -ano 2>/dev/null | grep -E "[:.]${port}\b" | grep -i listen | awk '{print $NF}' | sort -u
    elif command -v ss >/dev/null 2>&1; then
        ss -H -lntp 2>/dev/null | awk -v port=":${port}" '$4 ~ port {print}' | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u
    fi
}

existing_pids=$(check_port_in_use "$DEPLOY_RUN_PORT")
if [[ -n "$existing_pids" ]]; then
    echo "警告: 端口 ${DEPLOY_RUN_PORT} 已被以下进程占用 (PID: ${existing_pids})。"
    echo "为避免误杀无关进程，脚本不会自动结束这些进程。"
    echo "请手动处理占用进程，或设置 DEPLOY_RUN_PORT 使用其他端口后重试。"
    echo "继续启动可能会失败；若启动失败请先释放端口。"
else
    echo "端口 ${DEPLOY_RUN_PORT} 未被占用。"
fi

echo "Starting HTTP service on port ${PORT} for dev..."

# 使用 pnpm exec 确保使用项目安装的 Next.js 版本
pnpm exec next dev --port $PORT
