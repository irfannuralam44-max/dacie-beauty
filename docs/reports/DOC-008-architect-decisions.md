# Laporan Dokumentasi DOC-008 — Keputusan Arsitek

**Tanggal:** 20 November 2026  
**Jenis pekerjaan:** dokumentasi dan penyelarasan spesifikasi; tidak menulis kode aplikasi  
**Branch:** `docs/DOC-008-architect-decisions`  
**Base branch:** `docs/T-007-spec-alignment`  
**Status:** perubahan dokumen disimpan pada branch remote; belum di-merge ke `main`.

## 1. Ringkasan perubahan

Seluruh keputusan arsitek D-01 sampai D-10 diterapkan pada dokumen proyek sesuai instruksi. Arsitektur utama sekarang konsisten: satu repository, satu codebase dan satu image Docker, dijalankan sebagai dua instance/service terpisah (`web-public`/ `APP_MODE=public` dan `web-private`/ `APP_MODE=private`).

PRD dinaikkan ke versi 1.2 bertanggal 20 November 2026. Backlog implementasi diperluas dari 37 menjadi 41 task. Rencana fase dan peta dependensi disesuaikan. Skill dan checklist audit diperbarui. Lembar discovery infrastruktur dibuat dengan nilai yang belum dibuktikan diberi label `perlu diverifikasi`.

Tidak ada kode aplikasi, migration SQL, Dockerfile, Compose, atau workflow GitHub Actions yang dibuat/diubah dalam pekerjaan dokumentasi ini.

## 2. Daftar file berubah

| File | Perubahan |
|---|---|
| `docs/PRD.md` | Versi 1.2; D-01–D-08; model booking; K-01 sampai K-08; riwayat versi |
| `AGENTS.md` | Pemetaan DOC-001–DOC-008; keputusan dua instance dan privilege; authorization di lapisan data; dependency audit; aturan Git D-09 |
| `docs/IMPLEMENTATION-PLAN.md` | Peta dependensi, fase 0 dan 3, dua instance, task tambahan, gerbang fase |
| `docs/IMPLEMENTATION-TASKS.md` | Revisi T-001 sampai T-037 yang terdampak; penambahan T-038 sampai T-041; total 41 task |
| `skills/postgres-migrations-and-roles/SKILL.md` | Kontrak role, function, SECURITY DEFINER, dan grant D-02/D-03 |
| `skills/secure-coding-nextjs/SKILL.md` | APP_MODE, isolasi instance, 404 mode silang, authorization di lapisan repository |
| `skills/data-privacy-checklist/SKILL.md` | Pemisahan instance, secret, pemberitahuan privasi, hardening Next.js dan audit dependency |
| `docs/audit/SECURITY-PRIVACY-CHECKLIST.md` | Pemeriksaan D-01 sampai D-08, privilege, route mode, booking rules, advisory dan dependency audit |
| `docs/audit/SPEC-ALIGNMENT-REVIEW.md` | Menandai review DOC-007 sebagai historis dan menyelaraskan status K-02/K-07 dengan keputusan DOC-008 |
| `docs/discovery/infra.md` | Lembar discovery T-038; Access/Turnstile/Tunnel belum diverifikasi dan tidak ada angka/kuota yang ditebak |
| `docs/reports/DOC-008-architect-decisions.md` | Laporan pekerjaan ini |

Dokumen yang tidak perlu diubah berdasarkan keputusan ini—`CLAUDE.md`, kedua template laporan/audit, dan skill lain yang tidak terdampak—dipertahankan.

## 3. Daftar keputusan D-01 sampai D-10 dan lokasi perubahan

### D-01 — Satu codebase/image, dua instance

- `docs/PRD.md`: bagian 1, 4.1, 9.1, 11.1–11.3; semua pernyataan arsitektur menyebut satu codebase dan satu image yang dijalankan sebagai dua instance.
- `AGENTS.md`: bagian 1, 1.1, 5.2, 5.3.
- `docs/IMPLEMENTATION-TASKS.md`: T-002, T-003, T-006, T-016, T-029, T-031.
- `docs/IMPLEMENTATION-PLAN.md`: peta dependensi dan fase 0/3.
- Skill secure-coding, privacy checklist, dan security/privacy audit checklist: pemisahan environment, credential, route 404, dan host guard.

### D-02 — Tiga fungsi publik dan privilege app_public

- `docs/PRD.md`: bagian 7.2 dan 9.2; K-02/K-03 ditandai diputuskan arsitek.
- `AGENTS.md`: bagian 1.1 dan 5.2.
- `docs/IMPLEMENTATION-TASKS.md`: scope SQL publik yang sebelumnya tercantum dalam satu task kini dipisah oleh DOC-009: T-042 memiliki SQL; T-010/T-011/T-012 memakai lapisan aplikasi/slot.
- `skills/postgres-migrations-and-roles/SKILL.md` dan checklist audit: tanpa privilege tabel bagi app_public; SECURITY DEFINER owner NOLOGIN; search_path/REVOKE/GRANT; output minimum.

### D-03 — Hak app_private dan set_booking_status

- `docs/PRD.md`: bagian 7.2, 8.1, 9.2; K-07/K-08 ditandai diputuskan arsitek.
- `AGENTS.md`: bagian 1.1 dan 5.2.
- `docs/IMPLEMENTATION-TASKS.md`: scope fungsi status kini dipisah oleh DOC-009: T-043 memiliki SQL; T-025 memanggil fungsi; T-026 mengelola konfigurasi.
- Skill PostgreSQL dan checklist audit: SELECT booking; INSERT/UPDATE tanpa DELETE pada tabel konfigurasi; tidak ada DML langsung pada bookings; status_events dan transisi status.

### D-04 — Provider otomatis

- `docs/PRD.md`: bagian 8.1 dan aturan booking.
- `docs/IMPLEMENTATION-TASKS.md`: T-009, T-011, T-012.
- `docs/IMPLEMENTATION-PLAN.md`: alur kalkulasi slot dan auto-assign.

### D-05 — Status dan slot yang memblokir

- `docs/PRD.md`: bagian 7.2 dan 8.1.
- `docs/IMPLEMENTATION-TASKS.md`: T-004 (schema dan constraint), T-009, T-011, T-012 (constraint overlap database dan concurrency).
- `docs/audit/SECURITY-PRIVACY-CHECKLIST.md`: status pending/confirmed, interval terpakai, dan batas rentang fungsi interval.

### D-06 — Booking rules bawaan

- `docs/PRD.md`: bagian 6.3 dan 8.1.
- `docs/IMPLEMENTATION-TASKS.md`: T-004, T-009, T-012, T-024, T-026.
- `docs/IMPLEMENTATION-PLAN.md`: fase 0, 1, dan dependensi pengaturan.

### D-07 — Pemberitahuan privasi pada form

- `docs/PRD.md`: bagian 5.1 dan PUB-14 pada 6.1.
- `docs/IMPLEMENTATION-TASKS.md`: T-013, termasuk halaman privasi statis.
- Skill privacy dan security/privacy audit checklist: pemberitahuan bukan input/checkbox tambahan; teks final disiapkan pemilik dan ditinjau secara hukum.

### D-08 — Hardening Next.js

- `docs/PRD.md`: bagian 7.3.
- `AGENTS.md`: bagian 5.3 dan 7.1.
- `docs/IMPLEMENTATION-TASKS.md`: T-001 dan T-007.
- Skill secure-coding dan checklist audit: advisory resmi Next.js, otorisasi pada lapisan data/repository, audit dependency high/critical.

### D-09 — Aturan Git setelah push pertama

- `AGENTS.md`: bagian 8. Rebase hanya sebelum push pertama; jika branch sudah pernah dipush dan main bergerak, merge origin/main tanpa force push, jalankan ulang verifikasi, dan catat di laporan.

### D-10 — Task tambahan T-038 sampai T-041

- `docs/IMPLEMENTATION-TASKS.md`: T-038/T-039 ditambahkan ke fase 0; T-040/T-041 ditambahkan ke fase 3. T-040 bergantung pada T-033; T-041 harus selesai sebelum T-037.
- `docs/IMPLEMENTATION-PLAN.md`: peta dependensi, urutan fase 0/3, dan gerbang fase diperbarui.
- Ringkasan backlog: fase 0 = 10 task; fase 1 = 7; fase 2 = 13; fase 3 = 11; total = **41 task**.
- `docs/discovery/infra.md`: kerangka untuk bukti T-038; semua nilai paket/kuota yang belum diperiksa tetap `perlu diverifikasi`.

## 4. Lingkungan dan sinkronisasi Git

- Branch baru dibuat dari ref `docs/T-007-spec-alignment` dengan nama persis `docs/DOC-008-architect-decisions`.
- Tidak ada operasi pada `main`; tidak ada branch historis yang diganti namanya.
- Semua penulisan file dilakukan pada branch DOC-008 melalui operasi repository GitHub.
- Perbandingan terakhir yang diperiksa menunjukkan branch DOC-008 berada di depan base DOC-007 dan tidak tertinggal dari base.
- Tidak ada local checkout/working tree yang digunakan dalam sesi ini; karena itu status lokal dan sinkronisasi lokal tidak berlaku.
- Commit terakhir sebelum penambahan laporan ini: `8f4dac064217ddd3224dee6237c0ad9648bcb744`. SHA branch final setelah laporan disimpan dicantumkan pada pesan chat akhir.

## 5. Perintah yang dijalankan

Tidak ada perintah shell yang dijalankan. Pekerjaan dokumentasi dilakukan melalui operasi baca/tulis file pada repository GitHub. Tidak ada instalasi paket, build aplikasi, migrasi database, atau deployment.

## 6. Hasil verifikasi

**`scripts/verify.sh`: tidak dijalankan.** Repository belum berisi implementasi aplikasi yang dikerjakan dalam task ini, dan pekerjaan ini hanya mengubah dokumen. Tidak ada klaim bahwa kode atau aplikasi sudah diuji.

Pemeriksaan dokumen dilakukan dengan membaca ulang file pada branch dan pencarian pola:

- 20 dokumen yang diperiksa, termasuk laporan DOC-008.
- Tidak ditemukan label status tertahan pada task K-02/K-07.
- Tidak ditemukan rumusan arsitektur lama yang menyatukan kedua service dalam satu instance.
- Tidak ditemukan escape newline yang tertulis sebagai dua karakter; baris dokumen sudah dinormalisasi.
- Status K-02 dan K-07 pada seluruh dokumen sudah mengikuti keputusan arsitek.
- Versi PRD 1.2 dan tanggal 20 November 2026 tercantum.
- Ringkasan backlog menunjukkan 41 task; dependensi T-038/T-039/T-040/T-041 tercatat pada fase yang ditentukan.

Catatan: nama fungsi interval terpakai tetap dipertahankan sesuai kontrak D-02.

## 7. Kriteria penerimaan pekerjaan DOC-008

- [x] Branch baru dibuat dari `docs/T-007-spec-alignment`; `main` tidak disentuh.
- [x] Pemetaan DOC-001 sampai DOC-008 ditambahkan pada AGENTS.md; nama branch lama tidak diganti.
- [x] PRD dinaikkan ke versi 1.2 tanggal 20 November 2026.
- [x] D-01 sampai D-10 diterapkan pada dokumen terkait.
- [x] K-01/K-02/K-03/K-06/K-07 diberi status diputuskan arsitek; K-08 ditambahkan; keberatan historis dipertahankan.
- [x] T-038 sampai T-041 ditulis dengan format backlog task dan dependensi yang diminta.
- [x] Gerbang fase 0/fase 3, peta dependensi, dan total backlog 41 task diperbarui.
- [x] Skill PostgreSQL, secure coding, privacy, dan checklist audit diperbarui.
- [x] Placeholder discovery infra tidak mengarang versi, batas paket, atau kuota.
- [x] Pemeriksaan format baris, status keputusan K-02/K-07, dan konsistensi istilah arsitektur dilakukan.
- [ ] Pengujian aplikasi / scripts/verify.sh — tidak relevan untuk pekerjaan dokumen dan belum dijalankan.

## 8. Keputusan dan asumsi

- Keputusan D-01 sampai D-10 diperlakukan sebagai keputusan arsitek yang disetujui pemilik sebagaimana dinyatakan dalam instruksi DOC-008.
- Versi Next.js, versi paket lain, ketersediaan extension PostgreSQL, batas Cloudflare Access, syarat/batas Turnstile, dan layanan monitoring gratis tidak ditebak; verifikasi aktual menjadi bagian task yang ditetapkan.
- Teks akhir pemberitahuan privasi tetap disiapkan pemilik dan ditandai untuk tinjauan hukum.
- Tidak ada klaim kepatuhan hukum, keamanan implementasi, atau keberhasilan deployment.

## 9. Masalah tersisa dan perhatian auditor

- Belum ada kode aplikasi yang dibuat atau diuji berdasarkan revisi ini.
- Detail sintaks SECURITY DEFINER, role owner, search_path, privilege extension, dan exclusion constraint perlu diverifikasi pada task database.
- Cloudflare Access/Turnstile, mini PC, Tunnel, serta layanan uptime/backup alert belum diuji; hasil aktual dicatat oleh T-038/T-040.
- Nilai domain dan dua email Access masih perlu diberikan pemilik melalui kanal aman/dashboard; jangan commit ke repo.
- Teks final privacy notice dan halaman privasi memerlukan persiapan pemilik serta tinjauan hukum yang sesuai.
- Auditor perlu memeriksa ulang diff dan acceptance criteria pada SHA branch final sebelum merge.

## 10. Git dan langkah untuk pemilik

- **Branch:** `docs/DOC-008-architect-decisions`
- **Commit milestone dokumen sebelum laporan awal:** `8f4dac064217ddd3224dee6237c0ad9648bcb744`.
- **Follow-up setelah laporan awal:** `bdc69d97a9bf86fd995111f73977f0d1fb7031a0` memperjelas constraint overlap database pada T-012.
- **Commit laporan dan revisi laporan:** disimpan sebagai commit terpisah; SHA branch terbaru disampaikan pada pesan chat akhir.
- **Push:** perubahan dokumen telah ditulis ke branch remote; belum ada Pull Request dan belum ada merge.

**Langkah wajib untuk pemilik:**
1. Buka Pull Request dari `docs/DOC-008-architect-decisions` ke `main`.
2. Tinjau PRD 1.2, AGENTS.md, plan, backlog 41 task, skills, checklist audit, dan laporan DOC-008.
3. Merge dokumentasi ke `main` setelah review disetujui.
4. Coding agent **belum boleh memulai T-001** sebelum dokumen hasil DOC-008 sudah berada di `main`.

---

**Status pekerjaan DOC-008:** dokumen diperbarui dan dicatat; implementasi aplikasi belum dimulai.


## Addendum DOC-010 — Klarifikasi owner fungsi D-11

Rujukan historis dalam laporan ini pada satu role owner fungsi NOLOGIN telah disupersesi oleh keputusan arsitek D-11 pada DOC-010. Model aktif menggunakan dua role terpisah: `booking_public_fn_owner` untuk tiga fungsi publik D-02 (SELECT tabel konfigurasi dan SELECT/INSERT bookings, tanpa UPDATE/DELETE), serta `booking_private_fn_owner` untuk fungsi status D-03 (SELECT dan UPDATE kolom status bookings, INSERT status_events). T-005 membuat kedua role dan grant minimum; T-042/T-043 hanya menetapkan ownership fungsi.
