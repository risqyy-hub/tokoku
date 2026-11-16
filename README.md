# TOKOKITA POS - Modern Point of Sale System

Aplikasi Kasir dan Manajemen Inventori Ritel modern, cepat, dan responsif berbasis **Laravel**, **Inertia.js**, **React**, **Vite**, dan **Tailwind CSS**. Didesain dengan inspirasi antarmuka **Amazon Seller Central** (kartu statistik neumorfik biru-putih, tabel inventori padat, dan grafik omzet) dipadukan dengan sentuhan visual **Pinterest** (kartu produk rapi dan etalase otomatis).

Sistem ini terintegrasi penuh dengan basis data MariaDB **`db_tokokita`** melalui migrasi non-destruktif, dilengkapi pengamanan transaksi atomik (*row-level locking*), pembaca barcode USB, serta spesifikasi cetak struk termal **Epson TM-T82X 80 mm**.

---

## 🌟 Fitur Utama Aplikasi

### 1. 🛍️ Terminal Kasir Cepat (Fast POS)
- **USB Barcode Scanner & Pencarian Cepat**: Input otomatis langsung dari scanner barcode USB atau pencarian nama produk dan SKU. Tombol pintas keyboard (`F2` untuk fokus barcode).
- **Keranjang Belanja Interaktif**: Tambah/kurang kuantitas secara langsung dengan proteksi batas stok fisik maksimum.
- **Kalkulasi Akurat & Real-Time**: Perhitungan otomatis subtotal, potongan diskon nominal, kalkulasi pajak PPN toko, uang diterima, dan kembalian.
- **Tombol Uang Pas & Pecahan Cepat**: Opsi satu klik uang pas, Rp 20.000, Rp 50.000, dan Rp 100.000.
- **Metode Pembayaran**: Mendukung **Tunai (Cash)**, **QRIS**, dan **Transfer Bank**.
- **Opsi Pembayaran**:
  - **BAYAR & CETAK STRUK (80mm)**: Menyelesaikan transaksi sekaligus memicu dialog cetak struk termal secara instan.
  - **Bayar Tanpa Cetak**: Menyimpan penjualan tanpa memicu printer (hemat kertas).
- **Pencarian & Registrasi Member Cepat**: Dropdown pemilihan pelanggan atau pendaftaran member baru langsung melalui modal kasir tanpa meninggalkan halaman POS.

### 2. 🎠 Etalase Produk Otomatis (Showcase Slider)
- Carousel dinamis di bagian atas halaman kasir yang memamerkan produk-produk unggulan (*featured products*).
- Berputar otomatis setiap 4.5 detik dengan efek transisi halus (*smooth fade*).
- Dilengkapi fitur **Pause on Hover** (otomatis berhenti saat mouse diarahkan ke kartu promo agar tidak mengganggu operasional kasir).
- Tombol aksi langsung **+ Keranjang** dari slider promo.

### 3. 🖨️ Cetak Struk Termal Epson TM-T82X (Kertas Roll 80 mm)
- Diformat dengan aturan CSS `@media print` presisi `@page { size: 80mm auto; margin: 0; }`.
- Otomatis menyembunyikan sidebar, navbar, dan kontrol dashboard saat cetak.
- Menampilkan **17 elemen lengkap struk standar ritel**:
  1. Logo Toko
  2. Nama Toko
  3. Alamat Toko
  4. Nomor Telepon / WhatsApp Toko
  5. Nomor Faktur Transaksi (`TRX-YYYYMMDD-XXXX`)
  6. Tanggal & Waktu Transaksi
  7. Nama Kasir yang bertugas
  8. Nama Pelanggan / Member
  9. Nama Produk yang dibeli
  10. Kuantitas (Qty)
  11. Harga Satuan
  12. Subtotal per Produk
  13. Subtotal Transaksi
  14. Diskon
  15. Pajak (PPN)
  16. Total Belanja Akhir
  17. Uang Diterima, Kembalian, Metode Pembayaran, serta Ucapan Terima Kasih / Pesan Kaki.
- Fitur **Cetak Ulang Struk (Reprint Receipt)** dari riwayat transaksi kapan saja.

### 4. 📊 Dashboard Ringkasan Toko (Amazon Seller Central Style)
- **6 Metrik Utama**: Penjualan Hari Ini, Jumlah Transaksi, Total Item Katalog, Total Unit Terjual, Peringatan Stok Kritis, dan Akumulasi Omzet Bulan Berjalan.
- **Grafik Tren Penjualan 7 Hari Terakhir**: Visualisasi grafik batang interaktif dengan informasi rincian omzet dan jumlah transaksi harian saat di-hover.
- **Top 5 Produk Terlaris**: Peringkat produk dengan penjualan dan omzet tertinggi.
- **Widget Peringatan Stok Kritis**: Notifikasi dini untuk produk yang berada di bawah stok minimum atau habis.
- **Tabel Transaksi Terbaru**: Menampilkan 7 aktivitas kasir terakhir secara live.

### 5. 📦 Manajemen Inventori & Riwayat Mutasi Stok
- **Audit Mutasi Lengkap**: Pencatatan histori setiap perubahan stok (Stok Masuk, Stok Keluar/Rusak, Penjualan Kasir, Retur Batal, dan Penyesuaian Opname Fisik).
- **Proteksi Anti-Minus**: Sistem memvalidasi kuantitas sebelum menyimpan, menjamin stok tidak bernilai negatif.
- **Pencatatan Alasan & User**: Setiap mutasi manual wajib mencantumkan alasan dan mencatat akun yang bertanggung jawab.

### 6. 📁 Master Data Produk & Kategori
- **Produk**: Pengelolaan nama produk, brand, SKU, barcode, kategori, harga modal beli (HPP), harga jual POS, stok awal, stok minimum, status aktif/nonaktif, foto produk, dan saklar *Etalase Unggulan*.
- **Kategori**: Tambah, ubah, dan hapus kategori produk dengan perlindungan integritas (kategori tidak dapat dihapus jika masih digunakan oleh produk aktif).

### 7. 👥 Manajemen Pelanggan & Pengguna (RBAC)
- **Pelanggan**: Data kontak, alamat, kota, dan riwayat belanja per pelanggan beserta akumulasi omzet.
- **Hak Akses (Role Based Access Control)**:
  - **Administrator**: Akses penuh ke seluruh menu (Dashboard, Master Data, Manajemen Stok, Laporan, Pengguna, Pengaturan Toko, Pembatalan Transaksi).
  - **Kasir**: Dikhususkan untuk operasional penjualan (Terminal POS, Data Pelanggan, dan Riwayat Transaksi). Dilindungi melalui middleware backend `RoleMiddleware`.

### 8. 📈 Laporan Penjualan & Analitik Bisnis
- Filter rentang tanggal bebas (Hari Ini, Minggu Ini, Bulan Ini, atau kustom).
- Ringkasan Finansial: Total Omzet, Estimasi Beban Pokok Penjualan (HPP), Margin Keuntungan Kotor, dan Rata-rata per Faktur (*Average Order Value*).
- Laporan Terinci: Rincian Penjualan Harian, Performa Kasir, Metode Pembayaran Terfavorit, Produk Kurang Laku (*Slow Movers*), dan Valuasi Aset Stok Toko.
- **Ekspor Data ke CSV**: Unduh laporan transaksi ke format spreadsheet untuk pembukuan eksternal.

### 9. ⚙️ Pengaturan Toko & Pajak PPN
- Kustomisasi identitas toko (Nama Toko, Slogan, Alamat, No. Telepon, Email, Logo Toko).
- Konfigurasi Pajak Penjualan (PPN %) beserta saklar aktif/nonaktif.
- Pengaturan mode printer dan kustomisasi teks footer struk.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend Framework** | Laravel 12 / 13 | PHP 8.5, Routing, Eloquent ORM, DB Transactions |
| **Frontend Framework** | React 19 (JavaScript) | Komponen modern berbasis Hooks |
| **Single-Page Glue** | Inertia.js | SPA tanpa kompleksitas autentikasi JWT/OAuth |
| **Build Tool** | Vite 8 | Kompilasi kilat hot-module replacement |
| **Styling & Desain** | Tailwind CSS v4 | Soft UI, Neumorphism shadow, Plus Jakarta Sans |
| **Ikon Antarmuka** | Lucide React | Ikon modern, ringan, dan konsisten |
| **Database** | MariaDB 10.4 | Terkoneksi ke database lokal XAMPP `db_tokokita` |

---

## 🔐 Akun Login Bawaan (Default Credentials)

Sistem telah dilengkapi dua akun uji coba siap pakai:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses Penuh: Dashboard, Stok, Laporan, Pengaturan, dsb. |
| **Kasir** | `kasir` | `kasir123` | Akses Kasir: Terminal POS, Riwayat Transaksi, Pelanggan |

> *Pada halaman login, Anda juga dapat menekan tombol pintas **"Akun Admin"** atau **"Akun Kasir"** untuk mengisi kredensial secara otomatis.*

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### Persyaratan Sistem
- Web Server & Database: **XAMPP** (Apache & MySQL/MariaDB aktif).
- PHP: Versi **8.2 ke atas** (pengujian berjalan pada PHP 8.5).
- Package Manager: **Composer** dan **Node.js** (v18+ atau v22+).

### Langkah Menjalankan:

1. **Pastikan Apache dan MySQL XAMPP Berjalan**
   Buka XAMPP Control Panel, lalu klik **Start** pada modul **Apache** dan **MySQL**.

2. **Buka Terminal di Direktori Proyek**
   ```bash
   cd C:\xampp\htdocs\tokokita
   ```

3. **Pastikan Konfigurasi `.env` Sesuai**
   Pastikan berkas `.env` mengarah ke database `db_tokokita`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=db_tokokita
   DB_USERNAME=root
   DB_PASSWORD=
   ```

4. **Jalankan Migrasi & Seeder Database (Aman / Non-Destruktif)**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```
   *(Perintah ini mempertahankan seluruh data lama yang sudah ada dan hanya menambahkan tabel serta kolom pelengkap).*

5. **Hubungkan Storage Symlink (Untuk Foto Produk & Logo)**
   ```bash
   php artisan storage:link
   ```

6. **Jalankan Server Aplikasi**
   - **Opsi A: Mode Pengembangan (Vite HMR)**:
     Buka dua jendela terminal:
     ```bash
     # Terminal 1:
     php artisan serve

     # Terminal 2:
     npm run dev
     ```
   - **Opsi B: Mode Produksi (Sudah Ter-bundle)**:
     Aset frontend telah dikompilasi ke direktori `public/build`. Anda cukup menjalankan:
     ```bash
     php artisan serve
     ```
     Buka peramban (browser) dan akses: **`http://127.0.0.1:8000`** atau **`http://localhost:8000`**.

---

## 🖨️ Panduan Konfigurasi Printer Thermal Epson TM-T82X (80 mm)

Aplikasi TOKOKITA POS telah dioptimasi khusus untuk printer kasir termal **Epson TM-T82X**:

1. **Pemasangan Fisik & Driver**:
   - Sambungkan kabel USB printer Epson TM-T82X ke komputer kasir.
   - Pasang driver resmi **Epson Advanced Printer Driver (APD)** untuk seri TM-T82X.
2. **Pengaturan Dialog Cetak Browser (Google Chrome / Microsoft Edge)**:
   - Saat pop-up cetak struk muncul (atau tekan tombol *Cetak Struk*):
   - **Destination**: Pilih printer `EPSON TM-T82X Receipt` (bukan *Save as PDF*).
   - **Paper Size**: Pilih `Roll Paper 80 x 297 mm` atau `80 x Receipt`.
   - **Margins**: Atur ke **`None`** (Tanpa Margin).
   - **Options**: **Hilangkan centang** pada pilihan **`Headers and Footers`** (agar URL browser, tanggal browser, dan nomor halaman tidak tercetak pada struk kasir).
3. **Hasil Cetakan**:
   - Format struk akan pas di lebar 80 mm tanpa terpotong, teks rata tengah untuk identitas toko, rincian item bergaris putus-putus (*dashed line*), dan auto-cut bekerja mulus.

---

## 🧪 Pengujian Otomatis Sistem (Feature Tests)

Seluruh alur kritis aplikasi telah divalidasi dengan rangkaian uji coba otomatis PHPUnit:
- Autentikasi dan isolasi hak akses role Admin vs Kasir.
- Alur Checkout POS, pengurangan stok barang, dan pencatatan transaksi atomik.
- Mutasi stok masuk, mutasi keluar, dan penyesuaian opname fisik.
- Pembatalan / retur transaksi dengan pengembalian stok barang secara otomatis.
- Kelengkapan 17 atribut pada struktur data cetak struk termal 80mm.

Untuk menjalankan seluruh unit pengujian:
```bash
php artisan test
```

---

## 🛡️ Keamanan & Integritas Basis Data

- **Pencegahan Race Condition**: Operasi checkout kasir menggunakan `DB::transaction()` dipadukan dengan klausa `lockForUpdate()` pada model produk, mencegah pengurangan stok ganda saat transaksi bersamaan.
- **Log Audit**: Setiap aktivitas penting (tambah produk, perubahan stok, login pengguna, pembatalan faktur) dicatat ke dalam tabel `tbl_log`.
- **Soft Deactivation**: Produk yang memiliki riwayat transaksi masa lalu tidak dapat dihapus secara fisik, melainkan dinonaktifkan secara aman untuk melindungi validitas laporan penjualan.

---

&copy; 2026 **TOKOKITA POS** &bull; Dirancang untuk efisiensi transaksi ritel modern.
