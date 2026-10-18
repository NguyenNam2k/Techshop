const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// GET /api/catalog              — Lấy danh sách sản phẩm (Phân trang, lọc, sắp xếp)
router.get('/', catalogController.getCatalog);

// GET /api/catalog/filters-meta — Lấy danh sách brands, categories, khoảng giá cho sidebar
router.get('/filters-meta', catalogController.getFiltersMeta);

// GET /api/catalog/:idOrSlug    — Chi tiết sản phẩm theo ID hoặc Slug
router.get('/:idOrSlug', catalogController.getProductDetail);

module.exports = router;
