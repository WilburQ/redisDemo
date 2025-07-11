const express = require('express');
const router = express.Router();
const {
  likeProduct,
  getLikes,
  getLikedUsers
} = require('../services/likeService');

// 点赞商品
router.post('/products/:id/like', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  try {
    const result = await likeProduct(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取商品点赞数
router.get('/products/:id/likes', async (req, res) => {
  try {
    const likes = await getLikes(req.params.id);
    res.json(likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取点赞某商品的用户列表
router.get('/products/:id/liked-users', async (req, res) => {
  try {
    const users = await getLikedUsers(req.params.id);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
