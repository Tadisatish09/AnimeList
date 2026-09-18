const express = require('express');
const watchedController = require('../controllers/watchedController.js');
const { authMiddleware } = require('../middleware/jwt.js');

const router = express.Router();

router.use(authMiddleware);

router.post('/', watchedController.addToWatched);
router.get('/', watchedController.getWatched);
router.put('/:id', watchedController.updateWatched);
router.delete('/:id', watchedController.deleteWatched);

module.exports = router;
