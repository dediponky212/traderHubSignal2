const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { perAccountLimiter, perIpLimiter } = require("../middleware/rateLimiter");

const {
    connect,
    heartbeat,
    trade,
    commandAck,
    signalAck,
    disconnect,
    createCommand,
    status,
    getLastCommand,
    getTodayHistory,
    positions,
    dashboard,
} = require("../controllers/eaController");

// These are public (no JWT - the EA can't do a browser login flow, it proves
// itself with account_token instead) and unlike the /api/* dashboard routes
// their caller isn't a human clicking a button, so a runaway/misbehaving EA
// build can otherwise call them as fast as the network allows. Rate-limited
// per account (or per IP for /connect, before an account is even resolved).
router.post("/connect", perIpLimiter(20), connect);
router.post("/heartbeat", perAccountLimiter(40), heartbeat);
router.post("/trade", perAccountLimiter(120), trade);
router.post("/command/ack", perAccountLimiter(120), commandAck);
router.post("/signal/ack", perAccountLimiter(60), signalAck);
router.post("/disconnect", perAccountLimiter(20), disconnect);
router.get("/status", authMiddleware, status);
router.get("/command/last", authMiddleware, getLastCommand);
router.get("/history/today", authMiddleware, getTodayHistory);
router.get("/positions", authMiddleware, positions);
router.get("/dashboard", authMiddleware, dashboard);
router.post("/command", authMiddleware, createCommand);

module.exports = router;