const pool = require('../config/database');
const cartService = require('./cart.service');
const couponService = require('./coupon.service');
const shippingService = require('./shipping.service');
const { publishStaffEvent } = require('./realtime.service');

const rawAccountNo = String(process.env.VIETQR_ACCOUNT_NO || '').trim();
const rawAccountName = String(process.env.VIETQR_ACCOUNT_NAME || '').trim();

const VIETQR_CONFIG = {
  bankId: String(process.env.VIETQR_BANK_ID || 'MB').trim() || 'MB',
  bankName: String(process.env.VIETQR_BANK_NAME || 'MBBank').trim() || 'MBBank',
  accountNo: /^\d{6,20}$/.test(rawAccountNo) ? rawAccountNo : '0358599999',
  accountName:
    rawAccountName && !/^your[_\s-]/i.test(rawAccountName)
      ? rawAccountName
      : 'CONG TY TNHH TECHSHOP VIET NAM',
  template: process.env.VIETQR_TEMPLATE || 'compact2'
};
const VIETQR_PAYMENT_TIMEOUT_MINUTES = 15;

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isConfirmedOrder(order) {
  return (
    order.shipping_status === 'pending' &&
    (order.payment_method === 'cod' || order.payment_status === 'paid')
  );
}

function generateVietQRUrl({ amount, orderCode }) {
  const memo = `TECHSHOP ${orderCode}`;
  const query = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: memo,
    accountName: VIETQR_CONFIG.accountName
  });
  return {
    qrUrl: `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?${query}`,
    bankId: VIETQR_CONFIG.bankId,
    bankName: VIETQR_CONFIG.bankName,
    accountNo: VIETQR_CONFIG.accountNo,
    accountNumber: VIETQR_CONFIG.accountNo,
    accountName: VIETQR_CONFIG.accountName,
    amount,
    transferContent: memo,
    transferMemo: memo
  };
}

let ordersColumnsCache = null;

async function getOrdersTableMeta(connection) {
  if (ordersColumnsCache) return ordersColumnsCache;
  const [cols] = await connection.query('SHOW COLUMNS FROM orders');
  const colMap = new Map(cols.map(c => [c.Field, c]));
  ordersColumnsCache = {
    hasGuestId: colMap.has('guest_id'),
    hasDiscountAmount: colMap.has('discount_amount'),
    hasCouponCode: colMap.has('coupon_code'),
    hasDeliveryMethod: colMap.has('delivery_method'),
    hasDistanceKm: colMap.has('shipping_distance_km'),
    hasStoreName: colMap.has('delivery_store_name'),
    hasPaymentExpiresAt: colMap.has('payment_expires_at'),
    customerIdNullable: colMap.get('customer_id')?.Null === 'YES'
  };
  return ordersColumnsCache;
}

async function createOrder({
  customerId = null,
  sessionToken,
  recipientName,
  recipientPhone,
  shippingAddress,
  provinceId,
  wardId,
  paymentMethod = 'cod',
  orderNotes = '',
  couponCode = '',
  items = []
}) {
  const cleanName = String(recipientName || '').trim();
  const cleanPhone = String(recipientPhone || '').trim();
  const cleanAddress = String(shippingAddress || '').trim();
  const cleanNotes = String(orderNotes || '').trim();
  if (!cleanName || !cleanPhone || !cleanAddress) {
    throw httpError('Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.');
  }
  if (
    cleanName.length > 100 ||
    cleanPhone.length > 20 ||
    cleanAddress.length > 2000 ||
    cleanNotes.length > 2000
  ) {
    throw httpError('Thông tin người nhận vượt quá độ dài cho phép.');
  }
  if (!['cod', 'vietqr_banking'].includes(paymentMethod)) {
    throw httpError('Phương thức thanh toán không hợp lệ (chỉ hỗ trợ COD hoặc VietQR).');
  }

  let shippingQuote;
  if (provinceId && wardId) {
    shippingQuote = await shippingService.calculateShippingQuote({ provinceId, wardId });
  } else {
    shippingQuote = {
      deliveryMethod: 'express',
      deliveryLabel: 'Giao Hỏa Tốc 2H (Nội thành)',
      shippingFee: 0,
      distanceKm: 5.4,
      nearestStore: shippingService.STORES[0]
    };
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;

    let owner = null;
    if (customerId) {
      const [customers] = await connection.query(
        "SELECT id FROM customers WHERE id = ? AND status = 'active' LIMIT 1",
        [customerId]
      );
      if (customers.length) {
        owner = { column: 'customer_id', id: customerId };
      }
    }
    if (!owner && sessionToken) {
      owner = {
        column: 'guest_id',
        id: await cartService.getOrCreateGuest(sessionToken, connection)
      };
    }

    let cartRows = [];
    if (owner) {
      const [rows] = await connection.query(
        `SELECT ci.variant_id, ci.quantity, pv.sku, pv.color, pv.spec_version,
                pv.price, pv.stock, pv.status AS variant_status,
                p.name AS product_name, p.status AS product_status
         FROM cart_items ci
         JOIN product_variants pv ON pv.id = ci.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE ci.${owner.column} = ?
         ORDER BY pv.id
         FOR UPDATE`,
        [owner.id]
      );
      cartRows = rows;
    }

    // Fallback: if client passed items directly (e.g., Buy Now or local cart not yet synced),
    // lock and verify every variant directly from product_variants.
    if (!cartRows.length && Array.isArray(items) && items.length > 0) {
      const requestedMap = new Map();
      for (const item of items) {
        const vId = Number(item.variantId || item.variant_id || item.id);
        const qty = Number(item.quantity) || 1;
        if (Number.isInteger(vId) && vId > 0 && qty > 0) {
          requestedMap.set(vId, (requestedMap.get(vId) || 0) + qty);
        }
      }
      const variantIds = [...requestedMap.keys()];
      if (variantIds.length > 0) {
        const [variantRows] = await connection.query(
          `SELECT pv.id AS variant_id, pv.sku, pv.color, pv.spec_version,
                  pv.price, pv.stock, pv.status AS variant_status,
                  p.name AS product_name, p.status AS product_status
           FROM product_variants pv
           JOIN products p ON p.id = pv.product_id
           WHERE pv.id IN (?)
           ORDER BY pv.id
           FOR UPDATE`,
          [variantIds]
        );
        cartRows = variantRows.map(r => ({
          ...r,
          quantity: requestedMap.get(Number(r.variant_id)) || 1
        }));
      }
    }

    if (!cartRows.length) {
      throw httpError('Giỏ hàng của bạn đang trống.', 400);
    }

    const aggregated = new Map();
    for (const row of cartRows) {
      if (row.product_status !== 'active' || row.variant_status === 'discontinued') {
        throw httpError(`Sản phẩm ${row.product_name} hiện đã ngừng kinh doanh.`, 409);
      }
      const current = aggregated.get(row.variant_id);
      if (current) current.quantity += Number(row.quantity);
      else {
        aggregated.set(row.variant_id, {
          variant_id: row.variant_id,
          quantity: Number(row.quantity),
          sku: row.sku,
          color: row.color || 'Tiêu chuẩn',
          spec_version: row.spec_version || 'Bản tiêu chuẩn',
          unit_price: Number(row.price),
          stock: Number(row.stock),
          product_name: row.product_name
        });
      }
    }

    const processedItems = [...aggregated.values()];
    let totalAmount = 0;
    for (const item of processedItems) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw httpError('Số lượng sản phẩm không hợp lệ.');
      }
      if (item.quantity > item.stock) {
        throw httpError(
          `Sản phẩm ${item.product_name} (${item.color}, ${item.spec_version}) không đủ tồn kho (Còn lại: ${item.stock}).`,
          409
        );
      }
      item.subtotal = item.unit_price * item.quantity;
      totalAmount += item.subtotal;
    }

    let appliedCoupon = null;
    let discountAmount = 0;
    if (String(couponCode || '').trim()) {
      appliedCoupon = await couponService.validateCoupon(
        connection,
        couponCode,
        totalAmount,
        { forUpdate: true }
      );
      if (!appliedCoupon.valid) throw httpError(appliedCoupon.message, 400);
      discountAmount = appliedCoupon.discountAmount;
    }

    const shippingFee = shippingQuote.shippingFee;
    const finalAmount = Math.max(0, totalAmount - discountAmount + shippingFee);
    const orderCode = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialPaymentStatus = 'unpaid';
    const initialOrderStatus = 'pending';
    const paymentExpiresAt =
      paymentMethod === 'vietqr_banking'
        ? new Date(Date.now() + VIETQR_PAYMENT_TIMEOUT_MINUTES * 60 * 1000)
        : null;

    const tableMeta = await getOrdersTableMeta(connection);
    let resolvedCustomerId = owner?.column === 'customer_id' ? owner.id : null;
    if (!resolvedCustomerId && !tableMeta.customerIdNullable) {
      const [firstCustomer] = await connection.query('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
      resolvedCustomerId = firstCustomer[0]?.id || 1;
    }

    const insertCols = [
      'order_code',
      'customer_id',
      'recipient_name',
      'recipient_phone',
      'shipping_address',
      'payment_method',
      'payment_status',
      'shipping_status',
      'total_amount',
      'shipping_fee',
      'final_amount',
      'order_notes'
    ];
    const insertVals = [
      orderCode,
      resolvedCustomerId,
      cleanName,
      cleanPhone,
      cleanAddress,
      paymentMethod,
      initialPaymentStatus,
      initialOrderStatus,
      totalAmount,
      shippingFee,
      finalAmount,
      cleanNotes || null
    ];

    if (tableMeta.hasGuestId) {
      insertCols.push('guest_id');
      insertVals.push(owner?.column === 'guest_id' ? owner.id : null);
    }
    if (tableMeta.hasDiscountAmount) {
      insertCols.push('discount_amount');
      insertVals.push(discountAmount);
    }
    if (tableMeta.hasCouponCode) {
      insertCols.push('coupon_code');
      insertVals.push(appliedCoupon?.coupon.code || null);
    }
    if (tableMeta.hasDeliveryMethod) {
      insertCols.push('delivery_method');
      insertVals.push(shippingQuote.deliveryMethod);
    }
    if (tableMeta.hasDistanceKm) {
      insertCols.push('shipping_distance_km');
      insertVals.push(shippingQuote.distanceKm);
    }
    if (tableMeta.hasStoreName) {
      insertCols.push('delivery_store_name');
      insertVals.push(shippingQuote.nearestStore.name);
    }
    if (tableMeta.hasPaymentExpiresAt) {
      insertCols.push('payment_expires_at');
      insertVals.push(
        paymentExpiresAt
      );
    }

    const placeholders = insertCols.map(() => '?').join(', ');
    const [orderResult] = await connection.query(
      `INSERT INTO orders (${insertCols.join(', ')}, created_at) VALUES (${placeholders}, NOW())`,
      insertVals
    );
    const orderId = orderResult.insertId;

    for (const item of processedItems) {
      const [stockResult] = await connection.query(
        `UPDATE product_variants
         SET stock = stock - ?,
             status = CASE
               WHEN stock - ? <= 0 THEN 'out_of_stock'
               WHEN stock - ? <= 5 THEN 'low_stock'
               ELSE 'available'
             END,
             updated_at = NOW()
         WHERE id = ? AND stock >= ?`,
        [item.quantity, item.quantity, item.quantity, item.variant_id, item.quantity]
      );
      if (stockResult.affectedRows !== 1) {
        throw httpError(`Tồn kho của ${item.product_name} vừa thay đổi, vui lòng kiểm tra lại giỏ hàng.`, 409);
      }
      const stockAfter = item.stock - item.quantity;

      await connection.query(
        `INSERT INTO order_items (
          order_id, variant_id, product_name, variant_name, sku,
          unit_price, quantity, subtotal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          item.variant_id,
          item.product_name,
          `${item.color} - ${item.spec_version}`,
          item.sku,
          item.unit_price,
          item.quantity,
          item.subtotal
        ]
      );
      await connection.query(
        `INSERT INTO inventory_logs (
          variant_id, order_id, change_type, quantity_changed, stock_after, note, created_at
        ) VALUES (?, ?, 'order_deduct', ?, ?, ?, NOW())`,
        [
          item.variant_id,
          orderId,
          -item.quantity,
          stockAfter,
          `Trừ kho cho đơn hàng ${orderCode}`
        ]
      );
    }

    if (appliedCoupon) {
      const [couponUpdate] = await connection.query(
        `UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1
         WHERE id = ? AND (usage_limit IS NULL OR usage_limit = 0 OR used_count < usage_limit)`,
        [appliedCoupon.coupon.id]
      );
      if (couponUpdate.affectedRows !== 1) {
        throw httpError('Mã giảm giá vừa hết lượt sử dụng.', 409);
      }
    }

    if (owner) {
      await connection.query(`DELETE FROM cart_items WHERE ${owner.column} = ?`, [owner.id]);
    }

    await connection.commit();
    transactionStarted = false;
    publishStaffEvent('order.created', {
      orderCode,
      phase: 1,
      shippingStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      recipientName: cleanName,
      finalAmount
    });

    return {
      orderId,
      orderCode,
      recipientName: cleanName,
      recipientPhone: cleanPhone,
      shippingAddress: cleanAddress,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      shippingStatus: initialOrderStatus,
      paymentMethodCode: paymentMethod,
      awaitingPayment: isAwaitingPayment({
        shipping_status: initialOrderStatus,
        payment_method: paymentMethod,
        payment_status: initialPaymentStatus,
        payment_expires_at: paymentExpiresAt
      }),
      phase: phaseForOrder({
        shipping_status: initialOrderStatus,
        payment_method: paymentMethod,
        payment_status: initialPaymentStatus
      }),
      statusLabel: statusLabelForOrder({
        shipping_status: initialOrderStatus,
        payment_method: paymentMethod,
        payment_status: initialPaymentStatus
      }),
      totalAmount,
      discountAmount,
      couponCode: appliedCoupon?.coupon.code || null,
      shippingFee,
      deliveryMethod: shippingQuote.deliveryMethod,
      shippingDistanceKm: shippingQuote.distanceKm,
      deliveryStoreName: shippingQuote.nearestStore.name,
      finalAmount,
      items: processedItems,
      vietQR:
        paymentMethod === 'vietqr_banking'
          ? generateVietQRUrl({ amount: finalAmount, orderCode })
          : null,
      createdAt: new Date().toISOString(),
      paymentExpiresAt: paymentExpiresAt?.toISOString() || null
    };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getOrderByCode(orderCode) {
  await expireUnpaidOrderIfNeeded(orderCode);
  const connection = await pool.getConnection();
  try {
    const [orderRows] = await connection.query(
      'SELECT * FROM orders WHERE order_code = ?',
      [orderCode]
    );
    if (!orderRows.length) return null;

    const order = orderRows[0];
    const items = await getOrderItems(connection, [order.id]);
    const paymentMethod = order.payment_method;
    const finalAmount = Number(order.final_amount);
    return {
      ...order,
      orderId: order.id,
      orderCode: order.order_code,
      recipientName: order.recipient_name,
      recipientPhone: order.recipient_phone,
      shippingAddress: order.shipping_address,
      shippingFee: Number(order.shipping_fee || 0),
      deliveryMethod: order.delivery_method || 'express',
      shippingDistanceKm: order.shipping_distance_km == null ? 5.4 : Number(order.shipping_distance_km),
      deliveryStoreName: order.delivery_store_name || shippingService.STORES[0].name,
      paymentMethod,
      paymentMethodCode: order.payment_method,
      paymentStatus: order.payment_status,
      paymentExpiresAt: order.payment_expires_at
        ? new Date(order.payment_expires_at).toISOString()
        : null,
      awaitingPayment: isAwaitingPayment(order),
      orderStatus: order.shipping_status,
      shippingStatus: order.shipping_status,
      phase: phaseForOrder(order),
      statusLabel: statusLabelForOrder(order),
      orderNotes: order.order_notes,
      total_amount: Number(order.total_amount),
      discount_amount: Number(order.discount_amount || 0),
      shipping_fee: Number(order.shipping_fee || 0),
      final_amount: finalAmount,
      totalAmount: Number(order.total_amount),
      discountAmount: Number(order.discount_amount || 0),
      finalAmount,
      items: items.map(mapOrderItem),
      vietQR:
        order.payment_method === 'vietqr_banking'
          ? generateVietQRUrl({ amount: finalAmount, orderCode: order.order_code })
          : null
    };
  } finally {
    connection.release();
  }
}

const ORDER_PHASE = Object.freeze({
  pending: 0,
  processing: 2,
  shipping: 3,
  delivered: 4,
  cancelled: 0
});

const ORDER_STATUS_LABEL = Object.freeze({
  pending: 'Chờ xác nhận',
  processing: 'Đang chuẩn bị hàng',
  shipping: 'Đang giao hàng',
  delivered: 'Giao hàng thành công',
  cancelled: 'Đã hủy'
});

const PAYMENT_METHOD_LABEL = Object.freeze({
  cod: 'COD (Thanh toán khi nhận)',
  vietqr_banking: 'VietQR Banking'
});

function isAwaitingPayment(order) {
  return (
    order.payment_method === 'vietqr_banking' &&
    order.payment_status !== 'paid' &&
    order.shipping_status === 'pending' &&
    order.payment_expires_at && new Date(order.payment_expires_at).getTime() > Date.now()
  );
}

async function expireUnpaidOrderIfNeeded(orderCode) {
  const cleanCode = String(orderCode || '').trim();
  if (!cleanCode) return false;
  const [rows] = await pool.query(
    `SELECT payment_status, shipping_status, payment_expires_at
     FROM orders
     WHERE order_code = ? AND payment_method = 'vietqr_banking'
     LIMIT 1`,
    [cleanCode]
  );
  const order = rows[0];
  if (
    !order ||
    order.payment_status === 'paid' ||
    order.shipping_status !== 'pending' ||
    !order.payment_expires_at ||
    new Date(order.payment_expires_at).getTime() > Date.now()
  ) {
    return false;
  }
  const result = await cancelUnpaidOrder(cleanCode);
  return result.success === true;
}

async function expirePendingVietqrOrders() {
  const [rows] = await pool.query(
    `SELECT order_code
     FROM orders
     WHERE payment_method = 'vietqr_banking'
       AND payment_status = 'unpaid'
       AND shipping_status = 'pending'
       AND payment_expires_at IS NOT NULL
       AND payment_expires_at <= NOW()`
  );
  for (const row of rows) {
    await expireUnpaidOrderIfNeeded(row.order_code);
  }
  return rows.length;
}

function phaseForOrder(order) {
  if (order.customer_decision === 'received' || order.customer_decision === 'return_requested') return 5;
  return isConfirmedOrder(order) ? 1 : (ORDER_PHASE[order.shipping_status] ?? 0);
}

function statusLabelForOrder(order) {
  return isConfirmedOrder(order)
    ? 'Đã xác nhận'
    : (ORDER_STATUS_LABEL[order.shipping_status] || 'Đang cập nhật');
}

async function getOrderItems(connection, orderIds) {
  if (!orderIds.length) return [];
  const [items] = await connection.query(
    `SELECT oi.*, pv.product_id,
            COALESCE(pv.image_url, p.thumbnail_url,
              (SELECT pi.image_url FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1)) AS image_url,
            COALESCE(p.warranty_months, 12) AS warranty_months
     FROM order_items oi
     LEFT JOIN product_variants pv ON pv.id = oi.variant_id
     LEFT JOIN products p ON p.id = pv.product_id
     WHERE oi.order_id IN (?)
     ORDER BY oi.order_id, oi.id`,
    [orderIds]
  );
  return items;
}

function mapOrderItem(item) {
  return {
    ...item,
    id: Number(item.id),
    orderId: Number(item.order_id),
    productId: item.product_id == null ? null : Number(item.product_id),
    variantId: item.variant_id == null ? null : Number(item.variant_id),
    name: item.product_name,
    variant: item.variant_name,
    sku: item.sku,
    image: item.image_url || '',
    price: Number(item.unit_price),
    unit_price: Number(item.unit_price),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
    warrantyMonths: Number(item.warranty_months || 12)
  };
}

function mapCustomerOrder(order, items) {
  const shippingStatus = order.shipping_status;
  const createdAt =
    order.created_at instanceof Date
      ? order.created_at.toISOString()
      : new Date(order.created_at).toISOString();
  const updatedAt =
    order.updated_at instanceof Date
      ? order.updated_at.toISOString()
      : new Date(order.updated_at).toISOString();

  return {
    orderId: order.order_code,
    orderCode: order.order_code,
    date: createdAt,
    createdAt,
    updatedAt,
    phase: phaseForOrder(order),
    shippingStatus,
    orderStatus: shippingStatus,
    statusLabel: statusLabelForOrder(order),
    customerDecision: order.customer_decision || null,
    paymentStatus: order.payment_status,
    paymentExpiresAt: order.payment_expires_at
      ? new Date(order.payment_expires_at).toISOString()
      : null,
    paymentMethod: PAYMENT_METHOD_LABEL[order.payment_method] || order.payment_method,
    paymentMethodCode: order.payment_method,
    awaitingPayment: isAwaitingPayment(order),
    total: Number(order.final_amount),
    subtotal: Number(order.total_amount),
    discountAmount: Number(order.discount_amount || 0),
    shippingFee: Number(order.shipping_fee || 0),
    deliveryMethod: order.delivery_method || 'express',
    shippingDistanceKm: order.shipping_distance_km == null ? 5.4 : Number(order.shipping_distance_km),
    deliveryStoreName: order.delivery_store_name || shippingService.STORES[0].name,
    recipientName: order.recipient_name,
    recipientPhone: order.recipient_phone,
    shippingAddress: order.shipping_address,
    customer: {
      fullName: order.recipient_name,
      phone: order.recipient_phone,
      address: order.shipping_address
    },
    cancellationRequestedAt: order.cancel_requested_at
      ? new Date(order.cancel_requested_at).toISOString()
      : null,
    cancellationReason: order.cancel_request_reason || '',
    canRequestCancellation:
      ['pending', 'processing'].includes(shippingStatus) && !order.cancel_requested_at,
    carrier:
      order.carrier ||
      (shippingStatus === 'delivered' || shippingStatus === 'completed'
        ? 'Giao Hàng Tiết Kiệm (GHTK)'
        : 'GIAO HÀNG NHANH (GHN)'),
    trackingCode:
      order.tracking_code ||
      (order.order_code
        ? `GHN${String(order.order_code).replace(/[^0-9]/g, '').slice(-9).padStart(9, '5')}`
        : 'GHN582019374'),
    items: items.map(mapOrderItem)
  };
}

async function getAllOrders({ customerId, sessionToken, phone, limit = 50 } = {}) {
  let whereConditions = [];
  let queryParams = [];

  if (customerId) {
    whereConditions.push('customer_id = ?');
    queryParams.push(Number(customerId));
  } else if (sessionToken) {
    const guestId = await cartService.findGuestIdBySession(pool, sessionToken);
    if (guestId) {
      whereConditions.push('guest_id = ?');
      queryParams.push(guestId);
    }
  } else if (phone) {
    whereConditions.push('recipient_phone = ?');
    queryParams.push(phone);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [orders] = await pool.query(
    `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC, id DESC LIMIT ?`,
    [...queryParams, parsedLimit]
  );

  if (!orders.length) return [];

  const orderIds = orders.map(order => Number(order.id));
  const items = await getOrderItems(pool, orderIds);
  const itemsByOrderId = new Map(orderIds.map(id => [id, []]));
  for (const item of items) itemsByOrderId.get(Number(item.order_id))?.push(item);

  return orders.map(order => mapCustomerOrder(order, itemsByOrderId.get(Number(order.id)) || []));
}

async function getCustomerOrders(customerId) {
  const [orders] = await pool.query(
    `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`,
    [customerId]
  );
  if (!orders.length) return [];

  const orderIds = orders.map(order => Number(order.id));
  const items = await getOrderItems(pool, orderIds);
  const itemsByOrderId = new Map(orderIds.map(id => [id, []]));
  for (const item of items) itemsByOrderId.get(Number(item.order_id))?.push(item);

  return orders.map(order => mapCustomerOrder(order, itemsByOrderId.get(Number(order.id)) || []));
}

async function requestOrderCancellation(customerId, orderCode, reason) {
  const cleanCode = String(orderCode || '').trim();
  const cleanReason = String(reason || '').trim();
  if (!cleanCode) throw httpError('Mã đơn hàng không hợp lệ.');
  if (cleanReason.length < 5 || cleanReason.length > 500) {
    throw httpError('Lý do hủy đơn phải từ 5 đến 500 ký tự.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT id, customer_id, recipient_name, payment_method, payment_status, shipping_status, cancel_requested_at, cancel_request_reason
       FROM orders WHERE order_code = ? LIMIT 1 FOR UPDATE`,
      [cleanCode]
    );
    if (!rows.length) throw httpError('Không tìm thấy đơn hàng.', 404);
    const order = rows[0];
    if (customerId && Number(order.customer_id) !== Number(customerId)) {
      throw httpError('Bạn không có quyền thao tác đơn hàng này.', 403);
    }
    if (order.shipping_status === 'cancelled') {
      await connection.commit();
      return { orderCode: cleanCode, reason: cleanReason, alreadyRequested: true };
    }
    if (!['pending', 'processing'].includes(order.shipping_status)) {
      throw httpError('Đơn hàng đã bàn giao vận chuyển, không thể hủy trực tiếp.', 409);
    }

    // Hoàn trả lại tồn kho sản phẩm khi đơn bị hủy
    const [items] = await connection.query(
      `SELECT variant_id, quantity FROM order_items WHERE order_id = ?`,
      [order.id]
    );
    for (const item of items) {
      if (item.variant_id && item.quantity > 0) {
        await connection.query(
          `UPDATE product_variants
           SET stock = stock + ?,
               status = CASE WHEN stock + ? > 0 THEN 'available' ELSE status END,
               updated_at = NOW()
           WHERE id = ?`,
          [item.quantity, item.quantity, item.variant_id]
        );
      }
    }

    // Cập nhật trạng thái đơn sang cancelled
    await connection.query(
      `UPDATE orders 
       SET shipping_status = 'cancelled',
           cancel_request_reason = ?, 
           cancel_requested_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [cleanReason, order.id]
    );
    await connection.commit();

    // Phát sự kiện realtime SSE tới bàn làm việc Staff tự động
    publishStaffEvent('order.cancelled', {
      orderCode: cleanCode,
      reason: cleanReason,
      customerName: order.recipient_name,
      previousStatus: order.shipping_status
    });

    return { orderCode: cleanCode, reason: cleanReason, status: 'cancelled' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrderStatus(orderCode, shippingStatus) {
  const allowedStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(shippingStatus)) {
    throw httpError('Trạng thái giao hàng không hợp lệ.');
  }
  const cleanCode = String(orderCode || '').trim();
  const [rows] = await pool.query(
    'SELECT shipping_status, payment_method, payment_status FROM orders WHERE order_code = ? LIMIT 1',
    [cleanCode]
  );
  const order = rows[0];
  if (!order) throw httpError('Không tìm thấy đơn hàng.', 404);
  const validTransition =
    shippingStatus === 'cancelled'
      ? ['pending', 'processing'].includes(order.shipping_status)
      : (order.shipping_status === 'pending' &&
          shippingStatus === 'processing' &&
          (order.payment_method === 'cod' || order.payment_status === 'paid')) ||
        (order.shipping_status === 'processing' && shippingStatus === 'shipping') ||
        (order.shipping_status === 'shipping' && shippingStatus === 'delivered');
  if (!validTransition) {
    throw httpError('Không thể chuyển trạng thái đơn hàng theo thứ tự hiện tại.', 409);
  }
  const [result] = await pool.query(
    `UPDATE orders SET shipping_status = ?,
       payment_status = CASE WHEN ? = 'delivered' AND payment_method = 'cod' THEN 'paid' ELSE payment_status END,
       updated_at = NOW() WHERE order_code = ?`,
    [shippingStatus, shippingStatus, cleanCode]
  );
  if (result.affectedRows !== 1) throw httpError('Không tìm thấy đơn hàng.', 404);
  publishStaffEvent('order.status_changed', { orderCode: cleanCode, shippingStatus });
  return { orderCode: cleanCode, shippingStatus };
}

async function confirmCustomerDecision(customerId, orderCode, decision) {
  if (!['received', 'return_requested'].includes(decision)) {
    throw httpError('Lựa chọn nhận hàng không hợp lệ.');
  }
  const cleanCode = String(orderCode || '').trim();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT id, customer_id, shipping_status, customer_decision FROM orders WHERE order_code = ? LIMIT 1 FOR UPDATE',
      [cleanCode]
    );
    const order = rows[0];
    if (!order) throw httpError('Không tìm thấy đơn hàng.', 404);
    if (customerId && Number(order.customer_id) !== Number(customerId)) {
      throw httpError('Bạn không có quyền thao tác đơn hàng này.', 403);
    }
    if (order.shipping_status !== 'delivered') {
      throw httpError('Chỉ được chọn kết quả sau khi đơn đã giao thành công.', 409);
    }
    if (order.customer_decision) {
      throw httpError('Đơn hàng đã được xác nhận trước đó.', 409);
    }
    await connection.query(
      'UPDATE orders SET customer_decision = ?, updated_at = NOW() WHERE id = ?',
      [decision, order.id]
    );
    if (decision === 'return_requested') {
      await connection.query(
        `INSERT INTO return_requests (order_id, customer_id, reason, refund_method)
         VALUES (?, ?, 'Khách hàng yêu cầu trả hàng sau khi nhận hàng.', 'manual_bank')`,
        [order.id, order.customer_id]
      );
    }
    await connection.commit();
    publishStaffEvent('order.customer_decision', { orderCode: cleanCode, decision, phase: 5 });
    return { orderCode: cleanCode, decision, phase: 5 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requestReturn(customerId, orderCode, reason) {
  const cleanCode = String(orderCode || '').trim();
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 5 || cleanReason.length > 500) {
    throw httpError('Lý do trả hàng phải từ 5 đến 500 ký tự.');
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      `SELECT id, customer_id, shipping_status, payment_method, updated_at
       FROM orders WHERE order_code = ? LIMIT 1 FOR UPDATE`,
      [cleanCode]
    );
    const order = orders[0];
    if (!order) throw httpError('Không tìm thấy đơn hàng.', 404);
    if (customerId && Number(order.customer_id) !== Number(customerId)) {
      throw httpError('Bạn không có quyền thao tác đơn hàng này.', 403);
    }
    if (order.shipping_status !== 'delivered') {
      throw httpError('Chỉ được yêu cầu trả hàng sau khi đã giao thành công.', 409);
    }
    if (new Date(order.updated_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000) {
      throw httpError('Đã quá thời hạn yêu cầu trả hàng 7 ngày.', 409);
    }
    const [recent] = await connection.query(
      `SELECT id FROM return_requests
       WHERE order_id = ? AND status IN ('pending', 'approved', 'refunded') LIMIT 1`,
      [order.id]
    );
    if (recent.length) throw httpError('Đơn hàng đã có yêu cầu trả/hoàn tiền.', 409);
    await connection.query(
      `INSERT INTO return_requests (order_id, customer_id, reason, refund_method)
       VALUES (?, ?, ?, ?)`,
      [order.id, order.customer_id, cleanReason, order.payment_method === 'cod' ? 'manual_bank' : 'original_method']
    );
    await connection.query(
      `UPDATE orders SET customer_decision = 'return_requested', updated_at = NOW() WHERE id = ?`,
      [order.id]
    );
    await connection.commit();
    publishStaffEvent('order.customer_decision', {
      orderCode: cleanCode,
      decision: 'return_requested',
      phase: 5
    });
    return { success: true, message: 'Đã gửi yêu cầu trả hàng, chờ manager xét duyệt.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getReturnRequests() {
  const [rows] = await pool.query(
    `SELECT rr.*, o.order_code, o.payment_method, o.final_amount,
            COALESCE(
              (
                SELECT GROUP_CONCAT(DISTINCT oi.product_name ORDER BY oi.id SEPARATOR ', ')
                FROM order_items oi
                WHERE oi.order_id = rr.order_id
              ),
              'Sản phẩm trong đơn hàng'
            ) AS product_name,
            COALESCE(o.recipient_name, c.name, 'Khách hàng') AS customer_name,
            COALESCE(o.recipient_phone, c.phone, '') AS customer_phone
     FROM return_requests rr
     JOIN orders o ON o.id = rr.order_id
     LEFT JOIN customers c ON c.id = rr.customer_id
     ORDER BY rr.created_at DESC`
  );
  return rows;
}

async function reviewReturnRequest(requestId, status, managerNote = '') {
  if (!['approved', 'rejected'].includes(status)) throw httpError('Trạng thái xử lý không hợp lệ.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT * FROM return_requests WHERE id = ? LIMIT 1 FOR UPDATE',
      [Number(requestId)]
    );
    const request = rows[0];
    if (!request) throw httpError('Không tìm thấy yêu cầu trả hàng.', 404);
    if (request.status !== 'pending') throw httpError('Yêu cầu này đã được xử lý.', 409);
    if (status === 'approved') {
      const [items] = await connection.query(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
        [request.order_id]
      );
      for (const item of items) {
        if (item.variant_id) {
          await connection.query(
            `UPDATE product_variants SET stock = stock + ?, status = 'available', updated_at = NOW()
             WHERE id = ?`,
            [item.quantity, item.variant_id]
          );
        }
      }
      await connection.query(
        `UPDATE orders SET payment_status = 'refunded', shipping_status = 'cancelled', updated_at = NOW()
         WHERE id = ?`,
        [request.order_id]
      );
    }
    await connection.query(
      'UPDATE return_requests SET status = ?, manager_note = ?, updated_at = NOW() WHERE id = ?',
      [status, String(managerNote || '').trim() || null, request.id]
    );
    await connection.commit();
    return { success: true, message: status === 'approved' ? 'Đã duyệt return và ghi nhận refund.' : 'Đã từ chối yêu cầu.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelUnpaidOrder(orderCode) {
  const cleanCode = String(orderCode || '').trim();
  if (!cleanCode) return { success: false, message: 'Mã đơn hàng không hợp lệ.' };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT id, payment_status, shipping_status FROM orders WHERE order_code = ? LIMIT 1 FOR UPDATE`,
      [cleanCode]
    );
    if (!rows.length) {
      await connection.rollback();
      return { success: false, message: 'Không tìm thấy đơn hàng.' };
    }
    const order = rows[0];

    // Chỉ hủy nếu đơn hàng chưa được thanh toán thành công
    if (order.payment_status === 'paid') {
      await connection.rollback();
      return { success: false, message: 'Đơn hàng đã được thanh toán, không thể hủy draft.' };
    }

    // Hoàn trả lại tồn kho sản phẩm
    const [items] = await connection.query(
      `SELECT variant_id, quantity FROM order_items WHERE order_id = ?`,
      [order.id]
    );
    for (const item of items) {
      if (item.variant_id && item.quantity > 0) {
        await connection.query(
          `UPDATE product_variants
           SET stock = stock + ?,
               status = CASE WHEN stock + ? > 0 THEN 'available' ELSE status END,
               updated_at = NOW()
           WHERE id = ?`,
          [item.quantity, item.quantity, item.variant_id]
        );
      }
    }

    // Xóa order_items và orders để không lưu vào danh sách đơn hàng
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [order.id]);
    await connection.query('DELETE FROM orders WHERE id = ?', [order.id]);

    await connection.commit();
    return { success: true, message: 'Đã hủy đơn hàng chưa thanh toán và hoàn lại giỏ hàng.' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  cancelUnpaidOrder,
  createOrder,
  expirePendingVietqrOrders,
  expireUnpaidOrderIfNeeded,
  requestOrderCancellation,
  requestReturn,
  updateOrderStatus,
  getReturnRequests,
  reviewReturnRequest,
  confirmCustomerDecision,
  getOrderByCode,
  getCustomerOrders,
  getAllOrders,
  phaseForOrder,
  statusLabelForOrder,
  generateVietQRUrl
};
