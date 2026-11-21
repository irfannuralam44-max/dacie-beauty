# Dacie Beauty

Aplikasi operasional Dacie Beauty: booking publik dan rekam kulit privat dalam satu codebase Next.js.

Dokumentasi spesifikasi dan arsitektur berada di `docs/PRD.md`. Instruksi kerja agent berada di `AGENTS.md`.

## Prasyarat

- Node.js LTS (disarankan versi yang dipakai proyek: lihat `package.json`).
- npm (package manager yang dipilih repository).

## Instalasi

```bash
npm ci
```

## Konfigurasi environment

Salin contoh konfigurasi:

```bash
cp .env.example .env.local
```

Atur `APP_MODE` ke `public` atau `private`. Jangan commit `.env` atau nilai secret.

## Development

Mode publik:

```bash
APP_MODE=public npm run dev
```

Mode privat:

```bash
APP_MODE=private npm run dev
```

Aplikasi tersedia di `http://localhost:3000`.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
```

## Build

Mode publik:

```bash
APP_MODE=public npm run build
```

Mode privat:

```bash
APP_MODE=private npm run build
```

Jalankan hasil build:

```bash
APP_MODE=public npm run start
```

## Docker

Image yang sama dapat dijalankan untuk kedua mode:

```bash
docker build -t dacie-beauty .
docker run --rm -p 3000:3000 -e APP_MODE=public dacie-beauty
docker run --rm -p 3000:3000 -e APP_MODE=private dacie-beauty
```

## Struktur

- `src/app` — route dan layout Next.js App Router.
- `src/lib` — modul server/shared.
- `docs` — dokumentasi, audit, laporan task.
- `skills` — panduan kerja agent.