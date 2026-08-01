const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Mengarahkan file db keluar dua tingkat agar berada di root proyek
const dbPath = path.resolve(__dirname, '../../forexhub.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database:', err.message);
    } else {
        console.log('📦 Berhasil terhubung ke database SQLite via Config!');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket INTEGER, symbol TEXT, action TEXT, status TEXT, 
            price REAL, volume REAL, sl REAL, tp REAL, pnl REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
// Table User
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
});

module.exports = db;