# Laporan T-002 — Docker Compose development

## Ringkasan perubahan

Menambahkan lingkungan development Docker Compose dengan tiga service: `web-public` (`APP_MODE=public`), `web-private` (`APP_MODE=private`), dan PostgreSQL. Kedua service aplikasi memakai image `dacie-beauty:dev` yang sama dari `Dockerfile` yang sama. PostgreSQL memakai named volume `postgres_data`, healthcheck `pg_isready`, dan tidak mempublikasikan port ke host. Port aplikasi diikat ke `127.0.0.1` (`3001`/`3002`).

Ditambahkan endpoint health ringan `/api/health` untuk healthcheck container, pembaruan `.env.example` dengan placeholder dummy, dan README berisi instruksi konfigurasi, build, start, stop, status, log, persistensi, dan troubleshooting.

**Docker tidak tersedia di lingkungan ini.** Build image, `docker compose config`, menjalankan stack, healthcheck container, dan uji persistensi volume **tidak terverifikasi**. Bukti alternatif yang dijalankan adalah validasi YAML, inspeksi konfigurasi Compose, build aplikasi tanpa `APP_MODE`, dan smoke test runtime aplikasi untuk kedua mode.

## Daftar file berubah

| File | Perubahan |
|---|---|
| `compose.yaml` | Service `db`, `web-public`, `web-private`; image sama; named volume; healthcheck; port lokal |
| `.env.example` | Placeholder dummy kredensial PostgreSQL lokal dan port aplikasi |
| `README.md` | Instruksi Compose: konfigurasi, build, start, status, log, stop, persistensi, troubleshooting |
| `src/app/api/health/route.ts` | Endpoint health `GET /api/health` untuk healthcheck container |
| `scripts/smoke-app-modes.sh` | Assertion tambahan untuk `/api/health` pada kedua mode |
| `docs/reports/T-002-dev-compose.md` | Laporan task ini |

## Lingkungan dan sinkronisasi

- Branch: `agent/T-002-dev-compose`
- Branch dasar: `main`
- SHA dasar: `965729e9391132a0c5a6a27014e1aab81660a8ff` (merge T-001)
- Working tree sebelum mulai: bersih pada `main`; perubahan T-002 kemudian dipindahkan ke branch task
- Fetch/pull: `git fetch origin --prune` berhasil; `origin/main` = `965729e9391132a0c5a6a27014e1aab81660a8ff`
- Branch dibuat dari `origin/main`; `HEAD` awal branch = `965729e9391132a0c5a6a27014e1aab81660a8ff`
- SHA commit kode: `da5a520bfa863596e43d54f678881790285aeb0a`

## Perintah yang dijalankan

| Perintah | Hasil | Exit code |
|---|---|---:|
| `git fetch origin --prune` | `origin/main` diperbarui ke `965729e` | 0 |
| `git merge-base --is-ancestor 965729e origin/main` | T-001 merge terdeteksi | 0 |
| `docker --version` | `docker: command not found` | 127 |
| `docker compose version` | `docker: command not found` | 127 |
| `python3 -c "import yaml; yaml.safe_load(open('compose.yaml'))"` | YAML valid; service `db`, `web-private`, `web-public` | 0 |
| Inspeksi Compose via Python | Image sama, APP_MODE berbeda, db tanpa port, port app `127.0.0.1` | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | Tanpa error | 0 |
| `env -u APP_MODE npm run build` | Build berhasil; `/` dan `/api/health` dynamic | 0 |
| `./scripts/smoke-app-modes.sh` | Public/private/invalid lulus; termasuk `/api/health` 200 | 0 |
| `test -x scripts/verify.sh` | Script belum tersedia | 1 |
| `git diff --check` | Tidak ada whitespace error | 0 |

Perintah Docker yang **tidak dapat dijalankan**: `docker compose config`, `docker compose build`, `docker compose up -d`, `docker compose ps`, `docker compose images`, uji route melalui container, dan uji persistensi volume.

## Hasil scripts/verify.sh

- Perintah: `scripts/verify.sh`
- Hasil: script belum tersedia pada branch dasar (scope T-007).
- Exit code: N/A (tidak dijalankan)

## Kriteria penerimaan

1. **`web-public`, `web-private`, dan PostgreSQL dapat dijalankan melalui instruksi README** — **Tidak terverifikasi.** Instruksi dan konfigurasi tersedia, tetapi Docker tidak tersedia sehingga stack tidak dijalankan.
2. **Kedua service aplikasi memakai image yang sama** — **Terbukti pada konfigurasi, tidak terverifikasi runtime.** `compose.yaml` menetapkan `image: dacie-beauty:dev` dan build context yang sama untuk kedua service. Pemeriksaan image ID runtime belum dilakukan.
3. **`APP_MODE` public dan private berbeda pada runtime** — **Terbukti pada konfigurasi, tidak terverifikasi runtime container.** Compose menetapkan `APP_MODE: public` dan `APP_MODE: private`; smoke test lokal membuktikan aplikasi merespons berbeda untuk kedua nilai.
4. **PostgreSQL memakai named volume dan data bertahan setelah restart** — **Tidak terverifikasi.** `compose.yaml` mendefinisikan volume `postgres_data:/var/lib/postgresql/data`; uji restart container belum dijalankan karena Docker tidak tersedia.
5. **Kredensial lokal berasal dari environment, bukan hardcoded** — **Terbukti pada konfigurasi.** `db` memakai `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${POSTGRES_DB}`; `.env.example` hanya berisi placeholder dummy.
6. **Environment `web-public` tidak berisi credential/secret privat** — **Terbukti pada konfigurasi.** `web-public.environment` hanya berisi `APP_MODE: public`; tidak ada `POSTGRES_*`, `SESSION_SECRET`, atau kredensial privat.
7. **Healthcheck membedakan service siap dan belum siap** — **Sebagian terverifikasi.** `db` memakai `pg_isready`; aplikasi memakai `/api/health` dengan `start_period`/`retries`. Endpoint `/api/health` diuji lokal dan mengembalikan HTTP 200. Healthcheck container belum diuji karena Docker tidak tersedia.
8. **PostgreSQL tidak mengekspos port ke jaringan publik** — **Terbukti pada konfigurasi.** Service `db` tidak memiliki `ports`; hanya berada pada network Compose `internal`.
9. **Port aplikasi hanya tersedia lokal** — **Terbukti pada konfigurasi.** Port dipetakan sebagai `127.0.0.1:${WEB_PUBLIC_PORT:-3001}:3000` dan `127.0.0.1:${WEB_PRIVATE_PORT:-3002}:3000`.
10. **Route silang tetap ditolak** — **Terbukti lewat smoke test lokal.** Public: `/rekam` → 404; private: `/booking` → 404; `/api/health` → 200 pada kedua mode.
11. **Tidak ada secret atau data pelanggan nyata** — **Terbukti.** Tidak ada `.env` aktual yang dilacak; `.env.example` hanya placeholder dummy; tidak ada data pelanggan pada perubahan.

## Keputusan atau asumsi

- PostgreSQL memakai `postgres:17-alpine`. Keberadaan tag diverifikasi melalui Docker Hub API pada 2026-11-21; image belum di-pull karena Docker tidak tersedia.
- Aplikasi belum membutuhkan database saat startup, tetapi kedua service tetap diberi `depends_on: db: condition: service_healthy` agar urutan kesiapan database sudah benar untuk task berikutnya.
- Endpoint `/api/health` ditambahkan agar healthcheck container tidak bergantung pada halaman mode-aware.
- Port lokal default `3001` (public) dan `3002` (private) dipilih agar tidak bertabrakan dengan development `next dev` di `3000`.
- Kredensial aplikasi per mode (public/private) belum ditambahkan karena merupakan scope T-003; saat ini service aplikasi hanya menerima `APP_MODE`.

## Masalah yang tersisa

- Docker tidak tersedia; seluruh pengujian container (config, build, up, health, image ID, route melalui container, persistensi volume) belum terverifikasi.
- `scripts/verify.sh` belum tersedia; secret scan dan audit dependency formal belum dijalankan (scope T-007).
- Validasi environment per mode dan pemisahan kredensial aplikasi belum diimplementasikan (scope T-003).
- Role database `app_public`/`app_private` dan migrasi schema belum ada (scope T-004/T-005).

## Hal untuk auditor

- Periksa `compose.yaml`: image yang sama untuk kedua service, `APP_MODE` berbeda, `db` tanpa `ports`, volume `postgres_data`, dan healthcheck.
- Periksa `.env.example` hanya berisi placeholder dummy.
- Periksa `src/app/api/health/route.ts` dan healthcheck aplikasi.
- Jalankan pengujian Docker yang belum terverifikasi pada lingkungan yang memiliki Docker:
  - `docker compose config`
  - `docker compose build`
  - `docker compose up -d`
  - `docker compose ps`
  - `docker compose images`
  - uji route public/private dan silang melalui port `3001`/`3002`
  - uji persistensi data sintetis setelah `docker compose restart db`

## Git

- Branch: `agent/T-002-dev-compose`
- SHA commit kode: `da5a520bfa863596e43d54f678881790285aeb0a`
- Commit: `feat(compose): add development stack for both app modes`
- Push: (akan diisi setelah push)