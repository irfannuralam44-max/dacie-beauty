# Laporan T-005 — Role Database dan Privilege Minimum

## 1. Metadata

| Item | Nilai |
|---|---|
| Repository | `irfannuralam44-max/dacie-beauty` |
| Task ID | T-005 |
| Branch | `agent/T-005-db-roles` |
| Base branch | `main` |
| SHA base | `fae0c9aededa1af8f7150fc6501a7dca0631e410` |
| Status implementasi | Dibuat pada branch; menunggu verifikasi PostgreSQL lokal |
| Laporan | `docs/reports/T-005-db-roles.md` |

## 2. Ringkasan

Menambahkan migrasi `0006_database_roles.sql` untuk membuat role runtime `app_public`/`app_private` dan dua function owner NOLOGIN sesuai D-11. Grant eksplisit membatasi akses schema, tabel, kolom, dan sequence. Default privileges ditetapkan untuk objek yang dibuat oleh role migrasi saat ini. Tidak ada fungsi booking yang dibuat dalam task ini.

## 3. File dibuat/diubah

| File | Perubahan |
|---|---|
| `db/migrations/0006_database_roles.sql` | Membuat empat role; mengatur atribut keamanan; grant/revoke schema, tabel, kolom status, sequence; default privileges; revoke EXECUTE PUBLIC pada trigger function T-004 |
| `src/db/roles.test.ts` | Tes kredensial nyata app_public/app_private, batas kedua function owner, dan default privileges |
| `docs/database/panduan-migrasi.md` | Dokumentasi role, credential handling, default privileges, dan cara menjalankan tes |
| `docs/reports/T-005-db-roles.md` | Laporan task |

## 4. Matriks privilege yang diterapkan

| Role | Schema | Hak |
|---|---|---|
| `app_public` | `booking` | USAGE saja; tidak ada privilege tabel/sequence |
| `app_public` | `records` | Tidak ada USAGE |
| `app_private` | `booking` | SELECT semua tabel; INSERT/UPDATE lima tabel konfigurasi; tanpa DELETE dan tanpa DML bookings |
| `app_private` | `records` | SELECT/INSERT/UPDATE/DELETE semua tabel; USAGE sequence |
| `booking_public_fn_owner` | `booking` | SELECT konfigurasi; SELECT/INSERT bookings; USAGE sequence bookings |
| `booking_private_fn_owner` | `booking` | SELECT bookings; UPDATE hanya kolom status; INSERT status_events; USAGE sequence status_events |
| Kedua function owner | `records` | Tidak ada USAGE atau privilege objek |

Semua role bukan superuser, tidak memiliki CREATEDB/CREATEROLE/REPLICATION/BYPASSRLS. Kedua function owner NOLOGIN. Password role runtime tidak ditulis dalam migrasi atau repository.

## 5. Default privileges

Default privileges ditetapkan untuk role yang menjalankan migrasi:

- Tabel baru di schema booking: SELECT untuk app_private saja.
- Tabel baru di schema records: SELECT/INSERT/UPDATE/DELETE untuk app_private.
- Sequence baru di schema records: USAGE untuk app_private.
- Fungsi baru: EXECUTE tidak diberikan ke PUBLIC secara default.
- Sequence booking tidak diberi grant otomatis. Migrasi berikutnya harus memberikan USAGE secara eksplisit hanya untuk jalur INSERT yang memang diizinkan.
- DML tabel konfigurasi booking baru juga harus diberikan secara eksplisit; ini mencegah tabel bookings di masa depan ikut menerima INSERT/UPDATE secara otomatis.

Default privileges PostgreSQL melekat pada role pembuat objek, sehingga migrasi berikutnya perlu memakai role migrasi yang sama atau mengatur default privileges untuk role pembuat objek lain.

## 6. Pengujian yang disiapkan

File `src/db/roles.test.ts` mencakup:

1. Dengan `APP_PUBLIC_DATABASE_URL`, SELECT dan INSERT langsung pada setiap tabel di kedua schema harus gagal dengan SQLSTATE `42501`; schema records tidak boleh memiliki USAGE.
2. Dengan `APP_PRIVATE_DATABASE_URL`, SELECT seluruh tabel booking berhasil; DML langsung pada bookings ditolak; lima tabel konfigurasi memiliki INSERT/UPDATE tanpa DELETE; seluruh tabel records memiliki DML.
3. Dengan koneksi administrasi `DATABASE_URL`, kedua owner diperiksa NOLOGIN/non-superuser; privilege publik diverifikasi; owner privat hanya memiliki UPDATE kolom status (bukan UPDATE tabel atau kolom nama).
4. Default privileges diverifikasi melalui tabel/sequence/function probe dalam transaksi yang di-ROLLBACK.

**Status eksekusi:** belum dijalankan pada environment PostgreSQL dalam sesi ini. Repository connector memungkinkan perubahan file/branch GitHub, tetapi tidak menyediakan shell/database PostgreSQL untuk menjalankan migrasi atau tes. Karena itu tidak ada klaim PASS untuk tes runtime. Tes role runtime akan dilewati bila URL kredensial terkait tidak disetel.

## 7. Perintah verifikasi yang harus dijalankan

Pada database uji sintetis PostgreSQL 17 yang telah menerapkan migrasi 0001–0005:

```bash
DATABASE_URL="postgresql://<migration-role>:<password>@<host>:5432/<db>" \
node scripts/migrate.mjs
```

Setelah role runtime diberi password melalui secret lokal (jangan commit password):

```bash
DATABASE_URL="postgresql://<migration-role>:<password>@<host>:5432/<db>" \
APP_PUBLIC_DATABASE_URL="postgresql://app_public:<password>@<host>:5432/<db>" \
APP_PRIVATE_DATABASE_URL="postgresql://app_private:<password>@<host>:5432/<db>" \
npm test
```

Jalankan juga `npm run lint` dan `npm run typecheck`. Catat hasil terpisah; masalah typecheck `LayoutProps` yang sudah tercatat pada laporan T-004 bukan bagian dari T-005.

## 8. Batas scope dan tindak lanjut

- Tidak membuat `get_public_config`, `get_blocked_intervals`, `create_booking`, atau `set_booking_status`; fungsi tetap menjadi scope T-042/T-043.
- T-042/T-043 harus menetapkan owner fungsi dan memberikan EXECUTE eksplisit hanya ke role aplikasi terkait.
- Password `app_public` dan `app_private` harus dikonfigurasi di secret manager/environment deployment, tidak melalui migrasi.
- Sebelum merge, jalankan migrasi dan tes di PostgreSQL lokal dengan kredensial role nyata; tinjau hasil default privileges untuk role migrasi yang dipakai.
