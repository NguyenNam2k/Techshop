const supportTicketService = require('../services/supportTicket.service');
const { broadcastTicketEvent } = require('../services/realtime.service');

function fail(res, err) {
  console.error('supportTicket error:', err);
  return res.status(err.statusCode || 500).json({ success: false, message: err.message });
}

async function listTickets(req, res) {
  try {
    const tickets = await supportTicketService.listTickets();
    return res.json({ success: true, data: tickets });
  } catch (err) {
    return fail(res, err);
  }
}

async function createTicket(req, res) {
  try {
    const ticket = await supportTicketService.createTicket(req.body || {});
    broadcastTicketEvent(ticket.ticket_id, { type: 'ticket_created', ticket });
    return res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    return fail(res, err);
  }
}

async function getMessages(req, res) {
  try {
    const ticket = await supportTicketService.getTicketByCode(req.params.ticketCode);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ticket' });
    }
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return fail(res, err);
  }
}

async function postMessage(req, res) {
  try {
    const { ticket, message } = await supportTicketService.addMessage(req.params.ticketCode, req.body || {});
    broadcastTicketEvent(ticket.ticket_id, { type: 'message', ticket, message });
    return res.status(201).json({ success: true, data: { ticket, message } });
  } catch (err) {
    return fail(res, err);
  }
}

async function patchTicket(req, res) {
  try {
    const ticket = await supportTicketService.updateTicket(req.params.ticketCode, req.body || {});
    broadcastTicketEvent(ticket.ticket_id, { type: 'ticket_updated', ticket });
    return res.json({ success: true, data: ticket });
  } catch (err) {
    return fail(res, err);
  }
}

module.exports = {
  listTickets,
  createTicket,
  getMessages,
  postMessage,
  patchTicket
};
