const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const managerRoutes = require('./routes/manager.routes');
const couponRoutes = require('./routes/coupon.routes');
const authRoutes = require('./routes/auth.routes');
const searchRoutes = require('./routes/search.routes');
const shippingRoutes = require('./routes/shipping.routes');
const { authenticate } = require('./middleware/auth.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional authentication: turns a valid Bearer token into req.user so
// authenticated customers own their cart/orders and manager routes can be
// guarded. Requests without a token stay guest requests.
app.use(authenticate);

// Serve static uploads for local file uploads fallback
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/shipping', shippingRoutes);

// Health check
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 [TechGear Backend] Server running on http://localhost:${PORT}`);
  warnOnMissingVietQRConfig();
});

// VietQR is optional: when it is not configured only the `vietqr_banking`
// payment method is blocked (HTTP 503). COD keeps working.
function warnOnMissingVietQRConfig() {
  const missing = [];
  if (!String(process.env.VIETQR_BANK_ID || '').trim()) missing.push('VIETQR_BANK_ID');
  if (!/^\d{6,20}$/.test(String(process.env.VIETQR_ACCOUNT_NO || '').trim())) {
    missing.push('VIETQR_ACCOUNT_NO');
  }
  const accountName = String(process.env.VIETQR_ACCOUNT_NAME || '').trim();
  if (!accountName || /^your[_\s-]/i.test(accountName)) missing.push('VIETQR_ACCOUNT_NAME');

  if (missing.length) {
    console.warn(
      `⚠️  [TechGear Backend] VietQR bank transfer is disabled. Missing/invalid env: ${missing.join(', ')}. ` +
      'COD checkout is unaffected.'
    );
  }
}

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[TechGear Backend] Received ${signal}. Shutting down...`);

  let shutdownFailed = false;

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') {
          reject(error);
          return;
        }
        resolve();
      });
    });
  } catch (error) {
    shutdownFailed = true;
    console.error('[TechGear Backend] Failed to close the HTTP server:', error.message);
  }

  try {
    await pool.end();
  } catch (error) {
    shutdownFailed = true;
    console.error('[TechGear Backend] Failed to close the database pool:', error.message);
  }

  process.exitCode = shutdownFailed ? 1 : 0;
}

['SIGINT', 'SIGTERM', 'SIGBREAK'].forEach((signal) => {
  process.once(signal, () => {
    shutdown(signal).catch((error) => {
      console.error('[TechGear Backend] Unexpected shutdown error:', error);
      process.exitCode = 1;
    });
  });
});

module.exports = app;
