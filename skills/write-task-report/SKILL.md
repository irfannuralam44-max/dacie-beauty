# Skill: write-task-report

## Tujuan
Membuat laporan Markdown yang memungkinkan pemilik dan auditor memeriksa hasil task tanpa mengakses PC agent.

## Kapan dipakai
Wajib dipakai untuk setiap task sebelum push. Perbarui laporan jika hasil test, commit, atau status push berubah.

## Lokasi dan nama
`docs/reports/T-XXX-slug.md`

Pastikan direktori tersedia. Jangan menimpa laporan task lain.

## Langkah

1. Kumpulkan fakta dari Git:
   ```bash
   git branch --show-current
   git status --short
   git diff --stat
   git diff --name-only
   git log -1 --oneline
   ```
2. Catat commit dasar dan SHA branch sebelum perubahan jika tersedia.
3. Catat setiap perintah test/lint/verify yang benar-benar dijalankan, hasil, dan exit code.
4. Jalankan `scripts/verify.sh` sebelum push dan catat hasil aktual. Jangan menyatakan sukses jika script gagal atau tidak tersedia.
5. Cocokkan setiap kriteria penerimaan task satu per satu dengan bukti spesifik: nama test, output ringkas, file, atau perilaku yang diuji.
6. Tandai kriteria yang belum dibuktikan sebagai belum terpenuhi atau tidak terverifikasi. Jangan mencentang berdasarkan asumsi.
7. Catat keputusan dan asumsi, termasuk hal yang perlu dikonfirmasi pemilik.
8. Catat masalah tersisa dan risiko yang perlu diperhatikan auditor.
9. Periksa isi laporan agar tidak mengandung PII, data pelanggan, password, token, environment secret, atau output command yang membocorkan secret.
10. Setelah commit dan push, lengkapi SHA, pesan commit, branch, dan hasil push.

## Template minimum

```markdown
# Laporan T-XXX — Judul Task

## Ringkasan perubahan
...

## Daftar file berubah
| File | Perubahan |
|---|---|
| ... | ... |

## Lingkungan dan sinkronisasi
- Branch:
- Branch dasar:
- SHA dasar:
- Working tree sebelum mulai:
- Fetch/pull:

## Perintah yang dijalankan
| Perintah | Hasil | Exit code |
|---|---|---:|
| ... | ... | ... |

## Hasil scripts/verify.sh
- Perintah:
- Hasil:
- Exit code:

## Kriteria penerimaan
- [ ] Kriteria — bukti:
- [ ] Kriteria — bukti:

## Keputusan atau asumsi
...

## Masalah yang tersisa
...

## Hal untuk auditor
...

## Git
- Branch:
- SHA:
- Commit:
- Push:
```

## Contoh bukti yang baik
- "Test `public-role-denied-records.integration.test.ts` dijalankan terhadap PostgreSQL Docker; assertion SQLSTATE permission denied lulus."
- "Playwright test `booking-happy-path.spec.ts` lulus pada browser Chromium."
- "Tidak terverifikasi: uji restore backup belum termasuk lingkup task ini."

Hindari pernyataan kabur seperti "sudah dites" tanpa nama test atau hasil.

## Format chat setelah push
Chat agent harus mengikuti format persis dari `AGENTS.md`:
- Push berhasil: lima baris yang diwajibkan.
- Push gagal: tiga baris yang diwajibkan.

Tidak boleh menambahkan ringkasan atau secret ke chat.
