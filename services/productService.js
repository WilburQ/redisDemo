const { client: redisClient } = require('./redisClient');
const { Product } = require('../models');

const HOT_PRODUCTS_KEY = 'hot_products';
const PRODUCT_CACHE_TTL = 3600; // 缓存1小时

// 辅助函数：通过ID获取产品详情，带缓存
async function getProductById(id) {
  const cacheKey = `product:${id}`;
  let product = await redisClient.get(cacheKey);

  if (product) {
    return JSON.parse(product);
  }

  // 缓存未命中，从数据库获取
  product = await Product.findByPk(id);
  if (product) {
    // 存储到缓存
    await redisClient.set(cacheKey, JSON.stringify(product), 'EX', PRODUCT_CACHE_TTL);
  }
  return product;
}


// 获取所有产品，带数据库回退
async function getAllProducts() {
    // 为简化起见，我们从数据库获取所有产品。在实际应用中，您会使用分页。
    const products = await Product.findAll();
    return products;
}

// 从Redis获取热门产品，带数据库回退
async function getHotProducts() {
  // 1. 尝试从Redis有序集合中获取
  const productIds = await redisClient.zRange(HOT_PRODUCTS_KEY, 0, 4, 'REV');

  if (productIds && productIds.length > 0) {
    const products = await Promise.all(productIds.map(id => getProductById(id)));
    // 过滤掉任何空值（如果产品已被删除但仍在热门列表中）
    return products.filter(p => p);
  }

  // 2. 缓存未命中，从数据库获取（例如，点赞数最多的前5个产品）
  console.log('热门产品缓存未命中。正在从数据库获取...');
  const dbProducts = await Product.findAll({
    order: [['likes', 'DESC']],
    limit: 5
  });

  // 3. 填充Redis缓存
  if (dbProducts && dbProducts.length > 0) {
    const pipeline = redisClient.pipeline();
    for (const p of dbProducts) {
        const productString = JSON.stringify(p.toJSON());
        // 添加到有序集合以进行排名
        pipeline.zAdd(HOT_PRODUCTS_KEY, { score: p.likes, value: p.id.toString() });
        // 添加到单独缓存
        pipeline.set(`product:${p.id}`, productString, 'EX', PRODUCT_CACHE_TTL);
    }
    await pipeline.exec();
    console.log('热门产品缓存已从数据库填充。');
  }

  return dbProducts;
}

module.exports = {
  getProductById,
  getAllProducts,
  getHotProducts,
};
