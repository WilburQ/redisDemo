const express = require('express');
const app = express();
app.use(express.json());

// 路由统一导出
const routes = require('./routes');

// Redis连接和服务启动
const client = require('./services/redisClient');
const start = async () => {
  await client.connect();
  app.use(routes);
  app.listen(3000, () => {
    console.log('Product cache & leaderboard app running on port 3000');
  });
};

start();
