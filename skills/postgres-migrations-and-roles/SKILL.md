# Skill: postgres-migrations-and-roles

## Tujuan
Mengelola skema, migrasi, role, dan privilege PostgreSQL secara dapat diaudit dengan pemisahan booking dan records yang ketat.

## Kapan dipakai
Wajib untuk setiap task yang menambah/mengubah tabel, kolom, index, constraint, function, trigger, role, grant, revoke, seed, atau koneksi database.

## Prinsip wajib

- Skema `booking`: data booking operasional.
- Skema `records`: data kulit/kesehatan dan akun internal.
- `app_public`: tidak memiliki privilege tabel apa pun; hanya USAGE pada schema `booking`, EXECUTE pada `get_public_config`, `get_blocked_intervals`, `create_booking`, tanpa USAGE pada `records`. Role/grant dikerjakan terpisah dari SQL fungsi: T-005 mengelola role dan privilege; T-042 satu-satunya pemilik SQL tiga fungsi publik.
- `app_private`: SELECT seluruh tabel booking; INSERT/UPDATE tanpa DELETE pada tabel konfigurasi `treatments`, `providers`, `working_hours`, `time_off`, `booking_rules`; tanpa DML langsung pada `bookings`; status hanya melalui `set_booking_status`; DML yang diperlukan pada `records` tanpa DDL.
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
8. Pisahkan ownership task: T-005 hanya membuat role/grant/default privileges dan tes privilege; T-042 satu-satunya task yang membuat SQL `get_public_config`, `get_blocked_intervals`, dan `create_booking`; T-043 membuat SQL `set_booking_status`/status_events. T-010 dan T-012 hanya lapisan aplikasi dan tidak boleh menggandakan SQL.
9. Untuk fungsi publik:
   - output minimum;
   - tidak mengembalikan nama/kontak;
   - validasi argumen dan rentang waktu;
   - pertimbangkan keamanan `search_path`;
   - jika `SECURITY DEFINER`, gunakan owner terbatas dan grant EXECUTE minimum.
10. Tambahkan test privilege yang memakai koneksi sebagai role `app_public`, bukan sekadar memeriksa katalog dengan superuser.
11. Jalankan migrasi dari database kosong dan, bila relevan, dari versi migrasi sebelumnya.
12. Jalankan test integrasi terhadap PostgreSQL Docker dan `scripts/verify.sh`.
13. Catat hasil serta risiko migrasi dalam laporan.

## Pencegahan tabrakan booking

Constraint exclusion untuk mencegah overlap harus dibuat pada migrasi schema T-004, sebelum fungsi `create_booking` T-042 dibuat. T-004 juga memverifikasi ketersediaan `btree_gist` dan hak role migrasi untuk membuat extension. T-042 boleh mengandalkan constraint yang sudah tersedia, tetapi tidak membuat ulang constraint tersebut; T-012 hanya menguji perilakunya melalui jalur aplikasi.

Untuk booking, constraint database harus mencegah dua booking yang saling tumpang tindih untuk provider yang sama. Pilih mekanisme setelah memeriksa dukungan versi PostgreSQL yang dipakai dan kebutuhan extension. Ketersediaan `btree_gist` serta hak membuat extension perlu diverifikasi pada discovery; jangan menganggap extension tersedia. Jangan menganggap pemeriksaan availability di aplikasi cukup.

Uji dengan dua transaksi/request bersamaan. Hasil yang benar: paling banyak satu booking aktif yang saling bertabrakan berhasil.

## Penggunaan role

- Pool publik hanya dibuat oleh instance `APP_MODE=public` dari credential `app_public`; pool privat hanya dibuat oleh `APP_MODE=private` dari credential `app_private`.
- Instance publik tidak boleh memiliki credential/secret privat dan wajib gagal startup bila menemukan variabel tersebut.
- Jangan membuat helper generik yang memungkinkan request memilih nama role atau pool.
- Jangan mengimpor koneksi privat dari modul yang dapat dipanggil route publik.
- `app_public` tidak memiliki privilege tabel; ia hanya boleh menjalankan tiga fungsi publik D-02.
- Fungsi D-02 dan `booking.set_booking_status` memakai SECURITY DEFINER, owner NOLOGIN khusus berhak minimum, bukan superuser; search_path dikunci; objek dikualifikasi schema; REVOKE ALL FROM PUBLIC; GRANT EXECUTE hanya ke role yang ditetapkan.
- `app_private` memiliki SELECT semua tabel booking dan INSERT/UPDATE tanpa DELETE pada tabel konfigurasi yang ditetapkan D-03. Ia tidak memiliki DML langsung pada `booking.bookings`.
- Perubahan status booking hanya melalui `booking.set_booking_status`; transisi divalidasi dan ditulis ke `booking.status_events`.
- `app_private` memiliki DML yang diperlukan pada `records`, tanpa DDL dan bukan pemilik objek.
- Uji SELECT dan INSERT langsung dari `app_public` terhadap semua tabel harus gagal. Uji juga hanya tiga fungsi publik yang dapat dieksekusi.

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
