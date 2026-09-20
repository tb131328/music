# Codespace 重建与恢复

本仓库用于在 GitHub Codespaces 中运行 YesPlayMusic + 网易云 API + CDN 代理。

## 运行的服务

| 端口 | 服务 | 启动方式 |
|---|---|---|
| 3000 | NeteaseCloudMusicApi (`@neteaseapireborn/api`) | `run_server.py` |
| 3001 | CDN 代理 (`cdn-proxy.js`) | `run_server.py` |
| 8080 | YesPlayMusic 前端 (`vue-cli-service serve`) | `run_server.py` |

一键启动：

```bash
cd /workspaces/music && ./run_server.py
```

日志：`/tmp/cdn-proxy.log`、`/tmp/api.log`、`/tmp/player.log`

## 为什么需要重建

`idle_timeout_minutes` **只能在创建 codespace 时设定**，且个人默认超时设置只对**新建**的 codespace 生效。
已存在的 codespace 会永久保留创建时的值，`PATCH /user/codespaces/{name}` 也不支持修改该字段。
因此要把 30 分钟改为 240 分钟，**必须重建**。

## 依赖的路径（都在工作区外，重建会丢失）

- `/workspaces/ym` — YesPlayMusic 源码，克隆自 `https://github.com/qier222/YesPlayMusic.git`
  （上游官方仓库，**无 push 权限**，本地改动没有远程备份）
- `/workspaces/ym/node_modules/@neteaseapireborn/api` — 网易云 API，由 `yarn install` 安装

## 恢复流程

重建后由 `.devcontainer/setup.sh` 自动完成（`postCreateCommand`）：
切换 node 16 → 克隆 `/workspaces/ym` → 应用 `backup/` 下的改动 → `yarn install`。

手动执行同样内容：

```bash
bash /workspaces/music/.devcontainer/setup.sh
```

## backup/ 目录说明

| 文件 | 说明 |
|---|---|
| `ym/Player.js.patch` | `/workspaces/ym/src/utils/Player.js` 的本地改动（补丁格式） |
| `ym/env.development` | `/workspaces/ym/.env.development`，内容 `VUE_APP_NETEASE_API_URL=http://localhost:3000` |

手动应用补丁：

```bash
git -C /workspaces/ym apply /workspaces/music/backup/ym/Player.js.patch
```

> **注意**：`Player.js.patch` 新增的 `cdnProxy` 函数在项目中**仅定义、未被调用**，属于无效代码。
> 保留仅为还原原始状态，如需清理可直接删除该补丁并在 `postCreateCommand` 中去掉对应步骤。

## 重建步骤（安全方式：先建后删）

```bash
# 1. 确认改动已推送
cd /workspaces/music && git status

# 2. 新建 codespace（旧的保持运行，随时可退回）
gh codespace create -R rj-chenyangjian/music --idle-timeout 240m

# 3. 在新 codespace 中验证
bash /workspaces/music/.devcontainer/setup.sh
cd /workspaces/music && ./run_server.py

# 4. 验证通过后删除旧的
gh codespace list
gh codespace delete -c <旧 codespace 名称>
```

## 空闲超时判定

以下任一活动会重置空闲计时：

- 键盘 / 鼠标交互
- **终端有输入或输出**（后台进程静默运行**不算**活动）

若服务后台运行且日志不再输出，仍会被判定为空闲并停止。可在 `run_server.py` 中加定时心跳输出保持活跃。
