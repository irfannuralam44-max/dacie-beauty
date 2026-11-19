# Review Kesesuaian Spesifikasi Dacie Beauty

**Tanggal:** 19 November 2026  
**Status:** Review dokumentasi selesai; belum ada implementasi aplikasi  
**Branch hasil review:** `docs/T-007-spec-alignment`  
**Baseline:** spesifikasi awal pemilik yang dirangkum dalam PRD dan keputusan arsitektur terkunci.

## 1. Kesimpulan

Dokumentasi sudah **sebagian besar selaras** dengan spesifikasi awal. Arsitektur utama dipertahankan: satu repository privat, satu aplikasi Next.js, dua hostname, PostgreSQL dengan schema `booking` dan `records`, role `app_public` dan `app_private`, dua akun privat, booking lima field, data kulit privat, Docker Compose di Linux, Cloudflare Tunnel/Access, pengujian lokal, dan tidak ada GitHub Actions.

Review menemukan beberapa celah yang dapat menyebabkan agent mengambil keputusan yang tidak sesuai atau melemahkan batas keamanan. Koreksi dokumentasi dilakukan pada branch ini. Dua kontrak privilege tetap **belum diputuskan** dan sengaja tidak diubah menjadi keputusan otomatis.

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

**Prioritas:** P1 — dibatasi, menunggu keputusan pemilik.

**Temuan awal:** keputusan awal membatasi `app_public` pada pembuatan booking dan fungsi untuk membaca waktu terisi tanpa nama/kontak. Namun halaman booking membutuhkan daftar treatment aktif serta informasi durasi/jam kerja yang dapat berubah dari area privat. Task T-010 semula mengasumsikan fungsi/view tambahan dapat langsung dibuat.

**Koreksi:**
- T-010 diubah menjadi task discovery/keputusan kontrak.
- Tidak boleh memberi SELECT tabel konfigurasi kepada `app_public`.
- Function pembaca konfigurasi non-sensitif hanya boleh diimplementasikan setelah pemilik menyetujui perluasan kontrak secara eksplisit.
- Bila belum disetujui, task tetap BLOCKED; agent tidak boleh menganggapnya selesai.

**Status:** belum diputuskan. Ini tercatat sebagai PRD K-02.

### R-03 — Konfirmasi booking memerlukan hak perubahan status yang belum didefinisikan

**Prioritas:** P1 — dibatasi, menunggu keputusan pemilik.

**Temuan awal:** spesifikasi meminta pemilik/istri dapat mengonfirmasi booking dari area privat, tetapi role `app_private` secara eksplisit ditetapkan untuk membaca booking dan mengakses `records`. Tidak ada kontrak yang menjelaskan bagaimana status booking dapat diubah.

**Koreksi:**
- PRD menambahkan Catatan keberatan K-07.
- Tidak boleh memberi UPDATE langsung pada tabel booking kepada `app_private` secara luas.
- Rekomendasi yang diajukan: fungsi database sempit untuk transisi status yang diizinkan, dengan validasi transisi, audit, owner dan `search_path` aman, serta EXECUTE terbatas.
- Rekomendasi ini bukan keputusan terkunci; perlu persetujuan pemilik sebelum tombol konfirmasi diimplementasikan.
- T-025 ditandai BLOCKED untuk aksi perubahan status sampai keputusan tersedia.

**Status:** belum diputuskan. Fitur konfirmasi manual tetap merupakan kebutuhan produk, tetapi implementasinya menunggu kontrak privilege yang aman.

### R-04 — Dua hostname harus menuju satu aplikasi yang sama

**Prioritas:** P2 — diperjelas.

T-031 sekarang secara eksplisit menyatakan kedua hostname diarahkan ke instance aplikasi Next.js yang sama. Tidak boleh dibuat aplikasi kedua, fork, atau deployment aplikasi terpisah untuk area privat. Host guard di aplikasi menentukan route yang dapat dilayani pada masing-masing hostname.

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
- Satu repository privat dan satu aplikasi Next.js App Router.
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

Perbandingan GitHub pada saat review menunjukkan branch hasil review berada 25 commit di depan `main`, tanpa commit tertinggal, dan berisi 17 file dokumentasi. Seluruh dokumen masih berada di branch dokumentasi; belum di-merge ke `main`.

**Konsekuensi:** jangan mulai T-001 dari `main` sebelum dokumentasi ini digabungkan ke `main`. Instruksi agent mewajibkan branch task dibuat dari `main` yang sinkron, sehingga agent belum akan melihat PRD/AGENTS/skills bila dokumen belum masuk ke branch dasar.

Langkah yang disarankan berikutnya adalah membuka Pull Request dari `docs/T-007-spec-alignment` ke `main`, meninjau dua keputusan terbuka K-02 dan K-07, lalu merge dokumentasi setelah pemilik menyetujuinya.

## 6. Keputusan yang masih diperlukan dari pemilik

1. **K-02 — Data konfigurasi booking publik:** apakah pemilik menyetujui satu fungsi database terbatas tambahan bagi `app_public` untuk membaca konfigurasi booking non-sensitif (treatment aktif/durasi dan informasi jadwal yang perlu ditampilkan)? Tanpa persetujuan, jangan menambah hak ini.
2. **K-07 — Konfirmasi booking:** apakah pemilik menyetujui fungsi database terbatas untuk mengubah status booking dari area privat, tanpa memberikan UPDATE tabel booking secara luas kepada `app_private`?

Kedua keputusan ini harus dicatat sebelum task terkait diimplementasikan. Semua keputusan arsitektur lain tetap dipertahankan.

---

**Verdict review dokumentasi:** **PASS dengan dua keputusan terbuka yang menjadi gerbang implementasi (K-02 dan K-07).**  
**Status implementasi:** belum dimulai.
