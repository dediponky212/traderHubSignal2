const db = require('../config/database');

exports.handleWebhook = (req, res) => {
    const data = req.body;
    console.log("🔍 [Controller] Menangkap Data:", data);

    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ status: "error", message: "Data kosong" });
    }

    if (data.action === "PING") {
        return res.status(200).json({ message: "Ping diterima" });
    }

    // 1. Simpan ke Database
    const query = `INSERT INTO trades (ticket, symbol, action, status, price, volume, sl, tp, pnl) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        data.ticket || 0, data.symbol || '', data.action || '', data.status || '',
        data.price || 0, data.volume || 0, data.sl || 0, data.tp || 0, data.pnl || 0
    ];

    db.run(query, params, function(err) {
        if (err) console.error("❌ Gagal simpan DB:", err.message);
        else console.log(`💾 Tersimpan di DB! ID Row: ${this.lastID}`);
    });

    // 2. Format Pesan Telegram menggunakan Environment Variable (.env)
    let pesanTelegram = "";
    if (data.status === "OPEN") {
        pesanTelegram = `🔵 **SINYAL BARU MASUK!**\n\n` +
                        `**Aksi:** ${data.action} ${data.symbol}\n` +
                        `**Harga Entry:** ${data.price}\n` +
                        `**SL:** ${data.sl || 'Belum diatur'}\n` +
                        `**TP:** ${data.tp || 'Belum diatur'}\n`;
    } else if (data.status === "MODIFY") {
        pesanTelegram = `⚙️ **PERUBAHAN SINYAL (MODIFY)**\n\n` +
                        `**Posisi:** ${data.action} ${data.symbol}\n` +
                        `**SL Baru:** ${data.sl}\n` +
                        `**TP Baru:** ${data.tp}\n`;
    } else if (data.status === "CLOSE") {
        const emotpnl = data.pnl >= 0 ? "🟢 PROFIT" : "🔴 LOSS";
        pesanTelegram = `🏁 **SINYAL DITUTUP (CLOSED)**\n\n` +
                        `**Posisi:** ${data.action} ${data.symbol}\n` +
                        `**Harga Close:** ${data.price}\n` +
                        `**Hasil:** ${emotpnl} ($${data.pnl.toFixed(2)})\n`;
    }

    // 3. Tembak ke API Telegram jika ada pesan
    if (pesanTelegram !== "") {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: pesanTelegram,
                parse_mode: 'Markdown'
            })
        })
        .then(res => res.json())
        .then(hasil => {
            if (hasil.ok) console.log("🚀 Berhasil diteruskan ke Telegram!");
            else console.error("❌ Telegram menolak:", hasil.description);
        })
        .catch(err => console.error("❌ Error koneksi Telegram:", err));
    }

    res.status(200).json({ status: "success", message: "Processed modularly!" });
};
// Fungsi baru untuk mengambil semua data transaksi untuk Dashboard
exports.getTrades = (req, res) => {
    const query = `SELECT * FROM trades ORDER BY created_at DESC`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("❌ Gagal mengambil data dari database:", err.message);
            return res.status(500).json({ status: "error", message: err.message });
        }
        
        // Kirim data transaksi ke frontend
        res.status(200).json({ status: "success", data: rows });
    });
};