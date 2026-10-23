const cloudinary = require('cloudinary').v2;
require('dotenv').config();

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
 * Tải file từ máy tính lên Cloudinary CDN
 * @param {string} filePath - Đường dẫn file cục bộ
 * @param {string} folder - Thư mục trên Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadToCloudinary(filePath, folder = 'techshop/products') {
  if (!isConfigured) {
    throw new Error('Chưa cấu hình thông tin xác thực Cloudinary trong file .env');
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured: () => isConfigured,
  uploadToCloudinary
};
