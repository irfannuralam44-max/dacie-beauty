# Product Requirements Document (PRD)
## Dacie Beauty — Booking Online dan Rekam Kulit Privat

- **Status:** Draft baseline untuk implementasi
- **Versi dokumen:** 1.0
- **Tanggal:** 19 November 2026
- **Repositori:** `irfannuralam44-max/dacie-beauty` (private)
- **Branch dokumen:** `docs/T-001-prd`
- **Bahasa produk dan dokumentasi:** Bahasa Indonesia
- **Zona waktu operasional:** `Asia/Jakarta`

> Dokumen ini menurunkan keputusan arsitektur yang telah ditetapkan menjadi kebutuhan produk dan batas implementasi. Dokumen ini tidak memberi wewenang kepada agent untuk mengubah keputusan yang dikunci. Setiap keberatan dicatat terpisah pada bagian **Catatan keberatan**.

---

## 1. Ringkasan produk

Dacie Beauty adalah bisnis skincare dan facial treatment di Cimahi, Jawa Barat, yang dijalankan oleh pemilik dan istrinya. Bisnis menjual produk Theraskin dan Probeauty serta menyediakan layanan facial dan konsultasi kulit untuk pasar menengah atas.

Sistem terdiri dari satu aplikasi Next.js dalam satu repositori, tetapi mempunyai dua area dengan tujuan, hostname, autentikasi, dan hak akses data yang berbeda:

1. **Booking online publik** — calon pelanggan memilih treatment, tanggal, dan jam, lalu mengisi nama dan nomor WhatsApp. Form hanya memiliki lima kolom tersebut. Area ini tidak meminta keluhan, alergi, jenis kulit, atau informasi kesehatan.
2. **Rekam kulit privat** — aplikasi internal untuk tepat dua akun, yaitu pemilik dan istri. Area ini menyimpan profil pelanggan, riwayat kunjungan, catatan kondisi kulit, persetujuan, dan audit log. Konsultasi rinci berlangsung secara privat melalui WhatsApp atau tatap muka; hasil yang relevan dicatat oleh staf berwenang di sistem.

Pemisahan data bukan sekadar pemisahan tampilan. Data booking dan data rekam kulit berada pada skema PostgreSQL yang berbeda, diakses melalui role database berbeda dengan hak minimum. Rute publik hanya menggunakan kredensial `app_public`; rute privat menggunakan `app_private`.

## 2. Tujuan dan hasil yang diharapkan

### 2.1 Tujuan bisnis

- Memudahkan calon pelanggan membuat permintaan jadwal tanpa harus menghubungi admin terlebih dahulu.
- Mengurangi risiko jadwal ganda dan memudahkan pemilik mengelola dua penyedia layanan.
- Menyediakan riwayat perawatan pelanggan yang rapi dan hanya dapat diakses pemilik serta istri.
- Membantu pemilik mengidentifikasi pelanggan yang perlu ditindaklanjuti.
- Menjaga biaya operasional rendah dengan menjalankan aplikasi pada mini PC milik pemilik.
- Menjaga portabilitas agar sistem dapat dipindahkan ke VPS/hosting lain tanpa ketergantungan pada Supabase, Netlify, atau vendor database tertentu.

### 2.2 Bukan tujuan

- Menggantikan konsultasi langsung atau komunikasi privat dengan pelanggan.
- Menjadi rekam medis klinis atau alat diagnosis.
- Mengirim konfirmasi, pengingat, atau promosi otomatis.
- Menjadi sistem kasir, stok, komisi, atau akuntansi.
- Mengumpulkan foto before-after pada MVP.
- Menyediakan akun pelanggan atau pendaftaran mandiri.
- Menyediakan aplikasi Android native.

## 3. Pengguna, peran, dan batas kepercayaan

| Aktor | Area | Kemampuan |
|---|---|---|
| Calon pelanggan | Booking publik | Melihat pilihan booking yang disediakan, memilih treatment/tanggal/jam, mengirim nama dan WhatsApp |
| Pemilik | Rekam kulit privat | Mengelola pelanggan, kunjungan, jadwal, pengaturan, persetujuan, audit, dan permintaan penghapusan |
| Istri pemilik | Rekam kulit privat | Kemampuan operasional yang sama dengan pemilik, melalui akun tersendiri |
| Agent coding | Repository | Mengimplementasikan task sesuai dokumen; tidak memperoleh data pelanggan asli atau rahasia produksi |
| Auditor | Bukti yang ditempel pemilik | Memeriksa laporan, diff, dan bukti; tidak memiliki akses ke PC lokal |

### 3.1 Akun internal

- Harus tepat dua akun internal aktif: pemilik dan istri.
- Tidak ada registrasi publik, undangan otomatis, atau pembuatan akun oleh pelanggan.
- Pembuatan, penggantian, penonaktifan, dan pemulihan akun dilakukan melalui prosedur administratif yang terdokumentasi.
- Kedua akun harus menggunakan identitas login terpisah agar audit log dapat mengidentifikasi pelaku.
- Detail alamat email kedua akun belum ditentukan di PRD ini dan harus diberikan melalui konfigurasi server yang aman, bukan commit atau chat.

## 4. Ruang lingkup

### 4.1 MVP

**Booking publik**
- Halaman booking berbahasa Indonesia dengan identitas Dacie Beauty.
- Lima input saja: nama, nomor WhatsApp, jenis treatment, tanggal, dan jam.
- Empat treatment awal: Facial Brightening, Facial Acne Care, Facial Hydrating, Konsultasi Kulit.
- Dua penyedia layanan.
- Zona waktu operasional `Asia/Jakarta`.
- Jam kerja, durasi treatment, dan jeda antar sesi dapat diatur melalui area privat.
- Slot tersedia dihitung di server.
- Booking ganda dicegah di tingkat database, bukan hanya dengan pemeriksaan UI.
- Status booking dan konfirmasi manual dikelola dari area privat.
- Tautan `wa.me` untuk komunikasi manual; tidak ada WhatsApp API berbayar dan tidak ada email.
- Rate limit per IP, validasi WhatsApp, dan CAPTCHA gratis setelah batas layanan diverifikasi.

**Rekam kulit privat**
- Login dua akun, password hash, pembatasan percobaan login, sesi dengan kedaluwarsa.
- Daftar dan pencarian pelanggan berdasarkan nama.
- Profil pelanggan.
- Riwayat kunjungan.
- Penanda follow-up untuk pelanggan yang kunjungan terakhirnya 25 hari atau lebih lalu.
- Daftar booking yang dibaca dari skema booking.
- Tombol konfirmasi booking dan tombol membuka/membuat profil rekam kulit berdasarkan nomor WhatsApp.
- Pengaturan treatment, penyedia layanan, jam kerja.
- Tombol WhatsApp dengan pesan pembuka yang dapat diubah.
- Pencatatan persetujuan pelanggan, termasuk tanggal dan versi teks persetujuan.
- Audit log untuk akses lihat dan perubahan data pelanggan.
- Prosedur penghapusan atau anonimisasi data atas permintaan.

**Fondasi dan operasi**
- Satu repo privat, satu aplikasi Next.js App Router.
- PostgreSQL dengan dua skema dan dua role.
- Docker Compose untuk aplikasi dan database.
- `scripts/verify.sh` untuk lint, test, dan pemindaian rahasia secara lokal.
- Test pemisahan role database dan proteksi rute privat.
- Tidak ada CI jarak jauh atau GitHub Actions.
- Dokumentasi backup, restore, dan migrasi host.

### 4.2 Di luar MVP — jangan dikerjakan sebelum diminta

- Unggah atau penyimpanan foto before-after.
- Autentikasi dua langkah.
- Pengingat otomatis melalui WhatsApp/email/notifikasi.
- Kasir atau pembayaran.
- Stok produk.
- Komisi.
- Integrasi WhatsApp API.
- Email transaksional.
- Portal akun pelanggan.
- Diagnosis atau rekomendasi medis otomatis.
- Integrasi pihak ketiga yang tidak dinyatakan dalam PRD atau task.

## 5. Alur pengguna

### 5.1 Alur booking publik

1. Pelanggan membuka hostname booking, yaitu `booking.<domain>`.
2. Aplikasi menampilkan identitas Dacie Beauty dan pilihan treatment yang aktif.
3. Pelanggan memilih treatment.
4. Pelanggan memilih tanggal.
5. Server menghitung slot berdasarkan jam kerja, durasi treatment, jeda antar sesi, penyedia layanan, dan booking yang sudah ada.
6. Pelanggan memilih salah satu jam yang tersedia.
7. Pelanggan mengisi nama dan nomor WhatsApp.
8. Pelanggan menyelesaikan CAPTCHA jika diwajibkan oleh kebijakan proteksi.
9. Server memvalidasi seluruh input, memeriksa rate limit, menghitung ulang ketersediaan, lalu menyimpan booking melalui koneksi `app_public`.
10. Constraint database menjadi pertahanan terakhir terhadap tabrakan jadwal.
11. Aplikasi menampilkan hasil pengajuan booking tanpa membocorkan nama/kontak pelanggan lain.
12. Pemilik melakukan konfirmasi secara manual melalui WhatsApp. Tidak ada pesan otomatis yang dikirim oleh sistem.

**Batas form:** nama, nomor WhatsApp, treatment, tanggal, jam. Jangan menambah kolom keluhan, alergi, jenis kulit, diagnosis, foto, alamat, email, atau data kesehatan lain.

### 5.2 Alur pengelolaan booking privat

1. Pemilik atau istri membuka hostname `rekam.<domain>`.
2. Cloudflare Access memeriksa identitas yang diizinkan.
3. Pengguna juga harus lolos login aplikasi.
4. Area privat membaca daftar booking melalui role `app_private`.
5. Pengguna memeriksa detail booking, lalu menghubungi pelanggan melalui tautan WhatsApp bila diperlukan.
6. Pengguna mengubah status booking sesuai tindakan operasional, misalnya menandai sudah dikonfirmasi.
7. Pengguna memilih **Buka rekam kulit**.
8. Aplikasi mencari pelanggan berdasarkan nomor WhatsApp yang dinormalisasi ke format `62xxxxxxxxxx`.
9. Jika ditemukan, aplikasi membuka profil tersebut. Jika belum ditemukan, aplikasi memulai pembuatan profil baru.
10. Sebelum data kulit dicatat, staf memastikan persetujuan pelanggan telah diperoleh dan merekam tanggal serta versi teks persetujuan.
11. Hasil konsultasi privat dicatat sebagai kunjungan.

### 5.3 Alur rekam kunjungan

1. Pengguna internal mencari pelanggan berdasarkan nama.
2. Pengguna membuka profil dan memeriksa riwayat.
3. Pengguna menambahkan kunjungan dengan tanggal, treatment, catatan kondisi kulit, produk yang dipakai, saran, dan tanggal follow-up yang disarankan.
4. Sistem mencatat pengguna pembuat dan waktu pencatatan.
5. Sistem menulis audit log untuk tindakan melihat atau mengubah rekam pelanggan.
6. Penanda follow-up muncul jika kunjungan terakhir berjarak sekurang-kurangnya 25 hari dari tanggal saat ini menurut zona waktu operasional.

### 5.4 Alur permintaan penghapusan/anonimisasi

1. Pemilik memverifikasi permintaan pelanggan secara manual.
2. Pemilik menilai apakah ada kewajiban penyimpanan atau alasan sah lain yang perlu diperiksa.
3. Pemilik memilih penghapusan atau anonimisasi sesuai prosedur yang telah disetujui.
4. Sistem menjalankan operasi yang konsisten terhadap profil, kunjungan, dan relasi terkait.
5. Audit log menyimpan metadata tindakan tanpa menyalin kembali isi sensitif yang telah dihapus.
6. Permintaan dan hasilnya dicatat dalam prosedur operasional. Kasus yang tidak jelas ditinjau dengan penasihat hukum.

## 6. Kebutuhan fungsional

Prioritas: **P0** = wajib untuk MVP/fase terkait, **P1** = penting, **P2** = setelah MVP hanya jika diminta.

### 6.1 Booking publik

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| PUB-01 | P0 | Halaman booking menampilkan identitas Dacie Beauty dan bahasa Indonesia |
| PUB-02 | P0 | Form hanya memiliki lima kolom yang ditetapkan |
| PUB-03 | P0 | Treatment awal tersedia sesuai daftar pada PRD |
| PUB-04 | P0 | Pelanggan dapat memilih tanggal dan slot yang masih tersedia |
| PUB-05 | P0 | Slot dihitung di server dalam zona waktu `Asia/Jakarta` |
| PUB-06 | P0 | Sistem menerapkan jam kerja, durasi treatment, jeda, dan ketersediaan penyedia |
| PUB-07 | P0 | Nomor WhatsApp divalidasi dan dinormalisasi ke format `62xxxxxxxxxx` |
| PUB-08 | P0 | Server memvalidasi ulang slot pada saat submit |
| PUB-09 | P0 | Database menolak tabrakan jadwal, termasuk request bersamaan |
| PUB-10 | P0 | Respons publik tidak menampilkan nama, nomor, atau detail booking orang lain |
| PUB-11 | P0 | Rate limit per IP dan CAPTCHA gratis diterapkan setelah discovery layanan |
| PUB-12 | P0 | Konfirmasi dilakukan manual melalui WhatsApp |
| PUB-13 | P1 | Halaman memberi pesan hasil submit yang jelas tanpa membocorkan data internal |

### 6.2 Rekam kulit privat

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| PRI-01 | P0 | Hanya dua akun internal yang dapat login |
| PRI-02 | P0 | Tidak ada pendaftaran publik |
| PRI-03 | P0 | Password disimpan dalam bentuk hash yang kuat |
| PRI-04 | P0 | Login memiliki rate limit/pembatasan percobaan dan sesi kedaluwarsa |
| PRI-05 | P0 | Rute privat menolak request tanpa sesi login yang sah |
| PRI-06 | P0 | Daftar pelanggan mendukung pencarian nama |
| PRI-07 | P0 | Profil menyimpan nama, WhatsApp ternormalisasi unik, jenis kulit, keluhan utama, alergi/sensitivitas, dan catatan |
| PRI-08 | P0 | Riwayat kunjungan menyimpan seluruh atribut yang ditetapkan |
| PRI-09 | P0 | Sistem menampilkan penanda follow-up untuk kunjungan terakhir ≥25 hari |
| PRI-10 | P0 | Area privat membaca daftar booking dari skema booking |
| PRI-11 | P0 | Pengguna dapat mengonfirmasi booking dari area privat |
| PRI-12 | P0 | Pengguna dapat membuka profil berdasarkan nomor WhatsApp booking |
| PRI-13 | P0 | Jika profil belum ada, pengguna dapat membuatnya tanpa menyalin data booking ke skema records secara otomatis selain data yang diperlukan dan diizinkan pengguna |
| PRI-14 | P0 | Treatment, penyedia layanan, dan jam kerja dapat dikelola |
| PRI-15 | P0 | Tautan WhatsApp menggunakan nomor yang dinormalisasi dan pesan pembuka yang dapat diubah |
| PRI-16 | P0 | Persetujuan dicatat dengan tanggal dan versi teks |
| PRI-17 | P0 | Audit log mencatat siapa melihat atau mengubah rekam pelanggan dan kapan |
| PRI-18 | P0 | Tersedia alur hapus atau anonimisasi data |
| PRI-19 | P1 | Pengguna dapat memfilter booking berdasarkan tanggal/status |
| PRI-20 | P1 | Pesan pembuka WhatsApp dapat diedit tanpa deploy aplikasi |

### 6.3 Pengaturan

- Treatment memiliki nama, status aktif, durasi, dan jeda antar sesi atau parameter jeda yang relevan.
- Penyedia layanan memiliki identitas internal dan status aktif.
- Jam kerja dapat diatur per penyedia dan hari.
- Sistem harus mendukung hari libur/pengecualian jadwal bila dibutuhkan oleh aturan operasional; detail UI dan modelnya ditetapkan pada task desain data.
- Perubahan pengaturan hanya tersedia bagi pengguna privat yang telah login.
- Setiap perubahan pengaturan penting dicatat di audit log.

## 7. Kebutuhan non-fungsional

### 7.1 Platform dan stack

- Framework: Next.js App Router.
- Bahasa: TypeScript.
- UI: React, mobile-first dan responsif.
- Runtime: Node.js LTS.
- Database: PostgreSQL, versi stabil yang dipilih setelah verifikasi pada saat implementasi.
- Sistem operasi server: Linux pada mini PC milik pemilik.
- Orkestrasi lokal/produksi: Docker Compose.
- Akses internet: Cloudflare Tunnel (`cloudflared`), tanpa membuka port pada router.
- Dilarang menggunakan Supabase dan Netlify.
- Versi semua paket dan layanan harus diverifikasi pada task discovery sebelum dikunci. Jangan menyalin versi dari dokumen lama tanpa pemeriksaan.

### 7.2 Akses data dan migrasi

- Skema `booking` menyimpan data operasional booking.
- Skema `records` menyimpan data pelanggan dan rekam kulit.
- Role `app_public` hanya boleh membuat booking dan menjalankan fungsi terbatas untuk mendapatkan informasi jam yang sudah terisi tanpa nama/kontak.
- Role `app_public` tidak memiliki hak apa pun atas skema `records`.
- Role `app_private` boleh membaca booking dan mengakses data `records` sesuai kebutuhan aplikasi privat. Kebutuhan mengubah status booking dari area privat belum diberi grant langsung; gunakan fungsi database sempit hanya setelah kontrak privilege disetujui pemilik (lihat Catatan keberatan K-07).
- Koneksi database publik dan privat harus dibuat terpisah dan digunakan secara eksplisit pada server-side code.
- Test lokal wajib membuktikan role publik ditolak ketika membaca tabel pada skema `records`.
- Migrasi harus berupa file SQL yang tersimpan di repo atau alat migrasi ringan yang dipilih dan dijelaskan dalam PRD implementasi. Pilihan awal yang disarankan adalah **file SQL berversi** agar sederhana, transparan, mudah diaudit, dan tidak mengikat vendor.
- Pilihan akses data awal yang disarankan adalah **driver `pg` dengan SQL berparameter**. Alasannya: akses eksplisit ke dua pool/role, kontrol query dan transaksi yang jelas, serta minim abstraksi untuk skema sensitif. Keputusan final harus dicatat saat discovery dan tidak boleh membuat kedua role berbagi koneksi.
- Tidak boleh ada query yang menggabungkan atau mengekspos catatan kulit melalui jalur publik.

### 7.3 Autentikasi

- Pilihan awal yang disarankan: sesi aplikasi sederhana dengan token sesi acak berentropi tinggi, token mentah hanya pada cookie, hash token disimpan di database, password di-hash dengan Argon2id.
- Pilihan ini disarankan untuk dua akun tetap, tanpa registrasi dan tanpa kebutuhan federasi login.
- Detail parameter hash harus mengikuti rekomendasi library yang dipilih dan diverifikasi; jangan mengarang parameter atau versi paket.
- Cookie wajib `Secure`, `HttpOnly`, dan `SameSite` yang sesuai.
- Sesi harus memiliki waktu kedaluwarsa, dapat dicabut, dan tidak diperpanjang tanpa batas.
- Implementasi wajib melindungi login dari brute force dan memastikan logout mencabut sesi.
- Alternatif Auth.js hanya boleh dipertimbangkan dalam discovery, bukan alasan untuk menambah scope autentikasi sosial atau pendaftaran.

### 7.4 Performa dan ketersediaan

- Halaman booking harus nyaman digunakan pada ponsel dengan jaringan seluler umum.
- Perhitungan slot dilakukan di server; UI tidak menjadi sumber kebenaran ketersediaan.
- Constraint database harus menjadi perlindungan terakhir dari booking ganda.
- Docker Compose menggunakan kebijakan restart `unless-stopped` untuk layanan aplikasi dan database.
- Sistem harus dapat pulih setelah mini PC restart atau mati listrik, dengan prosedur pemulihan yang diuji pada Fase 3.
- Target angka performa dan kapasitas belum ditetapkan; ukur baseline selama uji coba sebelum menentukan SLA.

### 7.5 Portabilitas

- Semua konfigurasi operasional melalui environment variables.
- Tidak ada ketergantungan wajib pada layanan proprietary selain layanan tepi/tunnel yang memang dipilih untuk akses.
- Aplikasi dan database dapat dipindahkan dengan menyalin konfigurasi Docker Compose, image/build source, environment secrets secara aman, serta backup database.
- Panduan migrasi singkat ke VPS wajib tersedia.
- Tidak boleh menyimpan secret dalam Docker image, file konfigurasi yang di-commit, laporan, atau chat.

## 8. Model data konseptual

Model berikut adalah baseline minimum. Boleh ditambah kolom/tabel/constraint yang diperlukan, tetapi entitas dan kemampuan inti tidak boleh dikurangi. Nama kolom dan tipe final ditetapkan dalam migrasi Fase 0.

### 8.1 Skema `booking`

| Entitas | Data inti | Catatan |
|---|---|---|
| `treatments` | ID, nama, status aktif, durasi, jeda | Data pilihan treatment dan aturan waktu |
| `providers` | ID, nama tampilan/internal, status aktif | Dua penyedia layanan |
| `working_hours` | ID, provider, hari, jam mulai, jam selesai | Zona waktu operasional ditangani konsisten |
| `bookings` | ID, nama, nomor WA ternormalisasi, treatment_id, provider_id, mulai, selesai, status, created_at | Tidak menyimpan keluhan/kondisi kulit |
| Pengecualian jadwal (jika diperlukan) | Provider, rentang waktu, alasan operasional non-sensitif | Dapat ditambahkan untuk libur/cuti |

**Aturan booking**
- Waktu disimpan dalam representasi yang konsisten, idealnya `timestamptz`, dan ditampilkan dalam `Asia/Jakarta`.
- Rentang booking diperlakukan sebagai interval dengan batas yang tidak menimbulkan tabrakan pada sesi berurutan.
- Constraint anti-tabrakan harus mempertimbangkan provider dan rentang waktu, termasuk transaksi bersamaan. Pilihan implementasi constraint (misalnya exclusion constraint dengan dukungan extension yang sesuai, atau mekanisme database lain yang setara) harus diverifikasi pada discovery PostgreSQL.
- Status yang tidak lagi memblokir slot harus didefinisikan secara eksplisit. Status awal yang disarankan: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`. Status final ditetapkan dalam task booking.
- Fungsi slot publik hanya mengembalikan waktu yang sudah terisi/blocked untuk rentang tanggal yang diminta; tidak boleh mengembalikan nama, nomor WhatsApp, status yang mengandung informasi pribadi, atau ID pelanggan.
- Fungsi yang dapat dipanggil publik harus memiliki hak eksekusi terbatas, validasi argumen, dan konfigurasi `search_path` yang aman bila menggunakan `SECURITY DEFINER`.

### 8.2 Skema `records`

| Entitas | Data inti | Catatan |
|---|---|---|
| `users` | ID, nama, identitas login, password_hash, status, created_at | Maksimal dua akun aktif |
| `customers` | ID, nama, nomor WA ternormalisasi unik, jenis kulit, keluhan utama, alergi/sensitivitas, catatan, consent_at, consent_version | Data privat |
| `visits` | ID, customer_id, tanggal, treatment, catatan kondisi kulit, produk, saran, follow_up_on, created_by | Riwayat kunjungan |
| `audit_logs` | ID, user_id, aksi, objek, waktu | Mencatat akses lihat dan perubahan |
| Sesi autentikasi | ID, user_id, token_hash, created_at, expires_at, revoked_at | Tambahan yang diperlukan untuk sesi |
| Versi persetujuan (bila dibutuhkan) | Versi teks, isi/rujukan teks, tanggal berlaku | Agar versi persetujuan dapat dibuktikan |

**Aturan records**
- Nomor WhatsApp ternormalisasi unik pada `customers`, dengan format kanonis `62xxxxxxxxxx`.
- Tidak ada FK lintas skema yang menghubungkan booking dengan customer. Penghubung logisnya adalah nomor WhatsApp ternormalisasi.
- Data booking tidak boleh disalin secara otomatis menjadi catatan kulit.
- Profil identitas dasar (nama dan WhatsApp) boleh dibuat sebelum persetujuan bila diperlukan untuk menautkan booking. Field kesehatan/kulit (jenis kulit, keluhan, alergi/sensitivitas, catatan) dan catatan kunjungan hanya boleh dibuat atau diubah setelah persetujuan dicatat dan diverifikasi server-side.
- Audit log tidak boleh menyimpan salinan isi catatan sensitif, password, token, atau nomor WhatsApp lengkap jika tidak diperlukan untuk pembuktian tindakan.
- Akses lihat profil/rekam pelanggan harus tercatat, bukan hanya perubahan.
- Penghapusan/anonimisasi harus mempertimbangkan relasi kunjungan, audit, dan kebutuhan pembuktian; kebijakan final memerlukan tinjauan hukum/privasi.

### 8.3 Normalisasi WhatsApp

- Input dapat menerima variasi umum nomor Indonesia, misalnya awalan `0`, `62`, atau `+62`.
- Server menormalisasi ke format angka `62xxxxxxxxxx` sebelum penyimpanan.
- Normalisasi dilakukan sekali pada boundary input dan diverifikasi ulang pada server.
- Nomor tidak boleh dipakai sebagai autentikasi.
- Nomor WhatsApp merupakan penghubung operasional booking dan records, bukan alasan untuk memberikan akses publik ke profil.

## 9. Keamanan dan privasi

Keamanan berikut adalah kriteria penerimaan, bukan pekerjaan opsional.

### 9.1 Pemisahan host dan route

- Host publik: `booking.<domain>`.
- Host privat: `rekam.<domain>`.
- Host privat dilindungi Cloudflare Access dengan allowlist hanya dua email yang ditentukan pemilik, dan tetap memerlukan login aplikasi.
- Rute privat tidak boleh dilayani dari hostname booking, termasuk melalui rewrite, route handler, API, server action, middleware bypass, atau variasi URL.
- Hostname privat harus menolak host yang tidak dikenal.
- Pemeriksaan host harus menggunakan allowlist hostname yang dikonfigurasi, bukan pencocokan substring.
- Konfigurasi Cloudflare Access, batas paket gratis, dan kemampuan kebijakan yang diperlukan wajib diverifikasi sebelum deployment. Jangan menganggap fitur atau kuota tertentu tersedia tanpa bukti terkini.

### 9.2 Database least privilege

- Role database bukan superuser dan tidak memiliki hak administratif.
- `app_public` hanya memiliki hak minimum untuk membuat booking dan mengeksekusi fungsi slot publik yang diizinkan.
- `app_public` tidak boleh `SELECT`, `INSERT`, `UPDATE`, `DELETE`, atau `USAGE` yang memberi jalur akses ke `records`.
- `app_private` digunakan hanya untuk rute privat.
- Hak default untuk tabel/sequence/fungsi baru harus ditinjau agar migrasi tidak tanpa sengaja memberi hak kepada `PUBLIC` atau role publik.
- Koneksi role publik dan privat tidak boleh tertukar.
- Test integrasi harus menjalankan query nyata dengan role `app_public` dan membuktikan akses ke `records` ditolak oleh PostgreSQL.

### 9.3 Aplikasi web

- HTTPS wajib melalui Cloudflare.
- Cookie sesi: `Secure`, `HttpOnly`, `SameSite`.
- Proteksi CSRF untuk operasi yang mengubah state.
- Validasi input menggunakan schema validation di server.
- Output di-escape sesuai konteks; jangan menyisipkan HTML mentah dari input pengguna.
- Semua query menggunakan parameter binding; dilarang menyusun SQL dari input mentah.
- Rate limit login dan booking.
- CAPTCHA gratis (misalnya Cloudflare Turnstile) hanya setelah kuota, batas, dan syarat layanan diverifikasi.
- Error publik tidak boleh membocorkan stack trace, query, path server, konfigurasi, atau data pelanggan.
- Tidak ada data pelanggan di log aplikasi. Gunakan ID korelasi acak bila dibutuhkan untuk debugging.
- Jangan memasukkan PII atau catatan kulit ke analytics, telemetry, exception tracker, atau log reverse proxy.

### 9.4 Secret management

- File `.env`, token Cloudflare Tunnel, password database, password akun, secret sesi, dan secret lain hanya berada di server/lingkungan lokal yang aman.
- Jangan commit secret, menyalinnya ke laporan, atau menempelkannya di chat.
- Repo hanya berisi `.env.example` dengan nama variabel dan nilai dummy/non-secret.
- Secret produksi tidak digunakan dalam test, seeder, screenshot, issue, atau laporan agent.
- Pemindaian secret lokal wajib dijalankan melalui `scripts/verify.sh`.

### 9.5 Keamanan server

- Enkripsi disk pada mini PC.
- Pembaruan keamanan OS rutin dan terdokumentasi.
- SSH hanya menggunakan kunci; nonaktifkan login password bila layak dan telah diuji akses pemulihannya.
- Tidak ada port aplikasi/database yang dibuka di router.
- Database tidak diekspos langsung ke internet.
- Tunnel dijalankan sebagai service yang dikelola dan dipulihkan setelah restart.
- Docker socket, volume database, dan file backup tidak boleh dapat diakses publik.

### 9.6 Backup dan pemulihan

- Backup harian menggunakan `pg_dump` terenkripsi ke disk eksternal.
- Satu salinan backup disimpan di luar rumah.
- Kunci enkripsi backup disimpan terpisah dari media backup.
- Backup tidak dianggap berhasil hanya karena file terbentuk; perlu verifikasi integritas dan uji restore.
- Runbook pemulihan wajib mencakup kehilangan disk, kerusakan database, kegagalan mini PC, rotasi secret, dan pemindahan ke VPS.
- Uji pemulihan dilakukan berkala dan hasilnya dicatat.
- Backup produksi berisi data pribadi sehingga akses dan masa retensinya harus dibatasi.

### 9.7 Privasi dan UU PDP

Sistem harus dirancang dengan prinsip perlindungan data pribadi, termasuk pembatasan tujuan, minimisasi data, transparansi, persetujuan yang dapat dibuktikan, pembatasan akses, keamanan, dan mekanisme pemenuhan hak subjek data.

Rujukan hukum utama: **UU Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi**. Dokumen ini bukan pendapat hukum dan tidak menyatakan bahwa sistem atau bisnis telah patuh sepenuhnya.

Hal yang perlu ditinjau oleh penasihat hukum/ahli privasi:
- Dasar pemrosesan yang tepat untuk setiap kategori data, terutama data kesehatan atau informasi yang dapat mengungkap kondisi kesehatan.
- Isi, cara memperoleh, versi, dan bukti persetujuan.
- Informasi privasi yang harus disampaikan kepada pelanggan.
- Masa retensi data booking dan rekam kulit.
- Prosedur permintaan akses, koreksi, penghapusan, dan anonimisasi.
- Pengecualian penghapusan jika terdapat kewajiban hukum atau kepentingan sah yang berlaku.
- Penggunaan Cloudflare dan pemrosesan lintas negara, termasuk peran para pihak dan transfer data.
- Prosedur insiden/kebocoran data dan kewajiban pemberitahuan.
- Apakah skala/jenis pemrosesan menimbulkan kewajiban tambahan bagi pengendali data.

## 10. UX dan identitas visual

- Nuansa: premium, bersih, tenang, profesional, tidak ramai.
- Palet awal: putih, mauve muda, dan hijau sage.
- Tipografi harus mudah dibaca di layar ponsel.
- Kontras teks dan kontrol harus memadai.
- Form booking dibuat ringkas, dengan label yang jelas dan pesan validasi berbahasa Indonesia.
- Hindari klaim medis, janji hasil, atau bahasa diagnosis.
- Area privat mengutamakan keterbacaan, pencarian cepat, dan pencegahan salah input.
- UI harus mengikuti batasan backend dan model keamanan; jangan mengorbankan pemisahan data demi kemudahan UI.

## 11. Arsitektur deployment tingkat tinggi

### 11.1 Komponen

1. Satu repositori privat `dacie-beauty`.
2. Satu aplikasi Next.js App Router.
3. Satu PostgreSQL dengan skema `booking` dan `records`.
4. Role `app_public` dan `app_private`.
5. Docker Compose untuk aplikasi dan database.
6. Cloudflare Tunnel untuk menghubungkan hostname ke layanan lokal tanpa port router terbuka.
7. Cloudflare Access di depan hostname privat.
8. Browser pelanggan dan browser pemilik/istri.

### 11.2 Host routing

- Host booking hanya menyajikan halaman dan endpoint booking publik.
- Host rekam hanya menyajikan area privat setelah pemeriksaan Access dan sesi aplikasi.
- Request ke host yang tidak terdaftar ditolak.
- Request ke route privat melalui host booking harus ditolak secara eksplisit.
- Server-side data access harus memilih koneksi berdasarkan area/route yang diizinkan, bukan berdasarkan parameter request yang dapat dimanipulasi.

### 11.3 Docker Compose

- Service aplikasi dan PostgreSQL berjalan dalam jaringan internal Docker.
- Database hanya diekspos ke jaringan yang diperlukan; tidak dipublikasikan ke internet.
- Service menggunakan `restart: unless-stopped`.
- Volume persisten digunakan untuk data PostgreSQL.
- Healthcheck dan urutan kesiapan database harus ditentukan.
- Tunnel dapat dijalankan sebagai service terpisah atau service host sesuai hasil discovery; token tidak boleh berada di repo.
- Nilai konfigurasi melalui environment variables dan secret file/secret mechanism yang tidak di-commit.

### 11.4 Portabilitas

Panduan migrasi minimal harus menjelaskan:
1. Menyiapkan host Linux/Docker dan domain.
2. Memasang konfigurasi environment dan secret dengan aman.
3. Menjalankan PostgreSQL dan memulihkan backup.
4. Menjalankan migrasi yang belum diterapkan.
5. Membangun/menjalankan aplikasi.
6. Mengarahkan tunnel/hostname ke host baru.
7. Memverifikasi login, booking, role database, backup, dan pemulihan.
8. Menghentikan host lama setelah cutover dan validasi selesai.

## 12. Testing dan quality gates

Semua test, lint, dan pemindaian secret dilakukan di PC lokal. **Dilarang memakai GitHub Actions atau CI jarak jauh apa pun.**

### 12.1 Tooling yang disarankan

Pilihan alat berikut adalah rekomendasi awal, bukan versi paket yang sudah dikunci. Versi perlu diverifikasi saat discovery.

- Unit/integration test: runner yang kompatibel dengan TypeScript/Next.js dan dipilih dalam Fase 0.
- Database integration: PostgreSQL aktual melalui Docker Compose, bukan mock saja.
- End-to-end: Playwright untuk satu alur booking lengkap.
- Lint/typecheck: ESLint dan TypeScript checker sesuai konfigurasi Next.js yang dipilih.
- Secret scanning: Gitleaks atau pemindai setara yang dijalankan lokal.
- Script tunggal: `scripts/verify.sh`.

### 12.2 Cakupan wajib

- Unit test normalisasi nomor WhatsApp.
- Unit test perhitungan slot, durasi, jeda, dan zona waktu.
- Integration test pembuatan booking.
- Integration test dua request bersamaan pada slot/provider yang sama; satu harus ditolak.
- Integration test hak akses: `app_public` tidak dapat membaca skema `records`.
- Integration test fungsi slot hanya mengembalikan informasi waktu terisi tanpa nama/kontak.
- Integration test rute privat menolak request tanpa sesi.
- Integration test host booking menolak route privat.
- Integration test sesi kedaluwarsa dan logout.
- Integration test audit log untuk view dan update.
- Test consent sebelum pencatatan data kulit.
- E2E Playwright: pelanggan membuka booking, memilih treatment/tanggal/jam, mengisi nama dan WhatsApp, submit, lalu menerima respons sukses.
- Test tidak boleh memakai data pelanggan asli.

### 12.3 `scripts/verify.sh`

Satu perintah lokal harus menjalankan sekurang-kurangnya:
1. Lint.
2. Unit test.
3. Integration test yang membutuhkan PostgreSQL Docker.
4. Pemeriksaan type/build yang ditetapkan dalam repo.
5. Secret scanning lokal.

E2E dapat dijalankan oleh script yang sama atau menjadi langkah terpisah yang tetap wajib sebelum task terkait di-push; keputusan ini harus dijelaskan di `AGENTS.md`. Untuk konsistensi, target akhirnya adalah script verifikasi menyediakan satu entry point dan status keluar non-zero jika ada tahap wajib gagal.

Agent wajib menjalankan script ini sebelum push dan mencantumkan perintah serta hasilnya di laporan task.

## 13. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi / tindakan |
|---|---|---|
| Role publik memperoleh akses ke records | Kebocoran data kulit | Role terpisah, privilege minimum, test PostgreSQL nyata |
| Route privat dapat diakses melalui host publik | Eksposur data sensitif | Host allowlist, blok route privat pada host booking, E2E/integration test |
| Koneksi privat tersedia dalam proses Next.js yang juga melayani publik | Jika ada bug/RCE pada jalur publik, credential privat berpotensi terpapar | Pembatasan modul server, tidak pernah mengimpor koneksi privat ke bundle/jalur publik, audit boundary; lihat Catatan keberatan |
| Booking ganda saat request bersamaan | Gangguan operasional | Constraint database dan integration test konkurensi |
| Jam kerja/durasi berubah tanpa konsistensi | Slot salah | Perhitungan server, transaksi, validasi ulang |
| Salah normalisasi WhatsApp | Profil ganda atau salah taut | Fungsi normalisasi tunggal dan test variasi input |
| Catatan kulit di log | Kebocoran privasi | Redaksi log, larangan PII, audit logging metadata saja |
| Secret masuk Git | Pengambilalihan sistem | `.gitignore`, `.env.example`, Gitleaks lokal |
| Backup gagal atau tidak dapat dipulihkan | Kehilangan data | Backup harian terenkripsi dan restore drill berkala |
| Mini PC mati/listrik padam | Layanan tidak tersedia | Restart policy, UPS bila layak, runbook recovery |
| Cloudflare Access/Turnstile memiliki batas/fitur berbeda | Deployment atau proteksi gagal | Discovery paket dan batas resmi sebelum implementasi |
| Ketentuan PDP belum dipahami | Risiko hukum dan reputasi | Tinjauan hukum, consent/versioning, minimisasi, retensi |
| Data sensitif dipakai dalam test | Kebocoran data pelanggan | Seeder sintetis saja; review laporan dan artefak test |
| Scope creep | MVP tertunda | Fitur di luar MVP tidak dikerjakan tanpa task/izin baru |

## 14. Metrik keberhasilan

Target angka final ditetapkan setelah baseline uji coba. Kriteria awal:

### Operasional booking
- Pelanggan dapat menyelesaikan satu alur booking dari ponsel tanpa bantuan admin.
- Tidak ada booking ganda untuk provider dan rentang waktu yang sama dalam uji konkurensi.
- Respons publik tidak mengungkap nama atau nomor booking lain.
- Pemilik dapat melihat dan mengonfirmasi booking dari area privat.

### Rekam kulit
- Dua akun yang ditentukan dapat login secara terpisah.
- Request tanpa sesi tidak dapat mengakses halaman atau API privat.
- Pengguna dapat menemukan pelanggan berdasarkan nama dan nomor WhatsApp.
- Riwayat kunjungan dapat dibuat dan ditampilkan kembali.
- Penanda follow-up muncul tepat pada ambang 25 hari.
- Akses lihat dan perubahan rekam tercatat di audit log.

### Keamanan dan operasi
- Test membuktikan role publik ditolak saat mengakses `records`.
- Host publik tidak menyajikan route privat.
- Tidak ada secret terdeteksi dalam pemeriksaan lokal.
- `scripts/verify.sh` berhasil sebelum setiap push task.
- Backup terenkripsi harian berjalan dan restore telah diuji.
- Sistem pulih setelah restart host sesuai runbook.
- Tidak ada data pelanggan asli di seeder, test, atau laporan.

## 15. Asumsi dan hal yang harus dikonfirmasi

Bagian ini bukan izin untuk mengubah keputusan arsitektur. Item yang belum diketahui harus menjadi discovery task atau dikonfirmasi pemilik sebelum fitur terkait dikunci.

| ID | Asumsi/pertanyaan | Tindakan |
|---|---|---|
| A-01 | Domain aktual untuk `booking.<domain>` dan `rekam.<domain>` belum diberikan | Minta domain saat persiapan deployment |
| A-02 | Dua alamat email allowlist Cloudflare Access belum diberikan | Konfigurasikan hanya di dashboard/secret store; jangan masukkan ke repo |
| A-03 | Batas paket gratis Cloudflare Access dan konfigurasi policy yang dibutuhkan belum diverifikasi | Discovery resmi sebelum Fase 3 |
| A-04 | Batas dan syarat Cloudflare Turnstile gratis belum diverifikasi | Discovery resmi sebelum Fase 1 |
| A-05 | Versi stabil PostgreSQL dan Node.js LTS yang tepat belum dipilih | Verifikasi dokumentasi resmi saat Fase 0 |
| A-06 | Versi Next.js, React, TypeScript, driver `pg`, library Argon2, Playwright, dan Gitleaks belum dikunci | Verifikasi kompatibilitas dan versi yang didukung; jangan menebak |
| A-07 | Jam operasional, hari kerja, durasi tiap treatment, jeda antar sesi belum diberikan | Pemilik mengisi pengaturan awal sebelum uji booking |
| A-08 | Cara pembagian booking kepada dua provider (pilih pelanggan atau auto-assign) belum ditentukan | Konfirmasi sebelum desain slot Fase 1 |
| A-09 | Aturan status booking dan kapan slot dianggap terisi belum difinalkan | Tetapkan sebelum migrasi booking |
| A-10 | Apakah pelanggan dapat membatalkan booking sendiri belum ditentukan | Asumsi awal: tidak; pembatalan ditangani internal |
| A-11 | Teks persetujuan dan pemberitahuan privasi belum disediakan | Pemilik menyiapkan dan meminta tinjauan hukum |
| A-12 | Masa retensi booking, profil, kunjungan, dan audit log belum ditentukan | Tinjauan hukum/operasional sebelum rilis |
| A-13 | Prosedur pemulihan akun dan pergantian perangkat belum ditentukan | Buat runbook tanpa menambah akun |
| A-14 | Spesifikasi mini PC, RAM, storage, UPS, dan kapasitas disk belum dipastikan | Audit perangkat sebelum deployment |
| A-15 | Lokasi backup luar rumah dan pengelola kunci enkripsi belum ditentukan | Tetapkan sebelum rilis |
| A-16 | Pilihan akhir runner test dan bentuk migrasi perlu diverifikasi terhadap kebutuhan repo | Discovery Fase 0; rekomendasi awal SQL berversi + `pg` |
| A-17 | Kebijakan hari libur/cuti dan pengecualian jam kerja belum dirinci | Konfirmasi saat desain pengaturan |
| A-18 | Pesan pembuka WhatsApp belum ditentukan | Gunakan teks default netral, dapat diubah dari area privat |

## 16. Kriteria penerimaan PRD

PRD dianggap siap menjadi acuan task ketika:

- [x] Dua kebutuhan bisnis dipisahkan: booking publik dan rekam kulit privat.
- [x] Keputusan satu repo privat dan satu aplikasi Next.js dipertahankan.
- [x] Pemisahan skema `booking` dan `records` dijelaskan.
- [x] Dua role database dan larangan akses publik ke records dijelaskan.
- [x] Dua hostname dan lapisan Cloudflare Access + login aplikasi dijelaskan.
- [x] Stack, deployment lokal, portabilitas, dan larangan Supabase/Netlify dicantumkan.
- [x] Fitur MVP dan fitur di luar MVP dibedakan.
- [x] Model data awal dipertahankan dan diperluas tanpa mengurangi entitas inti.
- [x] Keamanan, privasi, backup, dan UU PDP dicantumkan tanpa klaim kepatuhan hukum.
- [x] Testing lokal, larangan CI jarak jauh, dan `scripts/verify.sh` dijelaskan.
- [x] Risiko dan asumsi yang perlu diverifikasi ditandai.
- [x] Catatan keberatan dibuat terpisah dari keputusan arsitektur.

## 17. Catatan keberatan

Bagian ini menyampaikan risiko/ketegangan teknis tanpa mengubah keputusan yang telah dikunci. Pemilik/arsitek menentukan apakah akan menerima risiko atau mengeluarkan revisi arsitektur resmi.

### K-01 — Satu proses aplikasi memegang dua kredensial database

**Keputusan terkunci:** satu aplikasi Next.js melayani dua hostname; rute publik memakai `app_public`, rute privat memakai `app_private`.

**Keberatan:** bila kedua credential tersedia dalam environment proses Next.js yang sama, kompromi pada proses atau bug server-side di jalur publik dapat berpotensi membuka akses ke credential privat. Pemisahan role database melindungi dari kesalahan query biasa, tetapi tidak sepenuhnya mengisolasi dua trust domain dalam satu proses.

**Mitigasi yang tidak mengubah keputusan:** modul koneksi privat hanya boleh diimpor dari modul server privat; boundary import dan host diperiksa; tidak ada fungsi publik yang menerima pilihan role dari request; secrets tidak pernah dikirim ke client; audit dependency dan route handler; pertimbangkan isolasi proses/credential melalui deployment topology hanya jika arsitek menyetujui perubahan resmi.

### K-02 — Hak `app_public` mungkin tidak cukup untuk membaca konfigurasi booking

**Keputusan terkunci:** `app_public` hanya boleh menambah booking dan memanggil fungsi yang mengembalikan jam terisi tanpa nama/kontak; role ini tidak memiliki hak ke records.

**Keberatan:** halaman publik memerlukan pilihan treatment aktif, jam kerja, durasi treatment, dan informasi yang cukup untuk menghitung slot. Hak yang disebutkan secara literal tidak memberi izin `SELECT` ke tabel konfigurasi. Di sisi lain, konfigurasi tersebut dapat berubah dari area privat. Jika fungsi database yang aman tidak disediakan untuk membaca konfigurasi non-sensitif, implementasi dapat terdorong memakai konfigurasi statis yang mudah tidak sinkron.

**Catatan:** jangan diam-diam memberikan `SELECT` tabel konfigurasi kepada `app_public`. Arsitek perlu menentukan apakah fungsi database terbatas untuk membaca konfigurasi publik diperbolehkan sebagai penjabaran hak minimum, atau konfigurasi publik disediakan melalui mekanisme lain yang disetujui.

### K-03 — Fungsi slot “jam terisi” perlu definisi output yang presisi

**Keputusan terkunci:** fungsi publik hanya mengembalikan jam yang sudah terisi tanpa nama atau kontak.

**Keberatan:** untuk menghitung slot kosong, server perlu tahu provider, durasi, jam kerja, jeda, status booking yang memblokir, serta rentang waktu. Output harus cukup untuk menghitung ketersediaan tanpa mengungkap pola operasional atau informasi pribadi lebih dari yang diperlukan. Kontrak fungsi perlu menetapkan parameter, granularitas waktu, status yang dihitung, dan aturan zona waktu.

**Mitigasi:** spesifikasi fungsi dan test kebocoran output menjadi bagian task database/booking; jangan mengembalikan row booking mentah.

### K-04 — WhatsApp sebagai penghubung dua skema memiliki risiko salah taut

**Keputusan terkunci:** penghubung booking dan records adalah nomor WhatsApp ternormalisasi.

**Keberatan:** nomor dapat berubah, didaur ulang, dipakai bersama keluarga, atau salah input. Nomor unik membantu pencarian tetapi tidak membuktikan bahwa orang yang sedang berkomunikasi adalah pemilik rekam tertentu.

**Mitigasi:** staf memverifikasi identitas secara operasional sebelum membuka/membuat rekam; nomor tidak boleh menjadi faktor autentikasi; perubahan nomor harus melalui prosedur privat dan tercatat.

### K-05 — Persetujuan dan penghapusan membutuhkan kebijakan yang lebih spesifik

**Keputusan terkunci:** catat tanggal dan versi persetujuan; sediakan hapus atau anonimisasi.

**Keberatan:** tanggal dan versi saja belum tentu cukup sebagai bukti persetujuan yang memadai. Penghapusan juga dapat berbenturan dengan kewajiban retensi atau kebutuhan audit.

**Mitigasi:** minta tinjauan hukum atas teks, bukti, masa retensi, dan prosedur pemenuhan hak sebelum data nyata digunakan. Jangan mengklaim kepatuhan UU PDP hanya karena field consent tersedia.

### K-06 — Satu aplikasi dan dua hostname perlu proteksi host yang ketat

**Keputusan terkunci:** satu aplikasi dengan dua hostname; rute privat tidak boleh dilayani pada hostname booking.

**Keberatan:** pemisahan UI atau redirect bukan kontrol keamanan yang cukup. Route handler, server action, middleware, asset/API internal, dan variasi host dapat menjadi jalur tidak sengaja.

**Mitigasi:** validasi host di server, allowlist eksplisit, blok akses lintas host, uji semua endpoint privat dari hostname publik, dan pastikan Cloudflare Access bukan satu-satunya lapisan autentikasi.

---

### K-07 — Aksi konfirmasi booking membutuhkan hak tulis yang belum didefinisikan

**Keputusan terkunci:** role `app_private` digunakan untuk area privat, membaca booking, dan mengakses `records`. Area privat juga harus menyediakan aksi konfirmasi/perubahan status booking.

**Konflik:** membaca booking tidak otomatis memberi hak untuk mengubah status. Memberi `UPDATE` langsung pada tabel `booking.bookings` kepada role `app_private` akan memperluas privilege dari keputusan awal.

**Rekomendasi aman untuk diputuskan pemilik:** pertahankan pembacaan booking melalui `app_private`, lalu sediakan satu fungsi database terbatas untuk transisi status yang diizinkan (misalnya pending → confirmed/cancelled), dengan validasi transisi, audit, argumen minimum, owner terbatas, `search_path` aman, dan EXECUTE hanya untuk `app_private`. Jangan memberi UPDATE tabel secara luas. Ini tetap memerlukan persetujuan eksplisit pemilik sebelum implementasi.

**Gerbang:** task implementasi tombol konfirmasi booking tidak boleh memberikan privilege tulis langsung atau mengarang kontrak fungsi sebelum keputusan ini disetujui.

---

## 18. Riwayat perubahan

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 19 November 2026 | PRD awal berdasarkan spesifikasi dan keputusan arsitektur pemilik |\n| 1.1 | 19 November 2026 | Review kesesuaian: mencatat kontrak privilege konfirmasi booking sebagai keputusan terbuka |
