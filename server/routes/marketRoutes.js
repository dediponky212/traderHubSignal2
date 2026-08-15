const express = require("express");
const { getMarketTicker } = require("../controllers/marketController");

const router = express.Router();

router.get("/ticker", getMarketTicker);

module.exports = router;
