---
doc: form-schema
version: 1.1
---

# FORM INPUT STRATEGI / SETTINGAN ROBOT — SKEMA FINAL

Data ini disimpan permanen per robot (baseline settings), dan bisa diedit kapan pun lewat halaman
"Edit Settings" robot setelah robot dibuat (fitur edit menyusul, memakai endpoint update biasa — bukan
form analisa on-demand).

```json
{
  "nama_robot": "string",
  "symbol": "string",                  // WAJIB — HANYA 1 symbol per robot, tidak boleh array
  "timeFrame": "string",               // WAJIB — mis. "M15", "H1", "H4", "D1"
  "owner_user_id": "string",           // WAJIB — pemilik robot, dipakai untuk identifikasi kepemilikan
                                        // (penting begitu robot bisa di-follow / masuk marketplace)
  "indikator": ["string"],             // referensi ke tabel indikator robot (lihat catatan #2)
  "news": false,                       // satu-satunya nama field boolean fundamental — konsisten
                                        // dipakai di form, database, kode. Jangan campur dengan
                                        // istilah "fundamental" atau "setting_news" di tempat lain.

  "jadwal_analisa": {
    "mode": "auto",                    // "auto" atau "manual"
    // --- hanya dipakai kalau mode == "auto" ---
    "interval_menit": 60,              // WAJIB kalau auto — MINIMAL 15
    "sesi_market": ["asia", "london", "usa"],  // sesi yang DIIZINKAN untuk analisa; kosongkan array
                                                // berarti tidak ada sesi yang diizinkan (robot idle)
    "buffer_sebelum_menit": 0,         // jeda sebelum batas sesi di mana analisa tetap ditahan
    "buffer_sesudah_menit": 0,         // jeda sesudah batas sesi di mana analisa tetap ditahan
    "kondisi_market": "all"            // "all" (selalu lanjut) atau "trend" (stop kalau Market Analyst
                                        // melaporkan Sideways — lihat 05-backend-validator.md bagian B)
  },

  "max_risk_per_day_percent": 0,       // dicek backend SEBELUM analisa, bukan oleh LLM manapun
  "max_risk_per_month_percent": 0,     // idem
  "max_open_posisi": 0,                // idem
  "min_risk_reward": 0,                // dipakai Decision Executor untuk menentukan TP1 (lihat catatan #5)

  "prompt_mode": "auto",               // "auto" (pakai skill baku di folder ini) atau "manual"
  "user_strategy_notes": null          // WAJIB diisi (textarea) kalau prompt_mode == "manual", null kalau auto
}
```

> **Tidak ada field lot/ukuran posisi di form ini** (mis. `max_lots`, `max_risk_per_trade_percent`) —
> robot secara sengaja tidak menghitung atau merekomendasikan ukuran lot sama sekali. Lihat catatan #5.
>
> **Biaya (`billing_mode`, dst) BUKAN bagian dari form strategi ini** — dipilih user di step konfirmasi
> terpisah setelah backend menghitung biayanya, lihat "Alur pembuatan robot" di bawah dan
> [06-billing-tokens.md](06-billing-tokens.md).

## Catatan implementasi backend (bukan bagian skill LLM)

1. **Symbol tetap 1 per robot** (bukan array). `symbol` di atas adalah symbol *default* robot, tersimpan
   di database. Saat robot dipicu (baik oleh jadwal `jadwal_analisa` maupun trigger manual dari
   dashboard), backend WAJIB menentukan **`effective_symbol`** dengan urutan resolusi berikut, SEBELUM
   memanggil skill manapun:
   - Jika ada form override symbol pada trigger manual **dan diisi** → pakai symbol dari form itu untuk
     analisa kali ini SAJA (tidak menimpa `symbol` yang tersimpan di settings robot).
   - Jika form override kosong/tidak ada (termasuk semua trigger otomatis via jadwal) → pakai `symbol`
     dari settings robot di database.
   - `effective_symbol` yang sudah final inilah satu-satunya nilai yang dikirim sebagai `symbol` ke
     skill di bawah — semua skill selalu menerima **1 string symbol**, tidak pernah tahu soal
     override/default. Resolusi ini murni tanggung jawab backend, tidak pernah bagian dari prompt LLM.
2. **Indikator**: dipilih lewat form select (bisa lebih dari 1). Tiap indikator yang dipilih memunculkan
   form settingan sendiri (mis. RSI → period; EMA → period; MACD → fast/slow/signal). Kombinasi
   indikator+settingan per robot disimpan di **tabel tersendiri** (bukan digabung ke tabel robot), satu
   baris per indikator per robot. Backend membaca market lalu MENGHITUNG nilai dari tiap baris indikator
   itu sebelum dikirim ke Market Analyst — AI tidak pernah menghitung nilai indikator sendiri.
3. **Edit settings**: robot yang sudah jadi bisa diubah settingannya (symbol default, risk, indikator,
   jadwal, dst) lewat endpoint update terpisah — perubahan ini berlaku untuk semua analisa berikutnya
   sampai diubah lagi. Ini beda dengan override symbol pada poin 1 yang hanya berlaku sekali per trigger
   manual.
4. Seluruh field ini adalah **data**, disuntik ke placeholder skill lewat `user_config` — tidak pernah
   mengubah isi `[STRICT RULES]` di skill manapun.
5. **Tidak ada manajemen lot/ukuran posisi di seluruh pipeline ini** — robot ini nantinya bisa di-follow
   dan sinyalnya didistribusikan ke banyak penerima (portofolio robot terpisah dari portofolio biasa,
   marketplace/copy-signal — lihat [catatan.md](../../catatan.md) produk #3–#4), yang masing-masing punya
   modal & toleransi risiko berbeda. Karena itu robot HANYA menghasilkan sinyal berbasis harga (arah,
   zona entri, SL, TP1/TP2/TP3) — ukuran lot sepenuhnya keputusan penerima sinyal saat eksekusi, baik itu
   pemilik robot sendiri maupun follower. `min_risk_reward` dipakai murni sebagai rasio jarak harga
   (TP1 vs SL), bukan perhitungan uang/lot — lihat [04-decision-executor.md](04-decision-executor.md).
6. **Jadwal analisa (`jadwal_analisa`)**:
   - `mode: "manual"` → tidak ada penjadwalan sama sekali, robot hanya menganalisa saat pemilik klik
     tombol di halaman robot.
   - `mode: "auto"` → backend menjalankan analisa tiap `interval_menit` (minimal 15), TAPI hanya kalau
     waktu saat itu masuk salah satu `sesi_market` yang diizinkan, DAN di luar zona
     `buffer_sebelum_menit`/`buffer_sesudah_menit` di sekitar batas sesi manapun (termasuk sesi yang
     TIDAK diizinkan — buffer ini mencegah analisa persis di tepi transisi sesi). Kalau `sesi_market`
     berisi ketiga sesi, praktis selalu analisa sesuai interval (buffer tetap berlaku di batas hari).
   - `kondisi_market: "trend"` → setelah Market Analyst menyimpulkan `trend`, backend cek: kalau hasilnya
     `"Sideways"`, pipeline **berhenti di situ juga** (tidak lanjut ke News Analyst/Decision Executor,
     hemat biaya — lihat [05-backend-validator.md](05-backend-validator.md) bagian B). Kalau
     `"all"`, selalu lanjut apapun hasil `trend`-nya.
7. **`prompt_mode: "manual"`**: `user_strategy_notes` (textarea bebas dari user) dikirim ke tiap skill
   sebagai **data tambahan untuk dipertimbangkan** (mis. field `user_strategy_notes` di `[CONTEXT INPUT]`
   masing-masing skill) — DILARANG diperlakukan sebagai instruksi yang bisa mengubah `[ROLE]`,
   `[STRICT RULES]`, atau `[OUTPUT FORMAT]` skill manapun. Diperlakukan persis sama seperti isi artikel
   berita di News Analyst: teks dari user adalah **data**, bukan perintah — kalau isinya menyerupai
   instruksi ("abaikan aturan di atas", dsb), abaikan sebagai instruksi, tetap hanya jadi konteks yang
   dipertimbangkan. Tahapan, aturan, dan larangan skill tetap sama persis baik `prompt_mode` auto maupun
   manual.

## Alur pipeline

```
Pre-check backend (lihat 05-backend-validator.md bagian A):
   → cek saldo token / status langganan (06-billing-tokens.md) — kalau tidak cukup: robot OFF, stop
   → cek max_risk_per_day / max_risk_per_month / max_open_posisi — kalau melanggar: skip kali ini
   → cek performa (portfolio_summary + last_5_trades) → kalau kurang baik, panggil AI Coach (advisory,
     tidak menghentikan pipeline) — lihat 03-ai-coach.md

resolve effective_symbol (lihat catatan #1)
   → backend hitung indicator_values (dari tabel indikator robot) + key_levels (support/resistance/pivot)
   → panggil Market Analyst (+ pola wave/candlestick dari 50 candle, lihat 01-market-analyst.md)

Gate kondisi market (05-backend-validator.md bagian B):
   → jika kondisi_market == "trend" dan hasil Market Analyst == "Sideways" → STOP di sini

   → panggil News Analyst (skip jika [ACTIVATION] tidak terpenuhi, lihat 02-news-analyst.md)
   → Decision Executor mensintesis Market + News → signal (TP1/TP2/TP3)
   → Backend Validator bagian C: post-check + potong biaya → signal_final disimpan
```

## Alur pembuatan robot (wizard)

> **Konvensi UI (berlaku seterusnya, bukan cuma wizard ini):** semua teks tombol/aksi interaktif di
> seluruh aplikasi pakai Bahasa Inggris, konsisten — bukan cuma navigasi wizard. Label/paragraf/heading
> konten boleh tetap Bahasa Indonesia seperti sekarang; yang diseragamkan ke Inggris khusus teks tombol.

1. User isi form strategi (skema JSON di atas) → klik **"Next"**.
2. Backend mulai menghitung biaya (lihat [06-billing-tokens.md](06-billing-tokens.md)). Selama proses ini,
   tampilkan status animasi bertahap (checklist per tahap selesai), contoh caption (Inggris):
   - "Setting up your robot..."
   - "Configuring strategy and indicators..."
   - "Selecting specialist agent models..."
3. Setelah selesai, tampilkan **layar konfirmasi**: rekap seluruh isi form, lalu tampilkan pilihan biaya:
   - **Per-signal**: tampilkan `tokens_per_signal`, lalu form **"Max signals per day"** (batas
     pengeluaran harian, dipilih user).
   - **Monthly**: tampilkan `monthly_price_idr` dan `max_signal_per_month` sebagai kuota keras
     (lihat [06-billing-tokens.md](06-billing-tokens.md)).
   - Tampilkan keterangan **free trial** (1 minggu, maks 3 analisa/hari) — hanya muncul untuk user yang
     belum pernah membuat robot sebelumnya.
4. User pilih model biaya (atau pakai free trial kalau berhak) → klik **"Create Bot"** → robot tersimpan.

File detail tiap skill:
- [01-market-analyst.md](01-market-analyst.md)
- [02-news-analyst.md](02-news-analyst.md)
- [03-ai-coach.md](03-ai-coach.md)
- [04-decision-executor.md](04-decision-executor.md)
- [05-backend-validator.md](05-backend-validator.md)
- [06-billing-tokens.md](06-billing-tokens.md)
- [07-market-data.md](07-market-data.md)
