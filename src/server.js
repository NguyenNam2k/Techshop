const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ Giao diện Front-end Tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, '../public')));

// Khai báo Routes API
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Techshop Authentication Service is running!',
    timestamp: new Date()
  });
});

// Route mặc định điều hướng tới Giao diện Web
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Khởi chạy HTTP Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Techshop Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔑 Auth API Endpoint: http://localhost:${PORT}/api/auth`);
  console.log(`=================================================`);
});
