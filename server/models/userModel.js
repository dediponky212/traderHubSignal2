const db = require('../config/database');

const User = {
    // Mengecek apakah email atau username sudah dipakai
    findByEmailOrUsername: (email, username) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE email = ? OR username = ?`;
            db.get(query, [email, username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    },

    // Menyimpan user baru ke database
    create: (userData) => {
        return new Promise((resolve, reject) => {
            const { fullname, username, email, password } = userData;
            const query = `
                INSERT INTO users (fullname, username, email, password) 
                VALUES (?, ?, ?, ?)
            `;
            
            // Menggunakan function() biasa (bukan arrow function) untuk mengakses this.lastID di SQLite3
            db.run(query, [fullname, username, email, password], function(err) {
                if (err) reject(err);
                resolve(this.lastID); // Mengembalikan ID dari user yang baru dibuat
            });
        });
    }
};

module.exports = User;

// dibuat gemini