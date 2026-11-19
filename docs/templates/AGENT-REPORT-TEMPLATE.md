# Template Laporan Agent

Salin file ini untuk setiap task. Simpan hasilnya di `docs/reports/T-XXX-slug.md`. Ganti semua placeholder. Jangan mengisi laporan dengan klaim yang tidak didukung bukti.

---

# Laporan Task T-XXX — <judul task>

## 1. Metadata

| Item | Nilai |
|---|---|
| Repository | `irfannuralam44-max/dacie-beauty` |
| Task ID | T-XXX |
| Branch | `agent/T-XXX-slug` |
| Base branch | `main` |
| SHA commit terakhir | <40 karakter> |
| Commit message | <Conventional Commit> |
| Tanggal pengerjaan | <YYYY-MM-DD> |
| Agent/tool | <nama agent dan versi bila diketahui> |
| Status push | <berhasil/gagal> |

## 2. Ringkasan

<Jelaskan apa yang dikerjakan, alasan, dan hasilnya. Maksimal beberapa paragraf.>

## 3. Perubahan file

| File | Dibuat/diubah/dihapus | Tujuan perubahan |
|---|---|---|
| `path/file` | <status> | <alasan> |

Jangan mencantumkan file environment berisi secret atau menempelkan isi secret.

## 4. Perintah dan hasil verifikasi

| Perintah persis | Hasil | Bukti/ringkasan |
|---|---|---|
| `<command>` | PASS/FAIL/SKIP | <exit code, jumlah tes, atau ringkasan> |

### Verifikasi wajib

- [ ] Sinkronisasi Git awal dilakukan sesuai `AGENTS.md`.
- [ ] Working tree bersih sebelum task dimulai.
- [ ] Branch task dibuat dari base yang benar.
- [ ] Tes spesifik task dijalankan.
- [ ] `scripts/verify.sh` dijalankan.
- [ ] Secret scan lokal dijalankan.
- [ ] Diff ditinjau sendiri sebelum push.
- [ ] Fetch ulang dilakukan sebelum push.
- [ ] Tidak melakukan force push.
- [ ] Tidak push ke `main`.

Jika salah satu tidak dapat dilakukan, jelaskan alasannya. Jangan centang hanya berdasarkan asumsi.

## 5. Acceptance criteria

Salin acceptance criteria dari task tanpa mengubah maknanya.

| # | Kriteria | Status (PASS/FAIL/tidak terverifikasi) | Bukti |
|---:|---|---|---|
| 1 | <kriteria persis> | <status> | <tes, file, output, atau alasan> |
| 2 | <kriteria persis> | <status> | <bukti> |

Kriteria yang tidak diuji harus diberi status **tidak terverifikasi**, bukan PASS.

## 6. Keputusan dan asumsi

- <Keputusan teknis yang dibuat dan alasannya>
- <Asumsi yang masih menunggu konfirmasi>
- <Discovery yang dilakukan, termasuk sumber dokumentasi bila relevan>

Jika tidak ada, tulis “Tidak ada”.

## 7. Keamanan dan privasi

- Data uji: <pastikan sintetis>
- Secret scan: <hasil>
- Data pribadi pada log/output: <hasil pemeriksaan>
- Akses database/route yang relevan: <hasil>
- Risiko keamanan atau privasi yang tersisa: <daftar atau “Tidak ditemukan dalam cakupan task ini”>

Jangan pernah menempelkan password, token, connection string, isi `.env`, data pelanggan, atau screenshot yang mengandung informasi tersebut.

## 8. Masalah tersisa dan tindak lanjut

| Prioritas | Masalah | Dampak | Saran/tindakan |
|---|---|---|---|
| P0/P1/P2/P3 | <deskripsi> | <dampak> | <tindakan> |

Jika tidak ada, tulis “Tidak ada yang diketahui”.

## 9. Catatan untuk auditor

- Area yang perlu diperiksa secara khusus: <path/logic/test>
- Keterbatasan verifikasi: <jelaskan>
- Apakah ada perubahan di luar scope? <ya/tidak, jelaskan>

## 10. Ringkasan Git final

```text
Push: berhasil
Branch: <branch>
SHA: <40 karakter>
Commit: <message>
Laporan: docs/reports/T-XXX-slug.md
```

Jika push gagal, gunakan format:

```text
Push: GAGAL
<alasan satu baris>
Laporan: docs/reports/T-XXX-slug.md
```

---

**Pernyataan agent:** laporan ini hanya menyatakan hal yang benar-benar dikerjakan dan diverifikasi. Hal yang belum dapat dibuktikan ditandai “tidak terverifikasi”.
