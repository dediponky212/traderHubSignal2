---
doc: market-data
version: 1.0
type: backend-design
status: "Provider API belum dipilih (ditunda) - dokumen ini cuma arsitektur caching-nya,
         provider-agnostic. Lihat catatan 'Belum diputuskan' di bawah."
---

# SUMBER DATA CANDLE (market_data) — DESAIN CACHING

## Prinsip

**Database lokal adalah sumber utama `market_data` untuk Market Analyst — API pihak ketiga
cuma dipanggil untuk menambah data yang belum ada.** Bukan sebaliknya (panggil API tiap kali ada
analisa).

Alasannya: candle yang **sudah tertutup** (periode waktunya sudah lewat) nilainya permanen,
tidak pernah berubah lagi — begitu tersimpan, bisa dipakai ulang selamanya oleh robot manapun
yang butuh symbol+timeframe yang sama. Yang berubah cuma candle yang **sedang berjalan**
saat ini.

> **EA (TraderHub.mq5) sengaja TIDAK dipakai sebagai sumber candle ini** — robot harus tetap
> bisa jalan terlepas dari status koneksi EA siapa pun (lihat diskusi arsitektur terkait).
> EA tetap dipakai untuk kebutuhan lain yang memang personal/real-time (mis. bid/ask saat
> halaman Remote EA dibuka) — bukan untuk pasokan data Market Analyst.

## Tabel `market_candles` (referensi field, bukan SQL final)

| Field | Keterangan |
|---|---|
| `symbol` | mis. "XAUUSD" |
| `timeframe` | mis. "H1" |
| `open_time` | waktu buka candle (UTC) |
| `open` / `high` / `low` / `close` / `volume` | OHLCV |
| `fetched_at` | kapan baris ini terakhir diperbarui dari API |

Unique per `(symbol, timeframe, open_time)`. Semua baris di tabel ini HANYA candle yang **sudah
tertutup** — candle yang sedang berjalan tidak pernah disimpan di sini (lihat catatan "Harga
saat ini" di bawah).

## Alur pengambilan data

```
Market Analyst butuh 50 candle {symbol}/{timeframe}
   → query market_candles: ada berapa baris, sampai open_time berapa yang terbaru?
   → kalau sudah lengkap 50 & yang terbaru memang candle yang seharusnya sudah tertutup
     sampai saat ini → langsung pakai dari DB, TIDAK ada panggilan API sama sekali
   → kalau ada candle yang seharusnya sudah kebentuk sejak baris terakhir tersimpan
     → panggil API HANYA untuk selisihnya (delta) - bukan 50 ulang dari nol
   → simpan hasil delta ke market_candles, lalu pakai 50 baris terbaru untuk Market Analyst
```

**Backfill awal**: begitu ada robot pertama yang pakai kombinasi symbol+timeframe yang belum
pernah dipakai robot manapun sebelumnya, baru dilakukan 1x fetch besar (50 candle sekaligus).
Setelah itu, robot lain dengan symbol+timeframe yang sama tinggal pakai baris yang sudah ada +
top-up kecil kalau ada candle baru.

## Job top-up berkala

Mengikuti pola `server/jobs/maintenance.js` yang sudah ada (dipanggil dari `server.js`,
berjalan berkala): cek symbol+timeframe mana saja yang **sedang dipakai robot aktif**
(`status: 'active'`), apakah candle terbarunya sudah harus bertambah sejak terakhir dicek — kalau
ya, fetch delta-nya dan simpan. Job ini yang jadi satu-satunya pemanggil API rutin, bukan
tiap-tiap analisa robot.

**Kenapa ini murah**: beban ke API sebanding dengan *jumlah kombinasi symbol+timeframe unik yang
benar-benar dipakai, dikali seberapa sering candle-nya tertutup* — BUKAN sebanding dengan jumlah
robot atau jumlah analisa. 100 robot yang sama-sama pakai XAUUSD/H1 berbagi baris data yang sama;
satu kali top-up per candle tertutup melayani semuanya sekaligus.

## Harga saat ini (candle yang belum tertutup)

`market_data` yang dikirim ke Market Analyst berisi HANYA candle yang sudah tertutup (lihat
[01-market-analyst.md](01-market-analyst.md)). Harga TERKINI (untuk `current_price_context`,
bid/ask indikator, dst) diambil terpisah lewat quote ringan (bukan full candle history) — jauh
lebih murah dipanggil live dibanding candle lengkap, karena cuma butuh 1 angka harga terbaru,
bukan array OHLCV.

## Belum diputuskan

Provider API pihak ketiga untuk fetch candle & quote (opsi yang pernah dibahas: API data market
berbayar/gratis-terbatas seperti Twelve Data/Polygon/TraderMade/OANDA, Yahoo Finance unofficial
seperti yang sudah dipakai `marketController.js` untuk ticker, atau agregasi mandiri dari seluruh
EA yang terhubung) — **ditunda**, sama seperti keputusan LLM provider di
[06-billing-tokens.md](06-billing-tokens.md). Desain caching di dokumen ini provider-agnostic;
tinggal isi fungsi fetch delta-nya begitu providernya dipilih.
