const orderService = require('../services/order.service');

async function list(req, res) {
  try {
    return res.json({ success: true, data: await orderService.getReturnRequests() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function review(req, res) {
  try {
    return res.json({
      success: true,
      data: await orderService.reviewReturnRequest(req.params.id, req.body?.status, req.body?.managerNote)
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}

module.exports = { list, review };
