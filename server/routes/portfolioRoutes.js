const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getPortfolio, getHistory, getTradingStyle, setVisibility } = require("../controllers/portofolioController");

router.get("/", authMiddleware, getPortfolio);
router.get("/history", authMiddleware, getHistory);
router.get("/trading-style", authMiddleware, getTradingStyle);
router.patch("/visibility", authMiddleware, setVisibility);

module.exports = router;