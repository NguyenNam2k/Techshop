const shippingService = require('../services/shipping.service');

async function getQuote(req, res) {
  try {
    const quote = await shippingService.calculateShippingQuote({
      provinceId: req.body?.provinceId,
      wardId: req.body?.wardId
    });
    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    const provinceId = String(req.body?.provinceId ?? '').replace(/[\r\n]/g, '').slice(0, 32);
    const wardId = String(req.body?.wardId ?? '').replace(/[\r\n]/g, '').slice(0, 32);
    console.error(
      `Error in shipping quote (provinceId=${provinceId}, wardId=${wardId}):`,
      error.message
    );
    return res.status(error.statusCode || 503).json({
      success: false,
      message: error.message || 'Không thể ước tính phí giao hàng lúc này.'
    });
  }
}

module.exports = { getQuote };
