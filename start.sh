#!/bin/bash
# 一键启动全部服务（readme 笔记中记录的入口名，等价于 run_server.py）
#
#   3000  @neteaseapireborn/api   网易云 API
#   3001  cdn-proxy.js            CDN 中转
#   8080  vue-cli-service serve   播放器前端
#
# 用法：bash /workspaces/music/start.sh
set -u
cd "$(dirname "$0")"

# ---- 前置检查 ----
if [ ! -d /workspaces/ym ]; then
  echo "❌ /workspaces/ym 不存在，请先执行：bash .devcontainer/setup.sh"
  exit 1
fi

echo "=== 启动服务 ==="
bash ./run_server.py

# ---- 等待并检查端口 ----
echo
echo "=== 等待服务就绪 ==="
declare -A NAMES=([3000]="Netease API" [3001]="CDN Proxy" [8080]="YesPlayMusic")
FAILED=0
for port in 3000 3001 8080; do
  ok=""
  for _ in $(seq 1 30); do
    if curl -s -o /dev/null -m 1 "http://localhost:${port}/" 2>/dev/null; then
      ok=1; break
    fi
    sleep 1
  done
  if [ -n "$ok" ]; then
    echo "  :${port} OK   ${NAMES[$port]}"
  else
    echo "  :${port} FAIL ${NAMES[$port]}  (日志见 /tmp)"
    FAILED=1
  fi
done

echo
if [ "$FAILED" -eq 0 ]; then
  echo "✅ 全部启动成功，浏览器打开 http://localhost:8080/"
else
  echo "⚠️  部分服务未就绪，请检查日志："
  echo "     /tmp/api.log  /tmp/cdn-proxy.log  /tmp/player.log"
fi
