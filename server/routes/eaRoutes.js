const express = require("express");
const router = express.Router();

const {
    connect,
    heartbeat,
    trade,
    commandAck,
    signalAck
} = require("../controllers/eaController");

router.post("/connect", connect);
router.post("/heartbeat", heartbeat);
router.post("/trade", trade);
router.post("/command/ack", commandAck);
router.post("/signal/ack", signalAck);
// router.post("/disconnect", disconnect);

module.exports = router;