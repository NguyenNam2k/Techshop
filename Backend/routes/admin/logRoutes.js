const express = require('express');
const router = express.Router();
const productController = require('../../controllers/manager/productController');

router.get('/inventory', productController.getInventoryLogs);
router.get('/audit', productController.getAuditLogs);

module.exports = router;
