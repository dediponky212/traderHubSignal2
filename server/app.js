const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const eaRoutes = require("./routes/eaRoutes");
const tradeRoutes = require("./routes/tradeRoutes");

const app = express();

app.use(cors()); 
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ea", eaRoutes);
app.use("/api/trades", tradeRoutes);

module.exports = app;