# Laporan T-004 — Migrasi Awal dan Schema PostgreSQL

## 1. Metadata

| Item | Nilai |
|---|---|
| Repository | `irfannuralam44-max/dacie-beauty` |
| Task ID | T-004 |
| Branch | `agent/T-004-db-schemas` |
| Base branch | `main` |
| SHA commit dasar | `7b1f8cd1d1746f2595a05b2bea792e666ff412f5` |
| SHA commit implementasi | `58c5f0a0f7006268ce37d47829450fe4f2e4648b` |
| Commit message | `fix(db): bukti lock-wait pemicu dua akun aktif dan sinkronisasi dokumentasi migrasi` |
| Tanggal pengerjaan | 2026-11-21 |
| Status push | berhasil |

## 2. Ringkasan perubahan

Mengimplementasikan fondasi database PostgreSQL Dacie Beauty menggunakan migrasi SQL berversi, sesuai PRD v1.3 dan AGENTS.md. Dibuat skema `booking` (data booking operasional) dan `records` (data kulit/kesehatan dan akun internal), mekanisme migrasi versi dengan tabel pelacakan dan skrip penerap, extension `btree_gist`, serta exclusion constraint untuk mencegah booking ganda (anti-double-booking). Semua pengujian dilakukan terhadap PostgreSQL nyata (`postgres:17-alpine` via Docker), bukan mock.

Task ini sengaja tidak mengerjakan role/privilege (`app_public`, `app_private`, owner fungsi), fungsi publik/privat booking, lapisan data Next.js, UI, atau autentikasi aplikasi (keadaan T-005, T-042/T-043, dan task lanjutan).

## 3. Daftar file dibuat/diubah

| File | Status | Tujuan |
|---|---|---|
| `db/migrations/0001_init.sql` | Dibuat | Extension `btree_gist`, skema `booking`/`records`, tabel pelacakan `booking.schema_migrations` |
| `db/migrations/0002_booking_tables.sql` | Dibuat | Tabel `booking` (treatments, providers, working_hours, time_off, booking_rules, bookings, status_events) + nilai awal `booking_rules` 30/3/30/2 |
| `db/migrations/0003_records_tables.sql` | Dibuat | Tabel `records` (users, customers, visits, audit_logs, sessions, consent_versions) |
| `db/migrations/0004_constraints.sql` | Dibuat | Exclusion constraint `bookings_no_overlap_active` + pemicu maksimal dua akun `users` aktif |
| `db/migrations/0005_corrections.sql` | Dibuat | Koreksi tipe `actor_user_id` ke `bigint` dan serialisasi pemicu batas dua akun aktif (`pg_advisory_xact_lock`) agar aman konkuren |
| `scripts/migrate.mjs` | Dibuat | Skrip penerap migrasi (terapkan, status, transaksi per file, pelacakan versi) |
| `src/db/exclusion.test.ts` | Dibuat | Tes integrasi PostgreSQL: exclusion constraint, status, dan dua transaksi bersamaan |
| `docs/database/panduan-migrasi.md` | Dibuat | Dokumentasi skema, strategi migrasi, cara apply/status, kebutuhan extension, hasil verifikasi |
| `package.json` | Diubah | Tambah dependency `pg` ^8.23.1 |
| `package-lock.json` | Diubah | Lockfile setelah penambahan `pg` dan `@types/pg` |
| `docs/reports/T-004-db-schemas.md` | Dibuat | Laporan task ini |

## 4. Mekanisme migrasi yang dipilih

**File SQL berversi + skrip penerap Node.js (`pg`)**, alasan:
- Cocok stack Next.js/Node.js yang ada; `pg` adalah driver PostgreSQL standar (lisensi MIT, terawat baik, direferensikan PRD) dan sudah diperlukan untuk lapisan data selanjutnya (T-006).
- Tidak menambah dependensi luar eksternal ke dalam image aplikasi selain `pg` yang sudah dijamin kompatibel (Node LTS, 0 vulnerability saat `npm audit`).
- Urutan deterministik berdasarkan nama file (`0001`..`0004`).
- Tabel pelakakan versi `booking.schema_migrations` mengetahui status migrasi yang sudah diterapkan.
- Setiap file dijalankan dalam satu transaksi; gagal → rollback, versi tidak dicatat, dapat diulang.
- Re-apply melewati versi yang sudah dicatat (idempoten pada tingkat file).
- Migrasi yang sudah diterapkan tidak diedit diam-diam; perubahan baru via file migrasi baru.

Perintah apply dan status dokumentasikan di `docs/database/panduan-migrasi.md`.

## 5. Perintah yang dijalankan dan hasil

| Perintah | Hasil | Exit code |
|---|---|---|
| `git fetch origin --prune` | `origin/main` = `7b1f8cd` | 0 |
| `git switch main && git pull --ff-only origin main` | Fast-forward ke `7b1f8cd` | 0 |
| `git switch -c agent/T-004-db-schemas` | Branch dibuat dari `7b1f8cd` | 0 |
| `npm install pg` | Ditambah `pg` 8.23.1 (MIT), 0 vuln | 0 |
| `npm install --save-dev @types/pg` | Ditambah `@types/pg` 8.23.1 (MIT), 0 vuln | 0 |
| `CREATE DATABASE dacie_t004` | Database uji kosong dibuat | 0 |
| `CREATE EXTENSION IF NOT EXISTS btree_gist` | Berhasil (versi 1.7, skema public) | 0 |
| `node scripts/migrate.mjs` (apply) | 5/5 migrasi diterapkan | 0 |
| `node scripts/migrate.mjs` (re-apply) | Semua dilewati (idempoten) | 0 |
| `node scripts/migrate.mjs status` | 5 versi [TERAPKAN] | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | Tanpa error | 0 |
| `node --test "src/**/*.test.ts"` (DATABASE_URL disetel) | 31/31 lulus | 0 |
| `node --test src/db/exclusion.test.ts` | 5/5 lulus | 0 |

`scripts/verify.sh`: **belum tersedia** (scope T-007), tidak dibuat pengganti agar tidak melanggar pembagian task. Verifikasi aktual dijalankan per perintah di atas.

## 6. Hasil pengujian PostgreSQL

- Database `dacie_t004` kosong dibangun dari seluruh 5 migrasi secara berurutan.
- `btree_gist` tersedia dan dapat dibuat sebagai superuser development `dacie_dev` (verifikasi non-superuser ditunda ke T-005).
- Skema `booking` dan `records` terbentuk; seluruh tabel, kolom, constraint, dan index sesuai spesifikasi.
- `booking_rules` nilai awal: `slot_step_minutes=30`, `min_notice_hours=3`, `max_advance_days=30`, `max_active_per_wa=2`.
- Exclusion constraint `bookings_no_overlap_active` menggunakan gist `(provider_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` WHERE status IN ('pending','confirmed').
- Tes integrasi (`src/db/exclusion.test.ts`): 5/5 lulus, meliputi exclusion constraint menolak interval bertumpang tindih, status non-aktif tidak menghalangi, provider berbeda boleh, dua transaksi bersamaan menghasilkan paling banyak satu booking aktif, dan pemicu maksimal dua akun aktif aman terhadap konkuren.

## 7. Bukti ketersediaan `btree_gist` dan hak membuat extension

Extension `btree_gist` versi 1.7 terpasang pada `postgres:17-alpine` dan berhasil dibuat dengan perintah `CREATE EXTENSION IF NOT EXISTS btree_gist;` sebagai role `dacie_dev` (superuser pada environment development). **Catatan:** ketersediaan dan hak membuat extension diverifikasi hanya sebagai superuser development `dacie_dev`; verifikasi dengan role migrasi non-superuser yang representatif ditunda ke T-005 (pembuatan role dan privilege), bukan cakupan T-004. Hak pembuatan extension untuk role runtime (`app_public`/`app_private`) diatur pada T-005.

## 8. Acceptance criteria

| # | Kriteria | Status | Bukti |
|---|---|---|---|
| 1 | Database kosong dapat dibangun melalui seluruh migrasi | PASS | `dacie_t004` dibangun dari 0 via `node scripts/migrate.mjs` (5/5 diterapkan) |
| 2 | Kedua schema berhasil dibuat | PASS | `\dn`: `booking`, `records` |
| 3 | Seluruh tabel dan kolom wajib tersedia | PASS | 13 tabel application + 1 tabel pelacakan migrasi (`booking.schema_migrations`); kolom sesuai `information_schema.columns` |
| 4 | Constraint dan index yang diwajibkan tersedia | PASS | PK, FK, UNIQUE, CHECK, exclusion constraint `bookings_no_overlap_active`, index pendukung |
| 5 | Nilai awal `booking_rules` sesuai PRD | PASS | 30 / 3 / 30 / 2 |
| 6 | Status booking hanya menerima nilai yang diizinkan | PASS | CHECK constraint; nilai `status_tidak_valid` ditolak (tes) |
| 7 | Foreign key tidak melanggar larangan lintas skema | PASS | Semua FK dalam satu skema; `actor_user_id` bigint tanpa FK; tidak ada FK `booking`<->`records` |
| 8 | Nomor WhatsApp constraint format/keunikan | PASS | `^62[0-9]{9,13}$` pada `bookings.nomor_wa` dan `customers.nomor_wa` (UNIQUE) |
| 9 | Exclusion constraint menolak dua booking aktif beririsan pada provider sama | PASS | Tes integrasi gagalkan insert pending yang bertumpang tindih (kode exclusion/23P01/40P01) |
| 10 | Booking cancelled/completed/no_show tidak menghalangi interval baru | PASS | Tes insert cancelled/completed/no_show pada interval yang sama berhasil |
| 11 | Dua transaksi bersamaan tidak dapat menghasilkan double-booking | PASS | Tes kompatibel: paling banyak 1 booking aktif berhasil (satu committed, satu ditolak constraint/deadlock) |
| 12 | Migrasi sudah diterapkan tidak diedit pada perubahan lanjutan | PASS | Re-apply melewati semua versi (idempoten); kebijakan dokumentasi |
| 13 | Fixture dan seed hanya memakai data sintetis | PASS | Tidak ada data pelanggan nyata; `booking_rules` hanya konfigurasi awal |

Kriteria yang diuji semua **PASS** dengan bukti tes integrasi terhadap PostgreSQL nyata. Tidak ada kriteria yang ditandai "tidak terverifikasi" dalam cakupan T-004.

## 9. Keputusan dan asumsi

- Memilih `pg` (Node.js PostgreSQL driver, MIT) sebagai dependensi untuk skrip migrasi dan tes integrasi; sudah diperlukan untuk lapisan data selanjutnya, 0 vulnerability, kompatibel Node LTS.
- Skrip migrasi ditulis sebagai ESM (`.mjs`) untuk menghindari larangan `require()` oleh ESLint dan menggunakan `process.cwd()`.
- Tabel pelacakan migrasi diletakkan di `booking.schema_migrations`; dijalankan sebagai role superuser/migrasi development.
- Extension `btree_gist` dibuat di skema `public` (default), diperlukan exclusion constraint btree+gist.
- Role runtime dan grant privilege ditunda ke T-005; fungsi publik/privat ditunda ke T-042/T-043, sesuai pembagian task.
- `scripts/verify.sh` belum tersedia (T-007); verifikasi dilakukan manual dan dicatat di laporan ini.
- Asumsi belum dikonfirmasi: waktu eksak deadlock/statement_timeout pada lingkungan produksi dapat berbeda dari development.

## 10. Masalah tersisa

| Prioritas | Masalah | Dampak | Saran/tindakan |
|---|---|---|---|
| P2 | `scripts/verify.sh` belum tersedia | Verifikasi otomatis belum tersatu | Dikerjakan pada T-007 |
| P2 | Role dan privilege database belum dibuat | `app_public`/`app_private` belum aktif | Dikerjakan pada T-005 |
| P2 | Fungsi publik/privat booking belum ada | Tidak dapat membuat/mengelola booking via DB | Dikerjakan pada T-042/T-043 |
| P3 | Gating consent pada tingkat aplikasi belum ada | Field kesehatan belum dibatasi oleh consent di DB | Dikerjakan pada T-021/T-022 |

## 11. Hal untuk auditor

- Area sensitif: exclusion constraint `bookings_no_overlap_active` (`db/migrations/0004_constraints.sql`), extension `btree_gist`, tabel pelacakan `booking.schema_migrations`.
- Berkas penting: `db/migrations/*.sql`, `scripts/migrate.mjs`, `src/db/exclusion.test.ts`, `docs/database/panduan-migrasi.md`.
- Langkah reproduksi: buat database kosong, set `DATABASE_URL`, jalankan `node scripts/migrate.mjs`, lalu `node --test src/db/exclusion.test.ts`.
- Perhatian khusus: SHA commit akhir dan status push sudah dicatat pada bagian Metadata dan Git di bawah ini.

## 12. Git

```text
Push: berhasil
Branch: agent/T-004-db-schemas
SHA: 7855c6ac2c9dfee4353e5f733dcfb16037696726
Commit: docs(report): sinkronisasi SHA implementasi dan daftar file T-004 ke 58c5f0a
Laporan: docs/reports/T-004-db-schemas.md
```
