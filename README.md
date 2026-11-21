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

## Docker Compose development

Lingkungan development menjalankan `web-public`, `web-private`, dan PostgreSQL dari satu image aplikasi.

### Konfigurasi

```bash
cp .env.example .env
```

Sesuaikan nilai dummy di `.env` untuk lingkungan lokal. Jangan commit `.env` atau secret nyata. Variabel yang dipakai Compose:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — kredensial PostgreSQL lokal.
- `WEB_PUBLIC_PORT` — port lokal `web-public` (default `3001`).
- `WEB_PRIVATE_PORT` — port lokal `web-private` (default `3002`).

Periksa konfigurasi Compose tanpa menjalankan service:

```bash
docker compose config
```

### Build dan start

```bash
docker compose build
docker compose up -d
```

Akses:

- Public: `http://127.0.0.1:3001`
- Private: `http://127.0.0.1:3002`

Kedua service memakai image `dacie-beauty:dev` yang sama, dengan `APP_MODE` berbeda. PostgreSQL hanya berada di jaringan Compose dan tidak dipublikasikan ke host.

### Status, log, dan stop

```bash
docker compose ps
docker compose images
docker compose logs -f
docker compose stop
docker compose down
```

`docker compose ps` menampilkan status kesehatan; `docker compose images` dapat dipakai untuk memastikan kedua service aplikasi memakai image ID yang sama.

Hentikan dan hapus volume database hanya jika memang ingin menghapus data lokal:

```bash
docker compose down -v
```

### Uji persistensi database

Masukkan data sintetis, restart container database, lalu periksa kembali:

```bash
docker compose exec db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE TABLE IF NOT EXISTS smoke_persistence (id integer primary key, note text); INSERT INTO smoke_persistence (id, note) VALUES (1, '\''synthetic-test'\'') ON CONFLICT (id) DO NOTHING;"'
docker compose restart db
docker compose exec db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM smoke_persistence;"'
```

### Troubleshooting dasar

- `POSTGRES_* is required`: pastikan `.env` sudah dibuat dari `.env.example`.
- Port sudah dipakai: ubah `WEB_PUBLIC_PORT` atau `WEB_PRIVATE_PORT` di `.env`.
- Service belum sehat: periksa `docker compose ps` dan `docker compose logs db`.
- Aplikasi gagal start: pastikan `APP_MODE` service bernilai `public` atau `private`.
- Data ingin direset total: `docker compose down -v` (menghapus volume `postgres_data`).

## Struktur

- `src/app` — route dan layout Next.js App Router.
- `src/lib` — modul server/shared.
- `docs` — dokumentasi, audit, laporan task.
- `skills` — panduan kerja agent.