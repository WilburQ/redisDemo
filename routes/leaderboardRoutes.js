// routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const client = require('../services/redisClient');
const { getAllProducts } = require('../services/productService');

// 商品访问排行榜接口
router.get('/', async (req, res) => {
  const leaderboardKey = 'product_views';
  const products = getAllProducts();
  try {
    const top = await client.zRange(leaderboardKey, 0, 9, { REV: true, WITHSCORES: true });
    const result = [];
    for (let i = 0; i < top.length; i += 2) {
      const productId = top[i];
      const views = parseInt(top[i + 1]);
      let product = products.find(p => p.id === productId);
      result.push({ productId, views, product });
    }
    res.json(result);
  } catch (e) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
