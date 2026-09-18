const express = require('express');
const watchlistController = require('../controllers/watchlistController.js');
const { authMiddleware } = require('../middleware/jwt.js');

const router = express.Router();

router.use(authMiddleware);

router.post('/', watchlistController.addToWatchlist);
router.get('/', watchlistController.getWatchlist);
router.delete('/:id', watchlistController.removeFromWatchlist);

module.exports = router;
