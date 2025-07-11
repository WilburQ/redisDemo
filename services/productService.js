const { client: redisClient } = require('./redisClient');
const { Product } = require('../models');

const HOT_PRODUCTS_KEY = 'hot_products';
const PRODUCT_CACHE_TTL = 3600; // Cache for 1 hour

// Helper to get product details, with caching
async function getProductById(id) {
  const cacheKey = `product:${id}`;
  let product = await redisClient.get(cacheKey);

  if (product) {
    return JSON.parse(product);
  }

  // Cache miss, get from DB
  product = await Product.findByPk(id);
  if (product) {
    // Store in cache
    await redisClient.set(cacheKey, JSON.stringify(product), 'EX', PRODUCT_CACHE_TTL);
  }
  return product;
}


// Get all products, with fallback to DB
async function getAllProducts() {
    // For simplicity, we fetch all from DB. In a real app, you'd use pagination.
    const products = await Product.findAll();
    return products;
}

// Get hot products from Redis, with fallback to DB
async function getHotProducts() {
  // 1. Try to get from Redis sorted set
  const productIds = await redisClient.zRange(HOT_PRODUCTS_KEY, 0, 4, 'REV');

  if (productIds && productIds.length > 0) {
    const products = await Promise.all(productIds.map(id => getProductById(id)));
    // Filter out any nulls if a product was deleted but still in hot list
    return products.filter(p => p);
  }

  // 2. Cache miss, get from DB (e.g., top 5 liked products)
  console.log('Hot products cache miss. Fetching from database...');
  const dbProducts = await Product.findAll({
    order: [['likes', 'DESC']],
    limit: 5
  });

  // 3. Populate Redis cache
  if (dbProducts && dbProducts.length > 0) {
    const pipeline = redisClient.pipeline();
    for (const p of dbProducts) {
        const productString = JSON.stringify(p.toJSON());
        // Add to sorted set for ranking
        pipeline.zAdd(HOT_PRODUCTS_KEY, { score: p.likes, value: p.id.toString() });
        // Add to individual cache
        pipeline.set(`product:${p.id}`, productString, 'EX', PRODUCT_CACHE_TTL);
    }
    await pipeline.exec();
    console.log('Hot products cache populated from database.');
  }

  return dbProducts;
}

module.exports = {
  getProductById,
  getAllProducts,
  getHotProducts,
};
