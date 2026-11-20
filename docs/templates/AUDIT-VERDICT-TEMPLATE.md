# Template Hasil Audit

Gunakan template ini setelah menerima laporan agent, diff, dan bukti yang diperlukan. Auditor tidak mengasumsikan akses ke komputer lokal agent. Jika bukti belum tersedia, tandai **tidak terverifikasi** dan minta bukti tambahan.

---

# Audit Task T-XXX — <judul task>

## 1. Metadata audit

| Item | Nilai |
|---|---|
| Repository | `irfannuralam44-max/dacie-beauty` |
| Task | T-XXX |
| Branch | `agent/T-XXX-slug` |
| SHA yang diaudit | <40 karakter> |
| Base pembanding | `main` pada SHA <sha jika diketahui> |
| Laporan agent | `docs/reports/T-XXX-slug.md` |
| Auditor | <nama/identitas peran> |
| Tanggal audit | <YYYY-MM-DD> |

## 2. Materi yang diperiksa

- [ ] Laporan task lengkap.
- [ ] `git diff --stat main...<branch>`.
- [ ] Diff lengkap untuk file yang relevan.
- [ ] Acceptance criteria dari task asli.
- [ ] `AGENTS.md` dan skill terkait.
- [ ] Hasil `scripts/verify.sh` dan tes spesifik.
- [ ] Security/privacy checklist.
- [ ] Tidak ada file atau perubahan di luar scope tanpa alasan.

**Materi yang belum tersedia:** <daftar>.  
**Batas audit:** <apa yang tidak dapat diperiksa secara independen>.

## 3. Hasil acceptance criteria

| # | Kriteria | Hasil | Bukti/temuan |
|---:|---|---|---|
| 1 | <kriteria task> | PASS/FAIL/tidak terverifikasi | <bukti> |
| 2 | <kriteria task> | PASS/FAIL/tidak terverifikasi | <bukti> |

## 4. Temuan

Urutkan dari risiko tertinggi. Jangan menyamarkan blocker sebagai catatan kecil.

| ID | Prioritas | Lokasi | Temuan dan dampak | Perbaikan yang diminta |
|---|---|---|---|---|
| A-01 | P0/P1/P2/P3 | `path:line` | <masalah konkret> | <aksi yang dapat diuji> |

### Definisi prioritas

- **P0 — Critical:** kebocoran data/secret, bypass autentikasi, akses lintas batas publik-privat, kehilangan/korupsi data serius, atau risiko kritis setara. Jangan merge.
- **P1 — High:** cacat keamanan/fungsi besar, privilege berlebih, double booking, atau acceptance criteria penting gagal. Jangan merge.
- **P2 — Medium:** cacat penting dengan dampak terbatas, test gap, atau maintainability yang menghambat. Umumnya perlu diperbaiki sebelum merge kecuali auditor memberi pengecualian eksplisit dan aman.
- **P3 — Low:** kosmetik, dokumentasi, atau penyempurnaan non-blocking. Dapat diterima sebagai catatan jika tidak melanggar acceptance criteria.

## 5. Pemeriksaan proses Git

- [ ] Branch sesuai pola `agent/T-XXX-slug`.
- [ ] Tidak ada push ke `main`.
- [ ] Tidak ada force push.
- [ ] Branch berasal dari base yang benar.
- [ ] Perubahan tidak menghapus pekerjaan orang lain.
- [ ] Commit message mengikuti Conventional Commits.
- [ ] SHA branch sesuai dengan laporan agent.

Temuan proses Git: <catatan>.

## 6. Pemeriksaan kualitas dan pengujian

- [ ] Lint lulus.
- [ ] Typecheck lulus jika dikonfigurasi.
- [ ] Unit tests lulus.
- [ ] Integration tests lulus pada PostgreSQL untuk perilaku database.
- [ ] E2E lulus jika task membutuhkannya.
- [ ] `scripts/verify.sh` lulus.
- [ ] Secret scan lulus.
- [ ] Tes negatif/security tests sesuai cakupan tersedia.

Jika hanya mengandalkan klaim laporan tanpa output atau bukti yang memadai, tulis **tidak terverifikasi**.

## 7. Security dan privacy review

- [ ] Tidak ada secret pada source, diff, log, atau laporan.
- [ ] Tidak ada data pelanggan nyata pada fixture, test, screenshot, atau laporan.
- [ ] Input divalidasi server-side.
- [ ] Query memakai parameter binding.
- [ ] Authn/authz diperiksa di server pada route privat.
- [ ] Database role sesuai konteks dan least privilege.
- [ ] Tidak ada PII/health data pada log umum.
- [ ] Error response tidak membocorkan data sensitif.
- [ ] Perubahan tidak melemahkan boundary hostname atau schema.
- [ ] Audit/consent/deletion behavior sesuai scope bila relevan.

Checklist lengkap ada di `docs/audit/SECURITY-PRIVACY-CHECKLIST.md`.

## 8. Catatan keberatan

<Catat keberatan terhadap keputusan desain/implementasi yang berisiko. Jangan ubah keputusan terkunci secara diam-diam.>

## 9. Keputusan audit

Pilih tepat satu:

### PASS
Semua acceptance criteria terverifikasi, tidak ada temuan blocking, dan bukti cukup. Branch boleh diajukan untuk merge oleh pemilik repo.

### PASS dengan catatan
Tidak ada risiko P0/P1 dan seluruh kriteria wajib terpenuhi. Ada catatan non-blocking yang jelas pemilik serta tindak lanjutnya. Pemilik repo memutuskan apakah merge dapat dilakukan.

### FAIL
Ada acceptance criteria gagal/tidak terverifikasi yang wajib, temuan P0/P1, atau bukti tidak cukup untuk menyatakan task aman. Jangan merge. Agent harus memperbaiki dan mengirim ulang untuk audit.

**Keputusan:** <PASS / PASS dengan catatan / FAIL>

**Alasan utama:** <ringkas dan spesifik>

**Syarat sebelum merge:** <daftar atau “Tidak ada”>

**Task tindak lanjut:** <ID task atau instruksi revisi>

---

## 10. Batas kesimpulan

Audit hanya mencakup SHA dan bukti yang disebutkan di atas. Jangan menyatakan seluruh aplikasi aman atau patuh hukum berdasarkan satu task. Bila suatu aspek tidak dapat diperiksa dari laporan/diff/bukti yang tersedia, tulis **tidak terverifikasi**.
