/**
 * seed-products.js
 * Script tạo dữ liệu mẫu cho Categories, Products, Product Variants, Specs và Images
 * Chạy: node seed-products.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedProducts() {
  console.log('🚀 Đang kết nối tới CSDL để nạp dữ liệu mẫu sản phẩm...\n');

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'techshop_db',
    port:     process.env.DB_PORT     || 3306,
  });

  // 1. Seed Categories
  console.log('📌 1. Thêm Danh Mục (Categories)...');
  const categories = [
    { name: 'Laptop Gaming', slug: 'laptop-gaming', description: 'Laptop cấu hình khủng cho game thủ và đồ họa', icon_url: '💻' },
    { name: 'Bàn Phím Cơ', slug: 'ban-phim-co', description: 'Bàn phím cơ Custom, Gaming switch cao cấp', icon_url: '⌨️' },
    { name: 'Chuột Gaming', slug: 'chuot-gaming', description: 'Chuột không dây, siêu nhẹ, cảm biến chuẩn xác', icon_url: '🖱️' },
    { name: 'Tai Nghe & Audio', slug: 'tai-nghe-audio', description: 'Tai nghe gaming 7.1, tai nghe audiophile', icon_url: '🎧' },
    { name: 'Màn Hình Máy Tính', slug: 'man-hinh-may-tinh', description: 'Màn hình tần số quét cao 144Hz - 240Hz, chuẩn màu IPS/OLED', icon_url: '🖥️' }
  ];

  const catMap = {}; // slug -> id
  for (const cat of categories) {
    const [rows] = await conn.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
    if (rows.length > 0) {
      catMap[cat.slug] = rows[0].id;
    } else {
      const [res] = await conn.query(
        'INSERT INTO categories (name, slug, description, icon_url) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.description, cat.icon_url]
      );
      catMap[cat.slug] = res.insertId;
      console.log(`   + Đã tạo danh mục: ${cat.name} (ID: ${res.insertId})`);
    }
  }

  // 2. Sample Products with Variants
  console.log('\n📌 2. Thêm Sản Phẩm & Biến Thể (Products & Variants)...');
  const sampleProducts = [
    {
      name: 'ASUS ROG Zephyrus G14 (2026)',
      slug: 'asus-rog-zephyrus-g14-2026',
      category_slug: 'laptop-gaming',
      brand: 'ASUS',
      model_code: 'GA403UI-QS026W',
      base_price: 49990000,
      description: 'Laptop gaming mỏng nhẹ hàng đầu với màn hình OLED 3K 120Hz, chip Ryzen 9 AI và RTX 4070.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997621/techshop/products/thumb-asus-rog-zephyrus-g14-2026.jpg',
      warranty_months: 24,
      status: 'active',
      variants: [
        { sku: 'ROG-G14-WHT-32G', color: 'Trắng Platinum', color_code: '#F8F9FA', spec_version: 'Ryzen 9 / 32GB RAM / 1TB SSD / RTX 4070', price: 54990000, stock: 15 },
        { sku: 'ROG-G14-GRY-16G', color: 'Xám Eclipse', color_code: '#2B2D42', spec_version: 'Ryzen 7 / 16GB RAM / 512GB SSD / RTX 4060', price: 44990000, stock: 20 }
      ]
    },
    {
      name: 'MacBook Pro 16 inch M3 Max',
      slug: 'macbook-pro-16-inch-m3-max',
      category_slug: 'laptop-gaming',
      brand: 'Apple',
      model_code: 'MUW63SA/A',
      base_price: 89990000,
      description: 'Sức mạnh vượt trội cho tác vụ đồ họa và lập trình chuyên nghiệp cùng thời lượng pin 22 giờ.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997622/techshop/products/thumb-macbook-pro-16-inch-m3-max.jpg',
      warranty_months: 12,
      status: 'active',
      variants: [
        { sku: 'MBP16-SPACEBLACK-36G', color: 'Space Black', color_code: '#1E1E24', spec_version: 'M3 Max 14-core / 36GB RAM / 1TB SSD', price: 89990000, stock: 10 },
        { sku: 'MBP16-SILVER-48G', color: 'Silver', color_code: '#E0E1DD', spec_version: 'M3 Max 16-core / 48GB RAM / 1TB SSD', price: 99990000, stock: 8 }
      ]
    },
    {
      name: 'Lenovo Legion Pro 7i Gen 9',
      slug: 'lenovo-legion-pro-7i-gen-9',
      category_slug: 'laptop-gaming',
      brand: 'Lenovo',
      model_code: '16IRX9H',
      base_price: 62990000,
      description: 'Cỗ máy gaming đỉnh cao trang bị Intel Core i9-14900HX, RTX 4080 và tản nhiệt buồng hơi Legion Coldfront.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997623/techshop/products/thumb-lenovo-legion-pro-7i-gen-9.jpg',
      warranty_months: 36,
      status: 'active',
      variants: [
        { sku: 'LEGION-PRO7-32G', color: 'Onyx Grey', color_code: '#3A3A3A', spec_version: 'Core i9 / 32GB RAM / 1TB SSD / RTX 4080', price: 62990000, stock: 12 }
      ]
    },
    {
      name: 'Bàn Phím Cơ Keychron Q1 Pro Wireless Custom',
      slug: 'ban-phim-co-keychron-q1-pro',
      category_slug: 'ban-phim-co',
      brand: 'Keychron',
      model_code: 'Q1P-M1',
      base_price: 4590000,
      description: 'Bàn phím cơ full nhôm CNC 75%, gasket mount, kết nối Bluetooth 5.1 & Type-C, switch Banana tactile mượt mà.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997623/techshop/products/thumb-ban-phim-co-keychron-q1-pro.jpg',
      warranty_months: 12,
      status: 'active',
      variants: [
        { sku: 'Q1PRO-BLK-RED', color: 'Carbon Black', color_code: '#111111', spec_version: 'Red Switch (Linear)', price: 4590000, stock: 25 },
        { sku: 'Q1PRO-SLV-BANANA', color: 'Silver Grey', color_code: '#8D99AE', spec_version: 'Banana Switch (Tactile)', price: 4790000, stock: 18 }
      ]
    },
    {
      name: 'Bàn Phím Cơ Akko Mod007v3 HE Year of Dragon',
      slug: 'ban-phim-co-akko-mod007v3-he',
      category_slug: 'ban-phim-co',
      brand: 'Akko',
      model_code: 'MOD007-HE',
      base_price: 3690000,
      description: 'Bàn phím cơ switch từ tính Magnetic Switch, tính năng Rapid Trigger siêu nhạy cho game thủ FPS.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997624/techshop/products/thumb-ban-phim-co-akko-mod007v3-he.jpg',
      warranty_months: 12,
      status: 'active',
      variants: [
        { sku: 'AKKO-MOD007-DRAGON', color: 'Cyan Gold', color_code: '#0077B6', spec_version: 'Magnetic Akko Cream Yellow Switch', price: 3690000, stock: 30 }
      ]
    },
    {
      name: 'Chuột Gaming Logitech G Pro X Superlight 2',
      slug: 'chuot-gaming-logitech-g-pro-x-superlight-2',
      category_slug: 'chuot-gaming',
      brand: 'Logitech',
      model_code: 'G-PXS2',
      base_price: 3890000,
      description: 'Huyền thoại chuột esports thế hệ mới trọng lượng 60g, cảm biến HERO 2 32.000 DPI, switch lai quang-cơ LIGHTFORCE.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997625/techshop/products/thumb-chuot-gaming-logitech-g-pro-x-superlight-2.jpg',
      warranty_months: 24,
      status: 'active',
      variants: [
        { sku: 'GPX2-WHT', color: 'Trắng', color_code: '#FFFFFF', spec_version: 'Không dây LIGHTSPEED / 4000Hz Polling', price: 3890000, stock: 40 },
        { sku: 'GPX2-BLK', color: 'Đen', color_code: '#000000', spec_version: 'Không dây LIGHTSPEED / 4000Hz Polling', price: 3890000, stock: 35 },
        { sku: 'GPX2-MAG', color: 'Hồng Magenta', color_code: '#E63946', spec_version: 'Phiên bản giới hạn Magenta', price: 4190000, stock: 15 }
      ]
    },
    {
      name: 'Chuột Gaming Razer Viper V3 Pro',
      slug: 'chuot-gaming-razer-viper-v3-pro',
      category_slug: 'chuot-gaming',
      brand: 'Razer',
      model_code: 'RZ01-0512',
      base_price: 3990000,
      description: 'Chuột đối xứng siêu nhẹ 54g, công nghệ không dây HyperPolling 8000Hz thực sự, cảm biến Focus Pro 35K Gen 2.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997626/techshop/products/thumb-chuot-gaming-razer-viper-v3-pro.jpg',
      warranty_months: 24,
      status: 'active',
      variants: [
        { sku: 'VIPER-V3-PRO-BLK', color: 'Đen Matte', color_code: '#1A1A1A', spec_version: 'True 8000Hz Polling Rate', price: 3990000, stock: 20 }
      ]
    },
    {
      name: 'Tai Nghe Gaming SteelSeries Arctis Nova Pro Wireless',
      slug: 'tai-nghe-steelseries-arctis-nova-pro-wireless',
      category_slug: 'tai-nghe-audio',
      brand: 'SteelSeries',
      model_code: '61520',
      base_price: 8990000,
      description: 'Hệ thống âm thanh Nova Pro đỉnh cao, khử tiếng ồn chủ động ANC, 2 pin thay nóng liên tục không bao giờ hết pin.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997626/techshop/products/thumb-tai-nghe-steelseries-arctis-nova-pro-wireless.jpg',
      warranty_months: 24,
      status: 'active',
      variants: [
        { sku: 'NOVA-PRO-WL-PC', color: 'Đen', color_code: '#1B1B1B', spec_version: 'PC / PlayStation / Dual DAC Wireless', price: 8990000, stock: 14 }
      ]
    },
    {
      name: 'Màn Hình Gaming Dell Alienware AW3423DWF QD-OLED',
      slug: 'man-hinh-dell-alienware-aw3423dwf',
      category_slug: 'man-hinh-may-tinh',
      brand: 'Dell',
      model_code: 'AW3423DWF',
      base_price: 26900000,
      description: 'Màn hình cong 34 inch Quantum Dot OLED, độ phân giải WQHD 3440x1440, tần số quét 165Hz 0.1ms cho màu đen tuyệt đối.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997627/techshop/products/thumb-man-hinh-dell-alienware-aw3423dwf.jpg',
      warranty_months: 36,
      status: 'active',
      variants: [
        { sku: 'AW3423DWF-BASE', color: 'Dark Side of the Moon', color_code: '#212529', spec_version: '34" Curved QD-OLED / 165Hz / HDR True Black 400', price: 26900000, stock: 7 }
      ]
    },
    {
      name: 'Màn Hình LG UltraGear 27GR95QE-B OLED 240Hz',
      slug: 'man-hinh-lg-ultragear-27gr95qe-b-oled',
      category_slug: 'man-hinh-may-tinh',
      brand: 'LG',
      model_code: '27GR95QE',
      base_price: 18900000,
      description: 'Màn hình gaming OLED 27 inch 2K QHD (2560x1440), tần số quét 240Hz, phản hồi 0.03ms mượt mà.',
      thumbnail_url: 'https://res.cloudinary.com/zrnhpe6p/image/upload/v1792997269/techshop/products/prod-thumb-man-hinh-lg-ultragear-27gr95qe-b-oled-1792997266539-845354_hht4ik.jpg',
      warranty_months: 24,
      status: 'active',
      variants: [
        { sku: 'LG-27GR95QE-240', color: 'Đen Tím Hexagon', color_code: '#10002B', spec_version: '27" 2K OLED / 240Hz / 0.03ms / G-Sync Compatible', price: 18900000, stock: 12 }
      ]
    }
  ];

  for (const item of sampleProducts) {
    const category_id = catMap[item.category_slug];
    const [existing] = await conn.query('SELECT id FROM products WHERE slug = ?', [item.slug]);

    let productId;
    if (existing.length > 0) {
      productId = existing[0].id;
      console.log(`   * Sản phẩm đã tồn tại: ${item.name} (ID: ${productId})`);
    } else {
      const [res] = await conn.query(
        `INSERT INTO products (category_id, name, slug, brand, model_code, base_price, description, thumbnail_url, warranty_months, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [category_id, item.name, item.slug, item.brand, item.model_code, item.base_price, item.description, item.thumbnail_url, item.warranty_months, item.status]
      );
      productId = res.insertId;
      console.log(`   + Đã tạo sản phẩm: ${item.name} (ID: ${productId})`);
    }

    // Insert variants
    for (const v of item.variants) {
      const [vExist] = await conn.query('SELECT id FROM product_variants WHERE sku = ?', [v.sku]);
      if (vExist.length === 0) {
        await conn.query(
          `INSERT INTO product_variants (product_id, sku, color, color_code, spec_version, price, stock, image_url, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
          [productId, v.sku, v.color, v.color_code, v.spec_version, v.price, v.stock, item.thumbnail_url]
        );
      }
    }
  }

  await conn.end();
  console.log('\n🎉 Hoàn tất nạp dữ liệu mẫu sản phẩm thành công!');
}

seedProducts().catch(err => {
  console.error('\n❌ Lỗi khi nạp dữ liệu:', err);
  process.exit(1);
});
