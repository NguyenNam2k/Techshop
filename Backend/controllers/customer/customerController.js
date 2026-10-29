const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

const DEFAULT_ADDRESSES = [];

const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'pay-1',
    type: 'vietqr',
    bankName: 'MBBank (Ngân hàng Quân Đội)',
    accountNumber: '0358599999',
    accountName: 'CONG TY TNHH TECHSHOP VIET NAM',
    isDefault: true,
    note: 'Chuyển khoản VietQR tự động xác nhận tức thì'
  },
  {
    id: 'pay-2',
    type: 'bank',
    bankName: 'Vietcombank (VCB Digital)',
    accountNumber: '001100438912',
    accountName: 'ĐẶNG MINH THUẬN',
    isDefault: false,
    note: 'Tài khoản hoàn tiền & nhận chiết khấu'
  },
  {
    id: 'pay-3',
    type: 'card',
    cardBrand: 'Visa Infinite Gaming',
    last4: '8821',
    expiry: '08/29',
    cardHolder: 'DANG MINH THUAN',
    isDefault: false,
    note: 'Thanh toán quốc tế 1-Click'
  }
];

const DEFAULT_WISHLIST = [
  {
    id: 15,
    productId: 15,
    variantId: 15,
    name: 'Chuột Gaming Không Dây Logitech G Pro X Superlight 2 DEX White',
    variant: 'Trắng Tuyết (White) - 44K DPI HERO 2 Sensor',
    price: 3490000,
    originalPrice: 3890000,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
    stock: 12,
    rating: 4.9
  },
  {
    id: 17,
    productId: 17,
    variantId: 17,
    name: 'Màn Hình Gaming ASUS ROG Swift OLED 240Hz 0.03ms Ultra-Low Latency',
    variant: '27 Inch 2K OLED (2560x1440) 240Hz',
    price: 14990000,
    originalPrice: 17500000,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80',
    stock: 5,
    rating: 5.0
  },
  {
    id: 14,
    productId: 14,
    variantId: 14,
    name: 'Bàn Phím Cơ Custom Keychron Q1 Pro QMK/VIA Full Nhôm CNC',
    variant: 'Bạc Trắng (Silver) - Kailh Banana Tactile Switch',
    price: 4490000,
    originalPrice: 4890000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80',
    stock: 8,
    rating: 4.8
  },
  {
    id: 1,
    productId: 1,
    variantId: 1,
    name: 'VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB GDDR6X',
    variant: 'Bản Ép Xung OC - 3 Quạt Axial-tech',
    price: 36680000,
    originalPrice: 39990000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=80',
    stock: 2,
    rating: 5.0
  }
];

const DEFAULT_PC_BUILDS = [
  {
    id: 'build-1',
    name: 'ROG Apex Ultra 4K Gaming & Render',
    description: 'Cấu hình đỉnh cao cân mọi tựa game 4K Ray Tracing và Render 3D Blender.',
    wattage: 780,
    totalPrice: 94500000,
    updatedAt: '18/10/2026',
    components: [
      { type: 'CPU', name: 'Intel Core i9-14900K 24 Nhân 32 Luồng 6.0GHz', price: 14890000 },
      { type: 'VGA', name: 'ASUS ROG Strix GeForce RTX 4090 OC 24GB GDDR6X', price: 36680000 },
      { type: 'Mainboard', name: 'ASUS ROG MAXIMUS Z790 DARK HERO DDR5', price: 17290000 },
      { type: 'RAM', name: 'Corsair Dominator Titanium RGB 64GB (2x32GB) 6400MHz', price: 7890000 },
      { type: 'SSD', name: 'Samsung 990 Pro 2TB PCIe Gen4 NVMe M.2 7450MB/s', price: 4690000 },
      { type: 'Nguồn (PSU)', name: 'ASUS ROG Thor 1000W Platinum II OLED Aura Sync', price: 8390000 },
      { type: 'Vỏ Case', name: 'Lian Li O11 Dynamic EVO RGB Modern Dual-Chamber Black', price: 4690000 }
    ]
  },
  {
    id: 'build-2',
    name: 'Compact ITX Silent Workstation & Code',
    description: 'Dàn máy nhỏ gọn đặt bàn học, tối ưu tản nhiệt êm ái cho lập trình viên.',
    wattage: 520,
    totalPrice: 48200000,
    updatedAt: '12/10/2026',
    components: [
      { type: 'CPU', name: 'AMD Ryzen 7 7800X3D 8 Nhân 16 Luồng Gaming King', price: 10490000 },
      { type: 'VGA', name: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X', price: 22490000 },
      { type: 'Mainboard', name: 'ASUS ROG STRIX B650E-I GAMING WIFI Mini-ITX', price: 8190000 },
      { type: 'RAM', name: 'G.Skill Flare X5 32GB (2x16GB) DDR5 6000MHz', price: 3190000 },
      { type: 'SSD', name: 'Kingston KC3000 1TB PCIe 4.0 NVMe 7000MB/s', price: 2190000 },
      { type: 'Nguồn (PSU)', name: 'Corsair SF750 80 Plus Platinum SFX Modular', price: 3990000 }
    ]
  }
];

function parseJsonField(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

async function getProfile(req, res) {
  try {
    const customerId = req.query.id || (req.user && req.user.id) || 1;
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, address, avatar_url, birth_date, gender, bio,
              two_factor_enabled, notification_preferences, saved_addresses,
              saved_payment_methods, wishlist, pc_builds, points, saved_vouchers,
              google_id, password_hash,
              created_at, updated_at
       FROM customers WHERE id = ? LIMIT 1`,
      [customerId]
    );

    let orderCount = 0;
    let totalSpent = 0;
    try {
      const [orderStats] = await pool.query(
        `SELECT 
           COUNT(id) as count,
           COALESCE(SUM(CASE WHEN payment_status = 'paid' AND shipping_status IN ('delivered', 'completed') THEN final_amount ELSE 0 END), 0) as total
         FROM orders 
         WHERE customer_id = ? OR (recipient_phone = ? AND recipient_phone != '')`,
        [customerId, rows[0]?.phone || '']
      );
      if (orderStats.length > 0) {
        orderCount = Number(orderStats[0].count) || 0;
        totalSpent = Number(orderStats[0].total) || 0;
      }
    } catch {
      // ignore
    }

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        data: {
          id: customerId,
          name: '',
          email: '',
          phone: '',
          address: '',
          avatar_url: '',
          birth_date: '',
          gender: 'male',
          bio: '',
          role: 'customer',
          memberTier: 'Khách hàng thành viên',
          points: 0,
          totalSpent: 0,
          orderCount: 0,
          hasPassword: false,
          isGoogleAccount: false,
          two_factor_enabled: false,
          notification_preferences: {
            orderUpdates: true,
            promotions: true,
            warrantyAlerts: true,
            smsAlerts: false
          },
          savedAddresses: [],
          savedPaymentMethods: [],
          wishlist: [],
          pcBuilds: [],
          savedVouchers: [],
          supportTickets: null,
          productReviews: null
        }
      });
    }

    const customer = rows[0];
    const savedAddresses = parseJsonField(customer.saved_addresses, []);
    const savedPaymentMethods = parseJsonField(customer.saved_payment_methods, []);
    const wishlist = parseJsonField(customer.wishlist, []);
    const pcBuilds = parseJsonField(customer.pc_builds, []);
    const savedVouchers = parseJsonField(customer.saved_vouchers, []);
    const supportTickets = null;
    const productReviews = null;
    const notifPrefs = parseJsonField(customer.notification_preferences, {
      orderUpdates: true,
      promotions: true,
      warrantyAlerts: true,
      smsAlerts: false
    });

    let birthDateStr = '';
    if (customer.birth_date) {
      birthDateStr = customer.birth_date instanceof Date
        ? customer.birth_date.toISOString().slice(0, 10)
        : String(customer.birth_date).slice(0, 10);
    }

    // Tính toán cấp bậc thành viên thực tế dựa trên số tiền tích lũy
    let memberTier = 'Khách hàng thành viên';
    if (totalSpent >= 50000000) {
      memberTier = 'Thành viên VIP Diamond';
    } else if (totalSpent >= 20000000) {
      memberTier = 'Thành viên VIP Gold';
    } else if (totalSpent >= 5000000) {
      memberTier = 'Thành viên Bạc';
    }

    return res.status(200).json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        avatar_url: customer.avatar_url || '',
        birth_date: birthDateStr,
        gender: customer.gender || 'male',
        bio: customer.bio || '',
        role: 'customer',
        memberTier,
        points: customer.points != null ? Number(customer.points) : 0,
        totalSpent,
        orderCount,
        hasPassword: Boolean(customer.password_hash && customer.password_hash.trim().length > 0),
        isGoogleAccount: Boolean(customer.google_id),
        two_factor_enabled: Boolean(customer.two_factor_enabled),
        notification_preferences: notifPrefs,
        savedAddresses,
        savedPaymentMethods,
        wishlist,
        pcBuilds,
        savedVouchers,
        supportTickets,
        productReviews,
        created_at: customer.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải thông tin hồ sơ.' });
  }
}

async function updateProfile(req, res) {
  try {
    const customerId = req.body.id || req.query.id || (req.user && req.user.id) || 1;
    const {
      name,
      email,
      phone,
      address,
      birth_date,
      birthDate,
      gender,
      bio,
      avatar_url,
      avatarUrl,
      two_factor_enabled,
      twoFactorEnabled,
      notification_preferences,
      notificationPreferences,
      saved_addresses,
      savedAddresses,
      saved_payment_methods,
      savedPaymentMethods,
      wishlist,
      pc_builds,
      pcBuilds,
      points,
      saved_vouchers,
      savedVouchers
    } = req.body;

    const finalBirthDate = birth_date || birthDate || null;
    const finalAvatarUrl = avatar_url || avatarUrl || null;
    const final2FA =
      two_factor_enabled !== undefined
        ? (two_factor_enabled ? 1 : 0)
        : twoFactorEnabled !== undefined
        ? (twoFactorEnabled ? 1 : 0)
        : null;

    const notifObj = notification_preferences || notificationPreferences;
    const finalNotifs = notifObj !== undefined ? JSON.stringify(notifObj) : null;

    const addrsObj = saved_addresses || savedAddresses;
    const finalAddrs = addrsObj !== undefined ? JSON.stringify(addrsObj) : null;

    const paysObj = saved_payment_methods || savedPaymentMethods;
    const finalPays = paysObj !== undefined ? JSON.stringify(paysObj) : null;

    const wishObj = wishlist;
    const finalWish = wishObj !== undefined ? JSON.stringify(wishObj) : null;

    const buildsObj = pc_builds || pcBuilds;
    const finalBuilds = buildsObj !== undefined ? JSON.stringify(buildsObj) : null;

    const vouchObj = saved_vouchers || savedVouchers;
    const finalVouch = vouchObj !== undefined ? JSON.stringify(vouchObj) : null;

    await pool.query(
      `UPDATE customers SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        birth_date = COALESCE(?, birth_date),
        gender = COALESCE(?, gender),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        two_factor_enabled = COALESCE(?, two_factor_enabled),
        notification_preferences = COALESCE(?, notification_preferences),
        saved_addresses = COALESCE(?, saved_addresses),
        saved_payment_methods = COALESCE(?, saved_payment_methods),
        wishlist = COALESCE(?, wishlist),
        pc_builds = COALESCE(?, pc_builds),
        points = COALESCE(?, points),
        saved_vouchers = COALESCE(?, saved_vouchers),
        updated_at = NOW()
       WHERE id = ?`,
      [
        name !== undefined ? name : null,
        email !== undefined ? email : null,
        phone !== undefined ? phone : null,
        address !== undefined ? address : null,
        finalBirthDate,
        gender !== undefined ? gender : null,
        bio !== undefined ? bio : null,
        finalAvatarUrl,
        final2FA,
        finalNotifs,
        finalAddrs,
        finalPays,
        finalWish,
        finalBuilds,
        points !== undefined ? Number(points) : null,
        finalVouch,
        customerId
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cơ sở dữ liệu thành công!'
    });
  } catch (error) {
    console.error('Error updating customer profile in DB:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật hồ sơ trong DB.' });
  }
}

async function changePassword(req, res) {
  try {
    const customerId = req.body.id || req.query.id || (req.user && req.user.id) || 1;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 8 ký tự.'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, password_hash, google_id FROM customers WHERE id = ? LIMIT 1',
      [customerId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản khách hàng.' });
    }

    const customer = rows[0];
    const hasExistingPassword = Boolean(customer.password_hash && customer.password_hash.trim().length > 0);

    if (hasExistingPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại.'
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, customer.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác.'
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE customers SET password_hash = ?, password_changed_at = NOW(), updated_at = NOW() WHERE id = ?',
      [hashedPassword, customerId]
    );

    return res.status(200).json({
      success: true,
      message: hasExistingPassword
        ? 'Đổi mật khẩu thành công!'
        : 'Thiết lập mật khẩu thành công! Giờ đây bạn có thể đăng nhập bằng cả Google và Email + Mật khẩu này.',
      hasPassword: true
    });
  } catch (error) {
    console.error('Error changing customer password:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật mật khẩu.' });
  }
}

async function updateAddresses(req, res) {
  try {
    const customerId = req.body.id || req.query.id || (req.user && req.user.id) || 1;
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) {
      return res.status(400).json({ success: false, message: 'Danh sách địa chỉ không hợp lệ.' });
    }

    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
    const defaultAddressStr = defaultAddr ? defaultAddr.address : null;

    if (defaultAddressStr) {
      await pool.query(
        'UPDATE customers SET saved_addresses = ?, address = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(addresses), defaultAddressStr, customerId]
      );
    } else {
      await pool.query(
        'UPDATE customers SET saved_addresses = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(addresses), customerId]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Đã lưu sổ địa chỉ vào database!',
      data: addresses,
      defaultAddress: defaultAddressStr
    });
  } catch (error) {
    console.error('Error updating addresses in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lưu sổ địa chỉ vào DB.' });
  }
}

async function updatePaymentMethods(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { methods } = req.body;
    if (!Array.isArray(methods)) {
      return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hợp lệ.' });
    }

    await pool.query(
      'UPDATE customers SET saved_payment_methods = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(methods), customerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã lưu phương thức thanh toán vào database!',
      data: methods
    });
  } catch (error) {
    console.error('Error updating payment methods in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lưu phương thức thanh toán vào DB.' });
  }
}

async function updateWishlist(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { wishlist } = req.body;
    if (!Array.isArray(wishlist)) {
      return res.status(400).json({ success: false, message: 'Danh sách yêu thích không hợp lệ.' });
    }

    await pool.query(
      'UPDATE customers SET wishlist = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(wishlist), customerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật danh sách yêu thích trong database!',
      data: wishlist
    });
  } catch (error) {
    console.error('Error updating wishlist in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật yêu thích vào DB.' });
  }
}

async function updatePCBuilds(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { pcBuilds } = req.body;
    if (!Array.isArray(pcBuilds)) {
      return res.status(400).json({ success: false, message: 'Cấu hình PC không hợp lệ.' });
    }

    await pool.query(
      'UPDATE customers SET pc_builds = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(pcBuilds), customerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã lưu cấu hình PC vào database!',
      data: pcBuilds
    });
  } catch (error) {
    console.error('Error updating PC builds in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lưu cấu hình PC vào DB.' });
  }
}

async function saveVoucher(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Mã voucher không được để trống.' });
    }

    const [rows] = await pool.query('SELECT saved_vouchers FROM customers WHERE id = ? LIMIT 1', [customerId]);
    const current = parseJsonField(rows[0]?.saved_vouchers, []);
    const cleanCode = String(code).trim().toUpperCase();

    if (!current.includes(cleanCode)) {
      current.push(cleanCode);
      await pool.query('UPDATE customers SET saved_vouchers = ?, updated_at = NOW() WHERE id = ?', [
        JSON.stringify(current),
        customerId
      ]);
    }

    return res.status(200).json({
      success: true,
      message: `Đã lưu mã voucher "${cleanCode}" vào database!`,
      data: current
    });
  } catch (error) {
    console.error('Error saving voucher in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lưu voucher vào DB.' });
  }
}

async function redeemPoints(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { cost, rewardTitle } = req.body;
    const pointCost = Number(cost) || 0;

    const [rows] = await pool.query('SELECT points, saved_vouchers FROM customers WHERE id = ? LIMIT 1', [customerId]);
    const currentPoints = rows[0]?.points != null ? Number(rows[0].points) : 2450;
    if (currentPoints < pointCost) {
      return res.status(400).json({ success: false, message: 'Bạn không đủ điểm để đổi quà này.' });
    }

    const newPoints = currentPoints - pointCost;
    const currentVouchers = parseJsonField(rows[0]?.saved_vouchers, []);
    const newVoucherCode = `REWARD-${Math.floor(1000 + Math.random() * 9000)}`;
    currentVouchers.push(newVoucherCode);

    await pool.query(
      'UPDATE customers SET points = ?, saved_vouchers = ?, updated_at = NOW() WHERE id = ?',
      [newPoints, JSON.stringify(currentVouchers), customerId]
    );

    return res.status(200).json({
      success: true,
      message: `Đổi quà thành công! Đã trừ ${pointCost} điểm trong database.`,
      data: {
        points: newPoints,
        voucherCode: newVoucherCode,
        rewardTitle
      }
    });
  } catch (error) {
    console.error('Error redeeming points in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi đổi điểm trong DB.' });
  }
}

async function createTicket(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { subject, priority } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung ticket không được để trống.' });
    }

    const [rows] = await pool.query('SELECT support_tickets FROM customers WHERE id = ? LIMIT 1', [customerId]);
    const current = parseJsonField(rows[0]?.support_tickets, [
      {
        id: 'TK-1042',
        subject: 'RTX 4070 Super lỗi artifact sau 2 tuần',
        customer: 'Đặng Minh Thuận',
        priority: 'Cao',
        status: 'open',
        date: '19/10/2026'
      },
      {
        id: 'TK-1038',
        subject: 'Hỏi tương thích RAM DDR5 với mainboard B650',
        customer: 'Đặng Minh Thuận',
        priority: 'Thấp',
        status: 'progress',
        date: '14/10/2026'
      },
      {
        id: 'TK-1021',
        subject: 'Đổi switch bàn phím cơ sang Kailh tactile',
        customer: 'Đặng Minh Thuận',
        priority: 'Trung bình',
        status: 'closed',
        date: '02/10/2026'
      }
    ]);
    const newTicket = {
      id: `TK-${1043 + current.length}`,
      subject: subject.trim(),
      customer: 'Đặng Minh Thuận',
      priority: priority || 'Trung bình',
      status: 'open',
      date: 'Hôm nay'
    };
    current.unshift(newTicket);

    await pool.query('UPDATE customers SET support_tickets = ?, updated_at = NOW() WHERE id = ?', [
      JSON.stringify(current),
      customerId
    ]);

    return res.status(200).json({
      success: true,
      message: 'Mở ticket thành công và đã lưu vào cơ sở dữ liệu!',
      data: newTicket
    });
  } catch (error) {
    console.error('Error creating ticket in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo ticket trong DB.' });
  }
}

async function submitReview(req, res) {
  try {
    const customerId = req.body.id || req.query.id || 1;
    const { key, rating, comment } = req.body;
    if (!key) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm đánh giá.' });
    }

    const [rows] = await pool.query('SELECT product_reviews FROM customers WHERE id = ? LIMIT 1', [customerId]);
    const current = parseJsonField(rows[0]?.product_reviews, {});
    current[key] = {
      rating: Number(rating) || 5,
      comment: (comment || '').trim(),
      updatedAt: new Date().toISOString()
    };

    await pool.query('UPDATE customers SET product_reviews = ?, updated_at = NOW() WHERE id = ?', [
      JSON.stringify(current),
      customerId
    ]);

    return res.status(200).json({
      success: true,
      message: 'Đã lưu đánh giá sản phẩm vào database!',
      data: current
    });
  } catch (error) {
    console.error('Error submitting review in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lưu đánh giá vào DB.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAddresses,
  updatePaymentMethods,
  updateWishlist,
  updatePCBuilds,
  saveVoucher,
  redeemPoints,
  createTicket,
  submitReview
};
