const multer = require('multer');

// Sử dụng memoryStorage để lưu file tạm trong RAM buffer,
// sẵn sàng cho việc stream tải trực tiếp lên Cloudinary.
const storage = multer.memoryStorage();

// Bộ lọc định dạng file: Chỉ cho phép các định dạng ảnh hợp lệ
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      'Định dạng tệp không hợp lệ! Vui lòng chỉ tải lên ảnh (JPEG, PNG, WEBP, GIF, SVG, AVIF).'
    );
    err.statusCode = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn tối đa 10MB mỗi ảnh
  }
});

module.exports = upload;
