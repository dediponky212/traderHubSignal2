const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// ================= CONFIGURATION TELEGRAM (ISI DI SINI) =================
const TELEGRAM_BOT_TOKEN = "8692207402:AAG2ZAG7UIccGisHCHc9PiVQ7Px9nbPYy-Y"; 
const TELEGRAM_CHAT_ID   = "@Trader_HubSignal"; 
// Contoh: const TELEGRAM_CHAT_ID = "@koleksisinyal_anda";
// =========================================================================

app.post('/webhook-signal', (req, res) => {
    const data = req.body;
    
    // Perhatikan teks ini saat Anda transaksi!
    console.log("🔍 MENANGKAP DATA MASUK:", data);

    if (data.action === "PING") {
        return res.status(200).json({ message: "Ping diterima" });
    }

    let pesanTelegram = "";

    if (data.status === "OPEN") {
        pesanTelegram = `🔵 **SINYAL BARU MASUK!**\n\n` +
                        `**Aksi:** ${data.action} ${data.symbol}\n` +
                        `**Harga Entry:** ${data.price}\n` +
                        `**SL:** ${data.sl || 'Belum diatur'}\n` +
                        `**TP:** ${data.tp || 'Belum diatur'}\n\n` +
                        `*Tetap kelola risiko Anda!*`;
    } 
    else if (data.status === "MODIFY") {
        pesanTelegram = `⚙️ **PERUBAHAN SINYAL (MODIFY)**\n\n` +
                        `**Posisi:** ${data.action} ${data.symbol}\n` +
                        `**SL Baru:** ${data.sl}\n` +
                        `**TP Baru:** ${data.tp}\n`;
    } 
    else if (data.status === "CLOSE") {
        const emotpnl = data.pnl >= 0 ? "🟢 PROFIT" : "🔴 LOSS";
        
        pesanTelegram = `🏁 **SINYAL DITUTUP (CLOSED)**\n\n` +
                        `**Posisi:** ${data.action} ${data.symbol}\n` +
                        `**Harga Close:** ${data.price}\n` +
                        `**Hasil:** ${emotpnl} ($${data.pnl.toFixed(2)})\n`;
    }

    // --- BARIS DETEKTIF BARU DI SINI ---
    if (pesanTelegram !== "") {
        kirimKeTelegram(pesanTelegram);
    } else {
        console.log(`⚠️ SKIP TELEGRAM: Format status tidak cocok. Nilai status Anda adalah: "${data.status}"`);
    }

    res.status(200).json({ status: "success", message: "Processed!" });
});

// Fungsi pembantu untuk mengirim request internet ke Telegram
function kirimKeTelegram(teks) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Menggunakan fitur bawaan Node.js (fetch) untuk mengirim pesan
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: teks,
            parse_mode: 'Markdown' // Agar teks bisa tebal/miring otomatis
        })
    })
    .then(res => res.json())
    .then(hasil => {
        if(hasil.ok) {
            console.log("🚀 Sinyal berhasil diteruskan ke Telegram Channel!");
        } else {
            console.error("❌ Telegram menolak mengirim pesan. Detail Error:", hasil.description);
        }
    })
    .catch(err => console.error("❌ Gagal terhubung ke server Telegram:", err));
}

app.listen(PORT, () => {
    console.log(`Server aktif di http://127.0.0.1:${PORT}`);
});