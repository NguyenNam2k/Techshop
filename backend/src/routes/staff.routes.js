const express = require('express');
const router = express.Router();
const controller = require('../controllers/staff.controller');

router.get('/profile', controller.getProfile);
router.get('/events', controller.streamEvents);
router.get('/tasks', controller.getTasks);
router.patch('/tasks/:id', controller.updateTask);
router.get('/schedules', controller.getSchedules);

module.exports = router;
