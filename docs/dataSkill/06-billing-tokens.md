---
doc: billing-tokens
version: 1.0
type: business-rules
note: "Detail teknis implementasi (wallet, payment gateway, ledger) sengaja belum dirancang di sini —
       sesuai arahan: 'untuk teknis bagaimana tokenya nanti saja'. File ini hanya aturan bisnis, formula,
       dan field yang dibutuhkan, bukan skema database final."
---

# BIAYA & TOKEN — ATURAN BISNIS

Robot AI dikenai biaya dengan **2 model**, dipilih user per robot saat konfirmasi akhir pembuatan robot
(lihat [00-form-schema.md](00-form-schema.md) bagian "Alur pembuatan robot"):

1. **Per-signal** — bayar token setiap kali robot menghasilkan 1 sinyal (baik `BUY`/`SELL`/`WAIT` — tetap
   dihitung karena tetap memanggil LLM, lihat catatan biaya di bawah).
2. **Bulanan** — bayar langganan tetap per bulan, sudah mencakup kuota sinyal maksimal per bulan.

Ada juga **uji coba gratis** untuk user baru (lihat bagian Free Trial).

## Token

- 1 token = **Rp 100** (mata uang milik platform, bukan mata uang riil — dibeli di muka oleh user).
- User membeli token di awal (top-up); belum ada pengisian otomatis/berlangganan token per bagian ini
  (murni beli-habis, konsisten dengan model "per-signal").

## Perhitungan biaya per sinyal (ditentukan saat konfirmasi akhir pembuatan robot)

Biaya per sinyal BEDA-BEDA per robot, tergantung kombinasi setting yang dipilih (jumlah indikator, filter
news aktif/tidak, dll — makin banyak yang dipanggil, makin mahal biaya LLM riilnya). Dihitung sekali saat
user menyelesaikan form pembuatan robot (di step konfirmasi biaya):

```
real_cost_idr      = total biaya LLM riil untuk 1 kali analisa penuh robot ini, dikonversi ke Rupiah
                      (bervariasi: jumlah indikator, news on/off, dst — dihitung backend saat itu juga)
cost_with_margin   = real_cost_idr × 1.5              // margin 50% di atas biaya asli
tokens_per_signal  = ceil( cost_with_margin / 100 )   // dibulatkan ke atas, ke satuan token
```

## Perhitungan harga bulanan

```
signals_per_day_max = floor(1440 / waktu_analisa_menit)   // dari interval analisa robot, bukan dari
                                                            // filter sesi/kondisi market (biar user tidak
                                                            // dirugikan kalau filter mengurangi jumlah
                                                            // sinyal aktual — harga pakai skenario maksimal)
monthly_price_idr   = (tokens_per_signal × 100) × signals_per_day_max × 30
max_signal_per_month = signals_per_day_max × 30
```

Ditampilkan ke user: harga bulanan (Rupiah) + `max_signal_per_month` sebagai kuota sinyal yang didapat.
`max_signal_per_month` adalah **batas keras** yang ditegakkan backend (bukan sekadar angka informasi) —
begitu tercapai dalam periode berjalan, robot berhenti menghasilkan sinyal baru sampai periode berikutnya,
persis seperti `max_signal_per_day` yang ditegakkan di mode per-signal (lihat
[05-backend-validator.md](05-backend-validator.md) bagian A poin 1).

## Pre-check sebelum analisa (lihat [05-backend-validator.md](05-backend-validator.md) bagian A)

- **Mode per-signal**: saldo token WAJIB ≥ **4× `tokens_per_signal`** sebelum analisa boleh jalan.
  - Kalau saldo turun ke **≤ 3× `tokens_per_signal`** → robot **OFF**, peringatan tampil di halaman robot
    + dikirim email ke pemilik.
  - Kalau saldo sudah tidak cukup untuk 1 sinyal sekalipun → robot diabaikan total (skip, tidak ada
    pipeline yang jalan sama sekali, tidak ada biaya yang bisa ditagih).
- **Mode bulanan**: cek tanggal kedaluwarsa langganan.
  - **≤ 7 hari** sebelum expired → kirim peringatan (email + halaman), robot tetap jalan normal.
  - Sudah **expired** tanpa perpanjangan → robot **OFF** (skip total) sampai diperpanjang.

## Free Trial

- Hanya untuk **user baru yang belum pernah membuat robot sama sekali**.
- Durasi: **1 minggu**, gratis (tidak memotong token/tidak perlu langganan).
- Dibatasi maksimal **3 kali analisa per hari** selama masa trial.
- Setelah 1 minggu atau robot ke-2 dibuat (mana dulu), user WAJIB pilih salah satu dari 2 model biaya di
  atas.

## Field yang dibutuhkan (referensi — bukan skema DB final, lihat catatan di frontmatter)

**Billing settings per robot**

| Field | Keterangan |
|---|---|
| `billing_mode` | `"per_signal"` atau `"monthly"` |
| `tokens_per_signal` | dihitung sekali saat robot dibuat (lihat formula di atas) |
| `max_signal_per_day` | khusus mode per-signal — batas pengeluaran harian, DIPILIH user sendiri (bukan hasil formula) |
| `monthly_price_idr` | khusus mode bulanan, dihitung dari formula di atas |
| `max_signal_per_month` | khusus mode bulanan, dihitung dari formula di atas |
| `is_free_trial` | true selama masih dalam masa trial |
| `trial_started_at` / `trial_ends_at` | penanda masa trial |

**Wallet token per user**

| Field | Keterangan |
|---|---|
| `token_balance` | saldo token user saat ini |

**Riwayat transaksi token (ledger)**

| Field | Keterangan |
|---|---|
| `type` | `"purchase"` / `"spend"` / `"refund"` |
| `amount` | jumlah token (+/-) |
| `balance_after` | saldo setelah transaksi ini (audit trail) |
| `robot_id` | robot mana yang memicu (kalau `type: "spend"`) |

**Langganan bulanan per robot**

| Field | Keterangan |
|---|---|
| `status` | aktif / expired |
| `current_period_end` | tanggal expired |
| `warned_7_days_sent` | flag supaya peringatan 7-hari tidak terkirim berulang tiap hari |
