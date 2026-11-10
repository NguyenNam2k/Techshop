const express = require('express');
const router = express.Router();
const supportTicketController = require('../controllers/supportTicket.controller');

// Support Ticket & Customer Chat API (REST + WebSocket tại /api/support/ws)
router.get('/tickets', supportTicketController.listTickets);
router.post('/tickets', supportTicketController.createTicket);
router.get('/tickets/:ticketCode/messages', supportTicketController.getMessages);
router.post('/tickets/:ticketCode/messages', supportTicketController.postMessage);
router.patch('/tickets/:ticketCode', supportTicketController.patchTicket);

module.exports = router;
