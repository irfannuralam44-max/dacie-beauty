# Skill: git-sync-and-branch

## Tujuan
Menjamin setiap task dimulai dari `main` yang tersinkronisasi dan dikerjakan pada branch task tersendiri tanpa mengganggu pekerjaan lain.

## Kapan dipakai
Wajib dipakai sebelum memulai setiap task yang mengubah repository, termasuk perubahan kode, migrasi, test, konfigurasi, dan dokumentasi task.

## Prasyarat
- Baca `AGENTS.md`, `docs/PRD.md`, dan task yang diberikan.
- Ketahui nomor dan slug task, misalnya `T-012-booking-slot-api`.
- Remote utama bernama `origin`, kecuali dokumentasi repository menyatakan berbeda.

## Langkah

1. Periksa lokasi repository dan branch aktif:
   ```bash
   pwd
   git remote -v
   git branch --show-current
   git status --short
   ```
2. Jika working tree tidak bersih, berhenti. Jangan stash, reset, clean, atau menghapus perubahan tanpa izin pemilik.
3. Ambil informasi remote:
   ```bash
   git fetch origin --prune
   ```
4. Pindah ke main dan fast-forward:
   ```bash
   git switch main
   git pull --ff-only origin main
   ```
5. Pastikan working tree bersih dan main lokal sama dengan origin/main:
   ```bash
   git status --short
   git rev-parse HEAD
   git rev-parse origin/main
   ```
   Kedua SHA harus sama.
6. Buat branch baru:
   ```bash
   git switch -c agent/T-XXX-slug
   ```
7. Catat branch dasar, SHA awal, hasil fetch/pull, dan status working tree pada laporan task.
8. Pastikan nama branch sesuai pola `agent/T-XXX-slug`. Jangan memakai branch `main`.

## Jika terjadi masalah
- Pull fast-forward gagal atau main divergen: berhenti dan laporkan; jangan merge atau rebase main.
- Branch sudah ada: jangan menimpa; periksa dan minta arahan.
- Remote tidak sesuai atau repository tidak dikenal: berhenti.
- Ada perubahan lokal tak dikenal: jangan menghapusnya.

## Contoh

Task: `T-012-booking-slot-api`

```bash
git fetch origin --prune
git status --short
git switch main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
git rev-parse origin/main
git switch -c agent/T-012-booking-slot-api
```

## Batasan
- Jangan push ke `main`.
- Jangan force push.
- Jangan menjalankan `git reset --hard` atau `git clean -fd`.
- Jangan menyelesaikan konflik sinkronisasi dengan menebak.
- Setelah task selesai, ikuti prosedur sebelum push pada `AGENTS.md`.
