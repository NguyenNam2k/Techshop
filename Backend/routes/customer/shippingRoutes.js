const express = require('express');
const shippingController = require('../../controllers/customer/shippingController');

const router = express.Router();

router.post('/quote', shippingController.getQuote);

module.exports = router;
