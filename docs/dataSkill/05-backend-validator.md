---
component: backend-validator
type: deterministic-code
not_an_llm_skill: true
runs: sebelum, di tengah, dan sesudah pipeline analisa — lihat 3 bagian di bawah
---

# BACKEND VALIDATOR — Lapisan Pengaman Kode

Ini **bukan** skill LLM/prompt — ini fungsi deterministik di backend (Node.js) yang menjadi gerbang di
tiga titik: sebelum pipeline analisa dimulai, di tengah pipeline (gate kondisi market), dan sesudah
Decision Executor selesai (sebelum `signal_final` disimpan). LLM tidak pernah menjadi otoritas terakhir
untuk angka yang berdampak uang, atau untuk keputusan apakah robot boleh jalan sama sekali.

## A. Pre-check — sebelum pipeline analisa dijalankan sama sekali

Semua poin di bagian ini murni kode, TIDAK PERNAH memanggil LLM apapun — tujuannya justru menghindari
panggilan LLM yang tidak perlu (biaya token) kalau robot memang tidak boleh jalan.

1. **Cek saldo token / status langganan** (lihat [06-billing-tokens.md](06-billing-tokens.md)):
   - Mode per-signal: saldo token pemilik robot WAJIB ≥ 4× biaya token per sinyal robot ini. Jika
     `saldo <= 3× biaya per sinyal`, robot di-set OFF, tampilkan peringatan di halaman robot + kirim
     email ke pemilik. Jika saldo sudah tidak cukup untuk 1 sinyal sekalipun, robot langsung diabaikan
     (skip total, tidak ada pipeline yang jalan).
   - Mode bulanan: cek `subscription.expires_at`. Kalau ≤ 7 hari lagi, kirim peringatan (email + halaman)
     tapi robot tetap jalan. Kalau sudah expired, robot di-set OFF (skip total) sampai diperpanjang.
2. **Cek kuota sinyal** (batas keras, terlepas dari saldo/langganan masih cukup atau tidak):
   - Mode per-signal: jumlah sinyal hari ini WAJIB < `max_signal_per_day` (dipilih user sendiri saat
     konfirmasi biaya). Kalau sudah tercapai → skip sampai hari berikutnya.
   - Mode bulanan: jumlah sinyal periode berjalan WAJIB < `max_signal_per_month` (dihitung dari formula
     di [06-billing-tokens.md](06-billing-tokens.md)). Kalau sudah tercapai → skip sampai periode
     berikutnya.
3. **Cek batas risiko akun** (menggantikan Risk Analyst lama — murni kode, bukan LLM):
   - `risk_used_today_percent >= max_risk_per_day_percent` → skip analisa hari ini, catat alasan.
   - `risk_used_month_percent >= max_risk_per_month_percent` → skip sampai bulan berikutnya.
   - `open_positions_count >= max_open_posisi` → skip analisa kali ini (posisi penuh).
   - Semua ini dicek dari riwayat transaksi asli, bukan dari LLM manapun.
4. **Evaluasi trigger AI Coach**: cek `portfolio_summary` + `last_5_trades` terhadap threshold performa
   (ditentukan backend, mis. win rate & drawdown). Kalau di bawah threshold → panggil
   [03-ai-coach.md](03-ai-coach.md), simpan hasilnya, kirim ke halaman + email pemilik. Ini TIDAK
   menghentikan pipeline analisa yang sedang berjalan — murni notifikasi ke pemilik robot.
5. Baru setelah lolos poin 1–3 di atas → lanjut hitung `indicator_values` + `key_levels`, lalu panggil
   Market Analyst.

## B. Gate di tengah pipeline — setelah Market Analyst, sebelum News/Decision

6. **Gate kondisi market**: kalau setting robot `market_condition == "trend"` dan
   `market_report.trend == "Sideways"`, **hentikan pipeline di sini** — jangan panggil News Analyst atau
   Decision Executor sama sekali (hemat biaya token, sesuai [06-billing-tokens.md](06-billing-tokens.md)).
   Kalau `market_condition == "all"`, selalu lanjut ke News/Decision terlepas dari hasil `trend`.

## C. Post-check — setelah Decision Executor selesai, sebelum `signal_final` disimpan

7. **Validasi schema JSON** tiap output agent (Market, News jika diaktifkan, Decision). Reject + retry
   (dengan log) jika ada field wajib hilang atau tipe data salah, termasuk enum yang tidak sesuai daftar
   resmi (mis. `trend` di luar `Bullish`/`Bearish`/`Sideways`, `signal` di luar `BUY`/`SELL`/`WAIT`).
8. **Cek konsistensi block-new-position**: jika `news_report != null` dan
   `news_report.trading_restriction.block_new_position == true` tetapi `decision.mode == "open_new"` dan
   `decision.signal != "WAIT"`, backend **paksa override** `signal` menjadi `"WAIT"`.
9. **Lot/ukuran posisi sengaja TIDAK dihitung di sini** — robot ini nantinya bisa di-follow dan sinyalnya
   didistribusikan ke banyak penerima dengan modal & toleransi risiko berbeda-beda, jadi manajemen risiko
   (termasuk lot) sepenuhnya jadi tanggung jawab penerima sinyal saat eksekusi. `signal_final` TIDAK
   PERNAH menyertakan field lot/size apapun — jangan menambahkannya di lapisan ini.
10. **Hitung ulang & validasi `tp1`/`tp2`/`tp3`** dari `entry_zone`, `stop_loss`, dan `robot_settings.min_risk_reward`:
    - `tp1` WAJIB persis sama dengan `entry ± (jarak(entry, stop_loss) × min_risk_reward)`. Jika meleset,
      backend **timpa** `tp1` dengan hasil hitungan deterministik ini (jangan percaya angka dari LLM).
    - `tp2`/`tp3` WAJIB cocok dengan salah satu level pada `market_report.key_levels` di sisi yang benar
      (searah signal, lebih jauh dari `tp1`, urut `tp1 → tp2 → tp3` menjauhi entry). Jika tidak cocok atau
      levelnya tidak tersedia, override `signal` menjadi `"WAIT"`.
11. **Cek slippage harga real-time**: bandingkan harga pasar saat ini (fetch ulang, bukan pakai data awal
    pipeline) terhadap `entry_zone` — jika selisih melebihi threshold yang wajar, reject sinyal atau
    tandai `"stale_price"`.
12. **Cek circuit breaker tingkat akun** (bukan tingkat trade): max daily loss, max posisi bersamaan,
    cooldown setelah N kekalahan beruntun — independen dari pre-check di bagian A, sebagai lapisan kedua.
13. **Cek ulang saldo token/langganan + kuota sinyal** (sekali lagi, singkat) — mencegah race condition
    kalau saldo/kuota berubah di antara pre-check (bagian A) dan selesainya pipeline (mis. dua robot
    jalan bersamaan menghabiskan token yang sama, atau trigger manual + jadwal otomatis bertabrakan).
    Kalau saldo/kuota sudah tidak cukup, batalkan `signal_final`, jangan dibebankan biayanya, robot
    di-set OFF + peringatan seperti poin 1/2.
14. **Idempotency check**: pastikan tidak ada job pipeline yang masih berjalan untuk robot+symbol yang
    sama sebelum menyimpan `signal_final` baru — cegah eksekusi ganda akibat run yang tumpang tindih
    (jadwal + trigger manual bersamaan, atau retry setelah timeout).
15. Baru setelah lolos seluruh poin di atas → potong biaya (token atau kuota bulanan), simpan sebagai
    `signal_final` ke database, tampilkan ke dashboard pengguna / teruskan ke eksekusi EA.

## Prinsip

> Skill LLM menentukan **arah** keputusan (kualitatif + kuantitatif dari reasoning, berdasarkan data yang
> sudah dihitung backend). Kode backend memutuskan **angka final** yang menyangkut uang sungguhan, DAN
> memutuskan apakah robot boleh jalan sama sekali (risiko, token, langganan) — tidak pernah mempercayai
> satu output LLM manapun sebagai kebenaran mutlak tanpa verifikasi ulang.
