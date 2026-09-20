#!/bin/bash
# 重建/新建 codespace 后自动恢复开发环境
# 由 .devcontainer/devcontainer.json 的 postCreateCommand 调用
set -u

YM_DIR=/workspaces/ym
YM_REPO=https://github.com/qier222/YesPlayMusic.git

echo "=== [1/4] 加载 nvm 并安装 node 16 ==="
export NVM_DIR=/usr/local/share/nvm
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 16

echo "=== [2/4] 克隆 ym (YesPlayMusic) ==="
if [ ! -d "$YM_DIR/.git" ]; then
  git clone "$YM_REPO" "$YM_DIR"
else
  echo "已存在，跳过克隆：$YM_DIR"
fi

echo "=== [3/4] 应用备份的本地改动 ==="
# .env.development
if [ -f /workspaces/music/backup/ym/env.development ]; then
  cp /workspaces/music/backup/ym/env.development "$YM_DIR/.env.development"
  echo "已恢复 .env.development"
fi

# Player.js 补丁
PATCH=/workspaces/music/backup/ym/Player.js.patch
if [ -f "$PATCH" ]; then
  if git -C "$YM_DIR" apply --check "$PATCH" 2>/dev/null; then
    git -C "$YM_DIR" apply "$PATCH"
    echo "已应用 Player.js 补丁"
  else
    echo "补丁未应用（可能已应用过或冲突），请手动检查"
  fi
fi

echo "=== [4/4] 安装依赖 (node 16) ==="
cd "$YM_DIR"
nvm use 16
yarn install

echo
echo "环境恢复完成。启动服务： cd /workspaces/music && python3 run_server.py"
