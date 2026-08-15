const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getPortfolio } = require("../controllers/portofolioController");

router.get("/", authMiddleware, getPortfolio);

module.exports = router;