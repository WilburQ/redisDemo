// services/likeService.js
const client = require('./redisClient');

const getLikeKey = (productId) => `product:likes:${productId}`;

async function likeProduct(productId, userId) {
  return client.sAdd(getLikeKey(productId), userId);
}

async function unlikeProduct(productId, userId) {
  return client.sRem(getLikeKey(productId), userId);
}

async function getProductLikeCount(productId) {
  return client.sCard(getLikeKey(productId));
}

async function isProductLikedByUser(productId, userId) {
  return client.sIsMember(getLikeKey(productId), userId);
}

module.exports = {
  likeProduct,
  unlikeProduct,
  getProductLikeCount,
  isProductLikedByUser,
};
