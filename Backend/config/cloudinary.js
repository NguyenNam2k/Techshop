const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config();

// Kiểm tra xem đã cung cấp đầy đủ thông tin xác thực Cloudinary chưa
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Tải trực tiếp buffer hình ảnh lên Cloudinary
 * @param {Buffer} buffer - Buffer dữ liệu file ảnh từ multer memoryStorage
 * @param {string} [folder='techshop/products'] - Thư mục lưu trữ trên Cloudinary
 * @param {object} [options={}] - Các tùy chọn bổ sung (tags, transformation...)
 * @returns {Promise<{ secure_url: string, public_id: string, format: string, bytes: number }>}
 */
const uploadBufferToCloud = (buffer, folder = 'techshop/products', options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(
        new Error(
          'Cloudinary chưa được cấu hình! Vui lòng thiết lập CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong file .env'
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height
        });
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * Xóa tài nguyên hình ảnh trên Cloudinary theo public_id
 * @param {string} publicId - ID tài nguyên trên Cloudinary
 * @returns {Promise<any>}
 */
const deleteFromCloud = async (publicId) => {
  if (!isConfigured || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[Cloudinary] Lỗi khi xóa ảnh ${publicId}:`, error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadBufferToCloud,
  deleteFromCloud
};
