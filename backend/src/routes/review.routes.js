const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id AS review_id, r.product_id, p.name AS product_name,
             r.customer_name, r.rating, r.comment, r.is_verified_buyer,
             r.likes, r.status, r.created_at,
             r.staff_reply, r.staff_replied_at
      FROM reviews r
      LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List reviews error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/reply', async (req, res) => {
  try {
    const replyText = req.body.reply || req.body.staff_reply;
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống.' });
    }
    await pool.query(
      'UPDATE reviews SET staff_reply = ?, staff_replied_at = NOW() WHERE id = ?',
      [replyText.trim(), req.params.id]
    );
    return res.json({ success: true, message: 'Đã gửi phản hồi đánh giá thành công!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id/reply', async (req, res) => {
  try {
    await pool.query(
      'UPDATE reviews SET staff_reply = NULL, staff_replied_at = NULL WHERE id = ?',
      [req.params.id]
    );
    return res.json({ success: true, message: 'Đã thu hồi phản hồi đánh giá.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'pending', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
    }
    await pool.query('UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?', [
      status,
      req.params.id
    ]);
    return res.json({ success: true, message: 'Cập nhật trạng thái đánh giá thành công.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

