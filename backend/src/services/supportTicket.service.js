const pool = require('../config/database');

const CATEGORY_LABELS = {
  general: 'Tư vấn chung',
  tech_support: 'Hỗ trợ kỹ thuật & Lỗi linh kiện',
  build_pc: 'Tư vấn cấu hình PC',
  delivery: 'Vận chuyển & Giao hàng',
  warranty: 'Bảo hành & Đổi trả',
  order: 'Đơn hàng & Thanh toán'
};

const PRIORITY_LABELS = {
  low: 'Tiêu chuẩn',
  medium: 'Bình thường',
  high: 'Ưu tiên cao',
  urgent: 'Khẩn cấp'
};

const TICKET_STATUSES = ['open', 'in_progress', 'closed'];
const SENDER_TYPES = ['customer', 'staff', 'system'];

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatClock(value) {
  const date = toDate(value);
  return date ? `${pad2(date.getHours())}:${pad2(date.getMinutes())}` : '';
}

function formatDayLabel(value) {
  const date = toDate(value);
  if (!date) return '';
  if (date.toDateString() === new Date().toDateString()) return 'Hôm nay';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatStamp(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${formatClock(date)}`;
}

function mapMessage(row) {
  return {
    id: `m-${row.id}`,
    sender: row.sender_type,
    sender_name: row.sender_name || '',
    text: row.text,
    time: formatClock(row.created_at),
    date: formatDayLabel(row.created_at)
  };
}

function mapTicket(row, messages = []) {
  return {
    ticket_id: row.ticket_code,
    customer_id: row.customer_id || null,
    customer_name: row.customer_name || 'Khách hàng',
    customer_phone: row.customer_phone || '',
    customer_email: row.customer_email || '',
    customer_address: row.customer_address || '',
    order_code: row.order_code || '',
    order_amount: Number(row.order_amount || 0),
    category: row.category || 'general',
    category_label: CATEGORY_LABELS[row.category] || CATEGORY_LABELS.general,
    priority: row.priority || 'medium',
    priority_label: PRIORITY_LABELS[row.priority] || PRIORITY_LABELS.medium,
    status: row.status || 'open',
    assigned_staff: row.assigned_staff || '',
    subject: row.subject || '',
    internal_notes: row.internal_notes || '',
    unread: Number(row.unread || 0),
    created_at: formatStamp(row.created_at),
    updated_at: formatStamp(row.updated_at || row.created_at),
    messages: messages.map(mapMessage)
  };
}

async function getTicketRowByCode(code) {
  const clean = String(code || '').trim();
  if (!clean) return null;
  const [rows] = await pool.query(
    'SELECT * FROM support_tickets WHERE ticket_code = ? LIMIT 1',
    [clean]
  );
  return rows[0] || null;
}

async function listTickets() {
  const [rows] = await pool.query(
    'SELECT * FROM support_tickets ORDER BY updated_at DESC, id DESC LIMIT 200'
  );
  if (!rows.length) return [];

  const [messages] = await pool.query(
    'SELECT * FROM ticket_messages WHERE ticket_id IN (?) ORDER BY id ASC',
    [rows.map((row) => row.id)]
  );
  const byTicket = new Map();
  messages.forEach((message) => {
    if (!byTicket.has(message.ticket_id)) byTicket.set(message.ticket_id, []);
    byTicket.get(message.ticket_id).push(message);
  });

  return rows.map((row) => mapTicket(row, byTicket.get(row.id) || []));
}

async function getTicketByCode(code) {
  const row = await getTicketRowByCode(code);
  if (!row) return null;
  const [messages] = await pool.query(
    'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY id ASC',
    [row.id]
  );
  return mapTicket(row, messages);
}

async function generateTicketCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const [rows] = await pool.query(
      'SELECT id FROM support_tickets WHERE ticket_code = ? LIMIT 1',
      [candidate]
    );
    if (!rows.length) return candidate;
  }
  return `TK-${String(Date.now()).slice(-6)}`;
}

async function createTicket(payload = {}) {
  const ticketCode = await generateTicketCode();
  const category = CATEGORY_LABELS[payload.category] ? payload.category : 'general';
  const priority = PRIORITY_LABELS[payload.priority] ? payload.priority : 'medium';

  const [result] = await pool.query(
    `INSERT INTO support_tickets
       (ticket_code, customer_id, customer_name, customer_phone, customer_email,
        customer_address, order_code, order_amount, category, priority, status, subject)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
    [
      ticketCode,
      payload.customerId || null,
      String(payload.customerName || 'Khách hàng').slice(0, 150),
      String(payload.customerPhone || '').slice(0, 30),
      String(payload.customerEmail || '').slice(0, 150),
      String(payload.customerAddress || '').slice(0, 255),
      String(payload.orderCode || '').slice(0, 50),
      Number(payload.orderAmount || 0),
      category,
      priority,
      String(payload.subject || '').slice(0, 255)
    ]
  );

  const greeting =
    payload.greeting ||
    'Xin chào! Em là chuyên viên hỗ trợ của Techshop. Anh/chị cần tư vấn cấu hình, kiểm tra đơn hàng hay bảo hành gì ạ?';
  await pool.query(
    'INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, text) VALUES (?, ?, ?, ?)',
    [result.insertId, 'system', 'Techshop Support', greeting]
  );

  return getTicketByCode(ticketCode);
}

async function addMessage(ticketCode, payload = {}) {
  const row = await getTicketRowByCode(ticketCode);
  if (!row) throw httpError('Không tìm thấy ticket', 404);

  const text = String(payload.text || '').trim();
  if (!text) throw httpError('Nội dung tin nhắn không được để trống');

  const senderType = SENDER_TYPES.includes(payload.senderType) ? payload.senderType : 'customer';
  const senderName = String(payload.senderName || '').slice(0, 150);

  const [result] = await pool.query(
    'INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, text) VALUES (?, ?, ?, ?)',
    [row.id, senderType, senderName, text]
  );

  let nextStatus = row.status || 'open';
  if (senderType === 'customer' && nextStatus === 'closed') nextStatus = 'open';
  if (senderType === 'staff' && nextStatus === 'open') nextStatus = 'in_progress';

  const unread = senderType === 'customer'
    ? Number(row.unread || 0) + 1
    : (senderType === 'staff' ? 0 : Number(row.unread || 0));

  await pool.query(
    'UPDATE support_tickets SET status = ?, unread = ?, updated_at = NOW() WHERE id = ?',
    [nextStatus, unread, row.id]
  );

  const [created] = await pool.query('SELECT * FROM ticket_messages WHERE id = ?', [result.insertId]);
  const ticket = await getTicketByCode(ticketCode);
  return { ticket, message: mapMessage(created[0]) };
}

async function updateTicket(ticketCode, fields = {}) {
  const row = await getTicketRowByCode(ticketCode);
  if (!row) throw httpError('Không tìm thấy ticket', 404);

  const assignments = [];
  const params = [];

  if (fields.status && TICKET_STATUSES.includes(fields.status)) {
    assignments.push('status = ?');
    params.push(fields.status);
  }
  if (fields.priority && PRIORITY_LABELS[fields.priority]) {
    assignments.push('priority = ?');
    params.push(fields.priority);
  }
  if (fields.category && CATEGORY_LABELS[fields.category]) {
    assignments.push('category = ?');
    params.push(fields.category);
  }
  if (typeof fields.assignedStaff === 'string') {
    assignments.push('assigned_staff = ?');
    params.push(fields.assignedStaff.slice(0, 150));
  }
  if (typeof fields.internalNotes === 'string') {
    assignments.push('internal_notes = ?');
    params.push(fields.internalNotes);
  }
  if (fields.unread !== undefined) {
    assignments.push('unread = ?');
    params.push(Number(fields.unread) || 0);
  }

  if (assignments.length) {
    assignments.push('updated_at = NOW()');
    params.push(row.id);
    await pool.query(
      `UPDATE support_tickets SET ${assignments.join(', ')} WHERE id = ?`,
      params
    );
  }

  return getTicketByCode(ticketCode);
}

module.exports = {
  listTickets,
  getTicketByCode,
  createTicket,
  addMessage,
  updateTicket,
  CATEGORY_LABELS,
  PRIORITY_LABELS
};
