// services/productService.js
const products = [
  { id: '1', name: 'Apple iPhone 15', price: 6999, desc: 'Flagship smartphone' },
  { id: '2', name: 'Xiaomi TV', price: 2999, desc: 'Smart TV 55 inch' },
  { id: '3', name: 'Dyson Vacuum', price: 3999, desc: 'Cordless vacuum cleaner' },
];

const fetchProductFromDB = (id) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(products.find(p => p.id === id) || null);
    }, 100);
  });
};

const getAllProducts = () => products;

module.exports = {
  fetchProductFromDB,
  getAllProducts,
};
