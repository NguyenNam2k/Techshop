const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const couponRoutes = require('./routes/coupon.routes');
const orderRoutes = require('./routes/order.routes');
const shippingRoutes = require('./routes/shipping.routes');
const customerRoutes = require('./routes/customer.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// User's dedicated API routes: Product Details, Cart, Coupons, Shipping, Orders, Customer Profile
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/payments', require('./routes/payment.routes'));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'TechGear Backend E-Commerce API',
      database: 'connected'
    });
  } catch (error) {
    console.error('[TechGear Health] Database connection failed:', error.message);
    return res.status(503).json({
      success: false,
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'TechGear Backend E-Commerce API',
      database: 'unavailable'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 [TechGear Backend] Server running on http://localhost:${PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[TechGear Backend] Received ${signal}. Shutting down...`);
  try {
    await new Promise((resolve) => server.close(() => resolve()));
    await pool.end();
  } catch (error) {
    console.error('[TechGear Backend] Shutdown error:', error.message);
  }
}

['SIGINT', 'SIGTERM', 'SIGBREAK'].forEach((signal) => {
  process.once(signal, () => shutdown(signal));
});

module.exports = app;
