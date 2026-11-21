# Laporan T-001 — Bootstrap struktur aplikasi

## Ringkasan perubahan

Bootstrap satu codebase Next.js App Router + TypeScript untuk Dacie Beauty. Struktur awal mendukung `APP_MODE=public` dan `APP_MODE=private` dari image/codebase yang sama, dengan placeholder route per mode dan pemblokiran route mode silang pada level proxy (404). Ditambahkan konfigurasi TypeScript strict, ESLint, output standalone untuk Docker, Dockerfile, `.env.example`, dan README dengan instruksi install/development/build.

Versi Next.js yang digunakan: `16.4.6` (stabil, rilis bug-fix setelah rilis keamanan November 2026). Advisory resmi diperiksa pada 2026-11-21:
- https://nextjs.org/blog/november-2026-security-release (rilis keamanan 3 Nov 2026; versi patched 16.4.5/15.5.29)
- https://github.com/vercel/next.js/releases/tag/v16.4.6 (rilis 9 Nov 2026, backport bug fix, tidak menambah advisory baru)

Tidak ada implementasi booking, autentikasi, schema database final, atau desain visual final. Tidak ada GitHub Actions.

## Daftar file berubah

| File | Perubahan |
|---|---|
| `package.json` | Nama paket `dacie-beauty`; script `lint`, `typecheck`, `build`, `dev`, `start` |
| `package-lock.json` | Lockfile hasil `npm ci` (360 paket, 0 kerentanan) |
| `tsconfig.json` | TypeScript strict aktif |
| `next.config.ts` | `output: "standalone"`; konfigurasi Turbopack untuk Tailwind v4 |
| `eslint.config.mjs` | Konfigurasi ESLint Next.js core-web-vitals + TypeScript |
| `src/proxy.ts` | Guard mode: 404 untuk route mode silang (`/rekam` pada public, `/booking` pada private) |
| `src/instrumentation.ts` | Validasi startup `APP_MODE` |
| `src/lib/app-mode.ts` | Helper pembacaan mode aplikasi |
| `src/app/page.tsx` | Placeholder berbeda untuk mode public/private |
| `src/app/booking/page.tsx` | Placeholder route booking |
| `src/app/rekam/page.tsx` | Placeholder route rekam kulit |
| `src/app/layout.tsx` | Metadata dan `lang="id"` |
| `Dockerfile` | Satu image untuk kedua mode (standalone) |
| `.dockerignore` | Pengabaian file build/secret |
| `.env.example` | Contoh variabel environment (dummy) |
| `.gitignore` | Pengabaian node_modules, .next, .env (kecuali .env.example) |
| `README.md` | Instruksi install, development, build, Docker |
| `docs/reports/T-001-app-bootstrap.md` | Laporan task ini |

## Lingkungan dan sinkronisasi

- Branch: `agent/T-001-app-bootstrap`
- Branch dasar: `main`
- SHA dasar: `011607997859468334da7a29986135c4f8722c57`
- Working tree sebelum mulai: bersih
- Fetch/pull: `git fetch origin --prune`; `git switch main`; `git pull --ff-only origin main` berhasil; SHA lokal = `origin/main`
- SHA commit kode: `f828f92af9f7dea10a2c63895e75147db63db853`
- SHA laporan awal: `11ff3f5b8f71359419a5ea13a15aaf7355f8b81e`
- SHA perbaikan audit: `66d1425b7e1812fdac4a90b67ca3b6de2e4efdda`

## Perintah yang dijalankan

| Perintah | Hasil | Exit code |
|---|---|---:|
| `npm ci` | 360 paket terpasang, 0 kerentanan | 0 |
| `npx next typegen` | Route types generated | 0 |
| `npm run lint` | Tanpa error/warning | 0 |
| `npm run typecheck` | Tanpa error | 0 |
| `APP_MODE=public npm run build` | Build berhasil; route `/`, `/booking`, `/rekam` | 0 |
| `APP_MODE=private npm run build` | Build berhasil; route `/`, `/booking`, `/rekam` | 0 |
| `env -u APP_MODE npm run build` | Build berhasil tanpa APP_MODE; `/` menjadi dynamic (ƒ) | 0 |
| `./scripts/smoke-app-modes.sh` | Build + runtime public/private/invalid lulus | 0 |
| Runtime public: `/`, `/booking`, `/rekam` | 200, 200, 404 | 0 |
| Runtime private: `/`, `/rekam`, `/booking` | 200, 200, 404 | 0 |
| Runtime invalid: `/` | 500, log memuat error APP_MODE | 0 (proses gagal startup) |
| `scripts/verify.sh` | Tidak tersedia (task T-007 belum dikerjakan) | N/A |

## Hasil scripts/verify.sh

- Perintah: `scripts/verify.sh`
- Hasil: script belum tersedia pada repository (akan dibuat pada T-007).
- Exit code: N/A (tidak dijalankan)

## Kriteria penerimaan

- [x] Aplikasi dapat di-install dari lockfile — dibuktikan dengan `npm ci` exit code 0.
- [x] Perintah development dan build yang terdokumentasi berjalan — `npm run dev` tersedia; build public/private exit code 0.
- [x] TypeScript dan lint aktif tanpa mematikan aturan secara global — `npm run lint` dan `npm run typecheck` exit code 0; `tsconfig.json` strict true.
- [x] Kedua mode dapat dibangun dari codebase/image yang sama — build public dan private berhasil; Dockerfile satu image dengan `APP_MODE`.
- [x] Tidak ada rahasia atau file environment aktual yang dikomit — `.env` diabaikan; hanya `.env.example` dengan placeholder dummy; `git status` tidak memuat `.env`.
- [x] Struktur awal tidak mengunci aplikasi pada vendor hosting tertentu — tidak ada konfigurasi Vercel/Netlify; Docker standalone.
- [x] Versi Next.js stabil dan advisory resmi keamanan terbaru diverifikasi — Next.js 16.4.6; advisory November 2026 dan rilis 16.4.6 dicatat beserta URL dan tanggal pemeriksaan 2026-11-21.

## Keputusan atau asumsi

- Dipilih Next.js 16.4.6 (latest stable) karena memuat perbaikan keamanan November 2026 (16.4.5) plus bug fix 16.4.6.
- `cacheComponents` tidak diaktifkan untuk menghindari permukaan serangan advisory Cache Components; dapat diaktifkan pada task terkait bila diperlukan.
- Guard mode dilakukan di `src/proxy.ts` (pengganti middleware pada Next.js 16) dan divalidasi runtime.
- `.env.example` sengaja dilacak dengan pengecualian `.gitignore`.
- `scripts/verify.sh` belum dibuat karena merupakan scope T-007; verifikasi dilakukan dengan perintah langsung yang setara (lint, typecheck, build).

## Temuan audit dan perbaikan lanjutan

1. **Static rendering `/` membaca `APP_MODE`**
   - Temuan: halaman root memanggil `getAppMode()` dan pada build awal dapat ter-prerender statis sehingga mode terkunci saat build.
   - Perbaikan: tambah `export const dynamic = "force-dynamic"` pada `src/app/page.tsx`; bukti build menampilkan `/` sebagai `ƒ (Dynamic)`.
   - Pengujian: `env -u APP_MODE npm run build` berhasil (exit 0) dan smoke script lulus.

2. **Fallback invalid/missing `APP_MODE` pada proxy**
   - Temuan: `src/proxy.ts` mengembalikan `public` untuk mode tidak valid.
   - Perbaikan: proxy sekarang fail-closed (404 untuk semua route) jika `APP_MODE` bukan `public`/`private`.
   - Pengujian: runtime invalid mengembalikan HTTP 500 dari instrumentation dan log memuat error; proxy juga fail-closed. Smoke script lulus.

3. **Bukti pengujian kedua mode**
   - Ditambahkan `scripts/smoke-app-modes.sh` yang membangun dan menjalankan mode public, private, dan invalid, lalu memeriksa status HTTP dan konten.
   - Hasil: `ALL SMOKE CHECKS PASSED` (exit 0).

4. **Docker**
   - `Dockerfile` menggunakan satu image standalone; `CMD` memvalidasi `APP_MODE` sebelum menjalankan `node server.js`.
   - Docker tidak tersedia di lingkungan ini, sehingga build image tidak diuji; dicatat sebagai tidak terverifikasi.

## Masalah yang tersisa

- Docker tidak tersedia di lingkungan ini, sehingga build image Docker tidak dapat diuji lokal. Dockerfile ditulis sesuai pola standalone Next.js.
- `scripts/verify.sh` belum tersedia; verifikasi penuh akan dilakukan setelah T-007.
- Host guard allowlist hostname (lapisan kedua) belum diimplementasikan; baru guard path berbasis mode. Hostname guard akan ditambahkan pada task konfigurasi environment/host (T-003 atau terkait).

## Hal untuk auditor

- Periksa `src/proxy.ts` untuk pemblokiran route mode silang.
- Periksa `Dockerfile` dan `next.config.ts` (`output: "standalone"`) untuk portabilitas.
- Periksa `.env.example` tidak berisi nilai sebenarnya.
- Periksa tidak ada file `.github/workflows`.

## Git

- Branch: `agent/T-001-app-bootstrap`
- SHA kode: `f828f92af9f7dea10a2c63895e75147db63db853`
- Commit: `feat(app): bootstrap Next.js App Router structure`
- Push: berhasil (branch `agent/T-001-app-bootstrap` ke origin)