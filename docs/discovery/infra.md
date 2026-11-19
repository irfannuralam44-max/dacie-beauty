# Discovery Infrastruktur — Dacie Beauty

**Status:** Kerangka discovery; hasil aktual belum dikumpulkan.  
**Task pemilik:** T-038 — Spike infrastruktur awal dua instance.  
**Aturan:** jangan mengisi angka, kuota, atau fitur berdasarkan perkiraan. Setiap klaim layanan harus memiliki URL sumber resmi dan tanggal pemeriksaan. Jika belum terbukti, tulis **perlu diverifikasi**.

## 1. Lingkungan spike

| Item | Hasil |
|---|---|
| Mini PC / OS | perlu diverifikasi |
| Versi Docker Engine / Compose | perlu diverifikasi |
| Image aplikasi yang digunakan | perlu diverifikasi saat T-038 |
| Service web-public / APP_MODE | perlu diverifikasi saat T-038 |
| Service web-private / APP_MODE | perlu diverifikasi saat T-038 |
| Domain booking dan rekam | menunggu domain pemilik |
| Hasil smoke test dua hostname | belum dijalankan |

## 2. Cloudflare Tunnel

| Pemeriksaan | Hasil | URL sumber resmi | Tanggal |
|---|---|---|---|
| Pemetaan booking ke web-public | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Pemetaan rekam ke web-private | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Tanpa port forwarding router | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |

## 3. Cloudflare Access — uji dua email

| Pemeriksaan | Hasil | URL sumber resmi | Tanggal |
|---|---|---|---|
| Ketersediaan paket/fitur yang dibutuhkan | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Batas paket dan jumlah pengguna yang berlaku | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Policy allowlist dua email dari dashboard | belum diuji | perlu diverifikasi | perlu diverifikasi |
| Hasil allow untuk dua email yang disetujui | belum diuji | — | — |
| Hasil deny untuk identitas lain | belum diuji | — | — |

**Catatan:** konfigurasi email dilakukan pada dashboard Cloudflare, bukan repository. Jangan mencatat alamat email atau credential dalam file ini.

## 4. Turnstile gratis

| Pemeriksaan | Hasil | URL sumber resmi | Tanggal |
|---|---|---|---|
| Syarat paket/layanan gratis | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Batas penggunaan/kuota yang berlaku | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Ketentuan privasi dan pemrosesan data | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |
| Kesesuaian untuk form booking Dacie Beauty | perlu diverifikasi | perlu diverifikasi | perlu diverifikasi |

## 5. Hasil dan keputusan spike

- Hasil deployment hello dua instance: belum dijalankan.
- Hasil pengujian route silang 404: belum dijalankan.
- Hasil host guard allowlist: belum dijalankan.
- Temuan risiko A-03/A-04: belum dinilai.
- Keputusan lanjutan: menunggu laporan T-038 dan audit.

## 6. Bukti yang boleh disimpan

- URL sumber resmi dan tanggal akses.
- Screenshot dashboard yang sudah disamarkan dari email, token, dan identifier sensitif.
- Hasil HTTP status dan log yang telah dipastikan bebas secret/PII.
- Ringkasan konfigurasi tanpa nilai credential.

Jangan menyimpan token Tunnel, secret CAPTCHA, session secret, alamat email allowlist, data pelanggan, atau isi request booking pada dokumen ini.
