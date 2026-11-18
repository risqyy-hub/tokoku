# TOKOKITA POS

TOKOKITA POS adalah aplikasi kasir, inventori, dan toko online sederhana untuk operasional ritel. Aplikasi dibangun dengan Laravel, Inertia.js, React, Vite, dan Tailwind CSS, serta mendukung alur kasir langsung maupun belanja mandiri oleh pelanggan.

> **Catatan fitur pembayaran:** POS kasir mendukung tunai, QRIS, transfer, dan saldo pelanggan. Belanja online pelanggan dapat memilih COD/tunai saat pesanan diterima atau saldo. Fitur top-up saldo melalui Midtrans masih memerlukan konfigurasi kredensial dan verifikasi sebelum digunakan.

## Fitur

### POS kasir
- Pencarian produk melalui nama, SKU, atau barcode scanner USB.
- Keranjang dengan kontrol kuantitas dan validasi stok.
- Perhitungan subtotal, diskon, pajak, uang diterima, dan kembalian.
- Pembayaran tunai, QRIS, transfer, atau saldo pelanggan.
- Pencarian pelanggan dan dukungan RFID. Diskon member RFID 5% dihitung di server.
- Struk POS dan akses nota transaksi dari riwayat.

### Belanja pelanggan
- Registrasi akun pelanggan mandiri dan login menggunakan username atau email.
- Katalog belanja, keranjang, serta tombol tambah/kurang kuantitas. Jumlah dibatasi stok yang tersedia.
- Checkout dengan alamat pengiriman dan pilihan COD/tunai atau saldo.
- Status serta rincian pesanan hanya ditampilkan untuk pelanggan pemilik akun.
- Nota digital di halaman **Pesanan Saya** dengan nomor nota, tanggal, rincian barang, subtotal, diskon, pajak, total, alamat, metode pembayaran, dan status. Nota dapat dilihat tanpa mencetak.
- Pelanggan dapat mengelola profil dan alamat pengiriman.

### Saldo pelanggan dan top-up
- Saldo disimpan pada data pelanggan; transaksi saldo menggunakan ledger mutasi.
- Debit saldo saat checkout dan pengembalian saldo ketika transaksi saldo dibatalkan mengikuti alur server.
- Tersedia kerangka integrasi Midtrans Snap dan endpoint notifikasi pembayaran. Top-up **belum siap digunakan** sampai kredensial Midtrans diatur dan callback diuji.
- Kategori sistem **Top-up Saldo** disediakan untuk kebutuhan administrasi; bukan produk belanja biasa.

### Administrasi toko
- Dashboard ringkasan penjualan, tren, produk terlaris, stok kritis, dan transaksi terbaru.
- Master produk, kategori, pelanggan, serta akun admin/kasir.
- Mutasi stok masuk/keluar, opname, dan riwayat perubahan.
- Riwayat transaksi, pembatalan transaksi oleh admin, serta laporan penjualan dan ekspor CSV.
- Pengaturan identitas toko, pajak, logo, dan informasi struk.

### Hak akses

| Peran | Akses utama |
| --- | --- |
| Admin | Dashboard, POS, data master, stok, transaksi, laporan, pengguna, dan pengaturan toko |
| Kasir | POS, data pelanggan, dan riwayat transaksi |
| Pelanggan (`user`) | Belanja, checkout, pesanan/nota milik sendiri, profil, alamat, dan wallet |

Route dan data pelanggan dibatasi berdasarkan peran serta kepemilikan akun di server.

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| Backend | Laravel (lihat `composer.json` untuk versi terpasang), PHP |
| UI | React, Inertia.js |
| Asset bundler | Vite |
| CSS | Tailwind CSS |
| Database | MariaDB/MySQL |
| Ikon | Lucide React |

## Persyaratan

- PHP sesuai versi yang tercantum pada `composer.json` dan ekstensi Laravel yang diperlukan.
- Composer.
- Node.js dan npm.
- MySQL atau MariaDB.

Di lingkungan Windows/XAMPP, jalankan Apache dan MySQL dari XAMPP Control Panel bila aplikasi diakses melalui konfigurasi XAMPP.

## Instalasi

1. Pasang dependensi PHP dan JavaScript:

   ```bash
   composer install
   npm install
   ```

2. Siapkan konfigurasi lingkungan:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

   Di Windows Command Prompt, salin `.env.example` secara manual ke `.env` bila perintah `cp` tidak tersedia.

3. Atur koneksi database di `.env`, misalnya:

   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=db_tokokita
   DB_USERNAME=root
   DB_PASSWORD=
   ```

4. Jalankan migrasi:

   ```bash
   php artisan migrate --no-interaction
   ```

   Migrasi pelanggan menambahkan relasi akun pelanggan, saldo/ledger, data top-up, alamat pengiriman, status pesanan menunggu, dan kategori sistem. Selalu buat cadangan database sebelum menjalankan migrasi pada database berisi data penting.

5. Buat symlink storage untuk file publik jika belum tersedia, lalu build frontend:

   ```bash
   php artisan storage:link
   npm run build
   ```

6. Jalankan aplikasi untuk pengembangan:

   ```bash
   php artisan serve
   npm run dev
   ```

   Buka alamat yang ditampilkan oleh `php artisan serve` (umumnya `http://127.0.0.1:8000`). Untuk menjalankan aset hasil build, gunakan `npm run build` dan tidak perlu menjalankan Vite dev server.

## Akun dan login

- Admin dan kasir dikelola melalui sistem pengguna. Kredensial bawaan bergantung pada seeder atau data lokal; jangan menganggap akun demo tersedia di semua instalasi.
- Halaman login menyediakan tombol **Isi Admin** dan **Isi Kasir** untuk mengisi kredensial demo yang ditampilkan aplikasi. Tombol tersebut bukan mekanisme bypass autentikasi.
- Pelanggan baru dapat memilih **Daftar akun** dari halaman login, lalu login dengan username/email dan kata sandi yang didaftarkan.
- Demi keamanan, jangan gunakan atau publikasikan kredensial contoh di instalasi produksi.

## Konfigurasi Midtrans (opsional, top-up belum aktif)

Top-up saat ini belum menjadi alur yang siap produksi. Jika akan mengaktifkannya, siapkan kredensial dari akun Midtrans dan isi variabel yang dibaca oleh `config/payment.php` pada `.env` (lihat `.env.example`). Pastikan environment sandbox/production sesuai, konfigurasi notifikasi mengarah ke route callback aplikasi, lalu uji tanda tangan notifikasi, status pembayaran, serta penambahan saldo secara idempoten sebelum digunakan pelanggan. Jangan commit nilai secret ke repository.

Belanja online COD tidak memerlukan konfigurasi Midtrans.

## Nota dan pencetakan

- Nota pelanggan tersedia di menu **Pesanan Saya** dan dapat dibuka kembali tanpa printer.
- POS menyediakan alur struk untuk printer kasir. Untuk printer termal 80 mm, pilih printer dan ukuran kertas yang sesuai pada dialog browser serta nonaktifkan header/footer browser.
- Ketersediaan dan hasil cetak bergantung pada printer, driver, dan pengaturan browser lokal.

## Pengujian dan build

Jalankan tes:

```bash
php artisan test --compact
```

Build aset produksi:

```bash
npm run build
```

Format kode PHP:

```bash
vendor/bin/pint --dirty --format agent
```

## Keamanan dan operasional

- Jangan commit `.env`, kredensial, atau kunci gateway.
- Gunakan HTTPS pada deployment publik dan kata sandi unik untuk semua akun.
- Ambil backup database sebelum migrasi atau perubahan operasional penting.
- Checkout memvalidasi produk/stok di server dan mencatat perubahan dalam transaksi database.
- Pembayaran COD dicatat sebagai pesanan menunggu pembayaran; konfirmasi pembayaran perlu dilakukan melalui alur operasional toko.

---

&copy; 2026 TOKOKITA POS
