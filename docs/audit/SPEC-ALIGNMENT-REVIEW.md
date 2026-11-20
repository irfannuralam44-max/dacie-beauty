# Review Kesesuaian Spesifikasi Dacie Beauty

**Tanggal:** 19 November 2026  
**Status:** Review historis DOC-007; superseded oleh keputusan arsitek DOC-008 pada 20 November 2026; belum ada implementasi aplikasi  
**Branch hasil review:** `docs/T-007-spec-alignment`  
**Baseline:** spesifikasi awal pemilik yang dirangkum dalam PRD dan keputusan arsitektur terkunci.

## 1. Kesimpulan

Dokumen ini merekam review DOC-007 sebelum keputusan arsitek. Pada DOC-008, arsitek menetapkan satu codebase dan satu image Docker yang dijalankan sebagai dua instance terpisah; kontrak privilege D-02/D-03; aturan booking D-04 sampai D-06; pemberitahuan privasi D-07; hardening D-08; aturan Git D-09; dan task tambahan D-10. K-02 dan K-07 yang dahulu terbuka telah diputuskan melalui D-02 dan D-03. Dokumen ini adalah review historis DOC-007. Untuk status terkini, gunakan PRD versi 1.3, AGENTS.md, IMPLEMENTATION-PLAN.md, backlog 43 task, skills, dan checklist pada branch DOC-010 atau branch dokumentasi terbaru yang ditetapkan pemilik.

Review ini hanya memeriksa dokumen. Tidak ada aplikasi yang dibangun, tidak ada test kode yang dijalankan, dan tidak ada klaim implementasi sudah aman.

## 2. Temuan dan tindakan

### R-01 — Consent harus mendahului penyimpanan data kulit

**Prioritas:** P1 — diperbaiki dalam dokumen.

**Temuan awal:** task T-020 semula mengizinkan pembuatan profil yang sekaligus memuat jenis kulit, keluhan, alergi/sensitivitas, dan catatan, sedangkan task consent T-021 baru dikerjakan sesudahnya. Ini bertentangan dengan alur PRD yang mensyaratkan persetujuan sebelum data kulit dicatat.

**Koreksi:**
- T-020 sekarang hanya membuat/mengelola identitas dasar: nama dan nomor WhatsApp.
- T-021 menangani pencatatan consent dan versi teks serta menegakkan pemeriksaan consent di server.
- T-022 baru mengizinkan field kesehatan/kulit dan riwayat kunjungan, dengan consent sebagai prasyarat.
- T-025 hanya boleh membuat profil identitas dasar jika belum ada; data kulit tetap melewati consent gate.
- PRD dan privacy checklist menegaskan pembedaan profil identitas dasar dan data kulit.

**Hasil:** urutan task sekarang tidak memungkinkan agent menganggap consent sebagai pekerjaan susulan setelah data kesehatan tersimpan.

### R-02 — Akses konfigurasi booking publik berpotensi memperluas hak app_public

**Status saat DOC-007:** masih menunggu keputusan arsitek. **Status terbaru DOC-008:** ditutup oleh D-02; konfigurasi publik dibaca melalui get_public_config tanpa privilege tabel bagi app_public.

**Temuan awal:** keputusan awal membatasi `app_public` pada pembuatan booking dan fungsi untuk membaca waktu terisi tanpa nama/kontak. Namun halaman booking membutuhkan daftar treatment aktif serta informasi durasi/jam kerja yang dapat berubah dari area privat. Task T-010 semula mengasumsikan fungsi/view tambahan dapat langsung dibuat.

**Koreksi:**
- T-010 pada DOC-007 semula ditulis sebagai discovery/keputusan kontrak.
- Keputusan terbaru D-02 pada DOC-008 menetapkan tiga fungsi publik terbatas dan melarang privilege tabel bagi app_public.
- Catatan lama mengenai menunggu persetujuan hanya merupakan riwayat, bukan status implementasi saat ini.

**Status akhir:** diputuskan melalui D-02; gunakan PRD versi 1.2 dan backlog terbaru.

### R-03 — Konfirmasi booking memerlukan hak perubahan status yang belum didefinisikan

**Status saat DOC-007:** masih menunggu keputusan arsitek. **Status terbaru DOC-008:** ditutup oleh D-03; perubahan status menggunakan set_booking_status dan app_private tidak memiliki DML langsung pada bookings.

**Temuan awal:** spesifikasi meminta pemilik/istri dapat mengonfirmasi booking dari area privat, tetapi role `app_private` secara eksplisit ditetapkan untuk membaca booking dan mengakses `records`. Tidak ada kontrak yang menjelaskan bagaimana status booking dapat diubah.

**Koreksi:**
- DOC-007 semula merekomendasikan fungsi database sempit dan melarang UPDATE langsung pada tabel bookings.
- Keputusan terbaru D-03 pada DOC-008 menetapkan fungsi booking.set_booking_status, transisi status yang diizinkan, dan pencatatan booking.status_events.
- T-025 pada backlog terbaru menggunakan fungsi tersebut; tidak ada status menunggu keputusan.

**Status akhir:** diputuskan melalui D-03; gunakan PRD versi 1.2 dan backlog terbaru.

### R-04 — Dua hostname harus menuju dua instance dari satu image

**Prioritas:** P2 — diperjelas.

Keputusan D-01 pada DOC-008 menetapkan dua instance terpisah dari satu codebase dan satu image Docker: web-public dan web-private. Tidak boleh dibuat fork atau codebase aplikasi terpisah. Host guard di aplikasi menentukan route yang dapat dilayani pada masing-masing hostname.

### R-05 — Hardening host Linux kurang eksplisit pada backlog

**Prioritas:** P2 — diperbaiki.

T-030 sekarang mencakup enkripsi disk sesuai kemampuan host, pembaruan keamanan OS, SSH berbasis key, dan penonaktifan login password hanya setelah akses pemulihan diuji. Perubahan enkripsi/partisi destruktif tidak boleh dilakukan tanpa backup dan persetujuan pemilik.

### R-06 — Audit perubahan pengaturan operasional belum masuk dependensi audit log

**Prioritas:** P2 — diperbaiki.

T-027 sekarang bergantung pada T-026 dan acceptance criteria mencakup audit event untuk perubahan treatment, provider, jam kerja, durasi, serta jeda.

### R-07 — Tes tanpa sesi ditempatkan terlalu dini pada foundation

**Prioritas:** P2 — diperbaiki.

T-008 semula meminta tes route privat tanpa sesi dengan stub sementara sebelum autentikasi/route privat dibangun. Ini berisiko membuat test-only bypass. T-008 sekarang hanya mendokumentasikan boundary dan menguji privilege database. Tes tanpa sesi dipindahkan ke T-019/T-028 setelah auth dan route privat benar-benar tersedia.

## 3. Kesesuaian yang diperiksa dan dipertahankan

- Bisnis Dacie Beauty di Cimahi, target pasar menengah atas, produk Theraskin dan Probeauty.
- Tepat dua akun internal: pemilik dan istri, dengan identitas login terpisah.
- Satu repository privat, satu codebase dan satu image Docker, dijalankan sebagai dua instance Next.js App Router.
- Dua hostname: `booking.<domain>` publik dan `rekam.<domain>` privat.
- Tidak menggunakan fork Easy!Appointments, Supabase, atau Netlify.
- Form publik hanya lima field: nama, WhatsApp, treatment, tanggal, dan jam.
- Empat treatment awal: Facial Brightening, Facial Acne Care, Facial Hydrating, Konsultasi Kulit.
- Dua provider, timezone Asia/Jakarta, slot dihitung server-side, dan pencegahan double booking pada database.
- Konfirmasi manual via WhatsApp/`wa.me`; tanpa WhatsApp API berbayar dan tanpa email.
- Schema booking/records terpisah; data kulit hanya di records; nomor WhatsApp ternormalisasi menjadi penghubung logis, bukan autentikasi.
- Pencarian pelanggan, riwayat kunjungan, follow-up ≥25 hari, consent versioning, audit log view/change, dan alur hapus/anonimisasi.
- Fitur di luar MVP tetap dilarang: foto before-after, 2FA, reminder otomatis, kasir/pembayaran, inventory, komisi, WhatsApp API, email transaksional.
- Docker Compose pada Linux mini PC, restart policy, Cloudflare Tunnel tanpa port router terbuka.
- Backup harian terenkripsi ke disk eksternal dan satu salinan offsite, serta restore drill.
- Tidak ada GitHub Actions/CI remote; verifikasi dan secret scan dijalankan lokal melalui `scripts/verify.sh`.
- Agent bekerja satu task per branch, tidak push main, laporan wajib, audit sebelum merge, data sintetis saja.
- Versi paket, batas layanan pihak ketiga, dan detail hukum tidak dikarang; harus diverifikasi saat task terkait.

## 4. Status dokumen setelah koreksi

File yang diperbarui:
- `docs/PRD.md`
- `AGENTS.md`
- `docs/IMPLEMENTATION-PLAN.md`
- `docs/IMPLEMENTATION-TASKS.md`
- `skills/postgres-migrations-and-roles/SKILL.md`
- `skills/data-privacy-checklist/SKILL.md`
- `docs/audit/SECURITY-PRIVACY-CHECKLIST.md`

File lain diperiksa dan tidak memerlukan koreksi berdasarkan temuan review ini:
- `CLAUDE.md`
- `skills/git-sync-and-branch/SKILL.md`
- `skills/write-task-report/SKILL.md`
- `skills/local-verify/SKILL.md`
- `skills/secure-coding-nextjs/SKILL.md`
- `skills/nextjs-feature-workflow/SKILL.md`
- `skills/booking-ui-indonesian/SKILL.md`
- `docs/templates/AGENT-REPORT-TEMPLATE.md`
- `docs/templates/AUDIT-VERDICT-TEMPLATE.md`

## 5. Status Git dan kesiapan mulai coding

Perbandingan GitHub pada saat review menunjukkan branch hasil review berada di depan `main` tanpa commit tertinggal, dan berisi 17 file dokumentasi. Seluruh dokumen masih berada di branch dokumentasi; belum di-merge ke `main`.

**Konsekuensi:** jangan mulai T-001 dari `main` sebelum dokumentasi ini digabungkan ke `main`. Instruksi agent mewajibkan branch task dibuat dari `main` yang sinkron, sehingga agent belum akan melihat PRD/AGENTS/skills bila dokumen belum masuk ke branch dasar.

Instruksi historis DOC-007 tersebut sudah digantikan: buka Pull Request dari `docs/DOC-008-architect-decisions` ke `main`, tinjau hasil DOC-008, lalu merge dokumentasi. Coding agent belum boleh memulai T-001 sebelum dokumen berada di main.

## 6. Status keputusan setelah DOC-008

Keputusan yang dahulu diminta pada review DOC-007 kini ditetapkan arsitek dan dianggap disetujui pemilik melalui delegasi keputusan dalam prompt 20 November 2026:

1. **K-02 — D-02:** tiga fungsi publik terbatas; app_public tanpa privilege tabel.
2. **K-07/K-08 — D-03:** app_private membaca booking, mengelola tabel konfigurasi dengan INSERT/UPDATE tanpa DELETE, dan mengubah status hanya melalui fungsi set_booking_status.

Rincian keputusan D-01 sampai D-10 tetap berada pada PRD, backlog 43 task, dan rencana implementasi. Klarifikasi D-11 mengenai dua role owner fungsi yang terpisah berada pada PRD versi 1.3, AGENTS.md, T-005/T-042/T-043, dan skill PostgreSQL di branch DOC-010. Laporan DOC-007 ini tetap disimpan sebagai catatan historis dan tidak lagi menjadi sumber status keputusan.

---

**Verdict DOC-007 (historis):** PASS dengan dua keputusan terbuka pada saat itu. Kedua keputusan kini ditutup melalui D-02 dan D-03 pada DOC-008. Laporan DOC-008/DOC-009 tetap menjadi riwayat; laporan DOC-010 dan dokumen terbaru menjadi acuan.  
**Status implementasi:** belum dimulai.
