# Rencana Implementasi Dacie Beauty

**Status:** Rencana kerja  
**Basis spesifikasi:** `docs/PRD.md`, `AGENTS.md`, dan skill di `skills/*/SKILL.md`  
**Urutan fase:** 0 → 1 → 2 → 3 (tetap)  
**Model eksekusi:** satu coding agent aktif pada satu waktu; pekerjaan dan verifikasi dijalankan serial.

Dokumen ini menetapkan urutan implementasi, dependensi, perkiraan ukuran pekerjaan, serta gerbang kelulusan setiap fase. Dokumen ini **belum** memecah pekerjaan menjadi tiket implementasi rinci; daftar task T-XXX dibuat sebagai deliverable terpisah.

## 1. Prinsip pelaksanaan

1. Ikuti PRD dan `AGENTS.md` sebagai sumber keputusan. Jika ada konflik, hentikan pekerjaan terkait dan laporkan; jangan mengubah keputusan terkunci diam-diam.
2. Selesaikan satu fase dan gerbang penerimaannya sebelum memulai fase berikutnya.
3. Kerjakan satu task pada satu branch `agent/T-XXX-slug`. Agent tidak boleh push ke `main`; pemilik repo yang melakukan merge setelah audit.
4. Sebelum implementasi, sinkronkan Git sesuai prosedur `AGENTS.md`. Jika working tree kotor atau main tidak dapat fast-forward, berhenti dan laporkan.
5. Setiap perubahan harus memiliki pengujian yang relevan dan bukti pada laporan task. Data uji hanya data sintetis.
6. Jangan menambahkan layanan berbayar, CI GitHub Actions, Supabase, Netlify, atau integrasi WhatsApp API berbayar.
7. Jangan mengunci versi paket, batas paket gratis pihak ketiga, atau detail layanan yang belum diverifikasi. Catat sebagai discovery/assumption dan verifikasi dari dokumentasi resmi saat task terkait dikerjakan.
8. Semua estimasi di bawah adalah ukuran relatif, bukan janji kalender. Estimasi mengasumsikan satu agent, scope sesuai PRD, dan tidak ada perubahan arsitektur besar.

## 2. Skala estimasi

| Ukuran | Arti relatif | Pedoman |
|---|---|---|
| XS | Sangat kecil | Perubahan dokumentasi/konfigurasi terisolasi |
| S | Kecil | Satu komponen atau perubahan teknis sederhana |
| M | Sedang | Beberapa file, satu alur lengkap, pengujian terfokus |
| L | Besar | Beberapa lapisan aplikasi/data, pengujian integrasi |
| XL | Sangat besar | Area lintas sistem atau banyak ketidakpastian; pecah menjadi task lebih kecil |

Ukuran task tidak boleh menjadi alasan untuk melewati acceptance criteria. Task XL harus dipecah saat penyusunan daftar task.

## 3. Peta dependensi tingkat tinggi

```text
Fase 0 — Foundation
  ├─ repo & aturan agent
  ├─ Docker Compose + Next.js + PostgreSQL
  ├─ skema booking/records + migrasi + role DB
  ├─ verify.sh + pengujian batas privilege
  └─ struktur dokumentasi & laporan
          |
          v
Fase 1 — Booking publik
  ├─ konfigurasi treatment/provider/jam kerja yang aman
  ├─ kalkulasi slot server-side
  ├─ pembuatan booking + pencegahan bentrok
  ├─ UI booking Bahasa Indonesia
  └─ proteksi abuse + E2E
          |
          v
Fase 2 — Rekam kulit privat
  ├─ autentikasi dua akun + sesi
  ├─ isolasi hostname/route privat
  ├─ profil pelanggan + persetujuan
  ├─ riwayat kunjungan + follow-up
  ├─ daftar booking + tindakan konfirmasi
  ├─ pengaturan operasional
  └─ audit log + pengujian akses
          |
          v
Fase 3 — Hardening & release
  ├─ deployment mini PC Linux
  ├─ Cloudflare Tunnel + Access
  ├─ backup terenkripsi + restore drill
  ├─ pemulihan setelah listrik/server mati
  ├─ dokumentasi operasional + migrasi VPS
  └─ pilot dengan data sintetis
```

Fase 1 dan 2 sama-sama bergantung pada fondasi fase 0. Fase 2 boleh memanfaatkan data booking dari fase 1, sehingga tidak dimulai sebelum kontrak data booking stabil. Fase 3 mengeraskan dan mengoperasikan hasil fase 1–2; bukan tempat untuk menambal desain keamanan mendasar yang seharusnya selesai lebih awal.

## 4. Fase 0 — Foundation

**Tujuan:** menyediakan fondasi aplikasi dan database yang dapat dijalankan lokal, dimigrasikan secara terkontrol, serta membuktikan pemisahan privilege publik dan privat sejak awal.

### Urutan kerja

| Urutan | Area | Hasil yang diharapkan | Estimasi |
|---:|---|---|---|
| 0.1 | Repository dan struktur | Struktur Next.js App Router, TypeScript, folder docs/scripts/tests, aturan repo | S |
| 0.2 | Runtime lokal | Docker Compose untuk aplikasi dan PostgreSQL; health/readiness yang sesuai | M |
| 0.3 | Kontrak konfigurasi | Daftar environment variables, validasi konfigurasi server, contoh env tanpa rahasia | S |
| 0.4 | Skema dan migrasi | Schema `booking` dan `records`, migrasi SQL berversi, constraint dasar | L |
| 0.5 | Role database | Role `app_public` dan `app_private`, grant minimum, function slot sesuai kontrak yang disepakati | L |
| 0.6 | Fondasi pengujian | Unit/integration test dasar dengan PostgreSQL, data sintetis | M |
| 0.7 | Verifikasi lokal | `scripts/verify.sh` menjalankan lint, test, dan secret scan lokal | M |
| 0.8 | Bukti isolasi | Tes membuktikan `app_public` tidak dapat membaca schema `records`; kontrak route privat didokumentasikan untuk diuji penuh saat autentikasi tersedia | M |
| 0.9 | Dokumentasi agent | `AGENTS.md`, `CLAUDE.md`, skill, template laporan tersedia dan konsisten | S |

### Dependensi dan catatan

- 0.1 mendahului semua perubahan kode.
- 0.2 dan 0.3 mendahului pengujian integrasi yang membutuhkan database.
- 0.4 mendahului 0.5; grant dan function tidak boleh dibuat berdasarkan asumsi struktur tabel yang belum disepakati.
- 0.8 adalah gerbang keamanan wajib, bukan pekerjaan opsional.
- Keputusan akses konfigurasi publik seperti treatment dan jam kerja harus diselesaikan secara eksplisit. Task konfigurasi publik tidak boleh mengimplementasikan function tambahan untuk `app_public` sebelum pemilik menyetujui kontraknya; jangan memberi akses tabel secara luas.\n- Hak untuk mengubah status booking dari area privat juga merupakan keputusan terbuka (PRD K-07); jangan memberi UPDATE langsung kepada `app_private` sebelum kontrak disetujui.
- Pilihan driver database, pendekatan autentikasi, dan detail function slot mengikuti keputusan PRD atau hasil discovery yang dicatat. Hindari menambah dua pola data-access/auth sekaligus.

### Gerbang keluar fase 0

Fase 0 dinyatakan selesai hanya jika:
- Aplikasi dan PostgreSQL dapat dijalankan dari instruksi repo pada lingkungan pengembangan.
- Migrasi dapat diterapkan dari database kosong secara berurutan dan hasilnya konsisten.
- Dua role DB memiliki privilege minimum yang terdokumentasi.
- Pengujian negatif membuktikan `app_public` tidak bisa membaca `records`.
- Kontrak host/route privat terdokumentasi; tes request tanpa sesi wajib diselesaikan pada fase 2 setelah autentikasi dan route privat dibangun.
- `scripts/verify.sh` berjalan lokal dan hasilnya dicatat.
- Tidak ada rahasia atau data pelanggan nyata di repo, fixture, atau laporan.
- Auditor memberikan PASS atau PASS dengan catatan yang tidak menghalangi fase berikutnya.

## 5. Fase 1 — Booking publik

**Tujuan:** pelanggan dapat mengirim permintaan booking melalui halaman publik yang ringkas, sementara slot dihitung server-side dan bentrok jadwal dicegah di database.

### Urutan kerja

| Urutan | Area | Hasil yang diharapkan | Estimasi |
|---:|---|---|---|
| 1.1 | Kontrak booking | Status booking, aturan waktu, durasi, provider, dan perilaku slot terdokumentasi | S |
| 1.2 | Data konfigurasi publik | Cara aman membaca treatment/jam kerja/provider yang memang boleh ditampilkan | M |
| 1.3 | Mesin slot | Slot dihitung server-side menurut timezone Asia/Jakarta, jam kerja, durasi, jeda, dan booking aktif | L |
| 1.4 | Pencegahan bentrok | Constraint/transaksi DB mencegah dua booking bertabrakan, termasuk request bersamaan | L |
| 1.5 | Form booking | Form Bahasa Indonesia dengan lima field yang ditetapkan PRD, validasi server-side | M |
| 1.6 | UI status dan hasil | Konfirmasi penerimaan permintaan booking; tidak mengklaim booking terkonfirmasi sebelum proses manual | S |
| 1.7 | Proteksi abuse | Rate limit, validasi WhatsApp, dan CAPTCHA gratis setelah batas/ketentuan layanan diverifikasi | M |
| 1.8 | E2E dan regression | Playwright menguji alur booking, slot tidak tersedia, validasi, dan pencegahan bentrok | L |

### Dependensi dan catatan

- 1.1 harus menetapkan semantik status: permintaan yang masuk belum otomatis berarti dikonfirmasi.
- 1.2 harus mengikuti keputusan privilege fase 0 dan persetujuan pemilik atas kontrak konfigurasi publik. Sampai disetujui, jangan menambah privilege baru ke `app_public`.
- 1.3 mendahului UI final karena UI harus mengikuti kontrak slot server-side.
- 1.4 wajib diselesaikan sebelum booking dipakai pilot; pemeriksaan ketersediaan di UI saja tidak cukup.
- 1.7 tidak boleh menjadi satu-satunya pertahanan terhadap bentrok atau input berbahaya.
- Link WhatsApp untuk konfirmasi manual adalah tindakan pemilik, bukan integrasi API otomatis.
- Jangan meminta keluhan kulit, alergi, atau data kesehatan pada form publik. Form publik tetap lima field sesuai PRD.

### Gerbang keluar fase 1

- Pengunjung dapat melihat slot yang tersedia dan mengirim booking dengan lima field yang disetujui.
- Slot mengikuti timezone Asia/Jakarta dan aturan operasional dari server.
- Bentrok tidak dapat terjadi pada kondisi request bersamaan; bukti pengujian tersedia.
- Public route hanya menggunakan privilege publik dan tidak dapat membaca schema `records`.
- Input divalidasi di server dan proteksi abuse diterapkan sesuai hasil verifikasi.
- E2E alur booking berhasil; kasus gagal/slot penuh juga diuji.
- Copy dan status UI tidak menjanjikan konfirmasi otomatis.
- Auditor memberi persetujuan sebelum data booking dipakai oleh modul privat.

## 6. Fase 2 — Rekam kulit privat

**Tujuan:** pemilik dan istri dapat mengelola profil pelanggan dan riwayat perawatan secara privat dengan pembatasan akses ketat, persetujuan, dan audit log.

### Urutan kerja

| Urutan | Area | Hasil yang diharapkan | Estimasi |
|---:|---|---|---|
| 2.1 | Boundary privat | Route/host privat dipisahkan secara eksplisit; tidak tersaji di hostname booking | M |
| 2.2 | Autentikasi | Tepat dua akun yang dibuat secara terkontrol; tanpa pendaftaran publik | L |
| 2.3 | Sesi dan proteksi login | Password hash kuat, cookie aman, expiry, rate limit percobaan login | M |
| 2.4 | Otorisasi server | Semua operasi rekam kulit memerlukan sesi dan memakai `app_private` | L |
| 2.5 | Daftar dan profil pelanggan | Pencarian nama, profil, WhatsApp ternormalisasi, field sesuai PRD | M |
| 2.6 | Persetujuan dan privasi | Catatan waktu serta versi teks persetujuan; alur permintaan penghapusan/anonymisasi | M |
| 2.7 | Riwayat kunjungan | Catatan kondisi, treatment, produk, rekomendasi, tanggal follow-up | M |
| 2.8 | Penanda follow-up | Penanda jika kunjungan terakhir memenuhi ambang 25 hari sesuai aturan PRD | S |
| 2.9 | Integrasi booking privat | Daftar booking, tindakan konfirmasi manual, buka/buat profil berdasarkan WA | L |
| 2.10 | Pengaturan operasional | Treatment, provider, jam kerja, durasi, jeda dapat dikelola dari area privat | M |
| 2.11 | Audit log | Catat siapa melihat/mengubah record dan kapan, tanpa membocorkan isi sensitif ke log umum | M |
| 2.12 | Pengujian otorisasi | Uji tanpa sesi, role salah, akses silang, perubahan data, dan alur utama | L |

### Dependensi dan catatan

- 2.1–2.4 adalah prasyarat sebelum membuat UI atau endpoint yang menampilkan data pelanggan.
- Tidak boleh ada route privat yang hanya disembunyikan dari navigasi; proteksi harus ditegakkan di server.
- Akun kedua dibuat melalui prosedur administrasi aman, bukan registrasi mandiri.
- Normalisasi WhatsApp harus konsisten dan diuji. Pencocokan nomor bukan bukti identitas yang kuat; jangan menggabungkan profil otomatis tanpa pemeriksaan yang tepat.
- Audit log harus merekam akses dan perubahan sesuai PRD, tetapi tidak menyalin catatan kesehatan lengkap ke log.
- Data pelanggan tidak boleh muncul pada log aplikasi, error publik, analytics, atau laporan task.
- Penghapusan/anonymisasi harus mempertimbangkan kebutuhan retensi dan ketentuan hukum; detail legal yang belum pasti harus ditandai untuk konsultasi, bukan diklaim patuh otomatis.

### Gerbang keluar fase 2

- Hanya dua akun yang diizinkan dapat masuk; tidak tersedia pendaftaran publik.
- Semua endpoint dan halaman privat menolak request tanpa sesi dan memeriksa otorisasi di server.
- Data rekam kulit hanya diakses melalui koneksi privat `app_private`.
- Public booking hostname tidak menyajikan halaman atau API rekam kulit.
- Pencarian pelanggan, profil, kunjungan, follow-up, dan daftar booking bekerja sesuai PRD.
- Alur buka/buat profil dari booking menangani nomor WA yang cocok maupun tidak cocok dengan aman.
- Persetujuan dan audit log tercatat; tidak ada data kesehatan dalam log umum.
- Pengujian akses negatif dan E2E alur privat lulus.
- Auditor menyetujui sebelum deployment produksi.

## 7. Fase 3 — Hardening dan release

**Tujuan:** menjalankan sistem pada mini PC Linux secara aman dan dapat dipulihkan, dengan jalur migrasi ke VPS yang terdokumentasi.

### Urutan kerja

| Urutan | Area | Hasil yang diharapkan | Estimasi |
|---:|---|---|---|
| 3.1 | Audit kesiapan produksi | Checklist konfigurasi, threat/risk review, dependency dan secret review | M |
| 3.2 | Compose produksi | Konfigurasi production terpisah, restart policy, volume persisten, health checks | M |
| 3.3 | Mini PC Linux | Deploy dan verifikasi layanan pada perangkat target | M |
| 3.4 | Cloudflare Tunnel | Routing hostname publik dan privat tanpa membuka port router | M |
| 3.5 | Cloudflare Access | Allowlist dua email untuk hostname privat; verifikasi batas paket dan konfigurasi aktual | M |
| 3.6 | HTTPS dan cookie | Validasi TLS, Secure/HttpOnly/SameSite, trusted proxy dan origin handling | M |
| 3.7 | Backup terenkripsi | Backup harian PostgreSQL ke disk eksternal dan satu salinan offsite | M |
| 3.8 | Restore drill | Pemulihan database dan aplikasi dari backup, catat hasil serta waktu pemulihan | L |
| 3.9 | Recovery listrik/server | Uji restart setelah mati listrik/reboot, konsistensi database, layanan kembali sehat | M |
| 3.10 | Runbook operasional | Panduan start/stop, update, backup, restore, pemeriksaan log, respons insiden | M |
| 3.11 | Panduan migrasi VPS | Langkah pindah Compose dan restore backup ke host lain | S |
| 3.12 | Pilot terbatas | Uji alur dengan data sintetis, checklist penerimaan pemilik, catat temuan | M |

### Dependensi dan catatan

- Audit kesiapan produksi harus dilakukan setelah fitur fase 1 dan 2 stabil.
- Tunnel dan Access baru dikonfigurasi setelah routing dua hostname serta boundary privat telah diuji di aplikasi.
- Konfigurasi Access bukan pengganti autentikasi aplikasi. Keduanya tetap wajib.
- Backup belum dianggap valid sebelum restore drill berhasil.
- Simpan salinan offsite terenkripsi dan pastikan kunci pemulihan tidak hanya berada di perangkat yang sama.
- Periksa batas paket Cloudflare yang berlaku saat implementasi; jangan mengasumsikan fitur/kuota dari informasi lama.
- Uji pemulihan setelah reboot dan kehilangan daya, bukan hanya restart manual saat developer mengawasi.
- Pilot menggunakan data sintetis; data pelanggan nyata tidak boleh masuk ke test, demo, screenshot, atau laporan.

### Gerbang keluar fase 3

- Deployment produksi berjalan pada mini PC dengan volume persisten dan restart policy yang sesuai.
- Booking dan rekam kulit diakses melalui hostname yang benar.
- Hostname privat dilindungi Cloudflare Access allowlist dua email dan login aplikasi.
- Tidak ada port router yang dibuka untuk mengekspos aplikasi.
- Backup terenkripsi berjalan sesuai jadwal, termasuk satu salinan offsite.
- Restore drill berhasil dan runbook mencatat langkah serta hasilnya.
- Recovery setelah reboot/power outage telah diuji.
- Panduan migrasi VPS cukup untuk memindahkan aplikasi dan memulihkan database tanpa vendor lock-in.
- Pilot sintetis lulus dan pemilik menyetujui rilis.

## 8. Critical path dan area risiko

Urutan berikut paling berpengaruh terhadap jadwal dan tidak boleh diparalelkan secara sembarangan:

1. **Pemisahan privilege database:** skema, role, grant, dan function harus dirancang serta diuji sebelum endpoint publik dibangun.
2. **Kontrak slot dan constraint booking:** definisi slot, timezone, durasi, dan collision prevention harus stabil sebelum UI booking diselesaikan.
3. **Boundary privat dan autentikasi:** harus benar sebelum data pelanggan dibuat atau ditampilkan.
4. **Kecocokan booking ke profil:** normalisasi WA dan proses pembuatan/pencocokan profil memerlukan aturan eksplisit untuk mencegah penggabungan pelanggan yang salah.
5. **Backup dan pemulihan:** implementasi backup tanpa restore drill tidak memenuhi kesiapan produksi.
6. **Dua hostname:** routing Cloudflare tidak boleh menjadi satu-satunya kontrol keamanan; aplikasi harus tetap menolak akses privat pada hostname publik.

Jika ditemukan masalah pada salah satu area ini, hentikan task turunannya, tulis temuan pada laporan, dan minta keputusan pemilik/auditor.

## 9. Strategi verifikasi lintas fase

- Setiap task menjalankan tes terfokus yang relevan dan `scripts/verify.sh` sebelum push, sesuai `AGENTS.md`.
- Gunakan PostgreSQL nyata melalui Docker untuk integration test; jangan mengganti pengujian privilege dengan mock.
- Jalankan E2E untuk alur booking dan alur privat utama.
- Tambahkan tes negatif untuk setiap boundary keamanan: tanpa sesi, role DB salah, hostname salah, input tidak valid, dan request bersamaan.
- Laporan harus menyertakan perintah yang dijalankan, hasil, acceptance criteria satu per satu, dan bukti. Jika tidak dapat diperiksa, tulis **tidak terverifikasi**.
- Audit dilakukan dari laporan dan diff branch oleh pemilik/auditor sebelum merge. Agent tidak boleh menganggap push sebagai persetujuan merge.

## 10. Asumsi dan hal yang harus diverifikasi saat task dibuat

1. Pilihan driver/data-access dan strategi autentikasi mengikuti rekomendasi/discovery PRD; keputusan final dicatat sebelum implementasi terkait.
2. Versi Node.js LTS, Next.js, PostgreSQL, dan paket lain dipilih berdasarkan kompatibilitas serta dukungan saat task dikerjakan, bukan ditebak dalam dokumen ini.
3. Kemampuan dan batas paket Cloudflare Tunnel/Access diverifikasi dari dokumentasi resmi terkini.
4. Pilihan CAPTCHA gratis diverifikasi untuk batas penggunaan, privasi, dan integrasi.
5. Detail retensi, penghapusan, dan teks persetujuan ditinjau sesuai UU PDP No. 27/2022; dokumen ini bukan pendapat hukum atau klaim kepatuhan.
6. Durasi dan jadwal treatment awal dapat berubah melalui pengaturan privat; nilai default ditetapkan pada task implementasi berdasarkan keputusan pemilik.
7. Estimasi dapat direvisi setelah discovery teknis, tetapi urutan fase dan acceptance gate tidak berubah tanpa persetujuan pemilik.

## 11. Kriteria keberhasilan rencana

Rencana dianggap siap diturunkan menjadi task apabila:
- Setiap fase mempunyai tujuan, urutan, dependensi, estimasi relatif, dan gerbang keluar.
- Tidak ada pekerjaan fase lanjutan yang mendahului prasyarat keamanan fase sebelumnya.
- Task dapat dipecah menjadi sesi agent yang kecil dan dapat diaudit.
- Seluruh implementasi tetap mengikuti PRD dan `AGENTS.md`.
- Tidak ada klaim bahwa fitur sudah dibuat atau diuji hanya karena rencana ini ditulis.

---

**Dokumen berikutnya:** daftar task implementasi T-001 dan seterusnya, masing-masing dengan scope, file yang mungkin berubah, acceptance criteria terukur, perintah tes, dan format laporan agent.
