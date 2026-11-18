<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\PelangganController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\PenggunaController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StokController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes - TOKOKITA POS
|--------------------------------------------------------------------------
*/

// Root Redirect based on user role
Route::get('/', function () {
    if (Auth::check()) {
        return Auth::user()->isAdmin()
            ? redirect()->route('dashboard')
            : (Auth::user()->isCustomer() ? redirect()->route('shop.index') : redirect()->route('pos.index'));
    }

    return redirect()->route('login');
});

// Authentication routes (Guest only)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
    Route::get('/register', fn () => Inertia::render('Auth/Register'))->name('register.form');
    Route::post('/register', [LoginController::class, 'register'])->name('register');
});

// Logout (Authenticated only)
Route::post('/logout', [LoginController::class, 'logout'])->name('logout')->middleware('auth');
Route::post('/payment/midtrans/notification', [WalletController::class, 'notification'])->name('wallet.notification');

// Protected Routes: Kasir & Admin
Route::middleware(['auth', 'role:admin,kasir'])->group(function () {
    // POS Terminal
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/checkout', [PosController::class, 'checkout'])->name('pos.checkout');
    Route::get('/pos/receipt/{id}', [PosController::class, 'getReceipt'])->name('pos.receipt');

    // Pelanggan (Master Data & Kasir lookup)
    Route::get('/pelanggan', [PelangganController::class, 'index'])->name('pelanggan.index');
    Route::post('/pelanggan', [PelangganController::class, 'store'])->name('pelanggan.store');
    Route::put('/pelanggan/{id}', [PelangganController::class, 'update'])->name('pelanggan.update');
    Route::delete('/pelanggan/{id}', [PelangganController::class, 'destroy'])->name('pelanggan.destroy');
    Route::get('/pelanggan/{id}/riwayat', [PelangganController::class, 'riwayat'])->name('pelanggan.riwayat');

    // Transaksi History & Reprint Receipt (Kasir & Admin can reprint)
    Route::get('/transaksi', [TransaksiController::class, 'index'])->name('transaksi.index');
    Route::get('/transaksi/{id}/receipt', [TransaksiController::class, 'receipt'])->name('transaksi.receipt');
});

Route::middleware(['auth', 'role:user'])->group(function () {
    Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
    Route::post('/shop/checkout', [ShopController::class, 'checkout'])->name('shop.checkout');
    Route::get('/shop/orders', [ShopController::class, 'orders'])->name('shop.orders');
    Route::get('/shop/profile', [ShopController::class, 'profile'])->name('shop.profile');
    Route::put('/shop/profile', [ShopController::class, 'updateProfile'])->name('shop.profile.update');
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index');
    Route::post('/wallet/topup', [WalletController::class, 'create'])->name('wallet.topup');
});

// Admin-only Routes
Route::middleware(['auth', 'role:admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Void / Cancel Transaction (Admin only)
    Route::post('/transaksi/{id}/batalkan', [TransaksiController::class, 'batalkan'])->name('transaksi.batalkan');

    // Manajemen Stok
    Route::get('/stok', [StokController::class, 'index'])->name('stok.index');
    Route::post('/stok/mutasi', [StokController::class, 'mutasi'])->name('stok.mutasi');

    // Laporan & Export
    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::get('/laporan/export', [LaporanController::class, 'export'])->name('laporan.export');

    // Kategori
    Route::get('/kategori', [KategoriController::class, 'index'])->name('kategori.index');
    Route::post('/kategori', [KategoriController::class, 'store'])->name('kategori.store');
    Route::put('/kategori/{id}', [KategoriController::class, 'update'])->name('kategori.update');
    Route::delete('/kategori/{id}', [KategoriController::class, 'destroy'])->name('kategori.destroy');

    // Produk
    Route::get('/produk', [ProdukController::class, 'index'])->name('produk.index');
    Route::post('/produk', [ProdukController::class, 'store'])->name('produk.store');
    Route::put('/produk/{id}', [ProdukController::class, 'update'])->name('produk.update');
    Route::delete('/produk/{id}', [ProdukController::class, 'destroy'])->name('produk.destroy');
    Route::post('/produk/{id}/toggle-status', [ProdukController::class, 'toggleStatus'])->name('produk.toggle-status');
    Route::post('/produk/{id}/toggle-featured', [ProdukController::class, 'toggleFeatured'])->name('produk.toggle-featured');

    // Pengguna
    Route::get('/pengguna', [PenggunaController::class, 'index'])->name('pengguna.index');
    Route::post('/pengguna', [PenggunaController::class, 'store'])->name('pengguna.store');
    Route::put('/pengguna/{id}', [PenggunaController::class, 'update'])->name('pengguna.update');
    Route::delete('/pengguna/{id}', [PenggunaController::class, 'destroy'])->name('pengguna.destroy');
    Route::post('/pengguna/{id}/toggle-status', [PenggunaController::class, 'toggleStatus'])->name('pengguna.toggle-status');

    // Pengaturan Toko & Printer
    Route::get('/pengaturan', [PengaturanController::class, 'index'])->name('pengaturan.index');
    Route::put('/pengaturan', [PengaturanController::class, 'update'])->name('pengaturan.update');
});
