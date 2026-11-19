# Daftar Task Implementasi Dacie Beauty

**Status:** backlog awal, belum dikerjakan  
**Repository:** `irfannuralam44-max/dacie-beauty`  
**Sumber keputusan:** `docs/PRD.md`, `AGENTS.md`, `docs/IMPLEMENTATION-PLAN.md`, dan `skills/*/SKILL.md`  
**Urutan fase:** 0 → 1 → 2 → 3  
**Aturan:** satu task per branch, satu agent aktif, tidak push ke `main`.

Daftar ini adalah backlog implementasi yang dapat diberikan satu per satu kepada coding agent. Task berikutnya hanya dimulai setelah task dependensinya di-merge dan hasilnya tersedia pada `main`. Jika hasil audit FAIL, perbaiki task yang sama sebelum melanjutkan.

## Cara menggunakan backlog

- Jangan memberikan seluruh backlog kepada agent sekaligus. Berikan hanya satu task.
- Branch wajib mengikuti pola `agent/T-XXX-slug`, misalnya `agent/T-003-db-foundation`.
- Semua task menggunakan repository yang sama: `irfannuralam44-max/dacie-beauty`.
- Sebelum mulai dan sebelum push, ikuti prosedur Git pada `AGENTS.md`.
- Agent wajib membaca `AGENTS.md` dan skill yang relevan sebelum mengubah file.
- Agent harus menjalankan `scripts/verify.sh` sebelum push. Jika script belum tersedia, task foundation yang membuatnya harus diselesaikan terlebih dahulu; jangan mengarang hasil verifikasi.
- Perintah tes spesifik harus mengikuti script yang benar-benar ada di `package.json`/konfigurasi repo. Agent wajib mencatat perintah aktual pada laporan.
- Setiap task wajib membuat laporan di `docs/reports/T-XXX-slug.md`.
- Acceptance criteria harus dijawab satu per satu dengan bukti. Bila tidak dapat diuji, tulis **tidak terverifikasi**.
- Data uji hanya data sintetis. Jangan masukkan data pelanggan nyata, password, token, atau isi `.env` ke commit/laporan/chat.
- Estimasi adalah ukuran relatif: XS, S, M, L. Jika task ternyata membesar menjadi XL, hentikan dan usulkan pemecahan task sebelum melanjutkan.

## Kontrak laporan wajib untuk setiap task

Laporan pada `docs/reports/T-XXX-slug.md` minimal berisi:
1. Ringkasan perubahan.
2. Daftar file yang dibuat/diubah.
3. Perintah yang dijalankan dan hasilnya.
4. Acceptance criteria satu per satu: PASS/FAIL/tidak terverifikasi beserta bukti.
5. Keputusan dan asumsi.
6. Risiko atau masalah tersisa.
7. Catatan untuk auditor.

Pesan akhir agent harus mengikuti format persis dari `AGENTS.md`:

```text
Push: berhasil
Branch: <branch>
SHA: <40 chars>
Commit: <message>
Laporan: <report path>
```

Jika push gagal:

```text
Push: GAGAL
<alasan satu baris>
Laporan: <report path>
```

---

# Fase 0 — Foundation

Semua task fase 0 harus selesai dan lolos audit sebelum fase 1 dimulai.

## T-001 — Bootstrap struktur aplikasi

- **Repo:** `irfannuralam44-max/dacie-beauty`
- **Branch:** `agent/T-001-app-bootstrap`
- **Estimasi:** M
- **Tujuan:** membuat kerangka aplikasi Next.js App Router + TypeScript sesuai stack PRD.
- **Dependensi:** dokumentasi PRD dan AGENTS tersedia pada branch dasar.
- **Scope:** inisialisasi satu codebase Next.js App Router dan satu image Docker yang dapat dijalankan dengan `APP_MODE=public` atau `APP_MODE=private`; struktur source minimal; konfigurasi TypeScript/lint; placeholder route per mode; README; gunakan versi Next.js stabil yang sudah memuat perbaikan keamanan terbaru; verifikasi advisory resmi Next.js dan catat versi, URL sumber, serta tanggal pemeriksaan di laporan. Versi paket spesifik perlu diverifikasi.
- **Di luar scope:** fitur booking, autentikasi, database schema final, desain visual final.
- **Kemungkinan file:** `package.json`, lockfile, `tsconfig.json`, konfigurasi Next.js/lint, `src/app/*`, `README.md`.
- **Acceptance criteria:**
  - [ ] Aplikasi dapat di-install dari lockfile.
  - [ ] Perintah development dan build yang terdokumentasi berjalan.
  - [ ] TypeScript dan lint aktif tanpa mematikan aturan secara global.
  - [ ] Tidak ada rahasia atau file environment aktual yang dikomit.
  - [ ] Struktur awal tidak mengunci aplikasi pada vendor hosting tertentu.
  - [ ] Versi Next.js stabil dan advisory resmi keamanan terbaru diverifikasi serta URL/tanggal dicatat dalam laporan.
- **Tes:** install bersih menggunakan package manager yang dipilih; lint; typecheck jika tersedia; build; `scripts/verify.sh` setelah tersedia.
- **Laporan:** `docs/reports/T-001-app-bootstrap.md`.

## T-002 — Docker Compose development

- **Repo:** sama.
- **Branch:** `agent/T-002-dev-compose`
- **Estimasi:** M
- **Tujuan:** menyediakan lingkungan lokal berisi app dan PostgreSQL.
- **Dependensi:** T-001.
- **Scope:** Compose development dengan service `web-public`, `web-private`, dan PostgreSQL; kedua service aplikasi dibangun dari image yang sama tetapi memakai `APP_MODE` berbeda; volume persisten; healthcheck; konfigurasi port lokal; contoh environment tanpa kredensial nyata; instruksi start/stop.
- **Di luar scope:** Cloudflare Tunnel, konfigurasi produksi, backup offsite.
- **Kemungkinan file:** `compose.yaml`, `.env.example`, `.dockerignore`, `README.md`, konfigurasi container.
- **Acceptance criteria:**
  - [ ] `web-public`, `web-private`, dan PostgreSQL dapat dijalankan melalui instruksi terdokumentasi.
  - [ ] Kedua service aplikasi memakai image yang sama dengan `APP_MODE` berbeda.
  - [ ] Data database tetap ada setelah container direstart.
  - [ ] Kredensial lokal berasal dari environment, bukan hardcoded pada source.
  - [ ] Healthcheck membedakan service siap dan belum siap.
  - [ ] Tidak ada port database yang diekspos ke jaringan publik.
- **Tes:** `docker compose config`; jalankan stack; periksa health; restart service dan verifikasi volume.
- **Laporan:** `docs/reports/T-002-dev-compose.md`.

## T-003 — Konfigurasi environment dan validasi server

- **Repo:** sama.
- **Branch:** `agent/T-003-env-config`
- **Estimasi:** S
- **Tujuan:** memusatkan pembacaan konfigurasi dan mencegah aplikasi berjalan dengan konfigurasi penting yang tidak valid.
- **Dependensi:** T-001.
- **Scope:** schema validasi environment server per `APP_MODE`; `public` hanya menerima `app_public` dan secret CAPTCHA, `private` hanya menerima `app_private` dan secret sesi; `web-public` wajib menolak startup bila menemukan credential atau secret privat; dokumentasi variabel dan pesan error aman.
- **Di luar scope:** memasukkan secret produksi atau membangun secret manager.
- **Kemungkinan file:** modul konfigurasi server, `.env.example`, README, unit tests.
- **Acceptance criteria:**
  - [ ] Variabel wajib divalidasi saat startup.
  - [ ] `APP_MODE` hanya menerima `public` atau `private`.
  - [ ] Mode public hanya menerima credential `app_public` dan secret CAPTCHA.
  - [ ] Mode public gagal startup bila ada credential/secret privat (DB private atau session secret).
  - [ ] Mode private hanya menerima credential `app_private` dan secret sesi.
  - [ ] Secret tidak diekspos melalui prefix/konfigurasi client.
  - [ ] Error tidak mencetak nilai secret.
  - [ ] Contoh env berisi placeholder, bukan nilai kredensial yang dapat digunakan.
- **Tes:** unit test konfigurasi valid, hilang, dan format salah; lint; typecheck; verify.
- **Laporan:** `docs/reports/T-003-env-config.md`.

## T-004 — Migrasi awal dan schema PostgreSQL

- **Repo:** sama.
- **Branch:** `agent/T-004-db-schemas`
- **Estimasi:** L
- **Tujuan:** membuat skema `booking` dan `records` serta sistem migrasi SQL berversi.
- **Dependensi:** T-002, T-003.
- **Scope:** pilih satu mekanisme migrasi ringan; buat schema terpisah; tabel awal sesuai model data PRD; constraint, index, foreign key, timestamp; dokumentasikan cara apply dan status migrasi.
- **Di luar scope:** UI CRUD dan data pelanggan nyata.
- **Kemungkinan file:** `db/migrations/*`, skrip migrasi, `docs/database/*`, integration tests.
- **Acceptance criteria:**
  - [ ] Database kosong dapat dibangun dari seluruh migrasi secara berurutan.
  - [ ] Schema `booking` dan `records` terpisah.
  - [ ] Struktur tabel mencakup entitas awal PRD tanpa mengurangi field penting.
  - [ ] Constraint dan index yang diperlukan didefinisikan melalui migrasi.
  - [ ] Migrasi yang sudah diterapkan tidak diedit diam-diam; perubahan dibuat sebagai migrasi baru.
  - [ ] Tidak ada data pribadi nyata dalam seed/fixture.
- **Tes:** apply migrasi pada PostgreSQL kosong; apply ulang sesuai perilaku tool; integration test constraint; dokumentasikan perintah aktual.
- **Laporan:** `docs/reports/T-004-db-schemas.md`.

## T-005 — Role database dan privilege minimum

- **Repo:** sama.
- **Branch:** `agent/T-005-db-roles`
- **Estimasi:** XL
- **Tujuan:** menerapkan kontrak privilege database D-02 dan D-03 secara persis.
- **Dependensi:** T-004.
- **Scope:** buat role runtime `app_public` dan `app_private`; role pemilik fungsi `booking_fn_owner` atau nama setara dengan atribut NOLOGIN dan hak minimum; tiga fungsi publik `booking.get_public_config()`, `booking.get_blocked_intervals(p_from,p_to)`, `booking.create_booking(p_name,p_wa,p_treatment_id,p_starts_at)`; fungsi privat `booking.set_booking_status(p_booking_id,p_new_status,p_actor_user_id)`; seluruh grant/revoke D-02/D-03; tabel `booking.status_events`; audit SECURITY DEFINER, search_path, object qualification, dan default privileges.
- **Di luar scope:** UI booking, UI rekam kulit, dan logika UI pemilihan slot.
- **Kemungkinan file:** migrasi role/grant, SQL functions, tabel status_events, integration tests, dokumentasi privilege.
- **Acceptance criteria:**
  - [ ] `app_public` hanya mendapat USAGE pada schema `booking` dan EXECUTE tiga fungsi D-02; tidak mendapat USAGE pada schema `records`.
  - [ ] `app_public` tidak memiliki privilege tabel apa pun; SELECT dan INSERT langsung ke setiap tabel ditolak. UPDATE/DELETE juga tidak diberikan.
  - [ ] `get_public_config` mengembalikan treatment aktif (id/nama/durasi/jeda), jam kerja provider aktif per hari tanpa nama provider, time_off, dan booking_rules.
  - [ ] `get_blocked_intervals` hanya mengembalikan provider_id/starts_at/ends_at untuk pending/confirmed yang beririsan; rentang lebih dari 35 hari ditolak; tidak ada ID booking/nama/nomor/status.
  - [ ] `create_booking` menormalisasi WA ulang, memvalidasi D-06, memilih provider D-04, menangani konkurensi, dan hanya mengembalikan kode hasil yang ditetapkan.
  - [ ] Fungsi publik dan `set_booking_status` memakai SECURITY DEFINER, owner NOLOGIN khusus hak minimum (bukan superuser), search_path dikunci, objek dikualifikasi schema, REVOKE ALL FROM PUBLIC, dan EXECUTE hanya untuk role yang ditetapkan.
  - [ ] `app_private` memiliki SELECT seluruh tabel booking; INSERT/UPDATE tanpa DELETE pada treatments, providers, working_hours, time_off, booking_rules; tanpa DML langsung pada bookings.
  - [ ] `set_booking_status` hanya mengizinkan transisi D-03 dan menulis setiap transisi ke status_events; actor_user_id tidak memakai FK lintas schema.
  - [ ] `app_private` memiliki DML yang diperlukan pada records tanpa DDL dan bukan pemilik objek.
  - [ ] Role runtime bukan superuser; role pemilik fungsi bukan superuser dan NOLOGIN.
- **Tes:** PostgreSQL integration tests menggunakan kredensial role sebenarnya; SELECT/INSERT langsung app_public ke seluruh tabel harus gagal; hanya tiga fungsi publik dapat dieksekusi; uji output function dan rentang 35 hari; uji status transition matrix dan audit event; `scripts/verify.sh`.
- **Laporan:** `docs/reports/T-005-db-roles.md`.



## T-006 — Lapisan data access dan transaksi

- **Repo:** sama.
- **Branch:** `agent/T-006-data-access`
- **Estimasi:** M
- **Tujuan:** menyediakan pola akses database yang ditentukan oleh mode instance dan tidak memungkinkan credential silang.
- **Dependensi:** T-003, T-005.
- **Scope:** satu pilihan data-access dari PRD; pemilihan pool saat startup berdasarkan APP_MODE; instance public hanya dapat membuat pool app_public dan instance private hanya app_private; public mode tidak dapat mengimpor/membuat pool privat; parameterized query; transaksi; error aman.
- **Di luar scope:** endpoint fitur dan mekanisme untuk memilih role berdasarkan request.
- **Kemungkinan file:** `src/lib/db/*`, modul repository, config per mode, integration tests, dokumentasi.
- **Acceptance criteria:**
  - [ ] `APP_MODE=public` hanya membuat pool `app_public`.
  - [ ] `APP_MODE=private` hanya membuat pool `app_private`.
  - [ ] Test membuktikan instance public tidak dapat membuat atau mengakses pool privat, termasuk melalui import tidak sengaja.
  - [ ] Tidak ada fallback atau helper yang memungkinkan request memilih role/pool.
  - [ ] Query menggunakan parameter binding dan transaksi dapat di-rollback.
  - [ ] Secret koneksi hanya dibaca server-side dan public mode menolak secret privat saat startup.
- **Tes:** unit tests validasi APP_MODE dan pool selection; integration tests query/rollback/role; negative import/boundary tests; lint; verify.
- **Laporan:** `docs/reports/T-006-data-access.md`.



## T-007 — Kerangka test dan script verify lokal

- **Repo:** sama.
- **Branch:** `agent/T-007-local-verify`
- **Estimasi:** M
- **Tujuan:** membuat satu entry point verifikasi lokal sesuai AGENTS.
- **Dependensi:** T-001; integrasikan hasil T-004 sampai T-006.
- **Scope:** unit test runner; integration test PostgreSQL; `scripts/verify.sh`; secret scanning lokal; audit dependency (misalnya package manager audit atau tool yang dipilih setelah diverifikasi); exit code non-zero saat lint/test/secret scan/audit wajib gagal; dokumentasi setup.
- **Di luar scope:** GitHub Actions atau CI remote.
- **Kemungkinan file:** `scripts/verify.sh`, konfigurasi test, `tests/*`, README.
- **Acceptance criteria:**
  - [ ] Satu perintah menjalankan lint, test, secret scan, dan audit dependency.
  - [ ] Temuan dependency high atau critical menggagalkan verifikasi kecuali pengecualian tertulis yang disetujui dan dicatat di laporan.
  - [ ] Kegagalan salah satu tahap membuat script gagal.
  - [ ] Integration test berjalan terhadap PostgreSQL, bukan mock privilege.
  - [ ] Script tidak mencetak nilai secret.
  - [ ] Tidak ada workflow GitHub Actions ditambahkan.
- **Tes:** jalankan script pada kondisi lulus dan uji simulasi kegagalan tiap tahap; catat output ringkas.
- **Laporan:** `docs/reports/T-007-local-verify.md`.

## T-008 — Tes boundary keamanan fase foundation

- **Repo:** sama.
- **Branch:** `agent/T-008-foundation-security-tests`
- **Estimasi:** M
- **Tujuan:** mengunci pengujian otomatis untuk boundary publik/privat sejak awal.
- **Dependensi:** T-005, T-006, T-007.
- **Scope:** tes role publik tidak dapat membaca `records`; dokumentasikan kontrak host/route privat dan skenario uji negatif yang akan dijalankan setelah autentikasi tersedia. Jangan membuat stub sesi atau bypass autentikasi produksi hanya demi meluluskan tes fase foundation.
- **Di luar scope:** autentikasi final dan halaman rekam kulit.
- **Kemungkinan file:** integration/security tests, test helpers, `docs/security/*`.
- **Acceptance criteria:**
  - [ ] Tes negatif akses DB publik ke records lulus karena akses ditolak.
  - [ ] Tidak ada test helper yang membuka bypass pada production build.
  - [ ] Boundary privat terdokumentasi dan siap diperketat oleh modul auth.
  - [ ] Tes tanpa sesi dijadwalkan pada T-019/T-028, bukan disimulasikan sebagai autentikasi final di fase foundation.
  - [ ] Semua tes dapat dijalankan lokal.
- **Tes:** integration security tests; `scripts/verify.sh`.
- **Laporan:** `docs/reports/T-008-foundation-security-tests.md`.

**Gerbang fase 0:** seluruh T-001 sampai T-008 merged dan lolos audit; database privilege separation terbukti.

---

## T-038 — Spike infrastruktur awal dua instance

- **Repo:** sama.
- **Branch:** `agent/T-038-infra-spike`
- **Estimasi:** L
- **Tujuan:** mengangkat risiko infrastruktur A-03/A-04 sebelum fitur booking dan rekam kulit dibangun.
- **Dependensi:** T-008 (serta fondasi Docker Compose/environment dari T-002 dan T-003).
- **Scope:** deploy halaman "hello" sintetis sebagai dua service dari satu image dengan `APP_MODE=public/private` pada mini PC; konfigurasi Cloudflare Tunnel untuk dua hostname `booking.<domain>` → `web-public` dan `rekam.<domain>` → `web-private`; lakukan satu uji Cloudflare Access dengan dua email yang dikonfigurasi di dashboard, bukan repository; verifikasi dan catat batas paket Access serta syarat/batas Turnstile gratis ke `docs/discovery/infra.md`, masing-masing dengan URL sumber dan tanggal pemeriksaan; tandai `perlu diverifikasi` jika belum dapat dibuktikan.
- **Di luar scope:** fitur booking/records, data pelanggan, penyimpanan secret di repo, konfigurasi produksi final, klaim ketersediaan layanan/kuota yang belum diverifikasi.
- **Kemungkinan file:** Compose/dev deployment example, halaman hello mode-specific, `docs/discovery/infra.md`, catatan smoke test tanpa secret.
- **Acceptance criteria:**
  - [ ] Dua service menjalankan satu image yang sama dengan APP_MODE berbeda pada mini PC.
  - [ ] `booking.<domain>` mencapai web-public dan `rekam.<domain>` mencapai web-private melalui Tunnel.
  - [ ] Route mode silang mengembalikan 404; host guard tetap aktif.
  - [ ] Satu uji Access dilakukan dengan dua email yang dimasukkan melalui dashboard; email dan secret tidak masuk repo/laporan.
  - [ ] `docs/discovery/infra.md` mencatat URL resmi, tanggal pemeriksaan, hasil dan batas paket Access serta syarat/batas Turnstile; hal yang belum terverifikasi diberi label `perlu diverifikasi`.
  - [ ] Tidak ada data pelanggan nyata atau secret di lingkungan/repository/bukti.
- **Tes:** validasi Compose; smoke test dua hostname dari jaringan eksternal; uji route silang 404; uji Access allow/deny sesuai dua akun yang disiapkan; pemeriksaan secret scan dan `scripts/verify.sh` jika tersedia.
- **Laporan:** `docs/reports/T-038-infra-spike.md`.

## T-039 — Seeder data sintetis bersama

- **Repo:** sama.
- **Branch:** `agent/T-039-synthetic-seeder`
- **Estimasi:** M
- **Tujuan:** menyediakan dataset sintetis konsisten untuk semua unit/integration/E2E tests.
- **Dependensi:** T-005 (dan schema/migration T-004).
- **Scope:** seeder treatment, provider, jam kerja, dan pelanggan fiktif; seluruh nama pelanggan diawali `Contoh`; gunakan nomor yang jelas tidak mungkin nyata dan hanya untuk test (misalnya pola placeholder yang ditetapkan dalam test config); data records sintetis dengan consent fixture yang eksplisit; idempotensi/cleanup aman untuk database test.
- **Di luar scope:** data pelanggan asli, nomor WA yang dapat dihubungi, seeding production, isi catatan sensitif nyata.
- **Kemungkinan file:** `db/seed/*`, test fixtures, `tests/fixtures/*`, dokumentasi seeder.
- **Acceptance criteria:**
  - [ ] Seeder mengisi treatment, provider, jam kerja, dan customer fiktif.
  - [ ] Semua nama customer diawali `Contoh`.
  - [ ] Nomor WhatsApp seed jelas bukan nomor pelanggan/nomor yang dapat dihubungi dan hanya digunakan dalam test.
  - [ ] Seeder dapat dijalankan berulang tanpa membuat duplikasi atau merusak data lain.
  - [ ] Semua E2E/integration tests menggunakan dataset seeder/fixture sintetis ini.
  - [ ] Seeder tidak dijalankan otomatis pada production.
- **Tes:** jalankan seed pada database test kosong dan berulang; verifikasi jumlah/identitas fixture; jalankan test suite yang memakai fixtures; `scripts/verify.sh`.
- **Laporan:** `docs/reports/T-039-synthetic-seeder.md`.

# Fase 1 — Booking publik

## T-009 — Kontrak domain booking dan status

- **Repo:** sama.
- **Branch:** `agent/T-009-booking-contract`
- **Estimasi:** S
- **Tujuan:** menetapkan aturan domain booking sebelum implementasi slot dan UI.
- **Dependensi:** T-008.
- **Scope:** definisi status booking, transisi status, timezone Asia/Jakarta, durasi, jeda, provider, batas tanggal pemesanan, dan semantik “permintaan diterima” versus “dikonfirmasi”.
- **Di luar scope:** tampilan halaman.
- **Kemungkinan file:** domain types, dokumentasi domain, unit tests.
- **Acceptance criteria:**
  - [ ] Status dan transisinya terdokumentasi serta tervalidasi.
  - [ ] Request baru tidak dianggap confirmed secara otomatis.
  - [ ] Aturan timezone dan interval booking eksplisit.
  - [ ] Edge case pembatalan/perubahan jadwal dicatat.
- **Tes:** unit tests untuk validasi status/transisi dan aturan waktu.
- **Laporan:** `docs/reports/T-009-booking-contract.md`.

## T-010 — Implementasi get_public_config publik

- **Repo:** sama.
- **Branch:** `agent/T-010-public-booking-config`
- **Estimasi:** M
- **Tujuan:** mengimplementasikan fungsi `booking.get_public_config()` sebagai kontrak baca konfigurasi publik yang terbatas.
- **Dependensi:** T-005, T-006, T-009.
- **Scope:** implementasi `booking.get_public_config()` sesuai D-02; treatment aktif (id, nama, durasi menit, jeda menit); jam kerja per provider aktif per hari (provider_id, hari, mulai, selesai, tanpa nama provider); pengecualian time_off; booking_rules; SECURITY DEFINER dengan owner/privilege/search_path sesuai T-005. `app_public` tetap tanpa privilege tabel.
- **Di luar scope:** halaman admin untuk mengubah konfigurasi.
- **Kemungkinan file:** SQL migration, server repository, route handler, integration tests.
- **Acceptance criteria:**
  - [ ] Fungsi mengembalikan semua field D-02 dan tidak menyertakan nama provider atau data booking/customer.
  - [ ] Tidak ada nama pelanggan, nomor WA, atau data records pada hasil.
  - [ ] Koneksi menggunakan `app_public`.
  - [ ] Tidak ada grant SELECT luas pada tabel operasional.
  - [ ] `app_public` hanya dapat EXECUTE fungsi ini dan tidak dapat SELECT tabel konfigurasi.
- **Tes:** integration test bentuk output dan privilege; verify.
- **Laporan:** `docs/reports/T-010-public-booking-config.md`.

## T-011 — Mesin kalkulasi slot server-side

- **Repo:** sama.
- **Branch:** `agent/T-011-slot-engine`
- **Estimasi:** L
- **Tujuan:** menghitung slot yang tersedia berdasarkan aturan operasional.
- **Dependensi:** T-009, T-010.
- **Scope:** kalkulasi slot server-side memakai `get_public_config()` dan `get_blocked_intervals(p_from,p_to)`; rentang query blocked maksimal 35 hari; Asia/Jakarta; jam kerja; durasi/jeda; time_off; aturan slot_step/min_notice/max_advance; tampilkan slot jika minimal satu provider aktif kosong. Provider final dipilih di create_booking.
- **Di luar scope:** UI booking dan notifikasi.
- **Kemungkinan file:** domain service slot, query/function DB, unit/integration tests.
- **Acceptance criteria:**
  - [ ] Slot dihitung server-side dan tidak mempercayai slot dari browser.
  - [ ] Slot di luar jam kerja atau dalam jeda tidak ditawarkan.
  - [ ] Slot memperhitungkan durasi treatment, jeda, time_off, dan setiap provider aktif.
  - [ ] UI menawarkan slot bila minimal satu provider kosong; pelanggan tidak memilih provider.
  - [ ] Query blocked tidak meminta rentang lebih dari 35 hari.
  - [ ] Timezone tidak bergantung pada timezone mesin klien.
  - [ ] Tidak ada data identitas booking lain yang dikembalikan.
- **Tes:** unit tests boundary waktu, DST tidak relevan untuk Asia/Jakarta tetapi offset harus eksplisit; integration test dengan booking sintetis.
- **Laporan:** `docs/reports/T-011-slot-engine.md`.

## T-012 — Pembuatan booking dan collision prevention

- **Repo:** sama.
- **Branch:** `agent/T-012-booking-create`
- **Estimasi:** L
- **Tujuan:** menyimpan booking secara aman dan mencegah double booking.
- **Dependensi:** T-005, T-006, T-009, T-011.
- **Scope:** pembuatan booking hanya melalui `booking.create_booking(p_name,p_wa,p_treatment_id,p_starts_at)`; normalisasi ulang WA; validasi aturan D-06; provider otomatis berdasarkan priority; constraint/locking untuk konkurensi; response hanya kode hasil yang ditentukan.
- **Di luar scope:** integrasi WhatsApp API atau konfirmasi otomatis.
- **Kemungkinan file:** booking service/repository, route handler, SQL migration tambahan, integration tests.
- **Acceptance criteria:**
  - [ ] Server memvalidasi ulang seluruh field.
  - [ ] Request memakai role `app_public` dan hanya memanggil fungsi `create_booking`; tidak ada INSERT langsung ke tabel booking.
  - [ ] Batas maksimal dua booking aktif pending/confirmed dan belum lewat per WA ditegakkan di fungsi/database.
  - [ ] Aturan langkah 30 menit, minimal 3 jam, maksimal 30 hari, dan pending tanpa expiry otomatis ditegakkan.
  - [ ] Dua request bersamaan untuk slot sama tidak menghasilkan dua booking aktif yang bentrok.
  - [ ] Nomor WA dinormalisasi dengan satu aturan konsisten.
  - [ ] Response tidak mengungkap detail booking pihak lain.
- **Tes:** integration test concurrency dan invalid input pada PostgreSQL; verify.
- **Laporan:** `docs/reports/T-012-booking-create.md`.

## T-013 — UI halaman booking Bahasa Indonesia

- **Repo:** sama.
- **Branch:** `agent/T-013-booking-ui`
- **Estimasi:** M
- **Tujuan:** membangun halaman booking mobile-first dengan lima field.
- **Dependensi:** T-010, T-011, T-012.
- **Scope:** identitas visual Dacie Beauty clean/premium; form berisi nama, WhatsApp, treatment, tanggal, waktu; state loading/error/success; aksesibilitas dasar; responsif; tampilkan satu kalimat pemberitahuan privasi statis di bawah tombol kirim dengan tautan ke halaman privasi.
- **Di luar scope:** form keluhan kulit, upload foto, akun pelanggan, pembayaran.
- **Kemungkinan file:** `src/app/(booking)/*`, components booking, styles, UI tests.
- **Acceptance criteria:**
  - [ ] Form hanya meminta lima field yang disetujui.
  - [ ] Pemberitahuan privasi statis di bawah tombol kirim menyatakan nama dan nomor WhatsApp hanya dipakai untuk konfirmasi jadwal dan memiliki tautan ke halaman privasi.
  - [ ] Pemberitahuan privasi bukan field atau checkbox tambahan; teks final disiapkan pemilik dan ditandai untuk tinjauan hukum.
  - [ ] Seluruh label dan pesan UI berbahasa Indonesia.
  - [ ] Slot berasal dari API server.
  - [ ] UI membedakan permintaan diterima dari booking dikonfirmasi.
  - [ ] Tampilan usable pada viewport mobile.
  - [ ] Form memiliki label, fokus keyboard, dan pesan error yang dapat dipahami.
- **Tes:** component/UI tests; responsive check; lint; verify.
- **Laporan:** `docs/reports/T-013-booking-ui.md`.

## T-014 — Proteksi abuse untuk endpoint publik

- **Repo:** sama.
- **Branch:** `agent/T-014-booking-abuse-protection`
- **Estimasi:** M
- **Tujuan:** mengurangi spam dan penyalahgunaan form booking.
- **Dependensi:** T-012, T-013.
- **Scope:** rate limiting yang sesuai arsitektur; validasi format WA; CAPTCHA gratis jika batas dan ketentuan sudah diverifikasi; error handling dan logging tanpa PII.
- **Di luar scope:** layanan CAPTCHA berbayar atau WhatsApp API.
- **Kemungkinan file:** middleware/route protection, validation schema, config, tests, docs.
- **Acceptance criteria:**
  - [ ] Rate limit berlaku di server dan memiliki perilaku saat limit terlampaui.
  - [ ] Validasi WA konsisten dengan normalisasi database.
  - [ ] Secret CAPTCHA (jika digunakan) hanya server-side.
  - [ ] CAPTCHA tidak diaktifkan dengan konfigurasi yang belum diverifikasi.
  - [ ] Log tidak berisi nama, nomor WA, atau data form lengkap.
- **Tes:** unit/integration tests rate limit dan validation; test konfigurasi CAPTCHA; verify.
- **Laporan:** `docs/reports/T-014-booking-abuse-protection.md`.

## T-015 — E2E dan hardening alur booking

- **Repo:** sama.
- **Branch:** `agent/T-015-booking-e2e`
- **Estimasi:** L
- **Tujuan:** memastikan alur booking publik bekerja end-to-end.
- **Dependensi:** T-011 sampai T-014.
- **Scope:** Playwright booking berhasil; validasi gagal; slot tidak tersedia; dua submit bersamaan; verifikasi tidak ada data privat pada response.
- **Di luar scope:** pengujian produksi dengan data pelanggan.
- **Kemungkinan file:** `tests/e2e/*`, Playwright config, test fixtures sintetis, docs.
- **Acceptance criteria:**
  - [ ] E2E membuat booking sintetis dari UI sampai database.
  - [ ] E2E memverifikasi status request bukan confirmed otomatis.
  - [ ] E2E slot penuh/invalid menampilkan hasil aman.
  - [ ] Concurrency/double booking diuji di integration test.
  - [ ] Tes tidak menggunakan data pribadi nyata.
- **Tes:** Playwright; integration suite; `scripts/verify.sh`.
- **Laporan:** `docs/reports/T-015-booking-e2e.md`.

**Gerbang fase 1:** seluruh T-009 sampai T-015 merged dan lolos audit; alur booking publik stabil dan tidak dapat mengakses records.

---

# Fase 2 — Rekam kulit privat

## T-016 — Pemisahan hostname dan route privat

- **Repo:** sama.
- **Branch:** `agent/T-016-private-boundary`
- **Estimasi:** M
- **Tujuan:** memastikan area privat hanya disajikan pada hostname privat.
- **Dependensi:** T-008, T-015.
- **Scope:** route/mode guard untuk dua instance dari satu codebase/image; `web-public` (`APP_MODE=public`) hanya melayani route booking dan mengembalikan 404 untuk route privat; `web-private` (`APP_MODE=private`) hanya melayani route privat dan mengembalikan 404 untuk route publik; host guard allowlist sebagai lapisan kedua; trusted host/proxy handling.
- **Di luar scope:** konfigurasi Cloudflare produksi.
- **Kemungkinan file:** middleware/server host guard, route groups, tests, docs.
- **Acceptance criteria:**
  - [ ] `web-public` mengembalikan 404 untuk seluruh route privat pada lapisan routing.
  - [ ] `web-private` mengembalikan 404 untuk seluruh route publik pada lapisan routing.
  - [ ] Host guard allowlist memvalidasi hostname sesuai mode instance.
  - [ ] Kedua service memakai satu image/codebase yang sama dengan APP_MODE terpisah.
  - [ ] Pemeriksaan dilakukan di server, bukan hanya menyembunyikan link.
  - [ ] Host header tidak dipercaya tanpa validasi.
  - [ ] Test mencakup hostname yang diizinkan dan ditolak.
- **Tes:** integration/E2E host boundary; verify.
- **Laporan:** `docs/reports/T-016-private-boundary.md`.

## T-017 — Autentikasi dua akun tanpa registrasi

- **Repo:** sama.
- **Branch:** `agent/T-017-private-auth`
- **Estimasi:** L
- **Tujuan:** menyediakan login untuk tepat dua akun yang diizinkan.
- **Dependensi:** T-006, T-016.
- **Scope:** pilih dan implementasikan pendekatan auth yang disetujui PRD; password hashing kuat (misalnya Argon2id setelah verifikasi dukungan); bootstrap dua akun melalui prosedur aman; tanpa registration route.
- **Di luar scope:** 2FA dan SSO.
- **Kemungkinan file:** auth service, login route/page, migrations, admin bootstrap script, tests.
- **Acceptance criteria:**
  - [ ] Tidak ada endpoint pendaftaran publik.
  - [ ] Hanya dua akun yang diizinkan dapat dibuat/diaktifkan.
  - [ ] Password disimpan sebagai hash, bukan plaintext.
  - [ ] Kredensial awal tidak dikomit atau ditulis ke laporan.
  - [ ] Login gagal tidak membocorkan apakah email tertentu terdaftar.
- **Tes:** unit/integration auth tests; negative registration tests; verify.
- **Laporan:** `docs/reports/T-017-private-auth.md`.

## T-018 — Sesi aman dan proteksi percobaan login

- **Repo:** sama.
- **Branch:** `agent/T-018-session-security`
- **Estimasi:** M
- **Tujuan:** melindungi sesi autentikasi dan mengurangi brute force.
- **Dependensi:** T-017.
- **Scope:** session expiry; invalidation/logout; cookie Secure, HttpOnly, SameSite; CSRF protection sesuai mekanisme; rate limit login; rotasi session ID setelah login.
- **Di luar scope:** 2FA.
- **Kemungkinan file:** session module, middleware, auth routes, tests, docs.
- **Acceptance criteria:**
  - [ ] Cookie sesi memiliki atribut keamanan sesuai deployment HTTPS.
  - [ ] Sesi memiliki masa berlaku dan dapat diakhiri.
  - [ ] Session identifier dirotasi setelah autentikasi.
  - [ ] Percobaan login dibatasi.
  - [ ] Mutasi state terlindungi dari CSRF sesuai pola framework.
- **Tes:** integration tests cookie/session/logout/rate limit/CSRF; verify.
- **Laporan:** `docs/reports/T-018-session-security.md`.

## T-019 — Otorisasi privat dan koneksi app_private

- **Repo:** sama.
- **Branch:** `agent/T-019-private-authorization`
- **Estimasi:** L
- **Tujuan:** memastikan seluruh operasi rekam kulit dilindungi autentikasi dan memakai DB role privat.
- **Dependensi:** T-005, T-006, T-017, T-018.
- **Scope:** server-side auth guard; helper otorisasi; koneksi DB privat; penolakan unauthorized/forbidden; tes route dan service.
- **Di luar scope:** CRUD profil pelanggan.
- **Kemungkinan file:** auth guard, private data access, route handlers, tests.
- **Acceptance criteria:**
  - [ ] Setiap route privat memeriksa sesi di server.
  - [ ] Semua operasi records menggunakan `app_private`.
  - [ ] Public route tidak dapat memanggil helper/koneksi privat.
  - [ ] Request tanpa sesi ditolak tanpa membocorkan data.
  - [ ] Test negatif untuk role dan route tersedia.
- **Tes:** integration tests dengan dua role DB dan berbagai status sesi; verify.
- **Laporan:** `docs/reports/T-019-private-authorization.md`.

## T-020 — Identitas dasar pelanggan dan pencarian

- **Repo:** sama.
- **Branch:** `agent/T-020-customer-profiles`
- **Estimasi:** M
- **Tujuan:** mengelola daftar dan profil pelanggan pada area privat.
- **Dependensi:** T-019.
- **Scope:** daftar pelanggan dan pencarian nama; buat/ubah profil identitas dasar yang hanya berisi nama dan nomor WhatsApp ternormalisasi. Field jenis kulit, keluhan utama, alergi/sensitivitas, catatan kulit, dan data kunjungan ditunda sampai consent tercatat pada T-021.
- **Di luar scope:** foto before-after dan import massal.
- **Kemungkinan file:** customer service/repository, private routes/pages, forms, tests.
- **Acceptance criteria:**
  - [ ] Hanya pengguna terautentikasi dapat mencari/membaca/mengubah profil.
  - [ ] Nomor WA disimpan dalam format normalisasi yang konsisten.
  - [ ] Profil dasar tidak menyimpan field kesehatan/kulit.
  - [ ] Pencarian nama tidak mengembalikan data di luar area privat.
  - [ ] Validasi dan batas panjang input diterapkan di server.
  - [ ] Tidak ada PII pada log umum.
- **Tes:** integration CRUD/search; auth negative tests; UI tests; verify.
- **Laporan:** `docs/reports/T-020-customer-profiles.md`.

## T-021 — Persetujuan dan alur privasi pelanggan

- **Repo:** sama.
- **Branch:** `agent/T-021-customer-consent-privacy`
- **Estimasi:** M
- **Tujuan:** mencatat persetujuan dan menyediakan penanganan permintaan penghapusan/anonymisasi.
- **Dependensi:** T-020.
- **Scope:** consent timestamp dan consent text version; registry/rujukan versi teks consent; tampilkan status consent; sediakan tindakan pencatatan consent sebelum field kesehatan/kulit dapat dibuat atau diubah; alur permintaan penghapusan/anonymisasi yang aman; catat keputusan dan hasil.
- **Di luar scope:** klaim sertifikasi/kepatuhan hukum.
- **Kemungkinan file:** migration, consent service/UI, privacy workflow, tests, docs.
- **Acceptance criteria:**
  - [ ] Catatan consent menyimpan waktu dan versi teks yang disetujui.
  - [ ] Versi teks consent dapat ditelusuri.
  - [ ] Server menolak pembuatan/perubahan field kesehatan/kulit jika consent belum tercatat.
  - [ ] Profil dasar identitas boleh ada sebelum consent, tetapi tidak boleh berisi catatan kulit/kunjungan.
  - [ ] Permintaan penghapusan/anonymisasi tidak dieksekusi diam-diam tanpa otorisasi.
  - [ ] Dampak terhadap riwayat booking/audit dan kewajiban retensi didokumentasikan.
  - [ ] Teks final ditandai untuk review hukum bila diperlukan.
- **Tes:** integration tests consent, versioning, authorization, dan deletion workflow; verify.
- **Laporan:** `docs/reports/T-021-customer-consent-privacy.md`.

## T-022 — Riwayat kunjungan perawatan

- **Repo:** sama.
- **Branch:** `agent/T-022-visit-history`
- **Estimasi:** M
- **Tujuan:** menyimpan riwayat kunjungan dan catatan perawatan.
- **Dependensi:** T-020, T-021.
- **Scope:** lengkapi profil dengan jenis kulit, keluhan utama, alergi/sensitivitas, dan catatan; lalu riwayat kunjungan berisi tanggal, treatment, kondisi kulit, produk digunakan, rekomendasi, tanggal follow-up, dan created_by. Semua operasi data kesehatan/kulit wajib memeriksa consent di server sebelum insert/update.
- **Di luar scope:** diagnosis medis otomatis, rekomendasi AI, foto before-after.
- **Kemungkinan file:** visit repository/service, private pages/forms, migrations, tests.
- **Acceptance criteria:**
  - [ ] Kunjungan selalu terhubung ke customer yang valid.
  - [ ] Profil kesehatan/kulit dan kunjungan ditolak jika consent belum tercatat.
  - [ ] Created_by mencatat akun privat yang membuat catatan.
  - [ ] Data hanya dapat diakses melalui server privat.
  - [ ] Input tervalidasi dan tidak mengklaim diagnosis medis.
  - [ ] Riwayat ditampilkan urut dan jelas.
- **Tes:** integration CRUD dan authorization; UI tests; verify.
- **Laporan:** `docs/reports/T-022-visit-history.md`.

## T-023 — Penanda follow-up 25 hari

- **Repo:** sama.
- **Branch:** `agent/T-023-follow-up-marker`
- **Estimasi:** S
- **Tujuan:** menandai pelanggan yang kunjungan terakhirnya sudah mencapai ambang follow-up.
- **Dependensi:** T-022.
- **Scope:** aturan hitung berdasarkan tanggal Asia/Jakarta; indikator pada daftar pelanggan/dashboard privat; penanganan jika belum pernah berkunjung.
- **Di luar scope:** pengiriman reminder otomatis.
- **Kemungkinan file:** domain service/query, UI indicator, unit tests.
- **Acceptance criteria:**
  - [ ] Penanda muncul ketika kunjungan terakhir >=25 hari sesuai definisi PRD.
  - [ ] Pelanggan tanpa kunjungan tidak salah ditandai.
  - [ ] Perhitungan konsisten pada timezone Asia/Jakarta.
  - [ ] Tidak ada pesan otomatis yang dikirim.
- **Tes:** unit tests batas 24/25 hari, tanggal lintas bulan/tahun, dan tanpa kunjungan; verify.
- **Laporan:** `docs/reports/T-023-follow-up-marker.md`.

## T-024 — Daftar booking pada dashboard privat

- **Repo:** sama.
- **Branch:** `agent/T-024-private-booking-list`
- **Estimasi:** M
- **Tujuan:** menampilkan booking untuk pemilik dan istri.
- **Dependensi:** T-019, T-012.
- **Scope:** daftar booking dan filter tanggal/status; detail yang diperlukan; baca melalui `app_private`; sorot booking berstatus pending yang berumur lebih dari 24 jam; jangan mengubah data booking dari jalur publik.
- **Di luar scope:** integrasi kalender eksternal.
- **Kemungkinan file:** booking private repository, dashboard pages, tests.
- **Acceptance criteria:**
  - [ ] Hanya dua akun privat dapat melihat daftar.
  - [ ] Data berasal dari schema booking melalui koneksi privat.
  - [ ] Filter tanggal/status berjalan di server.
  - [ ] Booking pending yang berumur lebih dari 24 jam ditonjolkan; pending tidak kedaluwarsa otomatis.
  - [ ] Tidak ada data booking privat yang bocor ke public response.
- **Tes:** integration query; authorization tests; UI tests; verify.
- **Laporan:** `docs/reports/T-024-private-booking-list.md`.

## T-025 — Konfirmasi manual dan buka/buat rekam kulit

- **Repo:** sama.
- **Branch:** `agent/T-025-booking-customer-link`
- **Estimasi:** L
- **Tujuan:** menghubungkan alur booking ke proses kerja manual pemilik.
- **Dependensi:** T-020, T-021, T-024.
- **Scope:** tombol konfirmasi manual memanggil `booking.set_booking_status(p_booking_id,p_new_status,p_actor_user_id)` melalui app_private; link WhatsApp `wa.me` dengan template yang dapat diedit; buka profil berdasarkan WA; jika belum ada, buat profil identitas dasar saja. Pengisian data kulit/kunjungan tetap melewati consent gate T-021/T-022.
- **Di luar scope:** WhatsApp API, pengiriman otomatis, auto-merge profil.
- **Kemungkinan file:** booking actions, customer matching service, WhatsApp link helper, UI, tests.
- **Acceptance criteria:**
  - [ ] Link WhatsApp dibuat dari nomor yang sudah dinormalisasi dan pesan yang di-encode dengan benar.
  - [ ] Pesan pembuka dapat diedit dari pengaturan privat.
  - [ ] Pencocokan WA dilakukan di server dan hanya pada area privat.
  - [ ] Status booking hanya diubah melalui fungsi `booking.set_booking_status`; tidak ada DML langsung ke `booking.bookings`.
  - [ ] Hanya transisi pending → confirmed/cancelled dan confirmed → cancelled/completed/no_show yang diterima.
  - [ ] completed/no_show hanya dapat ditetapkan setelah starts_at lewat.
  - [ ] Setiap transisi menghasilkan baris `booking.status_events` dengan actor dan waktu.
  - [ ] Jika ada kecocokan, pengguna dapat membuka profil yang sesuai.
  - [ ] Jika tidak ada kecocokan, pembuatan profil memerlukan tindakan eksplisit.
  - [ ] Tidak ada penggabungan otomatis yang berisiko menyatukan dua orang berbeda.
- **Tes:** unit tests normalisasi/URL encoding; integration matching; auth tests; verify.
- **Laporan:** `docs/reports/T-025-booking-customer-link.md`.

## T-026 — Pengaturan treatment, provider, dan jam kerja

- **Repo:** sama.
- **Branch:** `agent/T-026-operations-settings`
- **Estimasi:** M
- **Tujuan:** memberi pemilik kendali atas pengaturan operasional booking.
- **Dependensi:** T-019, T-010, T-011, T-012.
- **Scope:** CRUD treatment, provider, jam kerja, time_off, dan booking_rules melalui grant app_private D-03; provider priority; is_active untuk menonaktifkan; validasi jadwal/durasi/jeda; public config tetap melalui tiga fungsi D-02.
- **Di luar scope:** inventory, kasir, komisi.
- **Kemungkinan file:** settings service/pages, migrations bila diperlukan, tests.
- **Acceptance criteria:**
  - [ ] Hanya akun privat dapat mengubah pengaturan.
  - [ ] Pengaturan mencakup treatments, providers, working_hours, time_off, booking_rules.
  - [ ] app_private hanya INSERT/UPDATE tanpa DELETE pada tabel konfigurasi; nonaktifkan entitas melalui is_active.
  - [ ] Tidak ada DML langsung app_private pada booking.bookings.
  - [ ] Validasi mencegah durasi/jam kerja invalid.
  - [ ] Public booking membaca konfigurasi melalui interface publik yang dibatasi.
  - [ ] Perubahan tidak mengubah booking historis secara tidak sengaja.
  - [ ] Perubahan berdampak pada kalkulasi slot baru sesuai aturan.
- **Tes:** integration CRUD; slot regression tests; authorization tests; verify.
- **Laporan:** `docs/reports/T-026-operations-settings.md`.

## T-027 — Audit log akses dan perubahan

- **Repo:** sama.
- **Branch:** `agent/T-027-audit-log`
- **Estimasi:** M
- **Tujuan:** mencatat siapa melihat atau mengubah record pelanggan dan kapan.
- **Dependensi:** T-019, T-020, T-022, T-026.
- **Scope:** event audit untuk read/view dan mutation yang ditetapkan PRD; actor; action; object reference; timestamp; UI/akses audit terbatas bila dibutuhkan.
- **Di luar scope:** logging isi lengkap catatan kesehatan.
- **Kemungkinan file:** audit service, middleware/wrapper, migration, tests, docs.
- **Acceptance criteria:**
  - [ ] Event akses/perubahan yang diwajibkan tercatat.
  - [ ] Actor dan timestamp tercatat.
  - [ ] Audit log tidak menyimpan salinan isi sensitif record.
  - [ ] Pengguna biasa tidak dapat mengubah atau menghapus jejak audit.
  - [ ] Kegagalan audit ditangani sesuai kebijakan yang terdokumentasi.
  - [ ] Perubahan treatment, provider, jam kerja, durasi, dan jeda juga menghasilkan audit event.
- **Tes:** integration tests untuk view/create/update dan proteksi audit; verify.
- **Laporan:** `docs/reports/T-027-audit-log.md`.

## T-028 — E2E privat dan audit akses

- **Repo:** sama.
- **Branch:** `agent/T-028-private-e2e`
- **Estimasi:** L
- **Tujuan:** memverifikasi alur kerja privat dan seluruh boundary penting.
- **Dependensi:** T-017 sampai T-027.
- **Scope:** E2E login, cari/buat profil sintetis, tambah kunjungan, follow-up, lihat booking, buka link WhatsApp tanpa mengirim pesan; tes akses tanpa sesi dan host publik.
- **Di luar scope:** pilot dengan data pelanggan nyata.
- **Kemungkinan file:** `tests/e2e/private/*`, fixtures sintetis, docs.
- **Acceptance criteria:**
  - [ ] Alur privat utama lulus E2E.
  - [ ] Tanpa sesi ditolak pada halaman dan API privat.
  - [ ] Hostname booking tidak dapat membuka route privat.
  - [ ] Public DB role tidak dapat membaca records.
  - [ ] Data sintetis digunakan dan dibersihkan sesuai kebutuhan.
  - [ ] Tidak ada screenshot/laporan yang mengandung data pribadi nyata.
- **Tes:** Playwright; integration security tests; `scripts/verify.sh`.
- **Laporan:** `docs/reports/T-028-private-e2e.md`.

**Gerbang fase 2:** seluruh T-016 sampai T-028 merged dan lolos audit keamanan serta fungsional.

---

# Fase 3 — Hardening dan release

## T-029 — Checklist kesiapan produksi dan konfigurasi production

- **Repo:** sama.
- **Branch:** `agent/T-029-production-readiness`
- **Estimasi:** M
- **Tujuan:** menyiapkan konfigurasi produksi yang terpisah dari development.
- **Dependensi:** T-028.
- **Scope:** audit konfigurasi; production Compose dengan service `web-public` dan `web-private` dari satu image yang sama dengan APP_MODE berbeda, plus PostgreSQL; restart policy `unless-stopped`; healthcheck; volume persisten; least privilege; pengaturan log; dokumentasi konfigurasi.
- **Di luar scope:** membuka port router atau menanam secret produksi di repo.
- **Kemungkinan file:** `compose.prod.yaml` atau konfigurasi Compose terpisah, Dockerfile, docs/deployment.
- **Acceptance criteria:**
  - [ ] Development dan production configuration terpisah.
  - [ ] `web-public`, `web-private`, dan PostgreSQL memiliki restart policy yang sesuai.
  - [ ] `web-public` hanya menerima app_public dan CAPTCHA secret serta menolak secret privat.
  - [ ] `web-private` hanya menerima app_private dan session secret.
  - [ ] Kedua service app menggunakan image yang sama.
  - [ ] Database memakai volume persisten.
  - [ ] Secret dipasok dari environment/secret file di host, tidak dikomit.
  - [ ] Tidak ada port router yang perlu dibuka.
- **Tes:** validasi Compose; deploy rehearsal lokal; restart service; verify.
- **Laporan:** `docs/reports/T-029-production-readiness.md`.

## T-030 — Deployment mini PC Linux

- **Repo:** sama.
- **Branch:** `agent/T-030-mini-pc-deploy`
- **Estimasi:** M
- **Tujuan:** menjalankan stack pada mini PC Linux target.
- **Dependensi:** T-029.
- **Scope:** panduan instalasi host; deploy container; volume; environment setup; pemeriksaan resource dan health; enkripsi disk host sesuai kemampuan perangkat; update keamanan OS; konfigurasi SSH berbasis key dan penonaktifan password login setelah akses pemulihan diuji; prosedur update/restart. Jangan melakukan perubahan partisi/enkripsi destruktif pada host berisi data tanpa backup dan persetujuan pemilik.
- **Di luar scope:** konfigurasi Tunnel/Access.
- **Kemungkinan file:** deployment docs, scripts operasional non-secret.
- **Acceptance criteria:**
  - [ ] App dan database berjalan pada perangkat target.
  - [ ] Layanan pulih setelah container restart.
  - [ ] Data tetap ada setelah restart.
  - [ ] Enkripsi disk dan hardening SSH/OS diverifikasi atau keterbatasannya dicatat eksplisit.
  - [ ] Tidak ada secret pada script atau repo.
  - [ ] Instruksi dapat diulang oleh pemilik.
- **Tes:** smoke test dari LAN; reboot/restart test; verifikasi volume.
- **Laporan:** `docs/reports/T-030-mini-pc-deploy.md`.

## T-031 — Cloudflare Tunnel dan dua hostname

- **Repo:** sama.
- **Branch:** `agent/T-031-cloudflare-tunnel`
- **Estimasi:** M
- **Tujuan:** menghubungkan hostname publik dan privat ke service yang tepat tanpa port forwarding.
- **Dependensi:** T-016, T-030.
- **Scope:** konfigurasi Tunnel yang mengarahkan `booking.<domain>` ke service `web-public` dan `rekam.<domain>` ke service `web-private`; keduanya dua instance dari satu codebase dan satu image Docker dengan APP_MODE berbeda; host guard aplikasi membatasi route pada masing-masing mode; dokumentasi DNS/Tunnel; verifikasi dokumentasi resmi terkini. Jangan membuat fork atau codebase aplikasi terpisah.
- **Di luar scope:** menganggap Tunnel sebagai autentikasi aplikasi.
- **Kemungkinan file:** deployment docs dan konfigurasi contoh tanpa token.
- **Acceptance criteria:**
  - [ ] Tidak ada token Tunnel dalam repository.
  - [ ] `booking.<domain>` menuju service web-public (`APP_MODE=public`).
  - [ ] `rekam.<domain>` menuju service web-private (`APP_MODE=private`).
  - [ ] Kedua service berasal dari image Docker yang sama, tetapi berjalan sebagai dua instance terpisah.
  - [ ] Hostname booking hanya menyajikan halaman/endpoint publik.
  - [ ] Hostname rekam menuju boundary privat.
  - [ ] Tidak ada port router yang diekspos.
  - [ ] Pengujian memastikan route privat tetap ditolak pada hostname publik.
- **Tes:** smoke test dari jaringan eksternal; host routing tests; audit secret.
- **Laporan:** `docs/reports/T-031-cloudflare-tunnel.md`.

## T-032 — Cloudflare Access allowlist privat

- **Repo:** sama.
- **Branch:** `agent/T-032-cloudflare-access`
- **Estimasi:** M
- **Tujuan:** membatasi akses hostname privat hanya untuk dua email yang disetujui.
- **Dependensi:** T-031.
- **Scope:** konfigurasi Access allowlist dua email; dokumentasi enrollment; verifikasi fitur/batas paket resmi terkini; pertahankan login aplikasi.
- **Di luar scope:** menghapus autentikasi aplikasi atau menambahkan akun ketiga.
- **Kemungkinan file:** deployment/security docs, checklist konfigurasi dashboard (tanpa secret).
- **Acceptance criteria:**
  - [ ] Hanya dua email yang ditetapkan dapat melewati Access.
  - [ ] Login aplikasi tetap diwajibkan setelah Access.
  - [ ] Pengguna lain ditolak sebelum mencapai area privat.
  - [ ] Batas paket dan kemampuan yang dipakai telah diverifikasi dan dicatat.
  - [ ] Tidak ada klaim konfigurasi berhasil tanpa bukti pengujian.
- **Tes:** uji allow dan deny menggunakan akun yang disetujui/tidak disetujui; tes login aplikasi; dokumentasikan hasil.
- **Laporan:** `docs/reports/T-032-cloudflare-access.md`.

## T-033 — Backup PostgreSQL terenkripsi

- **Repo:** sama.
- **Branch:** `agent/T-033-encrypted-backup`
- **Estimasi:** M
- **Tujuan:** membuat backup database harian dengan salinan lokal eksternal dan offsite.
- **Dependensi:** T-030.
- **Scope:** skrip backup; enkripsi; retensi; target disk eksternal; mekanisme salinan offsite; notifikasi/log status tanpa data sensitif; dokumentasi pemulihan kunci.
- **Di luar scope:** menyimpan kunci enkripsi di samping satu-satunya salinan backup.
- **Kemungkinan file:** `scripts/backup/*`, docs/operations, konfigurasi contoh.
- **Acceptance criteria:**
  - [ ] Backup terjadwal harian.
  - [ ] File backup terenkripsi.
  - [ ] Ada salinan pada disk eksternal dan satu salinan offsite.
  - [ ] Kunci pemulihan tidak hanya disimpan pada host yang sama.
  - [ ] Kegagalan backup dapat diketahui pemilik.
  - [ ] Tidak ada isi backup atau secret dikomit.
- **Tes:** jalankan backup sintetis; verifikasi file terenkripsi; uji dekripsi pada lingkungan terkontrol; dokumentasikan hasil.
- **Laporan:** `docs/reports/T-033-encrypted-backup.md`.

## T-034 — Restore drill dan runbook pemulihan

- **Repo:** sama.
- **Branch:** `agent/T-034-restore-drill`
- **Estimasi:** L
- **Tujuan:** membuktikan backup dapat dipulihkan dan prosedur recovery dapat diikuti.
- **Dependensi:** T-033.
- **Scope:** restore ke lingkungan terisolasi; verifikasi schema dan record sintetis; dokumentasikan langkah, waktu, prasyarat, dan kegagalan; runbook recovery.
- **Di luar scope:** restore langsung menimpa produksi tanpa persetujuan.
- **Kemungkinan file:** `docs/operations/restore-runbook.md`, scripts restore, test evidence sintetis.
- **Acceptance criteria:**
  - [ ] Restore dari backup terenkripsi berhasil pada lingkungan terisolasi.
  - [ ] Struktur schema dan data sintetis tervalidasi.
  - [ ] Langkah pemulihan dan kebutuhan kunci terdokumentasi.
  - [ ] Tidak ada data pelanggan nyata dalam bukti laporan.
  - [ ] Batasan RPO/RTO yang realistis dicatat sebagai target yang perlu disetujui pemilik.
- **Tes:** restore drill penuh; smoke test aplikasi pada database hasil restore.
- **Laporan:** `docs/reports/T-034-restore-drill.md`.

## T-035 — Uji reboot dan pemulihan setelah listrik mati

- **Repo:** sama.
- **Branch:** `agent/T-035-power-recovery`
- **Estimasi:** M
- **Tujuan:** memastikan sistem kembali berjalan setelah host restart atau kehilangan daya.
- **Dependensi:** T-030, T-034.
- **Scope:** prosedur reboot terkontrol; validasi restart container/database; pemeriksaan konsistensi; recovery manual bila service gagal.
- **Di luar scope:** menjanjikan uptime tanpa UPS atau monitoring eksternal.
- **Kemungkinan file:** ops scripts/docs, checklist test.
- **Acceptance criteria:**
  - [ ] Setelah reboot host, container kembali berjalan sesuai policy.
  - [ ] Database lulus pemeriksaan kesiapan.
  - [ ] Aplikasi dapat melayani smoke test setelah database siap.
  - [ ] Prosedur jika service gagal terdokumentasi.
  - [ ] Tidak ada klaim bahwa kehilangan daya tidak mungkin merusak hardware/data.
- **Tes:** reboot test terencana; smoke test; pemeriksaan database; catat hasil.
- **Laporan:** `docs/reports/T-035-power-recovery.md`.

## T-036 — Panduan migrasi VPS dan operasional

- **Repo:** sama.
- **Branch:** `agent/T-036-vps-migration-guide`
- **Estimasi:** S
- **Tujuan:** mendokumentasikan pemindahan aplikasi ke VPS tanpa ketergantungan vendor.
- **Dependensi:** T-029, T-034.
- **Scope:** panduan menyiapkan host; menyalin konfigurasi environment secara aman; memindahkan Compose; restore database; mengalihkan Tunnel/DNS; validasi pascamigrasi.
- **Di luar scope:** benar-benar membeli VPS atau memindahkan produksi tanpa persetujuan.
- **Kemungkinan file:** `docs/operations/vps-migration.md`, deployment docs.
- **Acceptance criteria:**
  - [ ] Langkah migrasi dapat diikuti tanpa bergantung pada layanan hosting tertentu.
  - [ ] Tidak ada secret aktual dalam dokumen.
  - [ ] Backup/restore menjadi jalur perpindahan database.
  - [ ] Langkah validasi dan rollback terdokumentasi.
- **Tes:** walkthrough dokumentasi menggunakan lingkungan rehearsal bila tersedia; periksa semua path dan perintah.
- **Laporan:** `docs/reports/T-036-vps-migration-guide.md`.

## T-037 — Pilot sintetis dan release sign-off

- **Repo:** sama.
- **Branch:** `agent/T-037-release-pilot`
- **Estimasi:** M
- **Tujuan:** menjalankan pemeriksaan akhir menggunakan data sintetis sebelum pemilik menyetujui penggunaan.
- **Dependensi:** T-031 sampai T-036.
- **Scope:** checklist booking, rekam kulit, Access, backup, restore, recovery; temuan; release notes; keputusan go/no-go.
- **Di luar scope:** memasukkan data pelanggan nyata ke staging/test atau menyatakan kepatuhan hukum.
- **Kemungkinan file:** `docs/release/*`, checklist pilot, laporan.
- **Acceptance criteria:**
  - [ ] Semua gerbang fase 0–3 memiliki bukti.
  - [ ] Booking publik dan rekam kulit privat diuji dari jalur akses yang benar.
  - [ ] Data sintetis digunakan.
  - [ ] Backup dan restore drill memiliki hasil yang dapat ditinjau.
  - [ ] Temuan kritis ditutup sebelum go-live.
  - [ ] Keputusan go/no-go diberikan pemilik setelah audit.
- **Tes:** checklist release end-to-end; `scripts/verify.sh`; smoke tests deployment; review laporan.
- **Laporan:** `docs/reports/T-037-release-pilot.md`.

**Gerbang fase 3:** T-029 sampai T-037 selesai, audit keamanan dan operasional lulus, dan pemilik memberikan persetujuan rilis.

---

## Ringkasan backlog

| Fase | Rentang task | Jumlah |
|---|---|---:|
| 0 — Foundation | T-001–T-008 | 8 |
| 1 — Booking publik | T-009–T-015 | 7 |
| 2 — Rekam kulit privat | T-016–T-028 | 13 |
| 3 — Hardening & release | T-029–T-037 | 9 |
| **Total** | **T-001–T-037** | **37** |

## Aturan perubahan backlog

- Perubahan scope harus dicatat pada task dan laporan, bukan dilakukan diam-diam.
- Jika acceptance criteria memerlukan perubahan PRD, agent berhenti dan mengajukan keputusan kepada pemilik.
- Task baru diberi ID berikutnya; jangan memakai ulang ID yang sudah pernah dipakai.
- Task tidak dianggap selesai hanya karena branch berhasil di-push. Selesai setelah laporan dan diff diaudit serta pemilik meng-merge.
- Urutan fase tetap. Pemilik dapat menyetujui perubahan urutan task dalam fase bila dependensi tetap terpenuhi, tetapi tidak boleh melewati gerbang keamanan.

**Catatan:** task list ini adalah rencana, bukan bukti bahwa implementasi atau tes telah dijalankan.
