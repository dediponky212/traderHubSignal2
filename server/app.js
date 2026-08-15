const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const eaRoutes = require("./routes/eaRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const marketRoutes = require("./routes/marketRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");

app.use(cors()); 
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ea", eaRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/portfolio", portfolioRoutes);

module.exports = app;