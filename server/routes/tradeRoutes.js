const express = require("express");
const router = express.Router();


const {
    getTrades
} = require("../controllers/tradeController");

router.get("/", getTrades);
//console.log("Trade Routes Loaded");
module.exports = router;