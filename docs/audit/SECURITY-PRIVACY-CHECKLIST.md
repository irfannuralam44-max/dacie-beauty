# Checklist Audit Keamanan dan Privasi Dacie Beauty

Checklist ini digunakan bersama PRD, `AGENTS.md`, task terkait, laporan agent, dan diff. Checklist bukan sertifikasi keamanan atau pendapat hukum. Tandai setiap butir **PASS**, **FAIL**, **tidak relevan**, atau **tidak terverifikasi** dan sertakan bukti.

## 1. Aturan audit

- Jangan menyimpulkan aman hanya karena tes lulus.
- Periksa implementasi dan tes negatif, bukan hanya UI.
- Periksa diff pada SHA yang tepat.
- Jangan meminta atau menyalin secret/data pelanggan ke chat atau laporan.
- Gunakan data sintetis untuk semua pengujian.
- Jika tidak dapat diperiksa, tandai **tidak terverifikasi**.
- Temuan P0/P1 adalah blocker merge.

## 2. Repository, secret, dan supply chain

- [ ] Tidak ada password, token, private key, connection string, atau isi `.env` di commit.
- [ ] `.env` dan file secret dikecualikan dari Git; contoh env hanya placeholder.
- [ ] Secret tidak tercetak oleh script, exception, debug log, atau laporan.
- [ ] Secret scan lokal dijalankan dan hasilnya tersedia.
- [ ] Dependency baru punya alasan jelas dan lisensinya diperiksa.
- [ ] Tidak ada dependency/engine hasil copy tanpa pemeriksaan lisensi dan pencatatan sumber.
- [ ] Lockfile konsisten dengan package manager yang dipilih.
- [ ] Tidak ada workflow CI remote yang ditambahkan bertentangan dengan keputusan proyek.
- [ ] Versi Next.js stabil dan advisory resmi diperiksa saat bootstrap; URL dan tanggal dicatat.
- [ ] Audit dependency berjalan melalui `scripts/verify.sh`; high/critical menggagalkan kecuali ada pengecualian tertulis.

## 3. Identitas, autentikasi, dan sesi privat

- [ ] Tidak ada pendaftaran publik.
- [ ] Hanya dua akun yang diizinkan dapat aktif.
- [ ] Password disimpan dengan password hashing yang sesuai; bukan plaintext atau hash cepat generik.
- [ ] Password/credential tidak pernah dikirim kembali dalam response.
- [ ] Login error tidak mengungkap apakah akun tertentu terdaftar.
- [ ] Percobaan login dibatasi.
- [ ] Sesi punya expiry dan logout/invalidation.
- [ ] Session ID dirotasi setelah login.
- [ ] Cookie sesi memakai Secure, HttpOnly, dan SameSite sesuai arsitektur.
- [ ] CSRF protection diterapkan pada operasi mutasi sesuai mekanisme yang dipakai.
- [ ] Tidak ada auth guard yang hanya berjalan di client.
- [ ] Tidak ada akun default atau password contoh yang aktif di produksi.

## 4. Otorisasi dan pemisahan hostname

- [ ] Semua halaman/API rekam kulit memeriksa sesi di server.
- [ ] Setiap fungsi repository privat memanggil `requireSession()`/otorisasi di lapisan data sebelum query; middleware/proxy bukan satu-satunya kontrol.
- [ ] Public hostname tidak menyajikan route privat.
- [ ] Host header dan forwarded headers divalidasi; tidak dipercaya secara membabi buta.
- [ ] Tidak ada akses privat hanya dilindungi oleh tombol/menu tersembunyi.
- [ ] Pengguna yang tidak diizinkan ditolak sebelum data privat dikembalikan.
- [ ] Cloudflare Access (saat fase deployment) allowlist hanya dua email yang disetujui.
- [ ] Login aplikasi tetap diwajibkan meskipun Access aktif.
- [ ] Konfigurasi Access/Tunnel diverifikasi dari lingkungan aktual, bukan hanya file dokumentasi.

## 5. Database dan least privilege

- [ ] Schema `booking` dan `records` terpisah.
- [ ] `web-public` dan `web-private` adalah dua instance dari satu codebase/image dengan `APP_MODE` yang berbeda.
- [ ] `web-public` hanya menerima `app_public` dan secret CAPTCHA; startup gagal jika ada credential/secret privat.
- [ ] `web-private` hanya menerima `app_private` dan secret sesi.
- [ ] Tiap instance 404 untuk route mode lain; host guard allowlist menjadi lapisan kedua.
- [ ] Public code path hanya memakai `app_public`.
- [ ] Private code path hanya memakai `app_private`.
- [ ] `app_public` tidak memiliki privilege tabel apa pun; hanya USAGE pada schema booking dan EXECUTE tiga fungsi D-02.
- [ ] `app_public` tidak punya USAGE/SELECT/INSERT/UPDATE/DELETE atau privilege lain pada `records`.
- [ ] `app_public` gagal saat SELECT/INSERT langsung ke tabel apa pun.
- [ ] Fungsi D-02 dimiliki `booking_public_fn_owner` (NOLOGIN, bukan superuser) dengan hanya SELECT tabel konfigurasi dan SELECT/INSERT bookings; tanpa UPDATE/DELETE.
- [ ] Fungsi D-03 dimiliki `booking_private_fn_owner` (NOLOGIN, bukan superuser) dengan hanya SELECT dan UPDATE kolom status bookings serta INSERT status_events.
- [ ] Kedua owner fungsi tidak memiliki privilege records atau hak tabel/kolom di luar daftar; grant tabel/kolom dibuat T-005, bukan T-042/T-043.
- [ ] Fungsi SECURITY DEFINER memakai search_path terkunci, objek dikualifikasi schema, REVOKE PUBLIC, EXECUTE terbatas.
- [ ] `app_private` memiliki SELECT seluruh booking, INSERT/UPDATE tanpa DELETE pada tabel konfigurasi D-03, tanpa DML langsung pada bookings; status melalui fungsi set_booking_status.
- [ ] Transisi status dicatat pada booking.status_events sesuai aturan D-03.
- [ ] Tidak ada privilege berlebih yang diwariskan melalui role membership/default privileges.
- [ ] Runtime role bukan superuser, bukan pemilik database, dan bukan role migrasi.
- [ ] Public slot lookup hanya mengembalikan slot yang tersedia, tanpa nama/kontak pelanggan.
- [ ] Akses treatment/jam kerja publik menggunakan kontrak sempit yang disetujui.
- [ ] Query menggunakan parameter binding.
- [ ] Migrasi berversi; migrasi yang sudah diterapkan tidak diedit ulang.
- [ ] Tes privilege memakai PostgreSQL dan kredensial role yang sebenarnya, bukan mock.
- [ ] Constraint database mencegah double booking pada request bersamaan.

## 6. Input, output, dan keamanan aplikasi web

- [ ] Semua input divalidasi server-side dengan schema yang jelas.
- [ ] Validasi client hanya untuk UX, bukan satu-satunya kontrol.
- [ ] Output di-escape sesuai konteks.
- [ ] Tidak ada rendering HTML tidak tepercaya tanpa sanitasi yang sesuai.
- [ ] Mutasi punya proteksi CSRF sesuai arsitektur.
- [ ] Error response tidak mengandung stack trace, SQL, secret, atau data pribadi.
- [ ] Rate limit endpoint publik diterapkan di server.
- [ ] Validasi nomor WhatsApp konsisten dengan normalisasi yang disimpan.
- [ ] CAPTCHA (jika digunakan) memiliki batas, kebijakan privasi, dan konfigurasi yang diverifikasi.
- [ ] Tidak ada upload file publik kecuali disetujui melalui perubahan PRD dan review keamanan.

## 7. Privasi data pelanggan dan data kesehatan

- [ ] Form booking publik hanya meminta lima field yang disepakati: nama, WhatsApp, treatment, tanggal, waktu.
- [ ] Form booking tidak meminta keluhan kulit, alergi, atau data kesehatan.
- [ ] Pemberitahuan privasi statis tampil di bawah tombol kirim dengan tautan halaman privasi; form tetap lima field dan tidak menambah checkbox.
- [ ] Data rekam kulit hanya tersedia di area privat.
- [ ] Data yang dikumpulkan sesuai tujuan dan scope PRD.
- [ ] Profil identitas dasar (nama/WA) boleh dibuat sebelum consent bila diperlukan untuk alur booking.
- [ ] Sebelum field kesehatan/kulit atau catatan kunjungan dibuat/diubah, consent sudah tercatat dan diverifikasi server-side.
- [ ] Consent timestamp dan versi teks consent dicatat.
- [ ] Teks persetujuan dapat ditelusuri berdasarkan versinya.
- [ ] Permintaan akses/koreksi/penghapusan ditangani melalui prosedur yang terotorisasi.
- [ ] Kebijakan retensi dan konsekuensi penghapusan/anonymisasi terdokumentasi.
- [ ] Tidak ada data pribadi nyata dalam test, seed, demo, issue, screenshot, atau laporan.
- [ ] Nomor WA digunakan untuk pencocokan dengan kehati-hatian; tidak ada auto-merge profil hanya berdasarkan kecocokan nomor.
- [ ] Data pelanggan tidak dikirim ke layanan pihak ketiga tanpa dasar dan persetujuan yang sesuai.
- [ ] Tidak ada klaim “patuh UU PDP” tanpa review hukum yang memadai.

## 8. Logging dan audit trail

- [ ] Log aplikasi tidak berisi nama pelanggan, nomor WA, alergi, keluhan, atau catatan kunjungan.
- [ ] Audit log mencatat actor, action, object reference, dan waktu sesuai kebutuhan.
- [ ] Audit log tidak menyalin seluruh isi catatan sensitif.
- [ ] Pengguna biasa tidak dapat mengubah/menghapus audit log.
- [ ] Akses baca dan perubahan record yang diwajibkan dicatat.
- [ ] Perubahan treatment, provider, jam kerja, durasi, dan jeda dicatat dalam audit log.
- [ ] Error/monitoring tidak mengirim payload pribadi ke sistem eksternal.
- [ ] Retensi log ditentukan dan tidak berlebihan.

## 9. Booking dan alur operasional

- [ ] Slot dihitung server-side dalam timezone Asia/Jakarta.
- [ ] Jam kerja, durasi treatment, jeda, time_off, dan provider diperhitungkan.
- [ ] Provider dipilih otomatis menurut priority; pelanggan tidak memilih provider.
- [ ] Hanya pending/confirmed memblokir slot; interval terpakai [mulai, mulai + durasi + jeda).
- [ ] Booking rules: langkah 30 menit, minimal 3 jam, maksimal 30 hari, maksimal 2 booking aktif per WA.
- [ ] Rentang get_blocked_intervals maksimum 35 hari dan output hanya provider_id serta interval.
- [ ] Booking baru tidak otomatis dinyatakan confirmed.
- [ ] Constraint/transaksi mencegah double booking.
- [ ] Public response tidak membocorkan identitas booking lain.
- [ ] Link WhatsApp menggunakan nomor ternormalisasi dan URL encoding yang benar.
- [ ] Tidak ada WhatsApp API otomatis/berbayar tanpa perubahan keputusan pemilik.
- [ ] Perubahan pengaturan tidak mengubah booking historis secara tidak sengaja.

## 10. Infrastruktur dan operasi

- [ ] HTTPS aktif pada kedua hostname.
- [ ] Tidak ada port router yang dibuka untuk mengekspos app/database.
- [ ] Database tidak dapat diakses langsung dari internet.
- [ ] Container menggunakan konfigurasi least privilege sejauh didukung.
- [ ] Volume database persisten dan backup diuji.
- [ ] Host Linux mendapat pembaruan keamanan.
- [ ] Akses SSH menggunakan key; password login dinonaktifkan bila sesuai konfigurasi operasional.
- [ ] Restart policy dan healthcheck diuji.
- [ ] Backup harian terenkripsi.
- [ ] Ada salinan backup offsite.
- [ ] Kunci dekripsi dapat dipulihkan secara aman dan tidak hanya berada di host yang sama.
- [ ] Restore drill berhasil pada lingkungan terisolasi.
- [ ] Recovery setelah reboot/power outage diuji.
- [ ] Runbook dan panduan migrasi VPS tersedia.

## 11. Pengujian wajib dan bukti

- [ ] Unit test untuk validasi/domain logic.
- [ ] Integration test dengan PostgreSQL.
- [ ] Tes negatif autentikasi dan otorisasi.
- [ ] Tes role database publik tidak dapat membaca records.
- [ ] Tes concurrency untuk double booking.
- [ ] E2E booking publik.
- [ ] E2E alur privat utama.
- [ ] Tes host publik menolak route privat.
- [ ] `scripts/verify.sh` berhasil.
- [ ] Hasil secret scan tercatat.
- [ ] Laporan menyebut SHA yang diaudit dan semua kriteria yang tidak terverifikasi.

## 12. Format ringkas hasil checklist

| Area | Status | Bukti/temuan | Temuan ID |
|---|---|---|---|
| Repository & secret | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Auth & session | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Authorization & host | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Database privilege | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Web application | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Data privacy | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Logging & audit | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Booking | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Infrastructure | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |
| Testing evidence | PASS/FAIL/tidak terverifikasi | <bukti> | <ID> |

**Catatan legal:** checklist ini membantu pemeriksaan teknis dan operasional. Penafsiran kewajiban UU PDP No. 27/2022, dasar pemrosesan, retensi, dan redaksi persetujuan tetap memerlukan peninjauan yang sesuai; checklist ini bukan nasihat hukum atau bukti kepatuhan.
