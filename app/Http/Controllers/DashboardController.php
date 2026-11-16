<?php

namespace App\Http\Controllers;

use App\Models\DetailTransaksi;
use App\Models\Produk;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Amazon Seller Central-inspired POS Dashboard.
     */
    public function index(): Response
    {
        $today = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();

        // 1. Total Penjualan & Transaksi Hari Ini
        $penjualanHariIni = Transaksi::whereDate('tanggal', $today)
            ->where('status', 'selesai')
            ->sum('total_belanja');

        $transaksiHariIni = Transaksi::whereDate('tanggal', $today)
            ->where('status', 'selesai')
            ->count();

        // 2. Total Produk & Kondisi Stok
        $totalProduk = Produk::count();
        $stokMenipisCount = Produk::where('stok', '>', 0)
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->count();
        $stokHabisCount = Produk::where('stok', '<=', 0)->count();

        // 3. Total Produk Terjual (Total Units Sold)
        $totalProdukTerjual = DetailTransaksi::whereHas('transaksi', function ($q) {
            $q->where('status', 'selesai');
        })->sum('jumlah');

        // 4. Total Omzet / Pendapatan All Time & Bulan Ini
        $totalPendapatanAllTime = Transaksi::where('status', 'selesai')->sum('total_belanja');
        $pendapatanBulanIni = Transaksi::where('status', 'selesai')
            ->whereDate('tanggal', '>=', $startOfMonth)
            ->sum('total_belanja');

        // 5. Chart Penjualan 7 Hari Terakhir
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateString = $date->toDateString();
            $label = $date->translatedFormat('D, d M');

            $omzet = Transaksi::whereDate('tanggal', $dateString)
                ->where('status', 'selesai')
                ->sum('total_belanja');

            $count = Transaksi::whereDate('tanggal', $dateString)
                ->where('status', 'selesai')
                ->count();

            $chartData[] = [
                'tanggal' => $dateString,
                'label' => $label,
                'omzet' => (float) $omzet,
                'transaksi' => $count,
            ];
        }

        // 6. Produk Terlaris (Top 5 Best Sellers)
        $produkTerlaris = DetailTransaksi::select('nama_produk', DB::raw('SUM(jumlah) as total_terjual'), DB::raw('SUM(subtotal) as total_omzet'))
            ->whereHas('transaksi', function ($q) {
                $q->where('status', 'selesai');
            })
            ->groupBy('nama_produk')
            ->orderByDesc('total_terjual')
            ->limit(5)
            ->get();

        // 7. Produk Stok Kritis (Menipis & Habis) untuk Widget Notifikasi
        $produkKritis = Produk::with('kategori')
            ->where(function ($q) {
                $q->where('stok', '<=', 0)
                    ->orWhereColumn('stok', '<=', 'stok_minimum');
            })
            ->orderBy('stok', 'asc')
            ->limit(6)
            ->get();

        // 8. Aktivitas Transaksi Terbaru (Recent 7 Transactions)
        $transaksiTerbaru = Transaksi::with(['pelanggan', 'kasir'])
            ->orderBy('id_transaksi', 'desc')
            ->limit(7)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'stats' => [
                'penjualanHariIni' => (float) $penjualanHariIni,
                'transaksiHariIni' => $transaksiHariIni,
                'totalProduk' => $totalProduk,
                'stokMenipisCount' => $stokMenipisCount,
                'stokHabisCount' => $stokHabisCount,
                'totalProdukTerjual' => (int) $totalProdukTerjual,
                'pendapatanBulanIni' => (float) $pendapatanBulanIni,
                'totalPendapatanAllTime' => (float) $totalPendapatanAllTime,
            ],
            'chartData' => $chartData,
            'produkTerlaris' => $produkTerlaris,
            'produkKritis' => $produkKritis,
            'transaksiTerbaru' => $transaksiTerbaru,
        ]);
    }
}
