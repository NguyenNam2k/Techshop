const pool = require('../../config/db');

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getOrCreateGuest(sessionToken, connection) {
  if (typeof sessionToken !== 'string' ||
      sessionToken.length < 16 ||
      sessionToken.length > 100 ||
      !/^[A-Za-z0-9_-]+$/.test(sessionToken)) {
    throw httpError('A valid guest session token is required');
  }

  const [rows] = await connection.query(
    'SELECT id FROM guests WHERE session_token = ? LIMIT 1',
    [sessionToken]
  );
  if (rows.length) return rows[0].id;

  try {
    const [result] = await connection.query(
      'INSERT INTO guests (session_token, created_at) VALUES (?, NOW())',
      [sessionToken]
    );
    return result.insertId;
  } catch (error) {
    // Another request using this session may have created the guest concurrently.
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const [existing] = await connection.query(
      'SELECT id FROM guests WHERE session_token = ? LIMIT 1',
      [sessionToken]
    );
    if (!existing.length) throw error;
    return existing[0].id;
  }
}

async function resolveOwner(connection, { customerId, sessionToken }) {
  if (customerId) return { column: 'customer_id', id: customerId };
  return {
    column: 'guest_id',
    id: await getOrCreateGuest(sessionToken, connection)
  };
}

// Read-only guest lookup: merging must never create a guest row for a session
// that has no cart, otherwise every login would leave an empty guest behind.
async function findGuestIdBySession(connection, sessionToken) {
  if (typeof sessionToken !== 'string' ||
      sessionToken.length < 16 ||
      sessionToken.length > 100 ||
      !/^[A-Za-z0-9_-]+$/.test(sessionToken)) {
    return null;
  }

  const [rows] = await connection.query(
    'SELECT id FROM guests WHERE session_token = ? LIMIT 1',
    [sessionToken]
  );
  return rows.length ? rows[0].id : null;
}

async function getCartItemsWithConnection(connection, owner) {
  const [rows] = await connection.query(
    `SELECT ci.id, ci.quantity, ci.variant_id,
            pv.sku, pv.color, pv.color_code, pv.spec_version, pv.price, pv.stock,
            pv.status AS variant_status, pv.image_url AS variant_image,
            p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
            p.brand, p.thumbnail_url
     FROM cart_items ci
     JOIN product_variants pv ON ci.variant_id = pv.id
     JOIN products p ON pv.product_id = p.id
     WHERE ci.${owner.column} = ?
     ORDER BY ci.id DESC`,
    [owner.id]
  );

  const productIds = [...new Set(rows.map(row => row.product_id))];
  const variantsByProduct = {};
  if (productIds.length) {
    const placeholders = productIds.map(() => '?').join(',');
    const [variants] = await connection.query(
      `SELECT id, product_id, sku, color, color_code, spec_version, price, stock, status, image_url
       FROM product_variants
       WHERE product_id IN (${placeholders})
       ORDER BY id`,
      productIds
    );
    variants.forEach(variant => {
      (variantsByProduct[variant.product_id] ||= []).push({
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        color_code: variant.color_code,
        spec_version: variant.spec_version,
        price: Number(variant.price),
        stock: Number(variant.stock) || 0,
        status: variant.status,
        image_url: variant.image_url
      });
    });
  }

  let cartSubtotal = 0;
  let cartCount = 0;
  const items = rows.map(row => {
    const price = Number(row.price);
    const quantity = Number(row.quantity);
    const subtotal = price * quantity;
    cartSubtotal += subtotal;
    cartCount += quantity;

    return {
      id: row.id,
      variant_id: row.variant_id,
      variantId: row.variant_id,
      quantity,
      price,
      subtotal,
      product: {
        id: row.product_id,
        name: row.product_name,
        slug: row.product_slug,
        brand: row.brand,
        thumbnail_url: row.thumbnail_url,
        available_variants: variantsByProduct[row.product_id] || []
      },
      variant: {
        id: row.variant_id,
        sku: row.sku,
        color: row.color,
        color_code: row.color_code,
        spec_version: row.spec_version,
        price,
        stock: Number(row.stock) || 0,
        status: row.variant_status,
        image_url: row.variant_image || row.thumbnail_url
      }
    };
  });

  return { items, cartSubtotal, cartCount };
}

async function getCartItems(identity) {
  const connection = await pool.getConnection();
  try {
    const owner = await resolveOwner(connection, identity);
    return await getCartItemsWithConnection(connection, owner);
  } finally {
    connection.release();
  }
}

async function addItem({ customerId, sessionToken, variantId, productId, quantity = 1 }) {
  const parsedVariantId = Number(variantId);
  const parsedProductId = productId == null ? null : Number(productId);
  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedVariantId) || parsedVariantId < 1) {
    throw httpError('A valid variantId is required');
  }
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 99) {
    throw httpError('Quantity must be an integer between 1 and 99');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const owner = await resolveOwner(connection, { customerId, sessionToken });
    const [variantRows] = await connection.query(
      `SELECT pv.id, pv.product_id, pv.stock, pv.status, p.status AS product_status
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ?
       FOR UPDATE`,
      [parsedVariantId]
    );
    const variant = variantRows[0];
    if (!variant || (parsedProductId && Number(variant.product_id) !== parsedProductId)) {
      throw httpError('The selected product configuration was not found', 404);
    }
    if (variant.product_status !== 'active' || variant.status === 'discontinued') {
      throw httpError('This product configuration is unavailable', 409);
    }

    const [existingRows] = await connection.query(
      `SELECT id, quantity FROM cart_items
       WHERE ${owner.column} = ? AND variant_id = ?
       ORDER BY id
       LIMIT 1
       FOR UPDATE`,
      [owner.id, parsedVariantId]
    );
    const currentQuantity = Number(existingRows[0]?.quantity || 0);
    const nextQuantity = currentQuantity + parsedQuantity;
    if (nextQuantity > Number(variant.stock)) {
      throw httpError(`Only ${Number(variant.stock)} unit(s) are currently in stock`, 409);
    }

    if (existingRows.length) {
      await connection.query(
        'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [nextQuantity, existingRows[0].id]
      );
    } else {
      await connection.query(
        `INSERT INTO cart_items (${owner.column}, variant_id, quantity, created_at)
         VALUES (?, ?, ?, NOW())`,
        [owner.id, parsedVariantId, parsedQuantity]
      );
    }

    await connection.commit();
    return await getCartItemsWithConnection(connection, owner);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateItem({ customerId, sessionToken, itemId, quantity, variantId }) {
  const parsedItemId = Number(itemId);
  if (!Number.isInteger(parsedItemId) || parsedItemId < 1) {
    throw httpError('A valid cart item ID is required');
  }
  if (quantity !== undefined &&
      (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 99)) {
    throw httpError('Quantity must be an integer between 1 and 99');
  }
  if (variantId !== undefined &&
      (!Number.isInteger(Number(variantId)) || Number(variantId) < 1)) {
    throw httpError('A valid variantId is required');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const owner = await resolveOwner(connection, { customerId, sessionToken });
    const [itemRows] = await connection.query(
      `SELECT ci.id, ci.variant_id, ci.quantity, pv.product_id
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.id = ? AND ci.${owner.column} = ?
       FOR UPDATE`,
      [parsedItemId, owner.id]
    );
    const item = itemRows[0];
    if (!item) throw httpError('Cart item not found', 404);

    const targetVariantId = variantId === undefined ? Number(item.variant_id) : Number(variantId);
    const [variantRows] = await connection.query(
      `SELECT pv.id, pv.product_id, pv.stock, pv.status, p.status AS product_status
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ?
       FOR UPDATE`,
      [targetVariantId]
    );
    const variant = variantRows[0];
    if (!variant || Number(variant.product_id) !== Number(item.product_id)) {
      throw httpError('Choose a configuration of the same product', 400);
    }
    if (variant.product_status !== 'active' || variant.status === 'discontinued') {
      throw httpError('This product configuration is unavailable', 409);
    }

    const requestedQuantity = quantity === undefined ? Number(item.quantity) : Number(quantity);
    const [duplicateRows] = targetVariantId === Number(item.variant_id)
      ? [[]]
      : await connection.query(
        `SELECT id, quantity FROM cart_items
         WHERE ${owner.column} = ? AND variant_id = ? AND id <> ?
         ORDER BY id
         LIMIT 1
         FOR UPDATE`,
        [owner.id, targetVariantId, parsedItemId]
      );
    const finalQuantity = requestedQuantity + Number(duplicateRows[0]?.quantity || 0);
    if (finalQuantity > Number(variant.stock)) {
      throw httpError(`Only ${Number(variant.stock)} unit(s) are currently in stock`, 409);
    }

    if (duplicateRows.length) {
      await connection.query(
        'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [finalQuantity, duplicateRows[0].id]
      );
      await connection.query('DELETE FROM cart_items WHERE id = ?', [parsedItemId]);
    } else {
      await connection.query(
        `UPDATE cart_items SET variant_id = ?, quantity = ?, updated_at = NOW()
         WHERE id = ? AND ${owner.column} = ?`,
        [targetVariantId, finalQuantity, parsedItemId, owner.id]
      );
    }

    await connection.commit();
    return await getCartItemsWithConnection(connection, owner);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function removeItem({ customerId, sessionToken, itemId }) {
  const connection = await pool.getConnection();
  try {
    const owner = await resolveOwner(connection, { customerId, sessionToken });
    await connection.query(
      `DELETE FROM cart_items WHERE id = ? AND ${owner.column} = ?`,
      [itemId, owner.id]
    );
    return await getCartItemsWithConnection(connection, owner);
  } finally {
    connection.release();
  }
}

async function clearCart(identity) {
  const connection = await pool.getConnection();
  try {
    const owner = await resolveOwner(connection, identity);
    await connection.query(
      `DELETE FROM cart_items WHERE ${owner.column} = ?`,
      [owner.id]
    );
    return { items: [], cartSubtotal: 0, cartCount: 0 };
  } finally {
    connection.release();
  }
}

async function replaceCartItems({ customerId, sessionToken, items = [] }) {
  if (!Array.isArray(items) || items.length > 100) {
    throw httpError('Cart must contain no more than 100 items');
  }

  const quantities = new Map();
  for (const item of items) {
    const variantId = Number(item.variantId ?? item.variant_id ?? item.variant?.id);
    const productId = item.productId ?? item.product?.id;
    const quantity = Number(item.quantity);
    if (!Number.isInteger(variantId) || variantId < 1 ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw httpError('Cart contains an invalid product configuration or quantity');
    }
    const current = quantities.get(variantId);
    quantities.set(variantId, {
      productId: productId == null ? null : Number(productId),
      quantity: (current?.quantity || 0) + quantity
    });
    if (quantities.get(variantId).quantity > 99) {
      throw httpError('A cart configuration cannot exceed 99 units');
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const owner = await resolveOwner(connection, { customerId, sessionToken });
    for (const [variantId, requested] of quantities) {
      const [rows] = await connection.query(
        `SELECT pv.id, pv.product_id, pv.stock, pv.status, p.status AS product_status
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id = ?
         FOR UPDATE`,
        [variantId]
      );
      const variant = rows[0];
      if (!variant || (requested.productId && Number(variant.product_id) !== requested.productId)) {
        throw httpError('Cart contains an unknown product configuration', 404);
      }
      if (variant.product_status !== 'active' || variant.status === 'discontinued') {
        throw httpError('Cart contains an unavailable product configuration', 409);
      }
      if (requested.quantity > Number(variant.stock)) {
        throw httpError(`Only ${Number(variant.stock)} unit(s) are currently in stock`, 409);
      }
    }

    await connection.query(
      `DELETE FROM cart_items WHERE ${owner.column} = ?`,
      [owner.id]
    );
    for (const [variantId, requested] of quantities) {
      await connection.query(
        `INSERT INTO cart_items (${owner.column}, variant_id, quantity, created_at)
         VALUES (?, ?, ?, NOW())`,
        [owner.id, variantId, requested.quantity]
      );
    }

    await connection.commit();
    return await getCartItemsWithConnection(connection, owner);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Moves the caller's guest cart into their authenticated customer cart.
 *
 * The customer identity always comes from the verified token, never from the
 * request body or headers, so a request cannot merge into somebody else's cart.
 * Everything happens in one transaction: quantities for the same variant are
 * summed, stock and the 99-unit cap are re-checked, and the guest rows are
 * deleted only after every line moved. Any failure rolls the whole thing back,
 * leaving the guest cart untouched and no half-written customer cart behind.
 */
async function mergeGuestCart({ customerId, sessionToken }) {
  const parsedCustomerId = Number(customerId);
  if (!Number.isInteger(parsedCustomerId) || parsedCustomerId < 1) {
    throw httpError('Bạn cần đăng nhập bằng tài khoản khách hàng để gộp giỏ hàng.', 401);
  }

  const customerOwner = { column: 'customer_id', id: parsedCustomerId };
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const guestId = await findGuestIdBySession(connection, sessionToken);

    // No guest session or no guest cart is not an error: the caller simply gets
    // their current customer cart back.
    if (guestId == null) {
      await connection.commit();
      return await getCartItemsWithConnection(connection, customerOwner);
    }

    const [guestRows] = await connection.query(
      `SELECT variant_id, quantity
       FROM cart_items
       WHERE guest_id = ?
       ORDER BY id
       FOR UPDATE`,
      [guestId]
    );

    if (!guestRows.length) {
      await connection.commit();
      return await getCartItemsWithConnection(connection, customerOwner);
    }

    const [customerRows] = await connection.query(
      `SELECT id, variant_id, quantity
       FROM cart_items
       WHERE customer_id = ?
       ORDER BY id
       FOR UPDATE`,
      [parsedCustomerId]
    );

    // variantId -> { rowId, quantity }. rowId is null when the line only exists
    // in the guest cart and therefore has to be inserted.
    const merged = new Map();
    const duplicateRowIds = [];

    for (const row of customerRows) {
      const variantId = Number(row.variant_id);
      const existing = merged.get(variantId);
      if (existing) {
        // Defensive: the API never writes two rows for one variant, but a merge
        // must not double-count if legacy data does.
        existing.quantity += Number(row.quantity);
        duplicateRowIds.push(row.id);
        continue;
      }
      merged.set(variantId, { rowId: row.id, quantity: Number(row.quantity) });
    }

    for (const row of guestRows) {
      const variantId = Number(row.variant_id);
      const existing = merged.get(variantId);
      if (existing) {
        existing.quantity += Number(row.quantity);
        continue;
      }
      merged.set(variantId, { rowId: null, quantity: Number(row.quantity) });
    }

    // Validate every merged line before touching the customer cart. Throwing
    // here means nothing was written yet, so the rollback is a no-op.
    for (const [variantId, entry] of merged) {
      if (entry.quantity > 99) {
        throw httpError(
          'Giỏ hàng sau khi gộp vượt quá 99 sản phẩm cho một cấu hình. Vui lòng giảm số lượng rồi thử lại.',
          409
        );
      }

      const [variantRows] = await connection.query(
        `SELECT pv.id, pv.stock, pv.status, p.status AS product_status
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id = ?
         FOR UPDATE`,
        [variantId]
      );
      const variant = variantRows[0];
      if (!variant) {
        throw httpError('Giỏ hàng đang chứa cấu hình sản phẩm không còn tồn tại.', 404);
      }
      if (variant.product_status !== 'active' || variant.status === 'discontinued') {
        throw httpError('Giỏ hàng đang chứa cấu hình sản phẩm không còn khả dụng.', 409);
      }
      if (entry.quantity > Number(variant.stock)) {
        throw httpError(
          `Gộp giỏ hàng sẽ vượt quá tồn kho: cấu hình này chỉ còn ${Number(variant.stock)} sản phẩm. ` +
          'Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng giảm số lượng rồi thử lại.',
          409
        );
      }
    }

    for (const [variantId, entry] of merged) {
      if (entry.rowId == null) {
        await connection.query(
          `INSERT INTO cart_items (customer_id, variant_id, quantity, created_at)
           VALUES (?, ?, ?, NOW())`,
          [parsedCustomerId, variantId, entry.quantity]
        );
        continue;
      }
      await connection.query(
        'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [entry.quantity, entry.rowId]
      );
    }

    if (duplicateRowIds.length) {
      const placeholders = duplicateRowIds.map(() => '?').join(', ');
      await connection.query(`DELETE FROM cart_items WHERE id IN (${placeholders})`, duplicateRowIds);
    }

    // Guest rows are deleted last: a failure anywhere above keeps them intact.
    await connection.query('DELETE FROM cart_items WHERE guest_id = ?', [guestId]);

    await connection.commit();
    return await getCartItemsWithConnection(connection, customerOwner);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getOrCreateGuest,
  findGuestIdBySession,
  getCartItems,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  replaceCartItems,
  mergeGuestCart
};
