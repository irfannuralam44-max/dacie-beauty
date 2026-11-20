# Skill: booking-ui-indonesian

## Tujuan
Membangun pengalaman booking publik Dacie Beauty yang ringkas, premium, mobile-first, dan sepenuhnya berbahasa Indonesia tanpa menambah pengumpulan data pribadi.

## Kapan dipakai
Untuk task UI booking publik, form, pemilihan tanggal/jam, halaman hasil booking, validasi, dan pesan error/sukses.

## Identitas visual
- Brand: Dacie Beauty.
- Nuansa: premium, bersih, tenang, profesional.
- Palet awal: putih, mauve muda, hijau sage.
- Mobile-first dan responsif.
- Gunakan ruang kosong, hierarki tipografi, dan komponen yang konsisten.
- Kontras dan fokus keyboard harus jelas.
- Hindari dekorasi yang mengganggu penyelesaian booking.

## Lima field yang diizinkan
Form pelanggan hanya boleh menampilkan:
1. Nama.
2. Nomor WhatsApp.
3. Jenis treatment.
4. Tanggal.
5. Jam.

Tidak boleh menambah kolom keluhan, jenis kulit, alergi/sensitivitas, foto, alamat, email, tanggal lahir, atau data kesehatan lainnya.

## Treatment awal
- Facial Brightening.
- Facial Acne Care.
- Facial Hydrating.
- Konsultasi Kulit.

Pilihan yang aktif harus berasal dari sumber konfigurasi yang disetujui. Jangan hardcode daftar yang akan berbeda dari pengaturan privat tanpa keputusan desain yang eksplisit.

## Langkah

1. Pastikan route berada pada hostname booking dan tidak menampilkan area privat.
2. Rancang alur satu kolom yang nyaman di layar ponsel.
3. Beri label yang terlihat dan instruksi singkat untuk setiap field.
4. Input WhatsApp menerima variasi nomor Indonesia yang didukung, tetapi server tetap menjadi sumber normalisasi dan validasi.
5. Treatment dipilih dari pilihan yang aktif.
6. Tanggal dipilih terlebih dahulu atau sesuai alur yang ditentukan task.
7. Jam hanya menampilkan slot yang disediakan server.
8. Tampilkan zona waktu operasional secara jelas bila konteks membutuhkan.
9. Saat submit, tampilkan status loading dan cegah submit berulang dari UI; server/database tetap wajib menangani request bersamaan.
10. Pesan sukses menyatakan booking diterima/diajukan, bukan dikonfirmasi, kecuali status memang sudah dikonfirmasi manual.
11. Jika slot telah diambil pelanggan lain, jelaskan bahwa slot tidak tersedia lagi dan minta pilih jam lain.
12. Tampilkan CAPTCHA sesuai integrasi yang sudah diverifikasi dan disetujui.
13. Tambahkan test komponen/form dan E2E alur booking.

## Microcopy yang disarankan
- Judul: "Buat Jadwal Perawatan"
- Pengantar: "Pilih perawatan dan waktu yang sesuai. Tim Dacie Beauty akan menghubungi Anda melalui WhatsApp untuk konfirmasi."
- Label: "Nama", "Nomor WhatsApp", "Jenis Treatment", "Tanggal", "Jam"
- Tombol: "Ajukan Booking"
- Sukses: "Permintaan booking berhasil dikirim. Tim kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi."
- Konflik slot: "Maaf, jam tersebut baru saja tidak tersedia. Silakan pilih jam lain."

Teks ini dapat disesuaikan untuk UX, tetapi jangan menjanjikan konfirmasi otomatis.

## Kriteria review
- [ ] Tepat lima field pelanggan.
- [ ] Tidak ada input data kesehatan/keluhan.
- [ ] Semua teks UI berbahasa Indonesia.
- [ ] Tampilan mobile-first dan responsif.
- [ ] Treatment berasal dari sumber yang disetujui.
- [ ] Slot berasal dari server.
- [ ] Pesan tidak menyebut booking sudah terkonfirmasi sebelum tindakan manual.
- [ ] Tidak ada nama/kontak booking lain yang terlihat.
- [ ] Label, error, fokus, dan kontrol dapat diakses.

## Batasan
Jangan menambahkan pembayaran, akun pelanggan, email, WhatsApp API, pengingat otomatis, atau field tambahan.
