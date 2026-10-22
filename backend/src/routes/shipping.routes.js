const express = require('express');
const shippingController = require('../controllers/shipping.controller');

const router = express.Router();

router.post('/quote', shippingController.getQuote);

module.exports = router;
