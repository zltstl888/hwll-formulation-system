FROM node:20-slim

# 安装 pdftotext (poppler-utils)
RUN apt-get update && apt-get install -y poppler-utils && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
