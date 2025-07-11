const redis = require('redis');

// 创建客户端
const client = redis.createClient({
  url: 'redis://localhost:6379'
});

// 监听错误事件
client.on('error', err => console.error('Redis Client Error', err));

// 创建一个Promise，在连接成功时resolve
const ready = new Promise((resolve, reject) => {
  client.connect()
    .then(() => {
      console.log('Successfully connected to Redis.');
      resolve();
    })
    .catch(err => {
      console.error('Could not connect to Redis:', err);
      reject(err);
    });
});

// 导出客户端实例和连接就绪的Promise
module.exports = {
  client,
  ready
};
