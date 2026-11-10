const express = require('express');
const router = express.Router();
const controller = require('../controllers/return.controller');

router.get('/', controller.list);
router.patch('/:id', controller.review);

module.exports = router;
