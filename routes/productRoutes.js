// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const client = require('../services/redisClient');
const { fetchProductFromDB } = require('../services/productService');
const likeService = require('../services/likeService');

// 商品详情缓存接口 + 访问排行榜统计
// 商品详情缓存接口 + 访问排行榜统计（带缓存击穿保护）
router.get('/:id', async (req, res) => {
  const productId = req.params.id;
  const cacheKey = `product:${productId}`;
  const leaderboardKey = 'product_views';
  const lockKey = `lock:product:${productId}`;
  try {
    let cached = await client.get(cacheKey);
    if (cached) {
      await client.zIncrBy(leaderboardKey, 1, productId);
      return res.json(JSON.parse(cached));
    }
    // 缓存击穿保护：尝试加锁
    const lock = await client.set(lockKey, '1', { NX: true, PX: 2000 }); // 2秒锁
    if (!lock) {
      // 其他请求正在查库，等待并重试缓存
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 100));
        cached = await client.get(cacheKey);
        if (cached) {
          await client.zIncrBy(leaderboardKey, 1, productId);
          return res.json(JSON.parse(cached));
        }
      }
      return res.status(503).send('Please retry later');
    }
    // 查库并写缓存
    try {
      const product = await fetchProductFromDB(productId);
      if (!product) return res.status(404).send('Product not found');
      await client.setEx(cacheKey, 60, JSON.stringify(product));
      await client.zIncrBy(leaderboardKey, 1, productId);
      res.json(product);
    } finally {
      await client.del(lockKey);
    }
  } catch (e) {
    res.status(500).send('Server error');
  }
});

// 商品缓存失效接口，便于商品更新后主动清理缓存
router.delete('/:id/cache', async (req, res) => {
  const productId = req.params.id;
  const cacheKey = `product:${productId}`;
  try {
    await client.del(cacheKey);
    res.send('Cache invalidated');
  } catch (e) {
    res.status(500).send('Server error');
  }
});

// --- 用户点赞/收藏功能 ---
// 点赞商品
router.post('/:id/like', async (req, res) => {
  const productId = req.params.id;
  const userId = req.body.userId;
  if (!userId) return res.status(400).send('userId required');
  try {
    await likeService.likeProduct(productId, userId);
    res.send('Liked');
  } catch (e) {
    res.status(500).send('Server error');
  }
});

// 取消点赞
router.post('/:id/unlike', async (req, res) => {
  const productId = req.params.id;
  const userId = req.body.userId;
  if (!userId) return res.status(400).send('userId required');
  try {
    await likeService.unlikeProduct(productId, userId);
    res.send('Unliked');
  } catch (e) {
    res.status(500).send('Server error');
  }
});

// 查询商品点赞数
router.get('/:id/likes', async (req, res) => {
  const productId = req.params.id;
  try {
    const count = await likeService.getProductLikeCount(productId);
    res.json({ productId, likes: count });
  } catch (e) {
    res.status(500).send('Server error');
  }
});

// 查询用户是否已点赞
router.get('/:id/liked', async (req, res) => {
  const productId = req.params.id;
  const userId = req.query.userId;
  if (!userId) return res.status(400).send('userId required');
  try {
    const isLiked = await likeService.isProductLikedByUser(productId, userId);
    res.json({ productId, userId, liked: !!isLiked });
  } catch (e) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
