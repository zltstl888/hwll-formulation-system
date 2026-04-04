#!/bin/bash
# VPS 后端部署脚本
# 用法: ssh root@76.13.185.230 "bash /root/hwll-formulation-system/backend/deploy.sh"

set -e

APP_DIR="/root/hwll-formulation-system/backend"
PM2_NAME="hwll-formulation"

echo "=== HWLL Formulation Backend 部署 ==="

cd $APP_DIR

echo "1. 安装依赖..."
npm install --omit=dev

echo "2. 编译 TypeScript..."
npx tsc

echo "3. 启动/重载 PM2..."
if pm2 list | grep -q "$PM2_NAME"; then
  pm2 reload $PM2_NAME
else
  pm2 start dist/server.js --name $PM2_NAME --env production
fi

pm2 save

echo "4. 健康检查..."
sleep 2
curl -sf http://localhost:5002/api/health && echo "" && echo "✅ 部署成功！"
