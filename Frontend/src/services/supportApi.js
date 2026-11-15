/**
 * Support Ticket & Customer Chat API (REST) + WebSocket realtime.
 * Backend: /api/support  ·  WebSocket: /api/support/ws
 */
const API_BASE = '/api/support';

const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(body.message || 'API request failed');
  }
  return body.data;
};

const request = async (url, options) => parseResponse(await fetch(url, options));

const jsonOptions = (method, payload) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

export function fetchSupportTickets() {
  return request(`${API_BASE}/tickets`);
}

export function createSupportTicket(payload) {
  return request(`${API_BASE}/tickets`, jsonOptions('POST', payload));
}

export function fetchSupportTicket(ticketCode) {
  return request(`${API_BASE}/tickets/${encodeURIComponent(ticketCode)}/messages`);
}

export function sendSupportMessage(ticketCode, payload) {
  return request(
    `${API_BASE}/tickets/${encodeURIComponent(ticketCode)}/messages`,
    jsonOptions('POST', payload)
  );
}

export function patchSupportTicket(ticketCode, payload) {
  return request(`${API_BASE}/tickets/${encodeURIComponent(ticketCode)}`, jsonOptions('PATCH', payload));
}

/**
 * Mở kết nối WebSocket realtime tới phòng của ticket.
 * @param {{ ticketId?: string, role?: 'customer'|'staff', onEvent?: Function, onOpen?: Function, onClose?: Function }} options
 */
export function connectSupportSocket({ ticketId, role = 'customer', onEvent, onOpen, onClose } = {}) {
  if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') return null;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams({ role });
  if (ticketId) params.set('ticketId', ticketId);

  const socket = new WebSocket(`${protocol}//${window.location.host}${API_BASE}/ws?${params.toString()}`);

  socket.addEventListener('message', (event) => {
    if (!onEvent) return;
    try {
      onEvent(JSON.parse(event.data));
    } catch (error) {
      console.warn('Invalid support socket payload:', error);
    }
  });
  if (onOpen) socket.addEventListener('open', onOpen);
  if (onClose) socket.addEventListener('close', onClose);
  socket.addEventListener('error', () => {
    /* Lỗi kết nối được xử lý ở onClose của nơi gọi */
  });

  return socket;
}
