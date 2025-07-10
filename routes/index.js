// routes/index.js
const express = require('express');
const productRoutes = require('./productRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');

const router = express.Router();

router.use('/products', productRoutes);
router.use('/leaderboard', leaderboardRoutes);

module.exports = router;
