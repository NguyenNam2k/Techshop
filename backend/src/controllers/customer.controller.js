const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const couponService = require('../services/coupon.service');

function formatWishlistRow(row) {
  const price = Number(row.variant_price ?? row.base_price ?? 0);
  const basePrice = Number(row.base_price ?? price);
  const stock = Number(row.variant_stock ?? 0);
  const isAvailable =
    row.product_status === 'active' &&
    row.variant_status !== 'discontinued' &&
    stock > 0;

  const variantParts = [row.color, row.spec_version].filter(
    (v) => v && v !== 'Tiêu chuẩn' && v !== 'Bản tiêu chuẩn'
  );
  const variantLabel =
    variantParts.length > 0
      ? variantParts.join(' - ')
      : [row.color, row.spec_version].filter(Boolean).join(' - ') || 'Bản tiêu chuẩn';

  return {
    id: Number(row.wishlist_id),
    wishlistId: Number(row.wishlist_id),
    productId: Number(row.product_id),
    variantId: row.resolved_variant_id ? Number(row.resolved_variant_id) : null,
    slug: row.slug || '',
    name: row.product_name,
    brand: row.brand || 'TechShop',
    categoryName: row.category_name || '',
    sku: row.sku || '',
    variant: variantLabel,
    color: row.color || 'Tiêu chuẩn',
    specVersion: row.spec_version || 'Bản tiêu chuẩn',
    price,
    originalPrice: basePrice > price ? basePrice : price,
    image: row.image_url || '',
    stock,
    productStatus: row.product_status,
    variantStatus: row.variant_status || 'available',
    isAvailable,
    addedAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

async function fetchCustomerWishlist(connection, customerId) {
  const [rows] = await connection.query(
    `SELECT
       w.id AS wishlist_id,
       w.product_id,
       w.variant_id,
       w.created_at,
       p.name AS product_name,
       p.slug,
       p.brand,
       p.base_price,
       p.thumbnail_url,
       p.status AS product_status,
       c.name AS category_name,
       pv.id AS resolved_variant_id,
       pv.sku,
       pv.color,
       pv.spec_version,
       pv.price AS variant_price,
       pv.stock AS variant_stock,
       pv.status AS variant_status,
       COALESCE(
         pv.image_url,
         p.thumbnail_url,
         (SELECT pi.image_url FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1)
       ) AS image_url
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_variants pv ON pv.id = COALESCE(
       w.variant_id,
       (SELECT pv2.id FROM product_variants pv2
        WHERE pv2.product_id = p.id
        ORDER BY pv2.stock DESC, pv2.id ASC LIMIT 1)
     )
     WHERE w.customer_id = ?
     ORDER BY w.created_at DESC, w.id DESC`,
    [Number(customerId)]
  );
  return rows.map(formatWishlistRow);
}

function resolveVoucherStatus(row) {
  const today = couponService.getTodayDateString();
  const startStr = couponService.toDateOnlyString(row.start_date);
  const endStr = couponService.toDateOnlyString(row.end_date);
  const usageLimit = Number(row.usage_limit || 0);
  const usedCount = Number(row.used_count || 0);

  if (row.used_at) return 'used';
  if (Number(row.is_active) === 0) return 'disabled';
  if (endStr && today > endStr) return 'expired';
  if (usageLimit > 0 && usedCount >= usageLimit) return 'exhausted';
  if (startStr && today < startStr) return 'upcoming';
  return 'available';
}

function formatCouponItem(row, savedMeta = null) {
  const isPercent = row.discount_type === 'percent' || row.discount_type === 'percentage';
  const maxDiscount = row.max_discount_amount == null ? null : Number(row.max_discount_amount);
  const usageLimit = Number(row.usage_limit || 0);
  const usedCount = Number(row.used_count || 0);
  const merged = savedMeta ? { ...row, ...savedMeta } : row;
  const status = resolveVoucherStatus(merged);

  return {
    id: Number(row.id),
    code: row.code,
    description:
      row.description ||
      `Giảm ${isPercent ? `${Number(row.discount_value)}%` : `${Number(row.discount_value).toLocaleString('vi-VN')}₫`}`,
    discount_type: isPercent ? 'percentage' : 'fixed',
    discount_value: Number(row.discount_value),
    min_order_value: Number(row.min_order_value || 0),
    max_discount_amount: maxDiscount && maxDiscount > 0 ? maxDiscount : null,
    usage_limit: usageLimit,
    used_count: usedCount,
    remaining_uses: usageLimit > 0 ? Math.max(0, usageLimit - usedCount) : null,
    start_date: couponService.toDateOnlyString(row.start_date),
    end_date: couponService.toDateOnlyString(row.end_date),
    is_active: Number(row.is_active) === 1,
    status,
    is_saved: Boolean(savedMeta || row.saved_id),
    is_used: Boolean(merged.used_at),
    saved_at: merged.saved_at ? new Date(merged.saved_at).toISOString() : null,
    used_at: merged.used_at ? new Date(merged.used_at).toISOString() : null,
    used_order_code: merged.used_order_code || null
  };
}

async function fetchCustomerVouchersData(connection, customerId) {
  const [savedRows] = await connection.query(
    `SELECT
       cv.id AS saved_id,
       cv.saved_at,
       cv.used_at,
       cv.used_order_code,
       c.*
     FROM customer_vouchers cv
     JOIN coupons c ON c.id = cv.coupon_id
     WHERE cv.customer_id = ?
     ORDER BY (cv.used_at IS NOT NULL) ASC, c.is_active DESC, c.end_date ASC, cv.saved_at DESC`,
    [Number(customerId)]
  );

  const savedByCouponId = new Map(savedRows.map((r) => [Number(r.id), r]));
  const saved = savedRows.map((row) => formatCouponItem(row, row));

  const [publicRows] = await connection.query(
    `SELECT *
     FROM coupons
     WHERE is_active = 1
       AND (start_date IS NULL OR start_date <= CURDATE())
       AND (end_date IS NULL OR end_date >= CURDATE())
       AND (usage_limit IS NULL OR usage_limit = 0 OR used_count < usage_limit)
     ORDER BY discount_value DESC, id ASC`
  );

  const discover = publicRows.map((row) =>
    formatCouponItem(row, savedByCouponId.get(Number(row.id)) || null)
  );

  return { saved, discover };
}

function getAuthenticatedCustomerId(req) {
  if (!req.user || req.user.role !== 'customer') return null;
  const id = Number(req.user.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getProfile(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập tài khoản khách hàng.' });
    }

    const [rows] = await pool.query(
      `SELECT id, name, username, email, phone, address, avatar_url, status, created_at, updated_at
       FROM customers WHERE id = ? LIMIT 1`,
      [customerId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin khách hàng.' });
    }

    const customer = rows[0];
    const [orderStats] = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(final_amount), 0) AS total
       FROM orders
       WHERE customer_id = ? AND shipping_status != 'cancelled'`,
      [customerId]
    );
    const orderCount = Number(orderStats[0]?.count || 0);
    const totalSpent = Number(orderStats[0]?.total || 0);

    const wishlist = await fetchCustomerWishlist(pool, customerId);
    const vouchers = await fetchCustomerVouchersData(pool, customerId);

    return res.status(200).json({
      success: true,
      data: {
        id: Number(customer.id),
        name: customer.name,
        username: customer.username,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        avatar_url: customer.avatar_url || '',
        status: customer.status,
        created_at: customer.created_at,
        orderCount,
        totalSpent,
        points: Math.floor(totalSpent / 100000),
        wishlist,
        savedVouchers: vouchers.saved.map((v) => v.code),
        vouchers
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải thông tin hồ sơ khách hàng.' });
  }
}

async function updateProfile(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập tài khoản khách hàng.' });
    }

    const { name, phone, address, avatar_url, avatarUrl } = req.body || {};
    const finalAvatar = avatar_url ?? avatarUrl ?? null;

    await pool.query(
      `UPDATE customers SET
         name = COALESCE(?, name),
         phone = COALESCE(?, phone),
         address = COALESCE(?, address),
         avatar_url = COALESCE(?, avatar_url),
         updated_at = NOW()
       WHERE id = ?`,
      [
        name !== undefined ? String(name).trim() : null,
        phone !== undefined ? String(phone).trim() : null,
        address !== undefined ? String(address).trim() : null,
        finalAvatar !== null ? String(finalAvatar).trim() : null,
        customerId
      ]
    );

    return getProfile(req, res);
  } catch (error) {
    console.error('Error updating customer profile in DB:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật hồ sơ khách hàng.' });
  }
}

async function changePassword(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
    }

    const [rows] = await pool.query(
      'SELECT password_hash FROM customers WHERE id = ? LIMIT 1',
      [customerId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }

    if (rows[0].password_hash && currentPassword) {
      const valid = await bcrypt.compare(String(currentPassword), rows[0].password_hash);
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
      }
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await pool.query('UPDATE customers SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
      hash,
      customerId
    ]);
    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Không thể đổi mật khẩu.' });
  }
}

async function getWishlist(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem danh sách yêu thích.' });
    }
    const wishlist = await fetchCustomerWishlist(pool, customerId);
    return res.status(200).json({
      success: true,
      count: wishlist.length,
      data: wishlist
    });
  } catch (error) {
    console.error('Error loading customer wishlist:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải danh sách yêu thích từ cơ sở dữ liệu.' });
  }
}

async function resolveProductAndVariant(connection, productId, variantId) {
  let cleanProductId = Number(productId) || null;
  let cleanVariantId = Number(variantId) || null;

  if (!cleanProductId && cleanVariantId) {
    const [vRows] = await connection.query(
      'SELECT product_id FROM product_variants WHERE id = ? LIMIT 1',
      [cleanVariantId]
    );
    cleanProductId = vRows[0]?.product_id ? Number(vRows[0].product_id) : null;
  }

  if (!cleanProductId) return null;

  const [pRows] = await connection.query('SELECT id FROM products WHERE id = ? LIMIT 1', [cleanProductId]);
  if (!pRows.length) return null;

  if (cleanVariantId) {
    const [vRows] = await connection.query(
      'SELECT id FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1',
      [cleanVariantId, cleanProductId]
    );
    if (!vRows.length) cleanVariantId = null;
  }

  if (!cleanVariantId) {
    const [vDefault] = await connection.query(
      'SELECT id FROM product_variants WHERE product_id = ? ORDER BY stock DESC, id ASC LIMIT 1',
      [cleanProductId]
    );
    cleanVariantId = vDefault[0]?.id ? Number(vDefault[0].id) : null;
  }

  return { productId: cleanProductId, variantId: cleanVariantId };
}

async function addToWishlist(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để lưu sản phẩm yêu thích.' });
    }

    const resolved = await resolveProductAndVariant(
      pool,
      req.body?.productId ?? req.body?.id,
      req.body?.variantId
    );
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm hợp lệ trong cơ sở dữ liệu.' });
    }

    await pool.query(
      `INSERT INTO wishlists (customer_id, product_id, variant_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE variant_id = VALUES(variant_id), updated_at = NOW()`,
      [customerId, resolved.productId, resolved.variantId]
    );

    const wishlist = await fetchCustomerWishlist(pool, customerId);
    return res.status(200).json({
      success: true,
      wishlisted: true,
      message: 'Đã lưu sản phẩm vào danh sách yêu thích.',
      data: wishlist
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({ success: false, message: 'Không thể lưu sản phẩm yêu thích.' });
  }
}

async function toggleWishlist(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để lưu sản phẩm yêu thích.' });
    }

    const resolved = await resolveProductAndVariant(
      pool,
      req.body?.productId ?? req.body?.id,
      req.body?.variantId
    );
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm hợp lệ trong cơ sở dữ liệu.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM wishlists WHERE customer_id = ? AND product_id = ? LIMIT 1',
      [customerId, resolved.productId]
    );

    let wishlisted = false;
    if (existing.length > 0) {
      await pool.query('DELETE FROM wishlists WHERE id = ?', [existing[0].id]);
      wishlisted = false;
    } else {
      await pool.query(
        'INSERT INTO wishlists (customer_id, product_id, variant_id) VALUES (?, ?, ?)',
        [customerId, resolved.productId, resolved.variantId]
      );
      wishlisted = true;
    }

    const wishlist = await fetchCustomerWishlist(pool, customerId);
    return res.status(200).json({
      success: true,
      wishlisted,
      message: wishlisted
        ? 'Đã thêm sản phẩm vào danh sách yêu thích.'
        : 'Đã bỏ sản phẩm khỏi danh sách yêu thích.',
      data: wishlist
    });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật danh sách yêu thích.' });
  }
}

async function removeFromWishlist(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const targetId = Number(req.params.productId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ.' });
    }

    const [result] = await pool.query(
      'DELETE FROM wishlists WHERE customer_id = ? AND (product_id = ? OR id = ?)',
      [customerId, targetId, targetId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong danh sách yêu thích.' });
    }

    const wishlist = await fetchCustomerWishlist(pool, customerId);
    return res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
      data: wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa sản phẩm khỏi danh sách yêu thích.' });
  }
}

async function updateWishlist(req, res) {
  const customerId = getAuthenticatedCustomerId(req);
  if (!customerId) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
  }

  const { wishlist } = req.body || {};
  if (!Array.isArray(wishlist)) {
    return res.status(400).json({ success: false, message: 'Danh sách yêu thích không hợp lệ.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM wishlists WHERE customer_id = ?', [customerId]);

    for (const item of wishlist) {
      const pId = typeof item === 'object' ? item?.productId ?? item?.id : item;
      const vId = typeof item === 'object' ? item?.variantId : null;
      const resolved = await resolveProductAndVariant(connection, pId, vId);
      if (resolved) {
        await connection.query(
          `INSERT INTO wishlists (customer_id, product_id, variant_id)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE variant_id = VALUES(variant_id)`,
          [customerId, resolved.productId, resolved.variantId]
        );
      }
    }

    await connection.commit();
    const updated = await fetchCustomerWishlist(connection, customerId);
    return res.status(200).json({
      success: true,
      message: 'Đã đồng bộ danh sách yêu thích với cơ sở dữ liệu.',
      data: updated
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error syncing wishlist:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật danh sách yêu thích.' });
  } finally {
    connection.release();
  }
}

async function getVouchers(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem kho voucher.' });
    }

    const data = await fetchCustomerVouchersData(pool, customerId);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error loading customer vouchers:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải kho voucher từ cơ sở dữ liệu.' });
  }
}

async function saveVoucher(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để lưu mã giảm giá.' });
    }

    const cleanCode = String(req.body?.code || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã voucher.' });
    }

    const coupon = await couponService.findCoupon(pool, cleanCode);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Mã voucher "${cleanCode}" không tồn tại trên hệ thống.`
      });
    }

    const availability = couponService.evaluateCouponAvailability(coupon);
    if (!availability.valid) {
      return res.status(400).json({
        success: false,
        message: availability.message
      });
    }

    const [existing] = await pool.query(
      'SELECT id, used_at FROM customer_vouchers WHERE customer_id = ? AND coupon_id = ? LIMIT 1',
      [customerId, coupon.id]
    );
    if (existing.length > 0) {
      const data = await fetchCustomerVouchersData(pool, customerId);
      return res.status(200).json({
        success: true,
        alreadySaved: true,
        message: existing[0].used_at
          ? `Bạn đã sử dụng mã "${cleanCode}" trước đó.`
          : `Mã "${cleanCode}" đã có trong kho voucher của bạn.`,
        data
      });
    }

    await pool.query(
      'INSERT INTO customer_vouchers (customer_id, coupon_id) VALUES (?, ?)',
      [customerId, coupon.id]
    );

    const data = await fetchCustomerVouchersData(pool, customerId);
    return res.status(201).json({
      success: true,
      alreadySaved: false,
      message: `Đã lưu mã giảm giá "${cleanCode}" vào ví của bạn!`,
      data
    });
  } catch (error) {
    console.error('Error saving voucher in DB:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lưu voucher vào cơ sở dữ liệu.' });
  }
}

async function removeSavedVoucher(req, res) {
  try {
    const customerId = getAuthenticatedCustomerId(req);
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const couponId = Number(req.params.couponId);
    if (!Number.isInteger(couponId) || couponId <= 0) {
      return res.status(400).json({ success: false, message: 'Mã voucher không hợp lệ.' });
    }

    const [rows] = await pool.query(
      'SELECT id, used_at FROM customer_vouchers WHERE customer_id = ? AND coupon_id = ? LIMIT 1',
      [customerId, couponId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Voucher không tồn tại trong ví của bạn.' });
    }
    if (rows[0].used_at) {
      return res.status(400).json({ success: false, message: 'Không thể xóa voucher đã được sử dụng cho đơn hàng.' });
    }

    await pool.query('DELETE FROM customer_vouchers WHERE id = ?', [rows[0].id]);
    const data = await fetchCustomerVouchersData(pool, customerId);
    return res.status(200).json({
      success: true,
      message: 'Đã gỡ voucher khỏi ví.',
      data
    });
  } catch (error) {
    console.error('Error removing saved voucher:', error);
    return res.status(500).json({ success: false, message: 'Không thể gỡ voucher.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getWishlist,
  addToWishlist,
  toggleWishlist,
  removeFromWishlist,
  updateWishlist,
  getVouchers,
  saveVoucher,
  removeSavedVoucher
};
