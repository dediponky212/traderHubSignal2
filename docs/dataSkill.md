# AI ROBOT — SKILL PIPELINE (INDEX)

> Ini file index. Isi lengkap (form schema + skill LLM + backend validator + biaya token) sudah dipecah
> ke folder [dataSkill/](dataSkill/00-form-schema.md). File ini hanya ringkasan arsitektur; jangan edit
> skill-nya di sini, edit di file masing-masing pada folder `dataSkill/`.

## Struktur backend robot

Setiap tahap punya AI analis sendiri (Market, News) yang **hanya menghasilkan laporan**, tidak pernah
signal. Keputusan akhir selalu ada di tangan **Decision Executor** — satu-satunya yang mengeluarkan
**signal**. Setelah itu, **Backend Validator** (kode deterministik, bukan LLM) memvalidasi ulang sebelum
signal dianggap final — dan juga jadi gerbang SEBELUM pipeline berjalan sama sekali (cek token/langganan,
batas risiko, performa akun).

**Tidak ada lagi Risk Analyst.** Batas risiko (max risk/hari, max risk/bulan, max open posisi) sekarang
dicek langsung oleh kode backend sebelum pipeline analisa dimulai — bukan lewat LLM. Sebagai gantinya ada
**AI Coach**, agent kondisional yang HANYA muncul ketika performa robot akhir-akhir ini kurang baik,
memberi saran singkat ke pemilik robot (halaman + email) — murni advisory, tidak pernah memveto sinyal.

Prinsip yang berlaku di semua skill: backend membaca market lalu MENGHITUNG nilai indikator dan level
teknikal (support/resistance/pivot) sebelum dikirim ke AI. AI TIDAK PERNAH menentukan/menghitung nilai
apapun dari data mentah — AI hanya menerima data yang sudah jadi dan menafsirkannya. LLM tidak pernah
jadi otoritas akhir untuk angka yang menyangkut uang, atau untuk keputusan apakah robot boleh jalan —
itu tugas kode backend.

**Output akhir tidak pernah menyertakan lot/ukuran posisi.** Robot ini bisa di-follow dan sinyalnya
didistribusikan ke banyak penerima (portofolio robot terpisah, marketplace/copy-signal — lihat
[catatan.md](../catatan.md) produk #3–#4) dengan modal & toleransi risiko masing-masing berbeda. Karena
itu Decision Executor hanya menghasilkan sinyal berbasis harga: arah (BUY/SELL/WAIT), zona entri, SL, dan
tiga level Take Profit — **TP1** dihitung tepat dari `min_risk_reward` settings robot, **TP2**/**TP3**
diturunkan dari level teknikal hasil analisa. Manajemen risiko & lot sepenuhnya di tangan penerima sinyal
saat eksekusi.

**Robot berbayar.** Dua model biaya (per-signal token, atau langganan bulanan) plus uji coba gratis untuk
user baru — lihat [06-billing-tokens.md](dataSkill/06-billing-tokens.md). Detail teknis implementasi
wallet/pembayaran sengaja belum dirancang (menyusul).

## Isi folder `dataSkill/`

| File                                                         | Isi                                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [00-form-schema.md](dataSkill/00-form-schema.md)             | Skema settingan robot, jadwal analisa, prompt auto/manual, alur wizard pembuatan robot                 |
| [01-market-analyst.md](dataSkill/01-market-analyst.md)       | Analis teknikal — tren, key levels, indikator, pola Elliott Wave & candlestick                         |
| [02-news-analyst.md](dataSkill/02-news-analyst.md)           | Analis fundamental/berita — diaktifkan kondisional (hemat biaya token)                                 |
| [03-ai-coach.md](dataSkill/03-ai-coach.md)                   | Mentor performa kondisional — saran ke pemilik robot, bukan veto sinyal                                |
| [04-decision-executor.md](dataSkill/04-decision-executor.md) | Sintesis akhir → signal BUY/SELL/WAIT + TP1/TP2/TP3, termasuk mode manajemen posisi terbuka            |
| [05-backend-validator.md](dataSkill/05-backend-validator.md) | Lapisan kode (bukan LLM) — pre-check sebelum pipeline, gate di tengah, validasi akhir sebelum eksekusi |
| [06-billing-tokens.md](dataSkill/06-billing-tokens.md)       | Aturan biaya: token per-signal, langganan bulanan, free trial, peringatan saldo                        |
| [07-market-data.md](dataSkill/07-market-data.md)             | Sumber & caching candle historis — DB lokal jadi sumber utama, API pihak ketiga cuma untuk delta        |

## Symbol

Satu robot = satu `symbol` tetap (baseline, tersimpan di settings). Trigger manual analisa boleh
menyertakan override symbol untuk sekali analisa; jika kosong, pakai symbol default dari settings.
Detail resolusinya ada di [00-form-schema.md](dataSkill/00-form-schema.md).

## Status draft lama
