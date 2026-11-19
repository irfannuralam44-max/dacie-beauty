# Skill: postgres-migrations-and-roles

## Tujuan
Mengelola skema, migrasi, role, dan privilege PostgreSQL secara dapat diaudit dengan pemisahan booking dan records yang ketat.

## Kapan dipakai
Wajib untuk setiap task yang menambah/mengubah tabel, kolom, index, constraint, function, trigger, role, grant, revoke, seed, atau koneksi database.

## Prinsip wajib

- Skema `booking`: data booking operasional.
- Skema `records`: data kulit/kesehatan dan akun internal.
- `app_public`: hak minimum untuk membuat booking dan menjalankan fungsi slot yang disetujui; tidak memiliki akses apa pun ke `records`.
- `app_private`: akses area privat, termasuk records dan pembacaan booking sesuai kebutuhan.
- Jangan memakai superuser sebagai runtime role.
- Jangan memberi hak ke `PUBLIC` tanpa alasan yang eksplisit dan ditinjau.
- Jangan mengurangi entitas model data yang ditetapkan PRD.

## Langkah migrasi

1. Baca PRD, migrasi yang ada, dan status database lokal.
2. Pastikan working tree dan branch mengikuti `AGENTS.md`.
3. Buat migration file baru yang berurutan sesuai konvensi repo. Jangan mengedit migration yang sudah diterapkan pada lingkungan bersama kecuali prosedur repo secara eksplisit mengizinkan.
4. Tulis DDL secara eksplisit dan gunakan transaksi bila didukung operasi yang dilakukan.
5. Tentukan owner objek, schema usage, table privileges, sequence privileges, function execute privileges, dan default privileges.
6. Revoke hak yang tidak diperlukan dari `PUBLIC` dan role runtime.
7. Berikan hanya grant yang diperlukan untuk use case task.
8. Untuk fungsi publik:
   - output minimum;
   - tidak mengembalikan nama/kontak;
   - validasi argumen dan rentang waktu;
   - pertimbangkan keamanan `search_path`;
   - jika `SECURITY DEFINER`, gunakan owner terbatas dan grant EXECUTE minimum.
9. Tambahkan test privilege yang memakai koneksi sebagai role `app_public`, bukan sekadar memeriksa katalog dengan superuser.
10. Jalankan migrasi dari database kosong dan, bila relevan, dari versi migrasi sebelumnya.
11. Jalankan test integrasi terhadap PostgreSQL Docker dan `scripts/verify.sh`.
12. Catat hasil serta risiko migrasi dalam laporan.

## Pencegahan tabrakan booking

Untuk booking, constraint database harus mencegah dua booking yang saling tumpang tindih untuk provider yang sama. Pilih mekanisme setelah memeriksa dukungan versi PostgreSQL yang dipakai dan kebutuhan extension. Jangan menganggap pemeriksaan availability di aplikasi cukup.

Uji dengan dua transaksi/request bersamaan. Hasil yang benar: paling banyak satu booking aktif yang saling bertabrakan berhasil.

## Penggunaan role

- Pool publik hanya dibuat dari credential `app_public`.
- Pool privat hanya dibuat dari credential `app_private`.
- Jangan membuat helper generik yang memungkinkan request memilih nama role atau pool.
- Jangan mengimpor koneksi privat dari modul yang dapat dipanggil route publik.
- Jangan memberikan akses SELECT tabel konfigurasi kepada role publik tanpa keputusan eksplisit. Jika halaman publik memerlukan data treatment/jam kerja, eskalasi kontrak fungsi pembacaan konfigurasi non-sensitif sesuai Catatan keberatan PRD.

## Contoh pemeriksaan privilege

Contoh konseptual; gunakan nama service dan environment lokal sesuai repo:

```sql
SET ROLE app_public;
SELECT * FROM records.customers;
-- Harus gagal karena privilege ditolak.
RESET ROLE;
```

Test harus memakai kredensial koneksi role publik yang sebenarnya jika memungkinkan, bukan hanya `SET ROLE` oleh superuser, agar konfigurasi login/role ikut diuji.

## Data uji
- Seeder hanya menghasilkan data sintetis.
- Jangan memakai nomor telepon pelanggan nyata.
- Jangan memasukkan catatan kulit nyata ke fixture atau snapshot.
- Jangan mengirim dump database ke laporan.

## Rollback dan perubahan destruktif
- Migrasi destruktif memerlukan task eksplisit, strategi backup, dan persetujuan pemilik.
- Jangan menjalankan `DROP SCHEMA`, `TRUNCATE`, atau reset database tanpa memastikan target lokal dan tanpa izin.
- Jangan menjalankan migrasi terhadap produksi dari agent kecuali task secara eksplisit mengizinkan dan pemilik mengawasi.

## Eskalasi
Berhenti jika kebutuhan task membuat `app_public` dapat mengakses records, membuat role runtime superuser, atau mengurangi isolasi skema.
