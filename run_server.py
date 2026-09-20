#!/bin/bash
pkill -f "cdn-proxy.js" 2>/dev/null; pkill -f "NeteaseCloudMusicApi" 2>/dev/null; pkill -f "vue-cli-service" 2>/dev/null; sleep 1
nohup node /workspaces/music/cdn-proxy.js > /tmp/cdn-proxy.log 2>&1 &
nohup bash -c "source /usr/local/share/nvm/nvm.sh && nvm use 16 && cd /workspaces/ym/node_modules/@neteaseapireborn/api && node app.js" > /tmp/api.log 2>&1 &
sleep 2
nohup bash -c "source /usr/local/share/nvm/nvm.sh && nvm use 16 && cd /workspaces/ym && yarn serve" > /tmp/player.log 2>&1 &
sleep 5

ps aux | grep -E "(cdn-proxy|NeteaseCloudMusicApi|vue-cli)" | grep -v grep

