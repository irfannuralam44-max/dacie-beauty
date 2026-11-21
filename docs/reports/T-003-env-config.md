# Laporan T-003 — Konfigurasi environment dan validasi server

## Ringkasan perubahan

Ditambahkan modul validasi environment server terpusat (`src/lib/env/schema.ts` dan `src/lib/env/server.ts`) yang memvalidasi `APP_MODE` dan variabel wajib berdasarkan mode. Modul pembacaan `process.env` ditandai `server-only` agar tidak masuk ke client bundle. `instrumentation.ts` menjalankan validasi saat startup (dilewati pada fase build agar satu build tetap dapat melayani kedua mode). `src/lib/app-mode.ts` diarahkan ke parser terpusat. `/api/health` mengembalikan 503 bila konfigurasi tidak sah.

Mode public hanya menerima `APP_PUBLIC_DATABASE_URL` dan `CAPTCHA_SECRET`; gagal startup jika `APP_PRIVATE_DATABASE_URL` atau `SESSION_SECRET` berisi nilai. Mode private hanya menerima `APP_PRIVATE_DATABASE_URL` dan `SESSION_SECRET`; gagal startup jika `APP_PUBLIC_DATABASE_URL` atau `CAPTCHA_SECRET` berisi nilai. Variabel wajib yang hilang/kosong, `APP_MODE` tidak valid, atau DSN PostgreSQL yang salah format menggagalkan startup. Pesan error hanya memuat nama variabel dan aturan, tidak pernah nilainya.

`.env.example`, README, dan Compose diperbarui dengan nama variabel dan placeholder dummy. Compose memberikan variabel mode yang sesuai ke masing-masing service; `web-public` tidak menerima credential/secret privat. Ditambahkan 24 unit test konfigurasi valid/hilang/salah format/pencampuran secret. `npm test` ditambahkan.

## Daftar file berubah

| File | Perubahan |
|---|---|
| `src/lib/env/schema.ts` | Schema/validasi murni: `parseAppMode`, `parseServerEnv`, `EnvValidationError`, aturan required/forbidden/format/secret |
| `src/lib/env/server.ts` | Pembacaan `process.env` bertanda `server-only`, cache, `getServerEnv`, `assertServerEnv` |
| `src/lib/env/schema.test.ts` | 24 unit test konfigurasi valid, hilang, salah format, pencampuran secret, guard source |
| `src/lib/app-mode.ts` | Membaca `APP_MODE` melalui parser terpusat |
| `src/instrumentation.ts` | Validasi startup per runtime Node, dilewati pada fase build; `process.exit(1)` bila tidak sah |
| `src/app/api/health/route.ts` | Health 503 bila konfigurasi tidak sah (tanpa detail) |
| `compose.yaml` | Variabel mode diberikan per service (`APP_PUBLIC_DATABASE_URL`, `CAPTCHA_SECRET` ke public; `APP_PRIVATE_DATABASE_URL`, `SESSION_SECRET` ke private) |
| `.env.example` | Placeholder dummy untuk variabel baru dan kredensial PostgreSQL |
| `README.md` | Tabel variabel, aturan pemisahan, petunjuk local dev, troubleshooting, `npm test` |
| `package.json` | Script `test` |
| `tsconfig.json` | `allowImportingTsExtensions` untuk test |
| `scripts/smoke-app-modes.sh` | Menyediakan dummy env per mode; uji startup fail-closed (invalid, missing, forbidden) |
| `docs/reports/T-003-env-config.md` | Laporan task ini |

## Lingkungan dan sinkronisasi

- Branch: `agent/T-003-env-config`
- Branch dasar: `main`
- SHA dasar: `44a38a90ca40683c58034761b9069f7f77479c55`
- Working tree sebelum mulai: bersih (setelah sync fast-forward dari `origin/main`)
- Fetch: `git fetch origin --prune` berhasil; `origin/main` = `44a38a90ca40683c58034761b9069f7f77479c55`
- SHA commit implementasi: `ca1be35638c6e455f7fe4d39b9c1b07684ba97fa`
- Docker Engine: `29.1.3`; Docker Compose: `2.40.3+ds1-0ubuntu1~24.04.1`
- Node.js: `v24.22.2`
- `scripts/verify.sh`: belum tersedia (scope T-007)

## Perintah yang dijalankan

| Perintah | Hasil | Exit code |
|---|---|---:|
| `git fetch origin --prune` | `origin/main` = `44a38a9` | 0 |
| `git switch main && git pull --ff-only origin main` | Fast-forward ke `44a38a9` | 0 |
| `git switch -c agent/T-003-env-config origin/agent/T-003-env-config` | Branch dibuat dari `44a38a9` | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | Tanpa error | 0 |
| `npm test` | 24/24 lulus | 0 |
| `env -u APP_MODE npm run build` | Build berhasil; satu build untuk kedua mode | 0 |
| Pemeriksaan client bundle | Sentinel dummy tidak ditemukan di `.next/static` | 0 (grep tidak menemukan) |
| `./scripts/smoke-app-modes.sh` | Public/private valid lulus; invalid, missing, forbidden fail-closed | 0 |
| `docker compose config` | Valid; service db, web-public, web-private | 0 |
| `docker compose build` | Build berhasil; image `dacie-beauty:dev` | 0 |
| `docker compose up -d` | Semua service healthy | 0 |
| `docker compose ps` | `db`, `web-public`, `web-private` healthy | 0 |
| `docker compose images` | Kedua service aplikasi memakai image ID `e1fc9338a1d9` | 0 |
| Uji route runtime | Public `/booking` 200, `/rekam` 404; private `/rekam` 200, `/booking` 404 | 0 |
| Uji env per service | Public: `APP_PRIVATE_DATABASE_URL`, `SESSION_SECRET` ABSENT; private: `APP_PUBLIC_DATABASE_URL`, `CAPTCHA_SECRET` ABSENT | 0 |
| Uji startup gagal (Docker) | Container keluar dengan kode 1 dan pesan aman | 1 (exit code proses) |
| Uji port binding DB | `HostConfig.PortBindings = {}`; tidak dipublikasikan | 0 |
| Uji persistensi DB | Data sintetis tetap ada setelah `docker compose restart db` | 0 |
| `git diff --check` | Tidak ada whitespace error | 0 |
| `scripts/verify.sh` | Tidak tersedia | N/A |

## Hasil scripts/verify.sh

- Perintah: `scripts/verify.sh`
- Hasil: **tidak tersedia** (scope T-007). Tidak dijalankan.
- Exit code: N/A
- Secret scan formal: tidak tersedia/tidak dijalankan (menunggu T-007); tidak diklaim lulus.
- Audit dependency formal: tidak tersedia/tidak dijalankan (menunggu T-007); tidak diklaim lulus.
- Bukti pengganti yang benar-benar dijalankan: `npm run lint`, `npm run typecheck`, `npm test`, build aplikasi, smoke test, pengujian Docker Compose, dan `git diff --check`. Bukti tersebut bukan pengganti `scripts/verify.sh`.

## Kriteria penerimaan

1. **Variabel wajib divalidasi saat startup** — **LULUS.** `instrumentation.ts` memanggil `assertServerEnv()` pada runtime Node (dilewati saat build); uji startup gagal menunjukkan proses keluar kode 1 dengan pesan `Invalid server environment configuration`.
2. **`APP_MODE` hanya menerima `public` atau `private`** — **LULUS.** `parseAppMode` menolak nilai lain; unit test dan smoke test invalid mode lulus.
3. **Mode public hanya menerima credential `app_public` dan secret CAPTCHA** — **LULUS.** Public membutuhkan `APP_PUBLIC_DATABASE_URL` dan `CAPTCHA_SECRET`; pemeriksaan runtime menunjukkan keduanya PRESENT pada `web-public`.
4. **Mode public gagal startup jika ada credential/secret privat** — **LULUS.** Unit test dan smoke test `forbidden-public` lulus; Docker startup test keluar kode 1 dengan pesan aman.
5. **Mode private hanya menerima credential `app_private` dan secret sesi** — **LULUS.** Private membutuhkan `APP_PRIVATE_DATABASE_URL` dan `SESSION_SECRET`; pemeriksaan runtime menunjukkan keduanya PRESENT pada `web-private`.
6. **Secret tidak masuk ke client bundle** — **LULUS (bukti statis dan build).** `server.ts` memakai `import "server-only"`; unit test source guard lulus; grep sentinel dummy pada `.next/static` tidak ditemukan; tidak ada variabel `NEXT_PUBLIC_` secret.
7. **Error tidak mencetak nilai secret** — **LULUS.** Unit test `validation errors never include secret values` lulus; pemeriksaan log startup menunjukkan hanya nama variabel; sentinel secret tidak muncul.
8. **`.env.example` hanya berisi placeholder dummy** — **LULUS.** Semua nilai adalah dummy (`change-me-local-only`, `dacie_dev`, DSN dummy); tidak ada secret nyata.
9. **Unit test mencakup konfigurasi valid, hilang, dan salah format** — **LULUS.** 24/24 lulus: valid public/private, missing required, invalid `APP_MODE`, DSN protocol/malformed/credential/name, secret terlalu pendek, pencampuran secret antar-mode, empty forbidden, guard source.
10. **Laporan menyebutkan bukti dan hal yang belum terverifikasi** — **LULUS.** Bagian perintah, `scripts/verify.sh`, dan masalah tersisa mendokumentasikan hal yang belum terverifikasi.

## Keputusan atau asumsi

- Nama variabel koneksi: `APP_PUBLIC_DATABASE_URL` dan `APP_PRIVATE_DATABASE_URL` (DSN role aplikasi), `CAPTCHA_SECRET`, `SESSION_SECRET`. Nama ini menjadi konvensi untuk task berikutnya (T-006).
- Validasi DSN mensyaratkan protokol `postgres://`/`postgresql://`, username, password, dan nama database; validasi format saja, bukan konektivitas.
- Panjang minimum secret ditetapkan 32 karakter (berlaku untuk `CAPTCHA_SECRET` dan `SESSION_SECRET`).
- Variabel infrastruktur `POSTGRES_*` tidak dimasukkan ke daftar terlarang karena bukan kredensial aplikasi per mode dan tidak diberikan ke container aplikasi oleh Compose. Compose tidak meneruskan `POSTGRES_*` ke `web-public`/`web-private`.
- `APP_MODE` wajib tepat `public`/`private` (case-sensitive); whitespace tidak diterima.
- Validasi dilewati pada `NEXT_PHASE=phase-production-build` agar satu build tetap dapat melayani kedua mode (sesuai T-001).
- `process.exit(1)` dipanggil saat validasi gagal agar startup benar-benar gagal, bukan hanya mengembalikan HTTP 500.
- Health endpoint mengembalikan 503 tanpa detail bila konfigurasi tidak sah.
- Tidak ada dependency eksternal baru; penanda `server-only` disediakan Next.js pada tingkat compiler.
- `allowImportingTsExtensions` ditambahkan ke `tsconfig.json` agar unit test dapat mengimpor modul `.ts` secara eksplisit saat dijalankan dengan Node.
- `.env.example` menyertakan variabel kedua mode (komentar pemisahan); untuk local dev, sisakan hanya variabel mode yang dipakai agar validasi tidak gagal akibat pencampuran.

## Masalah yang tersisa

- `scripts/verify.sh` belum tersedia; secret scan formal dan audit dependency formal belum dijalankan (scope T-007).
- Role database `app_public`/`app_private` dan migrasi schema belum ada (scope T-004/T-005); DSN pada `.env.example`/Compose menunjuk role yang belum dibuat, tetapi aplikasi hanya memvalidasi format, bukan konektivitas.
- Data-access layer (T-006) belum memakai `getServerEnv()` untuk memilih pool; saat ini hanya validasi.
- Build lokal yang berjalan bersama `.env` Compose (berisi variabel kedua mode) akan gagal startup pada mode public/private karena pencampuran; README mendokumentasikan pemisahan. Script smoke menangani ini dengan rename sementara `.env`.

## Hal untuk auditor

- Periksa `src/lib/env/schema.ts` (aturan required/forbidden/format/secret) dan `src/lib/env/server.ts` (`import "server-only"`).
- Periksa `src/instrumentation.ts` (validasi startup, build phase skip, `process.exit(1)`).
- Periksa `compose.yaml` (variabel mode per service; public tidak menerima private).
- Periksa `.env.example` (hanya placeholder dummy).
- Reproduksi:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `env -u APP_MODE npm run build`
  - `./scripts/smoke-app-modes.sh`
  - `docker compose config`, `docker compose build`, `docker compose up -d`, `docker compose ps`, `docker compose images`
  - uji route public/private dan silang melalui port `3001`/`3002`
  - uji startup gagal: `docker run --rm -e APP_MODE=public -e APP_PUBLIC_DATABASE_URL=... dacie-beauty:dev` harus keluar kode 1
  - `docker port dacie-beauty-dev-db-1` harus kosong

## Git

- Branch: `agent/T-003-env-config`
- SHA commit implementasi: `ca1be35638c6e455f7fe4d39b9c1b07684ba97fa`
- Commit implementasi: `feat(env): centralize and validate server environment config`
- SHA commit laporan: `ca9d3203f6d8c338a40af775cffa5d50b4f85f85`
- Push: berhasil (branch `agent/T-003-env-config` ke origin)
