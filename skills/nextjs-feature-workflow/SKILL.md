# Skill: nextjs-feature-workflow

## Tujuan
Memberikan alur implementasi fitur Next.js yang konsisten, terukur, dan sesuai batas domain Dacie Beauty.

## Kapan dipakai
Untuk task fitur baru atau perubahan fitur pada App Router, UI, Route Handler, Server Action, domain logic, dan integrasi database.

## Langkah

1. Baca `AGENTS.md`, `docs/PRD.md`, dan task.
2. Jalankan skill `git-sync-and-branch`.
3. Periksa struktur aktual: app routes, components, server modules, database adapters, tests, package scripts, dan style conventions.
4. Buat rencana perubahan ringkas sebelum mengedit:
   - kebutuhan pengguna;
   - route/komponen yang terlibat;
   - data input/output;
   - batas publik/privat;
   - perubahan database (jika ada);
   - test dan kriteria penerimaan.
5. Tentukan apakah fitur berada di area booking atau records. Jangan mencampur domain tanpa kebutuhan yang dinyatakan.
6. Pisahkan server dan client:
   - server menangani validasi, autentikasi, otorisasi, query, dan aturan bisnis;
   - client menangani interaksi dan presentasi;
   - jangan kirim secret atau adapter database ke client.
7. Implementasikan schema input dan aturan domain terlebih dahulu, kemudian UI.
8. Untuk operasi tulis, tangani loading, validasi, error, dan hasil sukses secara jelas.
9. Buat test unit untuk aturan domain dan integration test untuk batas database/otorisasi.
10. Untuk perubahan alur pengguna, tambahkan atau perbarui E2E bila sesuai.
11. Periksa aksesibilitas, responsivitas mobile-first, dan teks Bahasa Indonesia.
12. Jalankan `scripts/verify.sh`.
13. Periksa diff untuk scope creep, file rahasia, data pribadi, dan perubahan arsitektur.
14. Tulis laporan menggunakan skill `write-task-report`.
15. Ikuti prosedur pre-push pada `AGENTS.md`; jangan push ke main.

## Pola struktur yang diharapkan
Struktur final ditentukan setelah scaffold dan discovery. Secara konseptual pisahkan:
- route dan layout;
- UI components;
- domain/use-cases;
- schema validation;
- database adapters;
- authentication/session;
- tests.

Jangan memaksakan struktur folder baru bila repository sudah memiliki konvensi yang sehat.

## Contoh alur fitur booking
Untuk task form booking:
1. Pastikan hanya lima field publik.
2. Definisikan schema input di server.
3. Normalisasi WhatsApp pada boundary.
4. Ambil treatment/slot melalui kontrak data publik yang disetujui.
5. Pada submit, hitung ulang ketersediaan dan simpan menggunakan `app_public`.
6. Tangani konflik constraint sebagai pesan bahwa slot sudah tidak tersedia.
7. Jangan mengembalikan data booking lain.
8. Tambahkan test unit, integration, dan E2E sesuai task.

## Contoh alur fitur rekam
Untuk task riwayat kunjungan:
1. Pastikan sesi valid dan user terotorisasi.
2. Gunakan koneksi `app_private`.
3. Pastikan consent sudah tercatat sesuai kebijakan task.
4. Validasi semua field di server.
5. Simpan kunjungan dan audit log dalam transaksi bila konsistensi menuntutnya.
6. Jangan mengirim data ke hostname publik.
7. Tambahkan test akses tanpa sesi dan audit.

## Batasan
- Jangan menambah fitur di luar task.
- Jangan mengubah stack atau pola autentikasi yang telah disetujui.
- Jangan menambahkan package tanpa pemeriksaan lisensi, pemeliharaan, kompatibilitas, dan kebutuhan.
- Jangan menyatakan selesai tanpa verifikasi dan laporan.
