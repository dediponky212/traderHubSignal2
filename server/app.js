const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const eaRoutes = require("./routes/eaRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const marketRoutes = require("./routes/marketRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const robotRoutes = require("./routes/robotRoutes");
const rankingRoutes = require("./routes/rankingRoutes");

app.use(cors());
app.use(express.json());

// Uploaded avatars (see authController.uploadAvatar) live on disk under
// server/uploads and are served back out from here as plain static files.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/ea", eaRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/robots", robotRoutes);
app.use("/api/ranking", rankingRoutes);

module.exports = app;