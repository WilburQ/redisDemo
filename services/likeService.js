const { client: redisClient } = require('./redisClient');
const { getProductById } = require('./productService');

// 用户点赞商品
async function likeProduct(productId, userId) {
  // 1. 检查商品是否存在
  const product = await getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const redisKey = `product:${productId}:likes`;
  
  // 2. 将用户ID添加到对应商品的点赞集合中
  const added = await redisClient.sAdd(redisKey, userId.toString());

  if (added) {
    // 3. 如果是新的点赞，增加热门商品排行榜的分数
    await redisClient.zIncrBy('hot_products', 1, productId.toString());
    
    // 4. 将此商品ID添加到待更新集合中，以便定时任务处理
    await redisClient.sAdd('likes_updated', productId.toString());
    
    console.log(`User ${userId} liked product ${productId}.`);
    return { success: true, newLike: true };
  } else {
    console.log(`User ${userId} already liked product ${productId}.`);
    return { success: true, newLike: false };
  }
}

// 获取商品的点赞数
async function getLikes(productId) {
  const redisKey = `product:${productId}:likes`;
  const count = await redisClient.sCard(redisKey);
  return { productId, likes: count };
}

// 获取点赞某商品的用户列表
async function getLikedUsers(productId) {
  const redisKey = `product:${productId}:likes`;
  const users = await redisClient.sMembers(redisKey);
  return { productId, users };
}

module.exports = {
  likeProduct,
  getLikes,
  getLikedUsers,
};
