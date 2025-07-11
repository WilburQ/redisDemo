const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const { ready: redisReady } = require('./services/redisClient'); // Import the ready promise
const { startSync } = require('./services/syncService');
const productRoutes = require('./routes/productRoutes');
const likeRoutes = require('./routes/leaderboardRoutes'); 

const app = express();
const port = 3000;

app.use(bodyParser.json());

// 注册路由
app.use('/api', productRoutes);
app.use('/api', likeRoutes); // Assuming leaderboardRoutes contains like/unlike endpoints

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 等待Redis连接就绪
    await redisReady;
    console.log('Redis is ready.');

    // 同步所有模型
    await db.sequelize.sync({ force: true }); // Use { force: true } only in dev to drop and recreate tables
    console.log('Database synced!');

    // 创建一些初始数据
    const productsCount = await db.Product.count();
    if (productsCount === 0) {
      await db.Product.bulkCreate([
        { name: 'Apple iPhone 15', price: 6999, likes: 0 },
        { name: 'Xiaomi TV', price: 2999, likes: 0 },
        { name: 'Dyson Vacuum', price: 3999, likes: 0 },
        { name: 'Nintendo Switch', price: 2099, likes: 0 },
        { name: 'Sony WH-1000XM5', price: 2599, likes: 0 },
      ]);
      console.log('Initial products created.');
    }

    // 启动定时同步服务
    startSync();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start the server:', error);
  }
}

startServer();
