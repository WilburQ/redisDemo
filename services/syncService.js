const cron = require('node-cron');
const { client: redisClient } = require('./redisClient');
const { Product, Like, sequelize } = require('../models');

// 同步Redis中的点赞数据到MySQL
async function syncLikesToDB() {
  console.log('开始同步点赞数据...');
  const updatedProducts = await redisClient.sMembers('likes_updated');

  if (!updatedProducts || updatedProducts.length === 0) {
    console.log('没有需要同步的点赞数据。');
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    for (const productId of updatedProducts) {
      const redisKey = `product:${productId}:likes`;
      const likedUsers = await redisClient.sMembers(redisKey);
      
      if (!likedUsers || likedUsers.length === 0) {
        continue;
      }

      // 准备批量插入的数据
      const likesToCreate = likedUsers.map(userId => ({
        productId: parseInt(productId, 10),
        userId: userId
      }));

      // 批量创建点赞记录，忽略已存在的记录
      await Like.bulkCreate(likesToCreate, {
        ignoreDuplicates: true,
        transaction
      });

      // 更新商品表中的总点赞数
      const totalLikes = await Like.count({ where: { productId }, transaction });
      await Product.update({ likes: totalLikes }, { where: { id: productId }, transaction });

      // 从 likes_updated 集合中移除已处理的 productId
      await redisClient.sRem('likes_updated', productId);
    }

    await transaction.commit();
    console.log('点赞数据同步成功！');
  } catch (error) {
    await transaction.rollback();
    console.error('点赞数据同步失败:', error);
  }
}

// 设置定时任务，例如每分钟执行一次
function startSync() {
  // 为了演示，设置为每10秒执行一次。在生产环境中，可以设置为 '*/1 * * * *' (每分钟)
  cron.schedule('*/10 * * * * *', syncLikesToDB);
  console.log('定时同步服务已启动，每10秒执行一次。');
}

module.exports = {
  startSync,
  syncLikesToDB
};
