const staffClients = new Set();
const staffSockets = new Set();
const ticketRooms = new Map();

function addStaffClient(res) {
  staffClients.add(res);
  res.on('close', () => staffClients.delete(res));
}

function publishStaffEvent(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of staffClients) {
    try {
      client.write(payload);
    } catch (error) {
      console.error('Unable to publish staff realtime event:', error.message);
      staffClients.delete(client);
    }
  }
}

/**
 * WebSocket realtime cho Support Ticket & Chat giữa Customer và Staff.
 * Client kết nối tới: /api/support/ws?role=customer|staff&ticketId=TK-xxxx
 */
const WS_OPEN = 1;

function safeSend(socket, payload) {
  if (!socket || socket.readyState !== WS_OPEN) return false;
  try {
    socket.send(payload);
    return true;
  } catch (error) {
    return false;
  }
}

function leaveRoom(socket) {
  const ticketId = socket.ticketId;
  if (!ticketId) return;
  const room = ticketRooms.get(ticketId);
  if (room) {
    room.delete(socket);
    if (room.size === 0) ticketRooms.delete(ticketId);
  }
  socket.ticketId = null;
}

function joinRoom(socket, ticketId) {
  const clean = String(ticketId || '').trim();
  if (!clean) return;
  if (socket.ticketId && socket.ticketId !== clean) leaveRoom(socket);
  socket.ticketId = clean;
  if (!ticketRooms.has(clean)) ticketRooms.set(clean, new Set());
  ticketRooms.get(clean).add(socket);
}

/**
 * Phát một sự kiện ticket tới mọi client đang mở đúng ticket đó
 * + toàn bộ bàn làm việc Staff (để danh sách ticket cập nhật realtime).
 */
function broadcastTicketEvent(ticketId, payload) {
  const clean = String(ticketId || '').trim();
  const data = JSON.stringify({ ...payload, ticketId: clean, at: Date.now() });
  const targets = new Set();
  const room = ticketRooms.get(clean);
  if (room) room.forEach((socket) => targets.add(socket));
  staffSockets.forEach((socket) => targets.add(socket));

  let delivered = 0;
  targets.forEach((socket) => {
    if (safeSend(socket, data)) delivered += 1;
  });
  return delivered;
}

let supportWss = null;

function attachSupportWebSocket(httpServer) {
  if (supportWss) return supportWss;

  const { WebSocketServer } = require('ws');
  supportWss = new WebSocketServer({ server: httpServer, path: '/api/support/ws' });

  supportWss.on('connection', (socket, req) => {
    socket.isAlive = true;
    socket.ticketId = null;
    socket.role = 'customer';

    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      socket.role = url.searchParams.get('role') === 'staff' ? 'staff' : 'customer';
      joinRoom(socket, url.searchParams.get('ticketId'));
    } catch (error) {
      console.warn('Support socket: cannot parse connection url:', error.message);
    }

    if (socket.role === 'staff') staffSockets.add(socket);
    safeSend(socket, JSON.stringify({
      type: 'connected',
      role: socket.role,
      ticketId: socket.ticketId,
      at: Date.now()
    }));

    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('message', (raw) => {
      let payload = null;
      try {
        payload = JSON.parse(raw.toString());
      } catch (error) {
        return;
      }
      if (!payload || typeof payload !== 'object') return;
      if (payload.type === 'ping') {
        safeSend(socket, JSON.stringify({ type: 'pong', at: Date.now() }));
        return;
      }
      if (payload.type === 'join') joinRoom(socket, payload.ticketId);
    });
    socket.on('close', () => {
      leaveRoom(socket);
      staffSockets.delete(socket);
    });
    socket.on('error', () => {
      leaveRoom(socket);
      staffSockets.delete(socket);
    });
  });

  const heartbeat = setInterval(() => {
    if (!supportWss) return;
    supportWss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      try {
        socket.ping();
      } catch (error) {
        /* ignore */
      }
    });
  }, 30000);

  supportWss.on('close', () => clearInterval(heartbeat));
  console.log('[TechGear] Support WebSocket ready at /api/support/ws');
  return supportWss;
}

module.exports = {
  addStaffClient,
  publishStaffEvent,
  attachSupportWebSocket,
  broadcastTicketEvent
};
