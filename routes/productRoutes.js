const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getHotProducts
} = require('../services/productService');

// 获取所有商品
router.get('/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取热门商品
router.get('/products/hot', async (req, res) => {
  try {
    const products = await getHotProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取单个商品详情
router.get('/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
