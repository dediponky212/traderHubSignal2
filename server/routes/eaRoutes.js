const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    connect,
    heartbeat,
    trade,
    commandAck,
    signalAck,
    createCommand,
    status,
    getLastCommand,
} = require("../controllers/eaController");

router.post("/connect", connect);
router.post("/heartbeat", heartbeat);
router.post("/trade", trade);
router.post("/command/ack", commandAck);
router.post("/signal/ack", signalAck);
router.get("/status", authMiddleware, status);
router.get("/command/last", authMiddleware, getLastCommand);
router.post("/command", authMiddleware, createCommand);

module.exports = router;