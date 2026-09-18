const express = require('express');
const animeController = require('../controllers/animeController.js');

const router = express.Router();

router.get('/search', animeController.search);
router.get('/trending', animeController.getTrending);
router.get('/:malId', animeController.getDetails);

module.exports = router;
