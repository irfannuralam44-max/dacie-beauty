# Laporan T-006 — Data Access Layer dan Transaksi

## 1. Metadata

| Item | Nilai |
|---|---|
| Repository | `irfannuralam44-max/dacie-beauty` |
| Task ID | T-006 |
| Branch | `agent/T-006-data-access` |
| Base branch | `main` |
| SHA base | `184b256` |
| SHA verifikasi | `21bcdbc7488f7b8e279e076482817e3538497adb` (T-005) + `HEAD T-006` |
| Status implementasi | Selesai; verifikasi lokal lulus |
| Laporan | `docs/reports/T-006-data-access.md` |

## 2. Ringkasan

Membuat lapisan akses data (Data Access Layer) di `src/lib/db/` yang memastikan pemilihan pool database ditentukan oleh `APP_MODE` saat startup, bukan oleh parameter request. Instance public hanya membuat pool `app_public`; instance private hanya membuat pool `app_private`. Tidak ada fallback, tidak ada helper untuk memilih role/pool berdasarkan request, dan semua query menggunakan parameter binding dengan dukungan transaksi (BEGIN/COMMIT/ROLLBACK).

Bergantung pada T-003 (validasi environment) dan T-005 (role database dan privilege minimum).

## 3. File dibuat/diubah

| File | Status | Tujuan |
|---|---|---|
| `src/lib/db/pool.ts` | Dibuat | Pembuatan dan pengelolaan `pg.Pool` per proses, pemilihan pool berdasarkan `APP_MODE`, query berparameter, transaksi dengan rollback otomatis |
| `src/lib/db/client.ts` | Dibuat | Wrapper query berparameter: `select`, `selectOne`, `modify` |
| `src/lib/db/index.ts` | Dibuat | Ekspor publik lapisan akses data |
| `src/lib/db/pool.test.ts` | Dibuat | Unit test pemilihan pool, konsistensi role, tidak ada fallback |
| `src/db/data-access.test.ts` | Dibuat | Integration test query, select, transaction, rollback, pemisahan role (public/private) |
| `docs/database/panduan-migrasi.md` | Diubah | Dokumentasi lapisan akses data dan aturan keamanan |

## 4. Acceptance criteria

| # | Kriteria | Status | Bukti |
|---|---|---|---|
| 1 | `APP_MODE=public` hanya membuat pool `app_public` | PASS | `getActiveRole()` = `app_public`, connection string mengandung `://app_public:` |
| 2 | `APP_MODE=private` hanya membuat pool `app_private` | PASS | `getActiveRole()` = `app_private`, connection string mengandung `://app_private:` |
| 3 | Test membuktikan instance public tidak dapat membuat/mengakses pool privat | PASS | Tes dengan pool terpisah `app_public` ditolak saat SELECT/INSERT tabel dan akses schema `records` |
| 4 | Tidak ada fallback atau helper untuk memilih role/pool berdasarkan request | PASS | `getPool()` selalu mengembalikan instance yang sama; tidak ada parameter pemilihan role |
| 5 | Query menggunakan parameter binding dan transaksi dapat di-rollback | PASS | `query(text, params)`, `transaction(work)` dengan `BEGIN`/`COMMIT`/`ROLLBACK`; tes rollback lulus |
| 6 | Secret koneksi hanya dibaca server-side; public mode menolak secret privat saat startup | PASS | `server-only` pada `src/lib/env/server.ts`; `parseServerEnv` menolak variabel privat pada mode public (sudah teruji T-003) |

## 5. Perintah yang dijalankan dan hasil

Database uji: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) via pg_ctl, port 5433, database `dacie_t006_test`, migrasi 0001–0006 diterapkan.

| Perintah | Hasil | Exit code |
|---|---|---|
| `node scripts/migrate.mjs` (apply) | 6/6 migrasi diterapkan | 0 |
| `node scripts/migrate.mjs` (re-apply) | Semua dilewati (idempoten) | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | FAIL: `src/app/layout.tsx(20,50)` error TS2304 — `LayoutProps` tidak terdefinisi/diimpor. Masalah pre-existing pada `main`, bukan regresi T-006. | 1 |
| `node --test "src/**/*.test.ts"` (mode private, DATABASE_URL disetel) | 54/54 lulus, 3 dilewati (APP_PUBLIC_DATABASE_URL tidak disetel) | 0 |
| `node --test "src/**/*.test.ts"` (mode public, DATABASE_URL disetel) | 49/49 lulus, 8 dilewati (APP_PRIVATE_DATABASE_URL tidak disetel) | 0 |

`scripts/verify.sh`: belum tersedia (scope T-007), tidak dibuat pengganti.

## 6. Hasil pengujian

- **Unit test pool** (`src/lib/db/pool.test.ts`): 5/5 lulus dalam kedua mode (public dan private). Memverifikasi pool mengembalikan connection string sesuai role aktif, tidak ada fallback ke role lain, instance pool selalu sama.
- **Integration test data access** (`src/db/data-access.test.ts`): 14/14 lulus dalam mode private, 9/9 lulus dalam mode private. Memverifikasi query berparameter, select/selectOne, transaksi commit/rollback, penolakan DML langsung pada `bookings`, penolakan akses schema `records` oleh `app_public`, SELECT seluruh tabel booking oleh `app_private`.
- **Tes yang ada (T-004, T-005)**: Semua tetap lulus (exclusion constraint, role/privilege, validasi environment).

## 7. Keputusan dan asumsi

- Memilih `pg` (Node.js PostgreSQL driver, MIT) sebagai driver untuk pool; sudah tersedia sebagai dependency dari T-004.
- Satu pool per proses, dibuat saat primeira panggilan `getPool()`; tidak ada pool per request.
- `parseServerEnv` dari `src/lib/env/schema.ts` digunakan untuk membaca environment (tidak ada `server-only` langsung di `pool.ts` untuk menghindari runtime error di `node --test`; `server-only` tetap aktif di `src/lib/env/server.ts`).
- Password role runtime tidak ditulis dalam repository; hanya digunakan untuk pengujian lokal.
- Typecheck error `LayoutProps` di `src/app/layout.tsx:20` adalah masalah pre-existing pada `main`, bukan regresi T-006.

## 8. Masalah tersisa

| Prioritas | Masalah | Dampak | Saran/tindakan |
|---|---|---|---|
| P2 | `scripts/verify.sh` belum tersedia | Verifikasi otomatis belum tersatu | Dikerjakan pada T-007 |
| P3 | Typecheck `LayoutProps` error pre-existing | Typecheck gagal pada `main` | Perlu diperbaiki dalam task terpisah (bukan T-006) |
| P3 | Fungsi publik `get_public_config()`, `get_blocked_intervals()`, `create_booking()`, `set_booking_status()` belum ada | Data access layer belum terhubung ke fungsi database | Dikerjakan pada T-042/T-043 |

## 9. Hal untuk auditor

- Area sensitif: pemilihan pool berdasarkan `APP_MODE` (`src/lib/db/pool.ts`), parameter binding (`src/lib/db/client.ts`), ekspor publik (`src/lib/db/index.ts`).
- Berkas penting: `src/lib/db/pool.ts`, `src/lib/db/client.ts`, `src/lib/db/index.ts`, `src/lib/db/pool.test.ts`, `src/db/data-access.test.ts`, `docs/database/panduan-migrasi.md`.
- Langkah reproduksi: set `APP_MODE`, `APP_PUBLIC_DATABASE_URL`/`APP_PRIVATE_DATABASE_URL`, `DATABASE_URL`, jalankan `node scripts/migrate.mjs`, lalu `node --test "src/**/*.test.ts"`.
- Perhatian khusus: verifikasi bahwa `app_public` tidak dapat mengakses schema `records` dan tidak memiliki privilege tabel langsung; verifikasi bahwa `app_private` tidak dapat DML langsung pada `booking.bookings`.

## 10. Git

```text
Push: belum dilakukan
Branch: agent/T-006-data-access
SHA: (akan ditentukan saat commit)
Commit: (akan ditentukan saat commit)
Laporan: docs/reports/T-006-data-access.md
```
