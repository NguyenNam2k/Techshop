const cartService = require('../services/cart.service');

function extractClientContext(req) {
  // customerId must come from trusted authentication middleware, never a client header/body.
  const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;
  const sessionToken = String(req.headers['x-session-token'] || '').trim();
  return {
    customerId: Number.isInteger(customerId) && customerId > 0 ? customerId : null,
    sessionToken
  };
}

function sendError(res, error) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Unable to update cart'
  });
}

async function getCart(req, res) {
  try {
    const data = await cartService.getCartItems(extractClientContext(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
}

async function addItem(req, res) {
  try {
    const { variantId, productId, quantity = 1 } = req.body;
    const data = await cartService.addItem({
      ...extractClientContext(req),
      variantId,
      productId,
      quantity
    });
    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateItem(req, res) {
  try {
    const data = await cartService.updateItem({
      ...extractClientContext(req),
      itemId: req.params.id,
      quantity: req.body.quantity,
      variantId: req.body.variantId
    });
    return res.status(200).json({ success: true, message: 'Cart updated', data });
  } catch (error) {
    return sendError(res, error);
  }
}

async function removeItem(req, res) {
  try {
    const data = await cartService.removeItem({
      ...extractClientContext(req),
      itemId: req.params.id
    });
    return res.status(200).json({ success: true, message: 'Item removed', data });
  } catch (error) {
    return sendError(res, error);
  }
}

async function clearCart(req, res) {
  try {
    const data = await cartService.clearCart(extractClientContext(req));
    return res.status(200).json({ success: true, message: 'Cart cleared', data });
  } catch (error) {
    return sendError(res, error);
  }
}

async function syncCart(req, res) {
  try {
    const data = await cartService.replaceCartItems({
      ...extractClientContext(req),
      items: req.body.items || []
    });
    return res.status(200).json({ success: true, message: 'Cart synchronized', data });
  } catch (error) {
    return sendError(res, error);
  }
}

// Merges the guest cart identified by x-session-token into the authenticated
// customer's cart. The customer identity is taken from req.user only, so the
// client can never choose which customer receives the items.
async function mergeCart(req, res) {
  try {
    const sessionToken = String(req.headers['x-session-token'] || '').trim();
    const data = await cartService.mergeGuestCart({
      customerId: req.user?.role === 'customer' ? Number(req.user.id) : null,
      sessionToken
    });
    return res.status(200).json({ success: true, message: 'Cart merged', data });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  extractClientContext,
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  syncCart,
  mergeCart
};
