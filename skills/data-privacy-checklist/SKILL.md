# Skill: data-privacy-checklist

## Tujuan
Memastikan setiap perubahan mempertahankan minimisasi data, pembatasan tujuan, kontrol akses, auditabilitas, dan perlindungan data pelanggan Dacie Beauty.

## Kapan dipakai
Wajib untuk setiap task yang menyentuh data pelanggan, booking, nomor WhatsApp, records, consent, audit log, logging, backup, penghapusan, export, atau layanan pihak ketiga. Gunakan juga sebagai pemeriksaan akhir untuk semua task.

## Langkah pemeriksaan

### A. Tujuan dan minimisasi
- [ ] Tujuan pengumpulan data jelas dan relevan dengan fitur.
- [ ] Booking publik hanya mengumpulkan nama, WhatsApp, treatment, tanggal, dan jam.
- [ ] Tidak ada keluhan atau data kesehatan pada form publik.
- [ ] Tidak ada field atau event telemetry tambahan yang mengumpulkan data yang tidak diperlukan.

### B. Klasifikasi dan lokasi data
- [ ] Data booking berada pada skema `booking`.
- [ ] Data kulit/kesehatan hanya berada pada skema `records`.
- [ ] Tidak ada salinan data kulit di tabel booking, log, cache publik, atau analytics.
- [ ] Nomor WhatsApp dinormalisasi konsisten ke format `62xxxxxxxxxx`.
- [ ] Nomor WhatsApp bukan faktor autentikasi.

### C. Akses dan pemisahan
- [ ] `web-public` (`APP_MODE=public`) hanya menerima credential `app_public` dan secret CAPTCHA.
- [ ] `web-public` menolak startup bila environment mengandung credential/secret privat.
- [ ] `web-private` (`APP_MODE=private`) hanya menerima credential `app_private` dan secret sesi.
- [ ] Kedua instance memakai image/codebase yang sama tetapi environment dan proses terpisah.
- [ ] Jalur publik menggunakan role `app_public`.
- [ ] Jalur privat menggunakan role `app_private`.
- [ ] Fungsi publik D-02 dimiliki `booking_public_fn_owner` (NOLOGIN, bukan superuser; SELECT tabel konfigurasi dan SELECT/INSERT bookings, tanpa UPDATE/DELETE).
- [ ] Fungsi status dimiliki `booking_private_fn_owner` (NOLOGIN, bukan superuser; SELECT dan UPDATE kolom status bookings serta INSERT status_events saja); grant tabel/kolom owner hanya dibuat T-005.
- [ ] `app_public` tidak dapat membaca/menulis/mengakses skema `records`.
- [ ] Fungsi publik hanya mengembalikan data minimum dan tidak menyertakan nama/kontak.
- [ ] Route privat membutuhkan sesi aplikasi sah.
- [ ] `web-public` 404 untuk route privat dan `web-private` 404 untuk route publik.
- [ ] Host guard allowlist aktif sebagai lapisan kedua.
- [ ] Route privat tidak dilayani melalui hostname booking.
- [ ] Cloudflare Access bukan satu-satunya kontrol autentikasi.
- [ ] Tepat dua akun internal aktif sesuai kebijakan pemilik.

### D. Persetujuan dan transparansi
- [ ] Profil identitas dasar (nama/WA) dapat dibuat sebelum consent bila diperlukan untuk alur booking.
- [ ] Sebelum field kesehatan/kulit atau catatan kunjungan dibuat/diubah, consent harus sudah tercatat dan diverifikasi server-side.
- [ ] Tanggal dan versi teks persetujuan dicatat.
- [ ] Versi teks persetujuan dapat ditelusuri.
- [ ] UI tidak mengklaim kepatuhan hukum secara otomatis.
- [ ] Form booking menampilkan kalimat statis bahwa nama dan nomor hanya dipakai untuk konfirmasi jadwal, dengan tautan halaman privasi; bukan field/checkbox tambahan.
- [ ] Teks final pemberitahuan disiapkan pemilik dan ditandai untuk tinjauan hukum.
- [ ] Pemberitahuan privasi dan dasar pemrosesan telah ditinjau pihak yang kompeten.

### E. Penggunaan dan retensi
- [ ] Data digunakan sesuai tujuan yang diinformasikan.
- [ ] Tidak ada pemakaian untuk promosi atau tujuan sekunder tanpa dasar yang sesuai.
- [ ] Masa retensi telah ditentukan atau ditandai sebagai keputusan yang belum selesai.
- [ ] Permintaan akses, koreksi, penghapusan, atau anonimisasi mempunyai alur penanganan.
- [ ] Penghapusan tidak menghilangkan kewajiban hukum yang perlu ditinjau.

### F. Logging dan observability
- [ ] Log aplikasi tidak memuat nama, nomor WA, catatan kulit, keluhan, alergi, password, cookie, token, atau secret.
- [ ] Audit log mencatat user, aksi, objek, dan waktu.
- [ ] Audit log tidak menyimpan salinan isi catatan sensitif.
- [ ] Akses melihat profil/rekam tercatat.
- [ ] Error response tidak membocorkan PII atau detail internal.

### G. Test, dokumentasi, dan artefak
- [ ] Semua data test dan seeder sintetis.
- [ ] Screenshot dan laporan bebas data pelanggan.
- [ ] Tidak ada dump database atau backup pada commit.
- [ ] Tidak ada secret pada repo, laporan, atau chat.
- [ ] Test akses negatif dan pemisahan role dijalankan.
- [ ] Bukti dan keterbatasan dicatat di laporan task.

### H. Vendor dan transfer data
- [ ] Dependency/service baru telah diperiksa lisensi, pemeliharaan, dan syaratnya.
- [ ] Pemrosesan data oleh pihak ketiga diidentifikasi.
- [ ] Lokasi pemrosesan/transfer lintas negara ditandai untuk tinjauan.
- [ ] Batas paket gratis dan kuota layanan diverifikasi dari sumber resmi sebelum diandalkan.
- [ ] Versi Next.js stabil dan advisory keamanan resmi diperiksa saat bootstrap; URL sumber dan tanggal dicatat.
- [ ] Audit dependency dijalankan dalam `scripts/verify.sh`; temuan high/critical menggagalkan verifikasi kecuali ada pengecualian tertulis.

## Penanganan permintaan hapus/anonimkan
1. Verifikasi identitas dan ruang lingkup permintaan melalui prosedur internal.
2. Jangan langsung menghapus sebelum memeriksa relasi, backup, dan kewajiban retensi.
3. Eskalasi kasus yang tidak jelas kepada pemilik dan penasihat hukum.
4. Jalankan operasi yang disetujui secara transaksional dan dapat diverifikasi.
5. Jangan menyalin isi data yang dihapus ke audit log.
6. Catat metadata tindakan dan hasilnya.
7. Pastikan kebijakan backup dan masa retensi salinan turut dipertimbangkan.

## Konteks hukum
Gunakan UU Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi sebagai rujukan utama untuk proses review. Skill ini bukan nasihat hukum dan checklist yang dicentang bukan bukti kepatuhan. Dasar pemrosesan, teks persetujuan, retensi, hak subjek data, insiden, dan transfer lintas negara perlu dikaji oleh pihak yang kompeten.

## Kapan harus berhenti
Hentikan task dan laporkan jika:
- data records akan dapat diakses dari jalur publik;
- data kesehatan diminta pada form booking;
- data pelanggan asli diminta untuk test/demo;
- secret atau PII ditemukan pada log/commit/laporan;
- tujuan pemrosesan tidak jelas;
- penghapusan berpotensi melanggar kewajiban retensi;
- layanan pihak ketiga akan menerima data tanpa tinjauan dan persetujuan yang diperlukan.

## Format hasil review
Pada laporan task, tulis:
- Checklist yang terpenuhi dengan bukti.
- Item yang gagal atau tidak terverifikasi.
- Risiko dan mitigasi.
- Keputusan yang perlu dibuat pemilik.
Jangan menandai seluruh checklist lulus hanya karena tidak menemukan masalah secara kasat mata.
