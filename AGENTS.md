# AGENTS.md — Aturan Kerja Agent Dacie Beauty

Dokumen ini adalah sumber instruksi utama untuk seluruh coding agent yang bekerja pada repository Dacie Beauty. Baca dokumen ini dan `docs/PRD.md` sebelum mengubah kode atau dokumentasi.

Jika instruksi task, percakapan, atau asumsi agent bertentangan dengan dokumen ini atau keputusan arsitektur yang dikunci dalam PRD, **berhenti dan laporkan konflik**. Jangan memilih solusi sendiri yang mengubah arsitektur.

## 1. Identitas proyek dan sumber kebenaran

- Repository: `irfannuralam44-max/dacie-beauty` (private).
- Aplikasi: satu aplikasi Next.js App Router dalam satu repository.
- Bahasa dokumentasi dan UI: Bahasa Indonesia.
- Zona waktu bisnis: `Asia/Jakarta`.
- Dokumen produk dan arsitektur: `docs/PRD.md`.
- Instruksi agent utama: `AGENTS.md`.
- Setiap task harus memiliki lingkup, kriteria penerimaan, dan laporan.
- Jangan mengarang keputusan, versi paket, batas layanan pihak ketiga, atau hasil pengujian.

### 1.1 Keputusan arsitektur yang tidak boleh diubah sepihak

1. Satu repo privat `dacie-beauty`, tanpa fork Easy!Appointments.
2. Satu aplikasi Next.js, dua area dan dua hostname:
   - `booking.<domain>`: publik.
   - `rekam.<domain>`: privat, Cloudflare Access dan login aplikasi.
3. Data booking berada pada skema PostgreSQL `booking`; data kulit/kesehatan hanya berada pada skema `records`.
4. Role `app_public` hanya boleh membuat booking dan memanggil fungsi terbatas yang mengembalikan informasi waktu terisi tanpa nama/kontak. Role ini tidak memiliki hak apa pun atas `records`.
5. Role `app_private` digunakan untuk area privat dan boleh mengakses data `records` serta membaca booking sesuai kebutuhan.
6. Rute privat tidak boleh dilayani melalui hostname booking.
7. Tepat dua akun privat; tidak ada pendaftaran publik.
8. Stack Next.js App Router, TypeScript, React, Node.js LTS, PostgreSQL, Docker Compose, Linux, Cloudflare Tunnel. Tidak menggunakan Supabase atau Netlify.
9. Tidak ada GitHub Actions atau CI jarak jauh.
10. Semua test, lint, dan secret scanning dijalankan lokal melalui `scripts/verify.sh`.
11. Agent tidak pernah push ke `main`. Merge hanya oleh pemilik setelah audit PASS.
12. Test, seeder, screenshot, dan laporan hanya boleh memakai data sintetis.

Jika implementasi menemui ketegangan teknis, dokumentasikan dalam laporan pada bagian keputusan/asumsi dan masalah tersisa. Jangan melemahkan pemisahan keamanan untuk membuat implementasi lebih mudah.

## 2. Wajib dibaca sebelum mulai

Sebelum mengerjakan task:

1. Baca `AGENTS.md`.
2. Baca bagian PRD yang relevan di `docs/PRD.md`.
3. Baca task yang diberikan dan kriteria penerimaannya.
4. Periksa skill relevan di `skills/` jika tersedia.
5. Periksa struktur repository dan kondisi implementasi saat ini. Jangan mengasumsikan file, script, dependency, atau service sudah ada.
6. Identifikasi risiko privasi, keamanan, migrasi, dan kompatibilitas sebelum mengubah file.

Jangan memperluas task tanpa persetujuan pemilik.

## 3. Sinkronisasi Git sebelum bekerja

Setiap task dikerjakan pada branch baru dengan pola:

```text
agent/T-XXX-slug
```

Contoh: `agent/T-004-booking-schema`.

Urutan wajib sebelum membuat branch:

```bash
git fetch origin --prune
git status --short
git switch main
git pull --ff-only origin main
git status --short
git switch -c agent/T-XXX-slug
```

Ketentuan:

- Working tree harus bersih sebelum berpindah branch dan membuat branch.
- Pastikan `main` lokal sama dengan `origin/main` setelah fast-forward.
- Jangan menghapus atau menyembunyikan perubahan lokal yang bukan milik task.
- Jika working tree tidak bersih, berhenti dan laporkan. Jangan menjalankan `git reset --hard`, `git clean -fd`, atau stash tanpa instruksi pemilik.
- Jika `git pull --ff-only` gagal karena divergensi atau kondisi yang tidak dapat diselesaikan fast-forward, berhenti. Jangan merge, rebase main, atau force update main. Catat kondisi dan bukti di laporan.
- Jika branch task sudah ada, jangan menimpanya. Periksa status dan minta arahan pemilik.
- Jangan pernah bekerja langsung pada `main`.

Setelah sinkronisasi, catat branch dasar dan commit awal di laporan.

## 4. Aturan saat implementasi

- Kerjakan hanya lingkup task.
- Pertahankan kompatibilitas dengan keputusan PRD dan task sebelumnya.
- Jangan mengganti stack, database, model autentikasi, pembagian skema, hostname, atau deployment tanpa persetujuan arsitek/pemilik.
- Jangan menambah layanan vendor atau dependency eksternal tanpa alasan dan pencatatan.
- Sebelum menambah dependency, periksa apakah fungsi dapat dipenuhi dengan dependency yang sudah ada. Verifikasi lisensi, status pemeliharaan, kompatibilitas, dan versi yang dipilih.
- Jika mengambil kode/pola dari proyek open source, periksa lisensi dan catat nama proyek, URL sumber, lisensi, bagian yang diadaptasi, dan kewajiban atribusinya di PRD atau catatan task yang relevan.
- Jangan menyalin kode Easy!Appointments atau membuat fork darinya.
- Jangan mengubah UI menjadi alasan untuk memperlemah backend, validasi, atau keamanan.
- Jangan menambahkan fitur di luar MVP tanpa task dan persetujuan eksplisit.
- Jangan menyimpan data sensitif di browser storage, URL, query string, analytics, atau log.
- Jangan mengekspos kredensial privat ke client bundle, route publik, Server Action publik, atau response publik.
- Hindari `any`; jika benar-benar diperlukan, beri alasan dan batasi cakupannya.
- Hindari duplikasi aturan bisnis; normalisasi nomor WhatsApp, validasi, dan perhitungan slot harus mempunyai sumber implementasi yang jelas.
- Gunakan nama variabel, fungsi, dan tipe yang jelas. UI dan dokumentasi untuk pengguna menggunakan Bahasa Indonesia.
- Jangan mengubah atau menghapus test yang gagal hanya untuk membuat verifikasi hijau. Perbaiki penyebabnya atau laporkan blocker.

## 5. Aturan keamanan dan privasi wajib

### 5.1 Data

- Data pelanggan nyata tidak boleh digunakan di lokal, test, seeder, fixture, screenshot, issue, laporan, atau chat.
- Gunakan data palsu yang jelas sintetis. Jangan memakai nama, nomor telepon, atau catatan pelanggan sungguhan.
- Data kulit/kesehatan hanya berada pada skema `records`.
- Booking publik tidak boleh meminta keluhan, alergi, jenis kulit, foto, atau data kesehatan.
- Nomor WhatsApp adalah penghubung operasional setelah normalisasi ke `62xxxxxxxxxx`, bukan faktor autentikasi.
- Jangan menyalin otomatis isi booking ke catatan kulit.

### 5.2 Database

- Gunakan koneksi role yang benar secara eksplisit: `app_public` untuk alur publik dan `app_private` untuk alur privat.
- Jangan membuat fallback yang menjalankan query publik dengan role privat.
- Jangan memberi `app_public` akses langsung ke tabel/skema `records`.
- Jangan memberi hak database yang luas kepada `PUBLIC`, role aplikasi, atau role runtime.
- Gunakan query berparameter dan transaksi untuk operasi yang memerlukan konsistensi.
- Periksa hak akses default untuk tabel, sequence, dan function baru pada setiap migrasi.
- Test lokal harus membuktikan akses `app_public` ke `records` ditolak oleh PostgreSQL sungguhan.
- Fungsi yang dieksekusi role publik harus mengembalikan data minimum dan tidak mengungkap nama/kontak. Jika memakai `SECURITY DEFINER`, audit owner, privilege execute, argumen, dan `search_path`.

### 5.3 Web dan autentikasi

- Validasi input di server dengan schema yang eksplisit.
- Escape output sesuai konteks; jangan merender HTML mentah dari input.
- Terapkan proteksi CSRF untuk operasi perubahan state.
- Cookie sesi wajib `Secure`, `HttpOnly`, dan `SameSite` yang sesuai.
- Terapkan batas percobaan login dan rate limit booking.
- Rute privat harus menolak request tanpa sesi sah.
- Validasi hostname menggunakan allowlist yang eksplisit.
- Rute privat harus ditolak dari hostname booking.
- Error publik tidak boleh membocorkan stack trace, SQL, konfigurasi, atau data pribadi.
- Jangan mencatat nama, nomor WhatsApp, keluhan, alergi, catatan kulit, password, token sesi, atau secret ke log.

### 5.4 Secret

- Jangan pernah menampilkan atau menyalin isi secret ke output terminal yang akan dimasukkan laporan/chat.
- Jangan commit `.env`, token tunnel, password, private key, secret sesi, credential database, atau file backup.
- `.env.example` hanya berisi nama variabel dan placeholder dummy.
- Jangan mengirim secret melalui chat, laporan, issue, atau commit.
- Jika menemukan secret yang sudah ter-commit, hentikan pekerjaan, jangan mengulang nilainya, laporkan lokasi/path saja, dan minta pemilik melakukan rotasi serta penanganan riwayat Git.
- Secret scanning wajib dilakukan lokal.

### 5.5 Logging dan audit

- Log aplikasi tidak boleh memuat data pelanggan.
- Audit log aplikasi privat harus mencatat identitas user, aksi, objek, dan waktu tanpa menyalin isi sensitif.
- Akses lihat rekam pelanggan juga merupakan peristiwa audit.
- Jangan menganggap log debug sebagai pengganti audit log.

## 6. Konvensi kode dan repository

Konvensi berikut menjadi baseline; sesuaikan detail tooling dengan scaffold yang benar-benar ada dan catat pilihan di dokumentasi proyek.

- TypeScript strict mode bila kompatibel dengan baseline aplikasi.
- Next.js App Router; tempatkan kode server dan client secara eksplisit.
- Koneksi database, autentikasi, dan akses records hanya pada server.
- Jangan mengimpor modul database atau secret ke Client Component.
- Gunakan pemisahan modul yang mudah diaudit, misalnya domain booking, domain records, auth, database, dan UI.
- Validasi boundary input pada server, bukan hanya pada form.
- Tipe domain dan schema validasi harus konsisten.
- Gunakan SQL berparameter.
- Migrasi database bersifat berversi, dapat ditinjau, dan tidak menghapus data tanpa task/izin eksplisit.
- Jangan melakukan perubahan schema manual yang tidak direpresentasikan sebagai migration file.
- Komponen UI harus responsif dan mobile-first.
- Aksesibilitas dasar: label input, pesan error yang jelas, navigasi keyboard, dan kontras yang memadai.
- Hindari hardcode timezone; gunakan `Asia/Jakarta` sebagai zona waktu bisnis yang dikonfigurasi secara eksplisit.
- Format tanggal/waktu untuk pengguna mengikuti locale Indonesia dan zona waktu bisnis.
- Jangan mengunci versi dependency sebelum diverifikasi; gunakan package manager dan lockfile yang sudah dipilih repository.
- Jangan mengganti package manager atau menghapus lockfile tanpa persetujuan.

### 6.1 Conventional Commits

Semua commit harus mengikuti format Conventional Commits:

```text
<type>(<scope>): <ringkasan imperatif>
```

Contoh:

- `docs(prd): define booking and private records requirements`
- `feat(booking): add public booking form`
- `fix(auth): reject expired sessions`
- `test(db): verify public role cannot read records`
- `chore(verify): add local secret scanning`

Gunakan body commit bila diperlukan untuk menjelaskan alasan atau dampak. Jangan masukkan PII atau secret ke pesan commit.

## 7. Testing dan verifikasi lokal

### 7.1 Satu entry point wajib

Repository harus menyediakan:

```bash
scripts/verify.sh
```

Script ini menjadi entry point lokal untuk lint, test, pemeriksaan tipe/build yang ditetapkan, integration test dengan PostgreSQL Docker, dan secret scanning (misalnya Gitleaks). Script harus mengembalikan exit code non-zero jika tahap wajib gagal.

Jangan menganggap perintah internal sudah tersedia sebelum memeriksa `package.json`, file konfigurasi, dan dokumentasi repository. Jangan mengarang nama script.

### 7.2 Alur lokal yang diharapkan

Setelah scaffold tersedia, agent harus mengikuti dokumentasi repo untuk:

1. Menyiapkan environment lokal dari contoh konfigurasi tanpa memakai secret produksi.
2. Menjalankan PostgreSQL melalui Docker Compose.
3. Menerapkan migrasi database.
4. Menjalankan seeder sintetis bila diperlukan.
5. Menjalankan test yang relevan.
6. Menjalankan `scripts/verify.sh`.
7. Memeriksa diff dan memastikan tidak ada file rahasia atau data nyata.

Perintah dasar pemeriksaan Git:

```bash
git status --short
git diff --check
git diff --stat
git diff
```

Jalankan perintah yang benar-benar didefinisikan repo. Jika PostgreSQL/Docker atau dependency belum tersedia, laporkan blocker; jangan menyatakan test lulus.

### 7.3 Cakupan test keamanan minimum

- Koneksi `app_public` ditolak ketika membaca tabel pada skema `records`.
- Fungsi slot publik tidak mengembalikan nama atau kontak.
- Rute privat menolak request tanpa sesi.
- Rute privat ditolak pada hostname booking.
- Sesi kedaluwarsa dan logout tidak dapat digunakan kembali.
- Booking bersamaan pada provider dan waktu yang bertabrakan tidak keduanya berhasil.
- Audit log mencatat view dan update rekam.
- Test hanya memakai data sintetis.

### 7.4 Larangan CI

- Dilarang membuat, mengaktifkan, atau mengandalkan GitHub Actions.
- Dilarang memakai CI jarak jauh lain untuk menggantikan verifikasi lokal.
- Jangan menambahkan workflow `.github/workflows/` kecuali pemilik mengubah aturan secara tertulis.
- Status CI hosted bukan bukti pengganti `scripts/verify.sh`.

## 8. Sebelum push

Sebelum push, wajib:

```bash
scripts/verify.sh
git diff --check
git status --short
git diff --stat
```

Lalu sinkronkan informasi remote:

```bash
git fetch origin --prune
```

Periksa apakah `origin/main` bergerak dari base branch task:

- Jika `origin/main` tidak bergerak, lanjutkan.
- Jika `origin/main` bergerak, rebase branch task ke `origin/main`, selesaikan konflik dengan hati-hati, lalu jalankan ulang seluruh verifikasi.
- Jika rebase tidak aman atau konflik tidak dapat diselesaikan dengan yakin, berhenti dan laporkan.
- Dilarang force push, termasuk `--force-with-lease`.
- Dilarang push ke `main`.
- Push hanya branch task yang sedang dikerjakan.

Contoh push:

```bash
git push -u origin agent/T-XXX-slug
```

Jangan menyatakan push berhasil sebelum menerima hasil sukses dari Git.

## 9. Laporan task wajib

Setiap task harus memiliki laporan Markdown pada:

```text
docs/reports/T-XXX-slug.md
```

Laporan harus berisi semua bagian berikut:

1. **Ringkasan perubahan** — apa yang dibuat/diubah dan alasan.
2. **Daftar file berubah** — path dan ringkasan.
3. **Lingkungan dan sinkronisasi** — branch dasar, commit awal, status working tree, hasil fetch/pull.
4. **Perintah yang dijalankan** — perintah nyata, hasil, dan status exit; jangan menulis secret.
5. **Hasil `scripts/verify.sh`** — perintah, hasil tiap tahap bila tersedia, exit code.
6. **Kriteria penerimaan** — checklist satu per satu, masing-masing dengan bukti yang dapat diperiksa.
7. **Keputusan atau asumsi** — pilihan yang dibuat dan alasan; tandai yang belum dikonfirmasi.
8. **Masalah tersisa** — blocker, risiko, test yang tidak dapat dijalankan.
9. **Hal untuk auditor** — area sensitif, file penting, langkah reproduksi, dan perhatian khusus.
10. **Git** — branch, commit SHA, pesan commit, hasil push.

Jangan masukkan nama, nomor WhatsApp, catatan kulit, data pelanggan, password, token, environment value sensitif, atau isi secret ke laporan.

### 9.1 Format chat setelah task

Setelah laporan disimpan dan branch berhasil di-push, pesan chat agent harus berisi **persis** lima baris berikut, tanpa salam, penjelasan, bullet tambahan, atau ringkasan:

```text
Push: berhasil
Branch: <nama branch>
SHA: <40 karakter>
Commit: <pesan commit>
Laporan: <path file laporan>
```

Jika push gagal, chat hanya berisi:

```text
Push: GAGAL
Alasan: <satu baris alasan tanpa secret>
Laporan: <path file laporan>
```

Jangan mengklaim push berhasil jika hanya commit lokal yang berhasil.

## 10. Batas peran auditor dan pemilik

- Agent tidak boleh menggabungkan branch ke `main`.
- Agent tidak boleh mengubah aturan audit atau menandai task PASS.
- Pemilik yang memutuskan merge setelah audit.
- Auditor tidak memiliki akses ke PC lokal dan hanya dapat memeriksa bukti yang diberikan pemilik.
- Laporan, `git diff --stat main...<branch>`, dan diff yang diminta menjadi bukti audit.
- Hasil test yang tidak disertai bukti dianggap **tidak terverifikasi** oleh auditor.
- Jangan menghapus laporan setelah task selesai.

## 11. Kondisi wajib berhenti dan eskalasi

Hentikan pekerjaan dan laporkan jika:

- Repository/branch tidak dapat disinkronkan secara fast-forward.
- Working tree berisi perubahan yang bukan bagian task.
- Task bertentangan dengan PRD atau instruksi ini.
- Solusi membutuhkan perubahan arsitektur terkunci.
- Ditemukan kemungkinan kebocoran data atau secret.
- Test memerlukan data pelanggan asli.
- Test keamanan gagal atau privilege database lebih luas dari yang diizinkan.
- Dependency atau layanan pihak ketiga memerlukan keputusan biaya, kebijakan, atau pemrosesan data yang belum disetujui.
- Tidak ada bukti cukup untuk menyatakan kriteria penerimaan terpenuhi.

**Prinsip akhir:** lebih baik berhenti dengan laporan blocker yang jujur daripada menyelesaikan task dengan mengorbankan privasi, keamanan, atau keputusan arsitektur Dacie Beauty.
