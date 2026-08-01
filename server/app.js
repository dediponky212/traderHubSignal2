const express = require('express');
const cors = require('cors'); // <-- 1. Tambahkan baris ini
const tradeRoutes = require('./routes/tradeRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();

app.use(cors()); 
app.use(express.json());

app.use('/', tradeRoutes);
app.use('/', authRoutes);

module.exports = app;