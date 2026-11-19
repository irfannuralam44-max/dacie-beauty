# Skill: secure-coding-nextjs

## Tujuan
Menerapkan kontrol keamanan pada Next.js tanpa membocorkan data privat melalui UI, API, Server Actions, log, atau koneksi database.

## Kapan dipakai
Wajib untuk setiap task yang menyentuh route, Server Component, Client Component, Route Handler, Server Action, middleware/proxy, autentikasi, session, database, form, logging, atau konfigurasi deployment.

## Langkah

1. Tentukan trust boundary:
   - hostname booking publik;
   - hostname rekam privat;
   - browser/client;
   - server runtime;
   - role database `app_public` dan `app_private`.
2. Identifikasi data yang diproses dan klasifikasikan data booking versus data records.
3. Pastikan modul database dan secret hanya berada di server. Gunakan penanda server-only yang sesuai dengan stack yang telah diverifikasi.
4. Pastikan jalur publik hanya menggunakan koneksi `app_public`; jangan sediakan fallback ke `app_private`.
5. Validasi host menggunakan allowlist hostname yang dikonfigurasi. Tolak host yang tidak dikenal dan route privat pada hostname booking.
6. Validasi semua input di server dengan schema eksplisit. Validasi client hanya untuk UX, bukan kontrol keamanan.
7. Gunakan SQL berparameter. Jangan menggabungkan string SQL dengan input.
8. Terapkan CSRF protection pada operasi perubahan state sesuai mekanisme yang dipilih.
9. Terapkan autentikasi dan otorisasi pada setiap route privat dan operasi sensitif; jangan mengandalkan tombol tersembunyi atau middleware saja.
10. Atur cookie sesi dengan `Secure`, `HttpOnly`, dan `SameSite` yang sesuai; verifikasi perilaku pada HTTPS dan lingkungan lokal.
11. Escape output sesuai konteks. Hindari `dangerouslySetInnerHTML`; jika benar-benar diperlukan, sanitasi dengan pendekatan yang ditinjau dan catat alasannya.
12. Redaksi log: jangan log nama, nomor WhatsApp, data kulit, password, token, cookie, atau request body sensitif.
13. Pastikan error publik generik dan tidak membocorkan detail internal.
14. Tambahkan test negatif untuk akses tanpa izin dan kebocoran data.
15. Jalankan `scripts/verify.sh`.

## Aturan khusus Dacie Beauty

- Booking publik hanya memproses lima field: nama, WhatsApp, treatment, tanggal, jam.
- Tidak boleh ada field keluhan, alergi, jenis kulit, foto, atau data kesehatan pada form publik.
- Data kulit/kesehatan hanya di skema `records`.
- Role publik tidak boleh membaca skema `records`.
- Output fungsi slot publik tidak boleh mengandung nama/kontak.
- Nomor WhatsApp ternormalisasi adalah penghubung data, bukan autentikasi.
- Jangan mengirim records ke client yang belum terautentikasi.
- Jangan memasukkan PII ke URL, query string, browser storage, telemetry, atau analytics.

## Contoh pola aman

Contoh konseptual; nama modul dan API harus mengikuti implementasi repository:

```ts
// Server-side only. Public handler receives only the public database adapter.
export async function createPublicBooking(input: unknown) {
  const parsed = PublicBookingSchema.parse(input);
  return publicBookingRepository.create(parsed);
}
```

Jangan membuat handler publik seperti ini:

```ts
// DILARANG: request dapat menentukan privilege database.
const db = request.headers.get("x-role") === "private"
  ? privateDb
  : publicDb;
```

## Checklist review
- [ ] Apakah handler melakukan autentikasi/otorisasi server-side?
- [ ] Apakah host sesuai allowlist?
- [ ] Apakah jalur publik hanya memakai role publik?
- [ ] Apakah input divalidasi server-side?
- [ ] Apakah query berparameter?
- [ ] Apakah output bebas PII yang tidak diperlukan?
- [ ] Apakah cookie dan CSRF ditangani?
- [ ] Apakah log bebas data pelanggan dan secret?
- [ ] Apakah test negatif ditambahkan?

## Eskalasi
Jika task memerlukan akses publik ke records, credential privat pada jalur publik, bypass autentikasi, atau perubahan batas hostname, hentikan dan minta keputusan pemilik/arsitek.
