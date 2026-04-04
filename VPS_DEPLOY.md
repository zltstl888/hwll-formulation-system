# VPS 后端部署指南

## 切新加坡节点后，执行以下命令

### 一、首次部署（SSH 到 VPS 执行）

```bash
ssh root@76.13.185.230

# 在 VPS 上执行:
cd /root
git clone https://github.com/zltstl888/hwll-formulation-system.git
cd hwll-formulation-system/backend
npm install
npx tsc

# 确认 /tmp/hwll-uploads 目录存在
mkdir -p /tmp/hwll-uploads

# PM2 启动
pm2 start dist/server.js --name hwll-formulation
pm2 save

# 健康检查
curl http://localhost:5002/api/health
```

### 二、开放 5002 端口（如未开放）

```bash
ufw allow 5002/tcp
# 或者 iptables:
iptables -A INPUT -p tcp --dport 5002 -j ACCEPT
```

### 三、后续更新部署

```bash
cd /root/hwll-formulation-system
git pull
cd backend
npm install
npx tsc
pm2 reload hwll-formulation
curl http://localhost:5002/api/health
```

### 四、确认部署成功

访问: http://76.13.185.230:5002/api/health

应返回:
```json
{"status":"ok","version":"1.0.0","service":"hwll-formulation-api"}
```

---

前端访问地址（GitHub Pages，1-2分钟生效）：
https://zltstl888.github.io/hwll-formulation-system/
