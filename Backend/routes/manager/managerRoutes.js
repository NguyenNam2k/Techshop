const express = require('express');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Redirect to Frontend React SPA Manager Portal
router.get('/products', (req, res) => res.redirect(`${FRONTEND_URL}/manager/products`));
router.get('/', (req, res) => res.redirect(`${FRONTEND_URL}/manager/products`));

module.exports = router;

