const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Đường dẫn tài nguyên tĩnh
const frontendDistPath = path.join(__dirname, '../Frontend/dist');
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
const { testConnection } = require('./config/database');

// Manager & Admin Web Routes (Redirect to React Frontend SPA)
app.use('/manager', managerRoutes);
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

