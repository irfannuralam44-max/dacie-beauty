# Laporan Dokumentasi DOC-009 — Perbaikan Audit

**Tanggal:** 20 November 2026  
**Jenis pekerjaan:** perbaikan dokumentasi dan backlog; tidak menulis kode aplikasi  
**Branch:** `docs/DOC-009-audit-fixes`  
**Base branch:** `docs/DOC-008-architect-decisions`  
**Commit dasar:** `0de0413092d8f346991b44561fb35531f6a3bb5e`  
**Status:** perubahan tersimpan pada branch remote; belum dibuat PR dan belum di-merge ke `main`.

## 1. Ringkasan perubahan

Temuan audit DOC-008 diperbaiki tanpa mengubah keputusan D-01 sampai D-10, ruang lingkup MVP, urutan fase, atau aturan kerja agent. T-005 dipecah secara logis menjadi role/privilege (T-005), fungsi publik (T-042), dan fungsi status (T-043). Backlog kini berisi 43 task unik, tidak ada estimasi XL, dan dependensi diperbarui.

Constraint exclusion anti-tabrakan dipindahkan menjadi tanggung jawab T-004 sehingga tersedia sebelum fungsi booking mengandalkannya. T-010 dan T-012 dibatasi pada lapisan aplikasi. Fixture WhatsApp harus valid menurut aturan produksi tanpa percabangan environment. Kepercayaan IP Cloudflare, pengujian spoofing, serta pilihan penyimpanan counter rate limit didokumentasikan. PRD, AGENTS, rencana fase, backlog, dan skill PostgreSQL diselaraskan.

Tidak ada kode aplikasi, SQL migration, konfigurasi runtime, Dockerfile, Compose, atau GitHub Actions yang dibuat/diubah. Tidak ada fitur yang dinyatakan sudah diuji.

## 2. Daftar file berubah

| File | Ringkasan |
|---|---|
| `docs/IMPLEMENTATION-TASKS.md` | T-005 dipecah; T-042/T-043 ditambahkan; ownership SQL/aplikasi, constraint, fixture, IP trust, dependensi, gerbang fase, ringkasan 43 task, dan format pesan gagal diselaraskan |
| `docs/IMPLEMENTATION-PLAN.md` | Peta dependensi dan urutan Fase 0/1 diperbarui; T-004 constraint, T-005 roles, T-042/T-043 functions, T-039 dependencies, dan gerbang Fase 0 diselaraskan |
| `docs/PRD.md` | Risiko D-01 ditulis sebagai residual risk; A-03/A-04 diperbarui; tes wajib 12.2 ditambah; audit dependency masuk 12.3; keberatan F-05 dicatat |
| `AGENTS.md` | Pemetaan DOC-009; aturan fixture WhatsApp; cakupan test keamanan minimum 7.3 diperluas |
| `skills/postgres-migrations-and-roles/SKILL.md` | Ownership T-005/T-042/T-043 dan urutan constraint T-004 ditegaskan |
| `docs/reports/DOC-009-audit-fixes.md` | Laporan pekerjaan ini |

Tidak ada perubahan terhadap file lain yang diperlukan untuk enam perbaikan ini.

## 3. Daftar perbaikan F-01 sampai F-07

### F-01 — Pecah T-005 dan perbarui dependensi/backlog

- `docs/IMPLEMENTATION-TASKS.md`, T-005: estimasi XL diubah menjadi M; scope hanya role runtime, role owner NOLOGIN, grant/revoke schema/tabel, default privileges, dan tes koneksi role nyata.
- `docs/IMPLEMENTATION-TASKS.md`, T-042: task baru estimasi L untuk tiga fungsi publik D-02, acceptance criteria dan tes PostgreSQL yang sebelumnya tercantum di T-005.
- `docs/IMPLEMENTATION-TASKS.md`, T-043: task baru estimasi M untuk `set_booking_status`, `status_events` bila belum ada di T-004, matriks transisi D-03, dan tes.
- `docs/IMPLEMENTATION-TASKS.md`: T-006 tetap bergantung pada T-005; T-010/T-011/T-012 bergantung pada T-042; T-025 bergantung pada T-043; T-039 bergantung pada T-005 dan T-042. Gerbang Fase 0 mencakup T-042/T-043.
- `docs/IMPLEMENTATION-PLAN.md`: peta dependensi, urutan Fase 0, catatan dependensi, dan gerbang keluar Fase 0 diperbarui.
- Ringkasan backlog: Fase 0 = 12, Fase 1 = 7, Fase 2 = 13, Fase 3 = 11; total = 43 task.

### F-02 — Pisahkan SQL dari lapisan aplikasi

- `docs/IMPLEMENTATION-TASKS.md`, T-042: ditetapkan sebagai satu-satunya pemilik SQL untuk `get_public_config()`, `get_blocked_intervals(...)`, dan `create_booking(...)`.
- `docs/IMPLEMENTATION-TASKS.md`, T-010: hanya server repository, tipe, route handler, dan tes bentuk output yang memanggil `get_public_config()` melalui `app_public`; tidak membuat SQL/migration fungsi.
- `docs/IMPLEMENTATION-TASKS.md`, T-012: hanya validasi input server, pemanggilan `create_booking`, pemetaan kode hasil ke respons aman, dan tes konkurensi melalui jalur aplikasi.
- `docs/IMPLEMENTATION-PLAN.md` dan skill PostgreSQL: ownership yang sama ditegaskan agar tidak ada implementasi SQL ganda.

### F-03 — Constraint anti-tabrakan sebelum fungsi

- `docs/IMPLEMENTATION-TASKS.md`, T-004: exclusion constraint untuk menolak interval pending/confirmed yang beririsan pada provider yang sama, verifikasi `btree_gist`, hak role migrasi untuk membuat extension, dan integration test database ditetapkan pada schema foundation.
- `docs/IMPLEMENTATION-TASKS.md`, T-012: hanya menguji perilaku constraint melalui jalur aplikasi; tidak membuat constraint, migration, atau extension.
- `docs/IMPLEMENTATION-PLAN.md` dan skill PostgreSQL: constraint T-004 harus ada sebelum T-042 membuat fungsi yang mengandalkannya.

### F-04 — Fixture WhatsApp tanpa percabangan environment

- `docs/IMPLEMENTATION-TASKS.md`, T-039: nomor fixture harus memenuhi format/normalisasi nomor seluler Indonesia yang diverifikasi untuk produksi, diletakkan dalam satu blok bernama `TEST_WA_FIXTURES`, didokumentasikan khusus test, dan tidak pernah dihubungi.
- `docs/IMPLEMENTATION-TASKS.md`, T-012: validasi aplikasi dan fungsi database harus konsisten dan tidak boleh bercabang menurut environment.
- `AGENTS.md`, bagian 5.1: aturan fixture yang sama berlaku untuk seluruh test/seeder. Sistem tidak mengirim pesan otomatis.

### F-05 — IP klien di belakang Cloudflare Tunnel

- `docs/IMPLEMENTATION-TASKS.md`, T-014: hanya mempercayai header IP yang ditetapkan Cloudflare bila request dipastikan melalui Tunnel; header spoof dari koneksi langsung diabaikan dan diuji. Tempat penyimpanan counter wajib dipilih serta dampak hilangnya counter memori saat restart dicatat di laporan.
- `docs/IMPLEMENTATION-TASKS.md`, T-018: aturan sumber IP tepercaya dan tes spoofing diterapkan pada rate limit login.
- `docs/IMPLEMENTATION-TASKS.md`, T-031: prosedur Tunnel memverifikasi jalur request sebelum mempercayai header; tes negatif spoofing dari koneksi langsung ditambahkan.
- `docs/PRD.md`, Catatan keberatan: risiko pemalsuan header dan hilangnya counter saat restart dicatat. Pilihan penyimpanan bersama tidak diputuskan sepihak; konsekuensi biaya/privasi harus diajukan kepada pemilik.

### F-06 — Sisa teks usang PRD

- `docs/PRD.md`, bagian 13: risiko koneksi privat diganti menjadi risiko residual kode privat yang ikut berada dalam image yang sama; mitigasi startup web-public menolak secret privat, route mode silang 404, dan tes impor. Rujukan yang menyiratkan keberatan D-01 masih terbuka dihapus.
- `docs/PRD.md`, bagian 15: A-03 diarahkan ke T-038 (Fase 0) dan dikonfirmasi ulang di T-032; A-04 diarahkan ke T-038 sebelum T-014.
- `docs/PRD.md`, bagian 12.2: tes rentang 35 hari, batas dua booking aktif per WA, matriks status, startup public menolak secret privat, 404 mode silang kedua instance, slot_step, min_notice, max_advance, dan time_off ditambahkan.
- `docs/PRD.md`, bagian 12.3: audit dependency ditambahkan ke tahapan `scripts/verify.sh`, termasuk perlakuan temuan high/critical.

### F-07 — Ketidakkonsistenan kecil

- `AGENTS.md`, bagian 7.3: tes minimum diselaraskan dengan tambahan PRD bagian 12.2.
- `docs/IMPLEMENTATION-TASKS.md`, bagian awal: format gagal kini memakai baris `Alasan:` yang sama dengan `AGENTS.md` bagian 9.1.
- `docs/IMPLEMENTATION-TASKS.md`, T-012: dua kriteria batas booking aktif digabung menjadi satu.
- Urutan T-040 tidak diubah: pemeriksaan posisi file menunjukkan T-040 sudah berada setelah T-033 dan sebelum T-034, sesuai dependensi.

## 4. Hasil pencarian pemeriksaan dokumen

Pencarian dilakukan pada 18 file proyek yang dapat diidentifikasi dan dibaca pada branch ini (AGENTS, CLAUDE, PRD, plan, backlog, delapan skill, dua dokumen audit, discovery infra, laporan DOC-008, dan README); laporan DOC-009 diperiksa lagi setelah dibuat. Hasil yang dicatat:

| Pemeriksaan | Hasil |
|---|---|
| Task berestimasi XL | Tidak ditemukan. |
| Jumlah task aktual dan ringkasan | 43 heading task unik; ringkasan 43. Jumlah fase 12 + 7 + 13 + 11 = 43. |
| Rujukan T-005 yang menyatakan implementasi/pembuatan SQL fungsi | Tidak ditemukan. T-005 hanya menangani role/privilege; penyebutan role owner fungsi adalah kebutuhan role, bukan ownership implementasi SQL. |
| Nomor sentinel lama | Tidak ditemukan. |
| Frasa lama yang menyatakan nomor hanya diterima di environment test | Tidak ditemukan. |
| Literal backslash-n | Tidak ditemukan pada file yang dipindai. |
| Dependensi task yang tidak ada | Tidak ditemukan; seluruh ID dependensi yang ditemukan cocok dengan 43 task yang didefinisikan. |
| Duplikasi kriteria batas dua booking aktif di T-012 | Tidak ada; tersisa satu kriteria. |
| Posisi T-040 | T-033 < T-040 < T-034; urutan file dipertahankan. |

Pemeriksaan dihitung sebagai pencarian teks dan pembacaan dokumen, bukan pengujian aplikasi atau verifikasi runtime. Daftar path yang tidak tersedia melalui fetch repository tidak dihitung sebagai dokumen yang berhasil dipindai.

## 5. Perintah yang dijalankan

Tidak ada perintah shell yang dijalankan. Pembacaan dan perubahan dilakukan melalui operasi repository pada GitHub. Tidak ada instalasi paket, build, migrasi database, deployment, atau perubahan source aplikasi.

## 6. Hasil `scripts/verify.sh`

**Tidak dijalankan.** Perubahan ini murni dokumentasi; repository belum diperiksa melalui working tree lokal. Tidak ada klaim bahwa aplikasi, SQL, migration, atau acceptance test implementasi telah dijalankan maupun lulus.

## 7. Kriteria penerimaan DOC-009

- [x] Branch DOC-009 dibuat dari `docs/DOC-008-architect-decisions`; tidak ada operasi pada `main`.
- [x] T-005 menjadi M dan terbatas pada role/privilege; T-042 (L) dan T-043 (M) ditambahkan tanpa memakai ulang ID.
- [x] Dependensi T-006, T-010, T-011, T-012, T-025, dan T-039 diperbarui.
- [x] T-004 memiliki ownership exclusion constraint, verifikasi extension, dan tes database.
- [x] T-010/T-012 hanya lapisan aplikasi; T-042 satu-satunya pemilik SQL tiga fungsi publik.
- [x] Fixture nomor mengikuti validasi produksi, satu blok khusus test, tanpa percabangan environment.
- [x] Aturan IP Cloudflare/Tunnel dan tes spoofing ditambahkan pada T-014/T-018/T-031; keputusan counter dicatat sebagai hal yang harus dilaporkan.
- [x] PRD, AGENTS, plan, backlog, dan skill PostgreSQL diperbarui sesuai F-01 sampai F-07.
- [x] Ringkasan backlog 43 dan tidak ada estimasi XL.
- [ ] `scripts/verify.sh` — tidak dijalankan; tidak ada klaim pengujian.

## 8. Keputusan atau asumsi

- D-01 sampai D-10, MVP, urutan fase, dan aturan kerja agent tetap tidak berubah.
- Nomor fixture aktual akan ditetapkan oleh implementer setelah aturan format nomor seluler Indonesia diverifikasi; seluruh fixture dikumpulkan di `TEST_WA_FIXTURES`, tidak pernah dihubungi, dan tidak digunakan untuk pengiriman pesan.
- Pilihan penyimpanan counter rate limit belum diputuskan dalam dokumen ini. T-014 harus mencatat pilihan, perilaku restart, dan konsekuensi lintas-instance sebelum implementasi diterima.
- Ketersediaan `btree_gist` dan hak extension tetap perlu dibuktikan oleh T-004; tidak diasumsikan tersedia.
- Tidak ada klaim kepatuhan hukum, keamanan runtime, atau keberhasilan deployment.

## 9. Masalah tersisa

- Detail validasi nomor seluler Indonesia dan daftar fixture aktual harus dibuktikan/ditetapkan pada implementasi T-039; fixture tidak boleh dihubungi.
- Strategi penyimpanan counter rate limit masih perlu dipilih dan dicatat oleh T-014.
- Ketersediaan `btree_gist` dan hak role migrasi untuk membuat extension masih perlu diverifikasi T-004.
- Seluruh pengujian implementasi dan `scripts/verify.sh` belum dijalankan.
- Audit final tetap perlu meninjau diff branch dan bukti task implementasi saat tersedia.

## 10. Hal untuk auditor

- Periksa pembagian ownership T-004/T-005/T-042/T-043 agar tidak ada fungsi SQL yang dibuat ganda.
- Pastikan T-010 dan T-012 tidak menambah migration/fungsi SQL.
- Periksa exclusion constraint dan hak extension pada migrasi T-004 sebelum fungsi T-042 digunakan.
- Periksa fixture `TEST_WA_FIXTURES` memenuhi validasi produksi tanpa bypass environment dan tidak ada pesan otomatis.
- Periksa IP hanya dipercaya pada jalur Tunnel Cloudflare yang terverifikasi; uji spoofing harus mencakup koneksi langsung.
- Pastikan laporan T-014 menyatakan tempat penyimpanan counter dan kehilangan counter saat restart bila in-memory.
- Periksa tidak ada perubahan pada keputusan D-01 sampai D-10 atau scope MVP.

## 11. Git dan langkah untuk pemilik

- **Branch:** `docs/DOC-009-audit-fixes`
- **Base:** `docs/DOC-008-architect-decisions` pada `0de0413092d8f346991b44561fb35531f6a3bb5e`.
- **Sinkronisasi:** perbandingan branch menunjukkan DOC-009 berangkat langsung dari DOC-008; tidak ada divergensi/commit tertinggal pada saat perbandingan terakhir.
- **Commit:** Conventional Commits digunakan untuk setiap perubahan dokumen; commit laporan ini memakai `docs(report): add DOC-009 audit fixes`.
- **Push:** perubahan disimpan pada branch remote; belum ada Pull Request dan belum ada merge ke `main`. SHA branch final dicantumkan pada pesan chat akhir.

**Langkah wajib untuk pemilik:**

1. Buat **satu Pull Request** dari `docs/DOC-009-audit-fixes` ke `main`.
2. PR tersebut harus memuat DOC-008 dan DOC-009 sekaligus; jangan membuka PR DOC-008 terpisah.
3. Tinjau diff kumulatif sejak DOC-008, termasuk PRD, AGENTS, implementation plan, backlog 43 task, skill PostgreSQL, serta kedua laporan.
4. Merge satu PR tersebut ke `main` setelah audit disetujui.
5. Coding agent tetap tidak boleh memulai T-001 sebelum dokumentasi hasil DOC-008 dan DOC-009 berada di `main`.

---

**Status pekerjaan DOC-009:** perubahan dokumentasi disimpan pada branch; menunggu audit dan keputusan merge pemilik.
