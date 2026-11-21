# Laporan T-002 — Docker Compose development

## Ringkasan perubahan

Menambahkan lingkungan development Docker Compose dengan tiga service: `web-public` (`APP_MODE=public`), `web-private` (`APP_MODE=private`), dan PostgreSQL. Kedua service aplikasi memakai image `dacie-beauty:dev` yang sama dari `Dockerfile` yang sama. PostgreSQL memakai named volume `postgres_data`, healthcheck `pg_isready`, dan tidak mempublikasikan port ke host. Port aplikasi diikat ke `127.0.0.1` (`3001`/`3002`).

Perbaikan audit runtime: build awal gagal karena kedua service memiliki blok `build` dengan tag image yang sama. Konfigurasi diubah agar image dibangun sekali melalui `web-public`; `web-private` memakai image yang sama. Ditambahkan endpoint health `/api/health` untuk healthcheck container.

Seluruh pengujian Docker wajib dijalankan pada lingkungan yang memiliki Docker Engine dan Docker Compose. Tidak ada credential atau secret yang ditampilkan pada laporan ini.

## Daftar file berubah

| File | Perubahan |
|---|---|
| `compose.yaml` | Service `db`, `web-public`, `web-private`; satu image; named volume; healthcheck; port lokal |
| `.env.example` | Placeholder dummy kredensial PostgreSQL lokal dan port aplikasi |
| `README.md` | Instruksi Compose: konfigurasi, build, start, status, log, stop, persistensi, troubleshooting |
| `src/app/api/health/route.ts` | Endpoint health `GET /api/health` untuk healthcheck container |
| `scripts/smoke-app-modes.sh` | Assertion tambahan untuk `/api/health` pada kedua mode |
| `docs/reports/T-002-dev-compose.md` | Laporan task ini |

## Lingkungan dan sinkronisasi

- Branch: `agent/T-002-dev-compose`
- Branch dasar: `main`
- SHA dasar: `965729e9391132a0c5a6a27014e1aab81660a8ff` (merge T-001)
- Working tree sebelum pengujian: bersih
- Fetch: `git fetch origin --prune` berhasil; `origin/main` = `965729e9391132a0c5a6a27014e1aab81660a8ff`
- Docker Engine: `29.1.3`
- Docker Compose: `2.40.3+ds1-0ubuntu1~24.04.1`
- SHA commit kode: `da5a520bfa863596e43d54f678881790285aeb0a`
- SHA perbaikan compose: (diisi setelah commit)

## Perintah yang dijalankan

| Perintah | Hasil | Exit code |
|---|---|---:|
| `git fetch origin --prune` | `origin/main` tetap `965729e` | 0 |
| `docker compose config` | Konfigurasi valid; service `db`, `web-private`, `web-public` | 0 |
| `docker compose build` | Build berhasil setelah perbaikan satu image (`web-public Built`) | 0 |
| `docker compose up -d` | PostgreSQL healthy; kedua aplikasi start | 0 |
| `docker compose ps` | `db`, `web-public`, `web-private` semua `healthy` | 0 |
| `docker compose images` | Kedua service aplikasi memakai image ID `bb3120305642` | 0 |
| Runtime public `/booking` | HTTP 200 | 0 |
| Runtime public `/rekam` | HTTP 404 | 0 |
| Runtime private `/rekam` | HTTP 200 | 0 |
| Runtime private `/booking` | HTTP 404 | 0 |
| Runtime `/api/health` public/private | HTTP 200 / 200 | 0 |
| `docker compose exec web-public` cek `APP_MODE` | `public` | 0 |
| `docker compose exec web-private` cek `APP_MODE` | `private` | 0 |
| Cek env privat pada `web-public` | `POSTGRES_*`, `SESSION_SECRET`, `APP_PRIVATE_DATABASE_URL` = `ABSENT` | 0 |
| Insert data sintetis ke PostgreSQL | `CREATE TABLE`, `INSERT 0 1` | 0 |
| `docker compose restart db` | Container restart, lalu `healthy` | 0 |
| Query data setelah restart | `id=1, note=synthetic-test` tetap ada | 0 |
| `docker port dacie-beauty-dev-db-1` | Tidak ada port yang dipublikasikan | 0 |
| `docker inspect` port binding `db` | `HostConfig.PortBindings = {}` | 0 |
| `docker inspect` port binding aplikasi | `127.0.0.1:3001`, `127.0.0.1:3002` | 0 |
| Healthcheck negatif (container tanpa server) | Status `unhealthy` | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | Tanpa error | 0 |
| `env -u APP_MODE npm run build` | Build aplikasi berhasil | 0 |
| `./scripts/smoke-app-modes.sh` | Public/private/invalid lulus | 0 |
| `test -x scripts/verify.sh` | Script belum tersedia | 1 |
| `git diff --check` | Tidak ada whitespace error | 0 |

## Hasil scripts/verify.sh

- Perintah: `scripts/verify.sh`
- Hasil: script belum tersedia pada branch dasar (scope T-007).
- Exit code: N/A (tidak dijalankan)

## Kriteria penerimaan

1. **`web-public`, `web-private`, dan PostgreSQL dapat dijalankan melalui instruksi README** — **LULUS.** `docker compose config`, `docker compose build`, dan `docker compose up -d` exit 0; `docker compose ps` menunjukkan ketiga service `healthy`.
2. **Kedua service aplikasi memakai image yang sama** — **LULUS.** `docker compose images` dan `docker inspect` menunjukkan image ID yang sama: `sha256:bb312030564269eb92a8a5773b64cc11dca5d89f6f03f6bfc4e7f87ecf6f82c9` untuk `web-public` dan `web-private`.
3. **`APP_MODE` public dan private berbeda pada runtime** — **LULUS.** `docker compose exec web-public` menghasilkan `public`; `docker compose exec web-private` menghasilkan `private`.
4. **PostgreSQL memakai named volume dan data bertahan setelah restart** — **LULUS.** Volume `postgres_data` terpasang di `/var/lib/postgresql/data`; data sintetis `synthetic-test` masih ada setelah `docker compose restart db`.
5. **Kredensial lokal berasal dari environment, bukan hardcoded** — **LULUS.** `compose.yaml` memakai `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${POSTGRES_DB}`; `.env.example` hanya placeholder dummy.
6. **Environment `web-public` tidak berisi credential/secret privat** — **LULUS.** Pemeriksaan runtime: `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB`, `SESSION_SECRET`, dan `APP_PRIVATE_DATABASE_URL` semuanya `ABSENT` pada `web-public`.
7. **Healthcheck membedakan service siap dan belum siap** — **LULUS.** `db`, `web-public`, dan `web-private` berstatus `healthy`; container uji dengan healthcheck yang sama tetapi tanpa server berstatus `unhealthy`.
8. **PostgreSQL tidak mengekspos port ke jaringan publik** — **LULUS.** `docker port` untuk container `db` kosong; `HostConfig.PortBindings` `{}`; container hanya berada pada network Compose `dacie-beauty-dev_internal`.
9. **Port aplikasi hanya tersedia lokal** — **LULUS.** Port binding `127.0.0.1:3001->3000/tcp` dan `127.0.0.1:3002->3000/tcp`; tidak ada binding `0.0.0.0`.
10. **Route silang tetap ditolak** — **LULUS.** Public `/booking` → 200, public `/rekam` → 404; private `/rekam` → 200, private `/booking` → 404.
11. **Tidak ada secret atau data pelanggan nyata** — **LULUS.** Tidak ada `.env` aktual yang dilacak; `.env.example` hanya placeholder dummy; data uji yang dimasukkan adalah `synthetic-test`.

## Keputusan atau asumsi

- PostgreSQL memakai `postgres:17-alpine`; tag diverifikasi melalui Docker Hub API pada 2026-11-21 dan image berhasil di-pull saat `docker compose up`.
- Image aplikasi dibangun sekali melalui service `web-public`; `web-private` memakai `image: dacie-beauty:dev` yang sama. Ini memperbaiki kegagalan build awal akibat dua service membangun tag yang sama secara bersamaan.
- Endpoint `/api/health` ditambahkan agar healthcheck container tidak bergantung pada halaman mode-aware.
- Port lokal default `3001` (public) dan `3002` (private) dipilih agar tidak bertabrakan dengan development `next dev` di `3000`.
- Kredensial aplikasi per mode (public/private) belum ditambahkan karena merupakan scope T-003; saat ini service aplikasi hanya menerima `APP_MODE`.
- Pada host pengujian terdapat PostgreSQL host yang sudah berjalan di `127.0.0.1:5432`. Karena itu `nc` ke port 5432 berhasil, tetapi itu bukan container Compose; `docker port` dan `HostConfig.PortBindings` membuktikan container `db` tidak dipublikasikan.

## Masalah yang tersisa

- `scripts/verify.sh` belum tersedia; secret scan dan audit dependency formal belum dijalankan (scope T-007).
- Validasi environment per mode dan pemisahan kredensial aplikasi belum diimplementasikan (scope T-003).
- Role database `app_public`/`app_private` dan migrasi schema belum ada (scope T-004/T-005).
- Data sintetis `smoke_persistence` hanya berada pada volume development lokal dan tidak termasuk seed proyek.

## Hal untuk auditor

- Periksa `compose.yaml`: hanya `web-public` yang memiliki blok `build`; `web-private` memakai image tag yang sama; `db` tanpa `ports`; volume `postgres_data`; healthcheck.
- Periksa `.env.example` hanya berisi placeholder dummy.
- Periksa `src/app/api/health/route.ts` dan healthcheck aplikasi.
- Reproduksi:
  - `cp .env.example .env`
  - `docker compose config`
  - `docker compose build`
  - `docker compose up -d`
  - `docker compose ps`
  - `docker compose images`
  - uji route public/private dan silang melalui port `3001`/`3002`
  - uji persistensi data sintetis setelah `docker compose restart db`
  - `docker port dacie-beauty-dev-db-1` harus kosong

## Git

- Branch: `agent/T-002-dev-compose`
- SHA commit kode: `da5a520bfa863596e43d54f678881790285aeb0a`
- Commit: `feat(compose): add development stack for both app modes`
- Push: berhasil (branch `agent/T-002-dev-compose` ke origin)
- SHA laporan: (diisi setelah commit)