# Skill: local-verify

## Tujuan
Menjalankan verifikasi kualitas dan keamanan secara lokal dengan hasil yang dapat direproduksi.

## Kapan dipakai
Wajib sebelum setiap push dan setiap kali perubahan menyentuh kode, dependency, migrasi, test, konfigurasi, atau dokumentasi yang memengaruhi prosedur verifikasi.

## Prasyarat
- Baca `AGENTS.md`.
- Periksa README dan script yang benar-benar ada.
- Docker dan dependency lokal tersedia sesuai dokumentasi proyek.
- Gunakan hanya data sintetis.

## Langkah

1. Periksa perubahan:
   ```bash
   git status --short
   git diff --check
   ```
2. Pastikan environment menggunakan konfigurasi lokal/dummy. Jangan menampilkan isi `.env` atau secret.
3. Jalankan PostgreSQL melalui Docker Compose sesuai dokumentasi repo.
4. Terapkan migrasi sesuai prosedur repository.
5. Jalankan test unit dan integration yang relevan.
6. Jalankan test E2E yang diwajibkan untuk task terkait.
7. Jalankan entry point utama:
   ```bash
   scripts/verify.sh
   ```
8. Catat perintah, hasil, dan exit code dalam laporan.
9. Periksa perubahan dan status akhir:
   ```bash
   git diff --check
   git status --short
   git diff --stat
   ```
10. Jika ada tahap gagal, jangan menyamarkan atau melewatinya. Perbaiki penyebab atau laporkan blocker.

## Persyaratan scripts/verify.sh
Script repo harus menjadi satu entry point lokal yang menjalankan tahap wajib yang telah dikonfigurasi:
- lint;
- unit test;
- integration test dengan PostgreSQL Docker;
- typecheck/build check yang dipilih;
- pemindaian secret lokal, misalnya Gitleaks.

Script harus gagal dengan exit code non-zero jika tahap wajib gagal. Jangan mengarang nama subcommand; baca implementasi script dan package manifest.

## Pemeriksaan keamanan minimum
Pastikan suite mencakup, sesuai fase:
- role `app_public` ditolak saat mengakses `records`;
- fungsi slot publik tidak mengembalikan nama/kontak;
- route privat menolak tanpa sesi;
- route privat tidak dilayani pada hostname booking;
- sesi kedaluwarsa/logout;
- konflik booking bersamaan;
- audit log untuk view dan update;
- consent sebelum pencatatan data kulit.

## Jika tool tidak tersedia
- Jangan menyatakan test lulus.
- Catat tool atau service yang tidak tersedia, perintah yang gagal, dan exit code.
- Jangan mengganti PostgreSQL nyata dengan mock untuk mengklaim pembuktian privilege database.
- Jangan menghapus test untuk membuat script hijau.

## Contoh

```bash
docker compose up -d db
# Jalankan migrasi sesuai instruksi repository.
scripts/verify.sh
git diff --check
```

Perintah di atas adalah pola; nama service dan perintah migrasi harus disesuaikan dengan file aktual di repo.

## Batasan
Semua verifikasi dilakukan lokal. Dilarang menambahkan GitHub Actions atau CI jarak jauh.
