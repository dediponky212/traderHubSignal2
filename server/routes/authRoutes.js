const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Menyesuaikan lokasi file database Anda

const JWT_SECRET = 'SUPER_RAHASIA_FOREXHUB_2026';

// Endpoint Pendaftaran (Gunakan sekali untuk membuat akun Anda)
// GANTI HANYA BLOK INI DI DI FILE server/routes/authRoutes.js
router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Log untuk memantau data yang dikirim dari browser
  console.log(`\n[Login Attempt] Email: ${email}`);

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      console.error("--> Error Database:", err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
    
    // Deteksi 1: Apakah emailnya ada di SQLite?
    if (!user) {
      console.log("--> Gagal: Email tidak ditemukan di database SQLite.");
      return res.status(400).json({ status: 'fail', message: 'Email tidak terdaftar di sistem' });
    }

    // Deteksi 2: Apakah password-nya cocok?
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("--> Gagal: Password yang dimasukkan salah.");
      return res.status(400).json({ status: 'fail', message: 'Password yang Anda masukkan salah' });
    }

    // Jika lolos semua deteksi
    console.log("--> Sukses: Kredensial cocok, token JWT dibuat.");
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      status: 'success',
      message: 'Login berhasil',
      token
    });
  });
});

// Endpoint Login
router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ status: 'fail', message: 'Email atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Email atau password salah' });
    }

    // Buat kunci akses digital (JWT Token) berlaku 1 hari
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      status: 'success',
      message: 'Login berhasil',
      token
    });
  });
});

module.exports = router;