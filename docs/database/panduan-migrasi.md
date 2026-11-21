# Panduan Migrasi dan Skema Database

Dokumen ini menjelaskan fondasi database PostgreSQL Dacie Beauty: skema `booking` dan `records`, mekanisme migrasi SQL berversi, cara menjalankan dan memeriksa status migrasi, serta hasil verifikasi pencegahan booking ganda (anti-double-booking).

## 1. Ringkasan

- Satu database PostgreSQL dengan dua skema terpisah: `booking` (data booking operasional) dan `records` (data kulit/kesehatan dan akun internal).
- Migrasi berupa file SQL berversi di `db/migrations/`, diterapkan secara berurutan melalui skrip `scripts/migrate.mjs`.
- Tabel pelacakan migrasi: `booking.schema_migrations`.
- Extension yang digunakan: `btree_gist` (untuk exclusion constraint anti-overlap booking).
- Semua pengujian dilakukan terhadap PostgreSQL nyata (`postgres:17-alpine` via Docker), bukan mock.

## 2. Struktur skema `booking`

| Tabel | Deskripsi |
|---|---|
| `treatments` | Jenis treatment: nama, is_active, durasi_menit, jeda_menit |
| `providers` | Penyedia layanan: nama_internal, is_active, priority (urutan pemilihan otomatis) |
| `working_hours` | Jam kerja per provider dan hari (hari 1=Senin..7=Minggu, mulai, selesai) |
| `time_off` | Pengecualian jadwal/libur/cuti per provider (starts_at, ends_at, keterangan non-sensitif, is_active) |
| `booking_rules` | Satu baris konfigurasi: slot_step_minutes, min_notice_hours, max_advance_days, max_active_per_wa (nilai awal 30, 3, 30, 2) |
| `bookings` | Booking: nama, nomor_wa (ternormalisasi), treatment_id, provider_id, starts_at, ends_at, status, created_at |
| `status_events` | Audit transisi status: booking_id, from_status, to_status, actor_user_id (tanpa FK lintas skema), created_at |

**Status booking yang diizinkan:** `pending`, `confirmed`, `cancelled`, `completed`, `no_show`. Hanya `pending` dan `confirmed` yang dianggap aktif dan memblokir slot.

**Interval terpakai booking:** `[starts_at, starts_at + durasi + jeda)`, direpresentasikan oleh rentang `[starts_at, ends_at)` dengan batas atas eksklusif, sehingga dua booking yang berdekatan (seluruhnya menabrak) tidak dianggap bentrok.

**Foreign key (tidak melintasi skema):**
- `bookings.treatment_id` → `booking.treatments(id)`
- `bookings.provider_id` → `booking.providers(id)`
- `status_events.booking_id` → `booking.bookings(id)`
- `working_hours.provider_id` → `booking.providers(id)`
- `time_off.provider_id` → `booking.providers(id)`

**CHECK constraint:**
- `bookings.status` hanya nilai yang diizinkan
- `bookings.nomor_wa` format `^62[0-9]{9,13}$`
- `working_hours.hari` antara 1 dan 7; `mulai < selesai`
- `time_off.starts_at < ends_at`
- `bookings.starts_at < ends_at`
- `booking_rules.id = 1` (memaksa satu baris konfigurasi)

**UNIQUE:** `booking_rules.id` (PK, paksa satu baris).

**Index:** `bookings(provider_id, status)`, `bookings(starts_at)`, `status_events(booking_id)`, `working_hours(provider_id, hari)`, `time_off(provider_id)`.

## 3. Struktur skema `records`

| Tabel | Deskripsi |
|---|---|
| `users` | Akun internal (maksimal dua aktif): nama, identitas_login (UNIQUE), password_hash, status (active/inactive), created_at |
| `customers` | Pelanggan: nama, nomor_wa (UNIQUE, format 62xxxxxxxxxx), jenis_kulit, keluhan_utama, alergi_sensitivitas, catatan, consent_at, consent_version |
| `visits` | Kunjungan: customer_id, tanggal, treatment, catatan_kondisi_kulit, produk, saran, follow_up_on, created_by, created_at |
| `audit_logs` | Audit: user_id, aksi, objek, waktu (tidak menyimpan salinan isi sensitif) |
| `sessions` | Sesi autentikasi: user_id, token_hash (UNIQUE), created_at, expires_at, revoked_at |
| `consent_versions` | Versi persetujuan: versi_teks (UNIQUE), isi_teks, tanggal_berlaku |

**Ketentuan privasi:**
- Data kulit/kesehatan hanya berada di skema `records`.
- Tidak ada foreign key lintas skema yang menghubungkan `booking` dengan `customers`. Penghubung logis adalah nomor WhatsApp ternormalisasi.
- `consent_at` dan `consent_version` nullable: profil identitas dasar boleh dibuat sebelum consent; field kesehatan/kulit dan kunjungan hanya setelah consent dicatat (ditangani lapisan aplikasi, T-021/T-022).
- `audit_logs` tidak menyimpan salinan isi catatan sensitif, password, token, atau nomor WhatsApp lengkap.

**Foreign key (dalam skema records saja):**
- `visits.customer_id` → `records.customers(id)`
- `visits.created_by` → `records.users(id)`
- `audit_logs.user_id` → `records.users(id)`
- `sessions.user_id` → `records.users(id)`

**UNIQUE:** `customers.nomor_wa`, `users.identitas_login`, `sessions.token_hash`, `consent_versions.versi_teks`.

**CHECK:** `users.status` (active/inactive), `customers.nomor_wa` format `^62[0-9]{9,13}$`.

**Pemicu (trigger):** `records.enforce_max_two_active_users()` mencegah lebih dari dua akun `users` dengan `status = 'active'` secara bersamaan (dipicu sebelum INSERT dan UPDATE status). Pemicu menggunakan `pg_advisory_xact_lock` untuk serialisasi, sehingga aman terhadap transaksi bersamaan.

## 4. Strategi migrasi dan penomoran

- Migrasi adalah file SQL berversi di `db/migrations/`, diformat `NNNN_deskripsi.sql`.
- Urutan diterapkan menurut nama file (urut abjad/angka), deterministik.
- Setiap file migrasi diterapkan dalam satu transaksi (`BEGIN ... COMMIT`). Gagal saat menjalankan file → rollback seluruh file dan versi tidak dicatat, sehingga dapat diulang.
- Tabel pelacakan `booking.schema_migrations` mencatat setiap versi yang sudah diterapkan dengan `applied_at`.
- Migrasi yang sudah diterapkan **tidak diedit diam-diam**. Perubahan selanjutnya harus dibuat sebagai file migrasi baru.
- Re-apply (menjalankan ulang) melewati versi yang sudah dicatat (idempoten pada tingkat file).

### Daftar file migrasi

| File | Isi |
|---|---|
| `0001_init.sql` | Extension `btree_gist`, skema `booking` dan `records`, tabel pelacakan `booking.schema_migrations` |
| `0002_booking_tables.sql` | Tabel `booking` (termasuk `booking_rules` dengan nilai awal 30/3/30/2) dan index pendukung |
| `0003_records_tables.sql` | Tabel `records` dan index pendukung |
| `0004_constraints.sql` | Exclusion constraint anti-overlap booking, pemicu maksimal dua akun aktif |
| `0005_corrections.sql` | Koreksi tipe `actor_user_id` ke `bigint` dan serialisasi pemicu batas dua akun aktif (`pg_advisory_xact_lock`) agar aman konkuren |

## 5. Cara menjalankan migrasi

Skrip: `scripts/migrate.mjs` (membutuhkan Node.js dan paket `pg`).

**Prasyarat:** variabel environment `DATABASE_URL` berisi connection string PostgreSQL (contoh: `postgresql://<user>:<pass>@<host>:5432/<db>`). Migrasi dijalankan sebagai role dengan hak membuat skema/tabel/extension (superuser atau role migrasi yang berhak).

**Terapkan semua migrasi belum diterapkan:**
```bash
DATABASE_URL="postgresql://...@db:5432/dacie_dev" node scripts/migrate.mjs
```

**Periksa status migrasi (versi apa saja yang sudah/belum diterapkan):**
```bash
DATABASE_URL="postgresql://...@db:5432/dacie_dev" node scripts/migrate.mjs status
```

**Dari database kosong:** buat database baru (contoh `CREATE DATABASE dacie_t004 OWNER <role>;`), lalu jalankan perintah apply di atas. Seluruh skema dan tabel akan terbentuk dari awal.

Contoh output apply pada database kosong:
```
[TERAPKAN] 0001_init.sql
[TERAPKAN] 0002_booking_tables.sql
[TERAPKAN] 0003_records_tables.sql
[TERAPKAN] 0004_constraints.sql
Berhasil menerapkan 4 dari 4 migrasi.
```

Contoh output re-apply (idempoten):
```
[LEWAT]    0001_init.sql (sudah diterapkan)
[LEWAT]    0002_booking_tables.sql (sudah diterapkan)
[LEWAT]    0003_records_tables.sql (sudah diterapkan)
[LEWAT]    0004_constraints.sql (sudah diterapkan)
Tidak ada migrasi baru yang perlu diterapkan.
```

## 6. Kebutuhan PostgreSQL dan extension

- PostgreSQL: diuji pada `postgres:17-alpine`.
- Extension `btree_gist` (versi 1.7): **wajib** untuk exclusion constraint `bookings_no_overlap_active` yang menggabungkan btree (`provider_id`) dengan gist (`tstzrange`).
- Hak membuat extension: verifikasi dilakukan sebagai role superuser/migrasi (`dacie_dev` pada environment development). Extension berhasil dibuat (`CREATE EXTENSION IF NOT EXISTS btree_gist;`).
- Jika `btree_gist` tidak tersedia atau role migrasi tidak berhak membuat extension, exclusion constraint tidak dapat dibuat dan task harus dilaporkan sebagai blocker dengan alternatif teknis (tidak melemahkan persyaratan anti-overlap).

## 7. Hasil verifikasi anti-double-booking

Diverifikasi terhadap PostgreSQL nyata (`postgres:17-alpine`) pada database kosong yang dibangun dari seluruh migrasi:

1. Database kosong dapat dibangun dari seluruh 4 migrasi secara berurutan. (**Terdiverifikasi**)
2. Kedua skema `booking` dan `records` terbentuk. (**Terdiverifikasi**)
3. Seluruh tabel dan kolom wajib tersedia (14 tabel application + 1 tabel pelacakan). (**Terdiverifikasi**)
4. Constraint dan index tersedia, termasuk exclusion constraint `bookings_no_overlap_active`. (**Terdiverifikasi**)
5. Nilai awal `booking_rules`: slot_step_minutes=30, min_notice_hours=3, max_advance_days=30, max_active_per_wa=2. (**Terdiverifikasi**)
6. Status booking hanya menerima lima nilai yang diizinkan; nilai lain ditolak oleh CHECK constraint. (**Terdiverifikasi**)
7. Foreign key tidak melintasi skema (`actor_user_id` tidak memiliki FK; tidak ada FK antara `booking` dan `records`). (**Terdiverifikasi**)
8. Nomor WhatsApp memiliki constraint format (`^62[0-9]{9,13}$`) dan keunikan pada `customers.nomor_wa`. (**Terdiverifikasi**)
9. Exclusion constraint menolak dua booking aktif (`pending`/`confirmed`) yang intervalnya tumpang tindih pada provider yang sama. (**Terdiverifikasi**)
10. Booking `cancelled`/`completed`/`no_show` tidak menghalangi interval baru pada provider yang sama. (**Terdiverifikasi**)
11. Dua transaksi bersamaan pada provider dan interval yang sama: paling banyak satu booking aktif berhasil (satu committed, satu ditolak oleh constraint/deadlock). (**Terdiverifikasi**)
12. Migrasi yang sudah diterapkan tidak diedit; re-apply melewati versi yang sudah dicatat. (**Terdiverifikasi**)
13. Fixture/seed hanya memakai data sintetis (tidak ada data pelanggan nyata pada migrasi ini; `booking_rules` hanya berisi konfigurasi awal). (**Terdiverifikasi**)

Integrasi tes tersimpan di `src/db/exclusion.test.ts` (4 tes) dan diverifikasi dengan perintah:
```bash
DATABASE_URL="postgresql://...@db:5432/dacie_t004" node --test src/db/exclusion.test.ts
```
Hasil: 4/4 lulus.

## 8. Asumsi, keterbatasan, dan risiko terbuka

- Role database (`app_public`, `app_private`) dan owner fungsi (`booking_public_fn_owner`, `booking_private_fn_owner`) belum dibuat; merupakan scope T-005. Migrasi T-004 dijalankan sebagai role superuser/migrasi.
- Fungsi publik `get_public_config()`, `get_blocked_intervals()`, `create_booking()`, dan `set_booking_status()` belum diimplementasikan (scope T-042/T-043).
- Pemicu `enforce_max_two_active_users()` memaksakan maksimal dua akun `users` aktif pada tingkat database; ini merupakan dukungan awal untuk aturan "maksimal dua akun aktif" yang akan diatur lebih lanjut pada T-017.
- Gating consent (field kesehatan/kulit dan kunjungan hanya setelah consent dicatat) ditangani pada lapisan aplikasi (T-021/T-022), bukan dibatasi sepenuhnya oleh constraint database.
- Penghubung logis antara `booking` dan `records` adalah nomor WhatsApp ternormalisasi (tidak ada foreign key lintas skema); integritas referensial antar keduanya dijamin oleh aplikasi, bukan database.
- Ekstra role/privilege dan default privileges ditinjau pada T-005; migrasi T-004 tidak memberikan hak tabel kepada role runtime.
- Rollback migrasi (down migration) tidak diimplementasikan; perubahan destruktif memerlukan task terpisah dan persetujuan pemilik.
- `scripts/verify.sh` belum tersedia pada saat pengerjaan T-004 (scope T-007); verifikasi dilakukan secara manual (lint, typecheck, `npm test` dengan PostgreSQL Docker).
