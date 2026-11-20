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
  ├─ T-001 bootstrap codebase Next.js + verifikasi advisory resmi
  ├─ T-002/T-003 Docker Compose dua service + APP_MODE/env validation
  ├─ T-004 schema booking/records + migrations + exclusion constraint overlap
  ├─ T-005 role/grant/default privileges D-02/D-03 (tanpa fungsi)
  ├─ T-042 fungsi publik D-02 (bergantung T-004/T-005)
  ├─ T-043 fungsi status D-03 (bergantung T-005)
  ├─ T-006 data access pool terpisah per APP_MODE
  ├─ T-007 verify.sh + audit dependency + secret scan
  ├─ T-008 tes privilege dan boundary
  ├─ T-039 seeder sintetis (setelah T-005 dan T-042)
  └─ T-038 spike awal mini PC/Tunnel/Access (setelah T-008)
          |
          v
Fase 1 — Booking publik
  ├─ T-009 status dan aturan booking D-04–D-06
  ├─ T-010 repository/route konfigurasi publik (memanggil T-042)
  ├─ T-011 slot dengan get_public_config/get_blocked_intervals
  ├─ T-012 validasi server dan pemanggilan create_booking (SQL di T-042)
  ├─ T-013 UI lima field + pemberitahuan privasi
  └─ T-014 abuse protection + T-015 E2E
          |
          v
Fase 2 — Rekam kulit privat
  ├─ T-016 dua instance, mode routing 404 + host guard
  ├─ T-017/T-018 autentikasi dan sesi
  ├─ T-019 otorisasi di lapisan repository
  ├─ T-020–T-023 profil, consent, kunjungan, follow-up
  ├─ T-024 daftar booking + sorotan pending >24 jam
  ├─ T-025 memanggil set_booking_status (SQL di T-043) + link WhatsApp
  ├─ T-026 pengaturan booking_rules/time_off
  └─ T-027/T-028 audit log + E2E privat
          |
          v
Fase 3 — Hardening & release
  ├─ T-029 Compose production dua service dari satu image
  ├─ T-030 mini PC menjalankan dua instance
  ├─ T-031 Tunnel memetakan dua hostname ke service berbeda
  ├─ T-032 Access allowlist dua email
  ├─ T-033 backup → T-040 uptime/backup alerts
  ├─ T-034 restore → T-035 power recovery
  ├─ T-036 VPS migration
  ├─ T-041 account/secret runbook sebelum T-037
  └─ T-037 pilot sintetis dan release sign-off
```

Fase 1 dan 2 sama-sama bergantung pada fondasi fase 0. Fase 2 memanfaatkan data booking dari fase 1 dan tidak dimulai sebelum kontrak booking stabil. T-039 dapat dikerjakan setelah T-005 dan T-042; T-038 dikerjakan setelah T-008 untuk mengangkat risiko infrastruktur lebih awal. Fase 3 mengeraskan dan mengoperasikan hasil fase 1–2. Urutan fase tetap 0 → 1 → 2 → 3.



## 4. Fase 0 — Foundation

**Tujuan:** menyediakan fondasi codebase dan database yang dapat dijalankan lokal, memisahkan dua instance dan privilege, serta mengangkat risiko infrastruktur sebelum fitur dibangun.

### Urutan kerja

| Urutan | Task | Area | Hasil yang diharapkan | Estimasi |
|---:|---|---|---|---|
| 0.1 | T-001 | Repository dan struktur | Codebase Next.js, satu image, versi stabil dan advisory diverifikasi | M |
| 0.2 | T-002 | Runtime lokal | Compose web-public, web-private, PostgreSQL dari satu image aplikasi | M |
| 0.3 | T-003 | Kontrak konfigurasi | APP_MODE dan secret validation per instance | S |
| 0.4 | T-004 | Skema dan migrasi | Schema booking/records, tabel, exclusion constraint overlap, verifikasi btree_gist/hak extension | L |
| 0.5 | T-005 | Role database | app_public/app_private, `booking_public_fn_owner` dan `booking_private_fn_owner` NOLOGIN terpisah dengan grant tabel/kolom minimum D-11; tanpa fungsi | M |
| 0.6 | T-042 | Fungsi publik | get_public_config, get_blocked_intervals, create_booking (satu pemilik SQL) | L |
| 0.7 | T-043 | Fungsi status | set_booking_status, status_events, matriks transisi D-03 | M |
| 0.8 | T-006 | Data access | Pool dipilih saat startup berdasarkan APP_MODE; public tidak dapat membuat pool private | M |
| 0.9 | T-007 | Verifikasi lokal | lint, test, secret scan, audit dependency | M |
| 0.10 | T-008 | Bukti isolasi | privilege dan boundary mode diuji/didokumentasikan | M |
| 0.11 | T-039 | Seeder sintetis | treatment/provider/jam kerja/customer fiktif untuk seluruh test | M |
| 0.12 | T-038 | Spike infrastruktur | hello dua instance di mini PC, Tunnel dua hostname, uji Access dua email, discovery Access/Turnstile | L |
| 0.13 | — | Dokumentasi agent | AGENTS, CLAUDE, skill, template laporan tersedia | S |

### Dependensi dan catatan

- T-001 mendahului semua perubahan kode; versi Next.js stabil dan advisory resmi diverifikasi serta dicatat URL/tanggalnya.
- T-002 dan T-003 mendahului pengujian integrasi yang membutuhkan dua mode.
- T-004 mendahului T-005, T-042, dan T-043; T-042 bergantung pada T-004/T-005, sedangkan T-043 bergantung pada T-005. Exclusion constraint harus tersedia di T-004 sebelum create_booking T-042.
- T-005 mendahului T-006, T-042, dan T-043; T-042 mendahului T-010/T-011/T-012 dan T-039.
- T-008 adalah gerbang keamanan wajib. T-038 bergantung pada T-008; T-039 bergantung pada T-005 dan T-042.
- T-005 membuat role runtime, `booking_public_fn_owner` dan `booking_private_fn_owner` (NOLOGIN, bukan superuser), grant tabel/kolom minimum D-11, dan default privileges tanpa membuat fungsi. T-042 adalah satu-satunya pemilik SQL untuk tiga fungsi publik D-02 dan menetapkan owner `booking_public_fn_owner`; T-043 membuat SQL set_booking_status/status_events dan menetapkan owner `booking_private_fn_owner`. Seluruh grant tabel/kolom kedua owner hanya dibuat T-005. T-004 membuat exclusion constraint overlap sebelum T-042 memakai mekanisme tersebut.
- T-038 mencatat sumber resmi, URL, dan tanggal untuk batas Access serta syarat Turnstile. Versi/batas layanan yang belum terbukti diberi label "perlu diverifikasi".
- Pilihan driver database, runner test, dan sintaks extension PostgreSQL diverifikasi pada task; jangan menebak versi atau kemampuan layanan.

### Gerbang keluar fase 0

Fase 0 dinyatakan selesai hanya jika:
- Codebase dan PostgreSQL dapat dijalankan melalui Docker Compose dengan dua service aplikasi dari image yang sama.
- Startup validation memastikan public mode tidak memiliki credential/secret privat dan hanya membuat pool app_public.
- Migrasi dapat diterapkan dari database kosong secara berurutan.
- Grant/privilege D-02/D-03 dan tes role lulus; fungsi D-02/D-03 (T-042/T-043) serta tesnya selesai; app_public tidak dapat SELECT/INSERT langsung ke tabel apa pun.
- Seeder sintetis T-039 tersedia untuk unit/integration/E2E.
- Spike T-038 selesai; dua hostname mencapai instance yang benar, Access diuji dengan dua email, dan discovery resmi didokumentasikan (atau secara eksplisit diberi label "perlu diverifikasi").
- scripts/verify.sh berjalan lokal termasuk audit dependency.
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

- 1.1 mengikuti status D-05: pending/confirmed memblokir slot; cancelled/completed/no_show tidak memblokir slot. Aturan booking D-06 disimpan di booking_rules.
- 1.2 mengimplementasikan repository/route aplikasi untuk memanggil get_public_config() yang sudah dibuat oleh T-042; app_public tetap tanpa privilege tabel.
- 1.3 menggunakan get_public_config dan get_blocked_intervals dari T-042; slot ditawarkan bila minimal satu provider aktif kosong. Fungsi create_booking pada T-042 memilih provider otomatis berdasarkan priority.
- Constraint exclusion dan verifikasi btree_gist dibuat di T-004 sebelum fungsi T-042; T-012 hanya menguji perilaku constraint melalui jalur aplikasi. Constraint wajib selesai sebelum booking dipakai pilot.
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

**Tujuan:** menjalankan dua instance dari satu image Docker pada mini PC Linux, menghubungkan hostname ke service yang tepat, serta memastikan sistem dapat dipantau dan dipulihkan.

### Urutan kerja

| Urutan | Task | Area | Hasil yang diharapkan | Estimasi |
|---:|---|---|---|---|
| 3.1 | — | Audit kesiapan produksi | Checklist konfigurasi, threat/risk review, dependency dan secret review | M |
| 3.2 | T-029 | Compose produksi | web-public, web-private, PostgreSQL; dua service app dari image sama, APP_MODE terpisah | M |
| 3.3 | T-030 | Mini PC Linux | Deploy dan verifikasi dua instance serta database pada perangkat target | M |
| 3.4 | T-031 | Cloudflare Tunnel | booking → web-public; rekam → web-private; tanpa port router | M |
| 3.5 | T-032 | Cloudflare Access | Allowlist dua email untuk hostname privat; verifikasi batas aktual | M |
| 3.6 | T-033 | Backup terenkripsi | Backup harian ke disk eksternal dan offsite | M |
| 3.7 | T-040 | Monitoring dan alert | HTTP uptime booking eksternal dan peringatan backup gagal, tanpa PII | M |
| 3.8 | T-034 | Restore drill | Pemulihan database dan aplikasi dari backup | L |
| 3.9 | T-035 | Recovery listrik/server | Uji reboot/power recovery dan konsistensi database | M |
| 3.10 | T-036 | Migrasi VPS | Panduan pindah Compose dan restore backup | S |
| 3.11 | T-041 | Runbook akun/secret | Provisioning dua akun, recovery, pergantian perangkat, rotasi secret; wajib sebelum pilot | M |
| 3.12 | T-037 | Pilot terbatas | Uji sintetis, audit akhir, keputusan go/no-go pemilik | M |

### Dependensi dan catatan

- T-029 membuat dua service aplikasi dari satu image yang sama dengan APP_MODE berbeda.
- T-030 menjalankan kedua instance di mini PC; web-public hanya menerima app_public dan CAPTCHA secret, web-private hanya app_private dan session secret.
- T-031 Tunnel harus memetakan setiap hostname ke service yang sesuai. Tiap instance 404 untuk route mode lain dan host guard allowlist tetap aktif.
- T-032 menguji allowlist dua email di dashboard, bukan menyimpan identitas/secret di repository. Cloudflare Access bukan pengganti login aplikasi.
- T-033 mendahului T-040; notifikasi kegagalan backup tidak boleh berisi data pribadi.
- T-034 hanya setelah backup; backup belum dianggap valid sebelum restore drill berhasil.
- T-041 harus selesai sebelum T-037 dan mencakup prosedur pemulihan akun, perangkat, serta rotasi secret.
- Batas paket Access, layanan monitoring gratis, dan syarat layanan pihak ketiga perlu diverifikasi dari sumber resmi pada saat task. Catat URL dan tanggal; bila belum terbukti, tulis "perlu diverifikasi".
- Pilot menggunakan data sintetis; data pelanggan nyata tidak boleh masuk ke test, demo, screenshot, atau laporan.

### Gerbang keluar fase 3

- Production Compose menjalankan web-public, web-private, dan PostgreSQL dengan restart policy serta volume persisten.
- Kedua instance berasal dari satu image/codebase; masing-masing hanya menerima credential/secret mode-nya.
- Tunnel memetakan booking ke web-public dan rekam ke web-private; route mode silang 404; host guard allowlist bekerja.
- Hostname privat dilindungi Access allowlist dua email dan login aplikasi.
- Tidak ada port router yang dibuka untuk mengekspos aplikasi.
- Backup terenkripsi harian memiliki salinan disk eksternal dan offsite; restore drill berhasil.
- Uptime booking dan kegagalan backup dapat memberi peringatan tanpa PII.
- Recovery setelah reboot/power outage telah diuji.
- Runbook akun/secret tersedia dan T-041 selesai sebelum sign-off.
- Panduan migrasi VPS cukup untuk memindahkan aplikasi dan memulihkan database.
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
