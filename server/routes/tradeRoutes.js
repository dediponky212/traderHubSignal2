const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');

// Mengarahkan webhook ke fungsi yang ada di controller
router.post('/webhook-signal', tradeController.handleWebhook);

// Tambahkan rute GET baru untuk konsumsi frontend
router.get('/api/trades', tradeController.getTrades);

module.exports = router;