const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Application Routes
app.use(productRoutes);
app.use('/api/categories', categoryRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin/products');
});

// 404 Not Found Handler
app.use((req, res, next) => {
  if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `Tài nguyên không tồn tại: ${req.method} ${req.url}`
    });
  }
  res.status(404).send(`
    <div style="font-family:sans-serif; text-align:center; padding: 50px;">
      <h2>404 - Không tìm thấy trang</h2>
      <p>Đường dẫn yêu cầu không tồn tại.</p>
      <a href="/admin/products" style="color: #06b6d4;">Quay lại Trang Quản Trị</a>
    </div>
  `);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 [Unhandled Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Đã xảy ra lỗi máy chủ nội bộ.';

  if (req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api')) {
    return res.status(statusCode).json({
      success: false,
      message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  res.status(statusCode).send(`
    <div style="font-family:sans-serif; text-align:center; padding: 50px; background: #0f172a; color: #f8fafc; min-height: 100vh;">
      <h2 style="color: #f43f5e;">Lỗi hệ thống (${statusCode})</h2>
      <p style="color: #cbd5e1;">${message}</p>
      <a href="/admin/products" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#06b6d4; color:#0f172a; text-decoration:none; border-radius:6px; font-weight:600;">Quay lại Quản trị</a>
    </div>
  `);
});

// Initialize Server & Database
async function startServer() {
  console.log('🔄 Đang kiểm tra kết nối cơ sở dữ liệu MySQL...');
  await testConnection();

  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 TechShop Admin Server đang chạy tại:`);
    console.log(`👉 Dashboard Quản trị: http://localhost:${PORT}/admin/products`);
    console.log(`👉 API Sản phẩm:       http://localhost:${PORT}/api/products`);
    console.log(`👉 API Danh mục:       http://localhost:${PORT}/api/categories`);
    console.log(`====================================================`);
  });
}

startServer();

module.exports = app;
