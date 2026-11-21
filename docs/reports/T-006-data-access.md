# Laporan T-006 — Data Access Layer dan Transaksi

## 1. Metadata

| Item | Nilai |
|---|---|
| Repository | `irfannuralam44-max/dacie-beauty` |
| Task ID | T-006 |
| Branch | `agent/T-006-data-access` |
| Base branch | `main` |
| SHA base | `184b256` |
| SHA verifikasi | `2feb15f6514a7a432eaf65de8f89fff831e20ff4` |
| Status implementasi | Selesai; verifikasi lokal lulus |
| Laporan | `docs/reports/T-006-data-access.md` |

## 2. Ringkasan

Membuat lapisan akses data (Data Access Layer) di `src/lib/db/` yang memastikan pemilihan pool database ditentukan oleh `APP_MODE` saat startup, bukan oleh parameter request. Instance public hanya membuat pool `app_public`; instance private hanya membuat pool `app_private`. Tidak ada fallback, tidak ada helper untuk memilih role/pool berdasarkan request, dan semua query menggunakan parameter binding dengan dukungan transaksi (BEGIN/COMMIT/ROLLBACK).

Bergantung pada T-003 (validasi environment) dan T-005 (role database dan privilege minimum).

## 3. File dibuat/diubah

| File | Status | Tujuan |
|---|---|---|
| `src/lib/db/pool.ts` | Dibuat/revisi | Pembuatan dan pengelolaan `pg.Pool` per proses, pemilihan pool berdasarkan `APP_MODE`, query berparameter, transaksi dengan rollback otomatis, tanpa `server-only` (internal module) |
| `src/lib/db/client.ts` | Dibuat/revisi | Wrapper query berparameter: `select`, `selectOne`, `modify`, tanpa `server-only` (internal module) |
| `src/lib/db/index.ts` | Dibuat/revisi | Ekspor publik lapisan akses data, dengan `server-only` (public API protection) |
| `src/lib/db/pool.test.ts` | Dibuat/revisi | Unit test pemilihan pool, konsistensi role, tidak ada fallback, negative test API publik |
| `src/db/data-access.test.ts` | Dibuat/revisi | Integration test query, select, transaction rollback, pemisahan role (public/private), negative test import tidak disengaja |
| `docs/database/panduan-migrasi.md` | Diubah | Dokumentasi lapisan akses data dan aturan keamanan |
| `src/lib/env/server.ts` | Diubah | Perbaikan import extension `.ts` |

## 4. Acceptance criteria

| # | Kriteria | Status | Bukti |
|---|---|---|---|
| 1 | `APP_MODE=public` hanya membuat pool `app_public` | PASS | `isPublicPool()` = true, pool connection string mengandung `://app_public:` |
| 2 | `APP_MODE=private` hanya membuat pool `app_private` | PASS | `isPrivatePool()` = true, pool connection string mengandung `://app_private:` |
| 3 | Test membuktikan instance public tidak dapat membuat/mengakses pool privat, termasuk melalui import tidak sengaja | PASS | `createPool` tidak diekspor dari `index.ts`; `getPool()` selalu mengembalikan pool sesuai mode; tes negative import tidak disengaja lulus |
| 4 | Tidak ada fallback atau helper yang memungkinkan request memilih role/pool | PASS | `getPool()` selalu mengembalikan instance yang sama (singleton); tidak ada parameter pemilihan role |
| 5 | Query menggunakan parameter binding dan transaksi dapat di-rollback | PASS | `query(text, params)`, `transaction(work)` dengan `BEGIN`/`COMMIT`/`ROLLBACK`; tes rollback wrapper lulus, data tidak tersimpan setelah error, koneksi dapat digunakan kembali |
| 6 | Secret koneksi hanya dibaca server-side dan public mode menolak secret privat saat startup | PASS | `index.ts` ditandai `server-only`; `parseServerEnv` menolak variabel privat pada mode public (sudah teruji T-003) |

## 5. Perintah yang dijalankan dan hasil

Database uji: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) via pg_ctl, port 5433, database `dacie_t006_test`, migrasi 0001–0006 diterapkan.

| Perintah | Hasil | Exit code |
|---|---|---|
| `node scripts/migrate.mjs` (apply) | 6/6 migrasi diterapkan | 0 |
| `node scripts/migrate.mjs` (re-apply) | Semua dilewati (idempoten) | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | FAIL: `src/app/layout.tsx(20,50)` error TS2304 — `LayoutProps` tidak terdefinisi/diimpor. Masalah pre-existing pada `main`, bukan regresi T-006. | 1 |
| `node --test "src/**/*.test.ts"` (mode private, DATABASE_URL disetel) | 53/53 lulus, 7 dilewati | 0 |
| `node --test "src/**/*.test.ts"` (mode public, DATABASE_URL disetel) | 51/51 lulus, 9 dilewati | 0 |

`scripts/verify.sh`: belum tersedia (scope T-007), tidak dibuat pengganti.

## 6. Hasil pengujian

- **Unit test pool** (`src/lib/db/pool.test.ts`): 7/7 lulus dalam kedua mode (public dan private). Memverifikasi pool mengembalikan connection string yang valid, `isPublicPool()`/`isPrivatePool()` konsisten dan saling eksklusif, instance pool selalu sama (singleton), API publik tidak mengekspos `createPool`/`getActiveConnectionString`/`getActiveRole`.
- **Integration test data access** (`src/db/data-access.test.ts`): 15/15 lulus dalam mode private, 12/12 lulus dalam mode public. Memverifikasi query berparameter, select/selectOne, transaksi commit melalui wrapper `transaction()`, rollback membatalkan semua data saat query gagal, koneksi dapat digunakan kembali setelah rollback, penolakan DML langsung pada `bookings`, penolakan akses schema `records` oleh `app_public`, SELECT seluruh tabel booking oleh `app_private`, tidak ada pembuatan pool privat melalui import tidak disengaja.
- **Tes yang ada (T-004, T-005)**: Semua tetap lulus (exclusion constraint, role/privilege, validasi environment).

## 7. Keputusan dan asumsi

- Memilih `pg` (Node.js PostgreSQL driver, MIT) sebagai driver untuk pool; sudah tersedia sebagai dependency dari T-004.
- `server-only` hanya dipasang di `index.ts` (API publik) untuk mencegah impor oleh Client Component. Modul internal `pool.ts` dan `client.ts` tidak memiliki `server-only` agar dapat diimpor langsung dalam pengujian Node.js tanpa melemahkan proteksi produksi.
- `pool.ts` dan `client.ts` membaca environment melalui `parseServerEnv` dari `schema.ts` (fungsi yang sama yang dipakai oleh `getServerEnv` di `server.ts`), bukan membaca `process.env` langsung tanpa validasi.
- Satu pool per proses, dibuat saat primeira panggilan `getPool()`; tidak ada pool per request.
- Password role runtime tidak ditulis dalam repository; hanya digunakan untuk pengujian lokal.
- Typecheck error `LayoutProps` di `src/app/layout.tsx:20` adalah masalah pre-existing pada `main`, bukan regresi T-006.

## 8. Masalah tersisa

| Prioritas | Masalah | Dampak | Saran/tindakan |
|---|---|---|---|
| P2 | `scripts/verify.sh` belum tersedia | Verifikasi otomatis belum tersatu | Dikerjakan pada T-007 |
| P3 | Typecheck `LayoutProps` error pre-existing | Typecheck gagal pada `main` | Perlu diperbaiki dalam task terpisah (bukan T-006) |
| P3 | Fungsi publik `get_public_config()`, `get_blocked_intervals()`, `create_booking()`, `set_booking_status()` belum ada | Data access layer belum terhubung ke fungsi database | Dikerjakan pada T-042/T-043 |

## 9. Hal untuk auditor

- Area sensitif: pemilihan pool berdasarkan `APP_MODE` (`src/lib/db/pool.ts`), parameter binding (`src/lib/db/client.ts`), ekspor publik dengan `server-only` (`src/lib/db/index.ts`).
- Berkas penting: `src/lib/db/pool.ts`, `src/lib/db/client.ts`, `src/lib/db/index.ts`, `src/lib/db/pool.test.ts`, `src/db/data-access.test.ts`, `docs/database/panduan-migrasi.md`.
- Langkah reproduksi: set `APP_MODE`, `APP_PUBLIC_DATABASE_URL`/`APP_PRIVATE_DATABASE_URL`, `DATABASE_URL`, jalankan `node scripts/migrate.mjs`, lalu `node --test "src/**/*.test.ts"`.
- Perhatian khusus: verifikasi bahwa `index.ts` memiliki `import "server-only"`; verifikasi bahwa `createPool` tidak diekspor dari `index.ts`; verifikasi bahwa `app_public` tidak dapat mengakses schema `records` dan tidak memiliki privilege tabel langsung; verifikasi bahwa `app_private` tidak dapat DML langsung pada `booking.bookings`.

## 10. Git

```text
Push: berhasil
Branch: agent/T-006-data-access
SHA: 2feb15f6514a7a432eaf65de8f89fff831e20ff4
Commit: docs(report): sinkronisasi SHA verifikasi akhir T-006
Laporan: docs/reports/T-006-data-access.md
```
