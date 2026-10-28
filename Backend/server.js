const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Đường dẫn tài nguyên tĩnh
const frontendDistPath = fs.existsSync(path.join(__dirname, '../Frontend/dist'))
  ? path.join(__dirname, '../Frontend/dist')
  : path.join(__dirname, '../frontend/dist');
const legacyPublicPath = path.join(__dirname, '../public');

// 1. Ưu tiên phục vụ Giao diện Khách hàng Storefront (React SPA) từ Frontend/dist
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// 2. Phục vụ static legacy public và demo xác thực
app.use('/auth-demo', express.static(legacyPublicPath));
app.use(express.static(legacyPublicPath));

// Khai báo Routes
const authRoutes = require('./routes/auth/authRoutes');
const userRoutes = require('./routes/admin/userRoutes');
const catalogRoutes = require('./routes/customer/catalogRoutes');
const productRoutes = require('./routes/manager/productRoutes');
const managerRoutes = require('./routes/manager/managerRoutes');
const categoryRoutes = require('./routes/manager/categoryRoutes');
const staffRoutes = require('./routes/manager/staffRoutes');
const couponRoutes = require('./routes/manager/couponRoutes');
const reportRoutes = require('./routes/manager/reportRoutes');
const logRoutes = require('./routes/admin/logRoutes');
const roleRoutes = require('./routes/admin/roleRoutes');
const permissionRoutes = require('./routes/admin/permissionRoutes');
const orderRoutes = require('./src/routes/order.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const shippingRoutes = require('./src/routes/shipping.routes');
const cartRoutes = require('./src/routes/cart.routes');
const customerProfileRoutes = require('./src/routes/customer.routes');
const { testConnection } = require('./config/database');

// 3. Phục vụ Manager App SPA nếu đã build dist (Duong's Manager Portal)
const managerAppDist = path.join(__dirname, '../views/manager-app/dist');
if (fs.existsSync(managerAppDist)) {
  const staticDistOptions = {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  };
  app.use('/manager', express.static(managerAppDist, staticDistOptions));
  app.get(['/manager', '/manager/*'], (req, res, next) => {
    if (req.path.startsWith('/manager/api')) return next();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(managerAppDist, 'index.html'));
  });
} else {
  // Manager & Admin Web Routes (Redirect to React Frontend SPA)
  app.use('/manager', managerRoutes);
}

app.get('/admin/products', (req, res) => res.redirect(`${FRONTEND_URL}/manager/products`));
app.get('/admin', (req, res) => res.redirect(`${FRONTEND_URL}/admin`));
app.get('/logout', (req, res) => res.redirect(`${FRONTEND_URL}/login`));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/staffs', staffRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/customer', customerProfileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Techshop Fullstack Service is running!',
    timestamp: new Date()
  });
});

// Điều hướng /dashboard về Storefront
app.get('/dashboard', (req, res) => res.redirect('/'));

// Route mặc định điều hướng tới Giao diện Khách hàng (SPA React Catalog)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }
  if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
  res.sendFile(path.join(legacyPublicPath, 'index.html'));
});

// Khởi chạy HTTP Server & Kiểm tra cơ sở dữ liệu
async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Techshop Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📊 Manager Portal Dashboard:     ${FRONTEND_URL}/manager/products`);
    console.log(`🛍️ Customer Catalog Web:         http://localhost:${PORT}/catalog`);
    console.log(`🔑 Auth API Endpoint:            http://localhost:${PORT}/api/auth`);
    console.log(`=================================================`);
  });
}

startServer();

