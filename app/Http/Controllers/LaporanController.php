<?php

namespace App\Http\Controllers;

use App\Models\DetailTransaksi;
use App\Models\Produk;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanController extends Controller
{
    /**
     * Display comprehensive POS business reports.
     */
    public function index(Request $request): Response
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        // 1. Transactions in Period
        $trxQuery = Transaksi::where('status', 'selesai')
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate);

        $totalOmzet = (float) $trxQuery->sum('total_belanja');
        $jumlahTransaksi = $trxQuery->count();
        $rataRataTransaksi = $jumlahTransaksi > 0 ? round($totalOmzet / $jumlahTransaksi, 2) : 0.0;

        // 2. Gross Profit Calculation from Snapshot items
        $detailQuery = DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->where('status', 'selesai')
                ->whereDate('tanggal', '>=', $startDate)
                ->whereDate('tanggal', '<=', $endDate);
        });

        $totalModalHPP = (float) $detailQuery->sum(DB::raw('harga_beli * jumlah'));
        $keuntunganKotor = max(0.0, $totalOmzet - $totalModalHPP);

        // 3. Penjualan Harian Breakdown
        $penjualanHarian = Transaksi::select(
            'tanggal',
            DB::raw('COUNT(*) as total_transaksi'),
            DB::raw('SUM(total_belanja) as total_omzet')
        )
            ->where('status', 'selesai')
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->groupBy('tanggal')
            ->orderBy('tanggal', 'asc')
            ->get();

        // 4. Laporan Per Kasir
        $laporanKasir = Transaksi::select(
            'id_user',
            DB::raw('COUNT(*) as total_transaksi'),
            DB::raw('SUM(total_belanja) as total_omzet')
        )
            ->with('kasir')
            ->where('status', 'selesai')
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->groupBy('id_user')
            ->orderByDesc('total_omzet')
            ->get()
            ->map(function ($row) {
                return [
                    'nama_kasir' => $row->kasir ? $row->kasir->name : 'Kasir Toko (Umum)',
                    'total_transaksi' => $row->total_transaksi,
                    'total_omzet' => (float) $row->total_omzet,
                ];
            });

        // 5. Laporan Metode Pembayaran
        $laporanMetode = Transaksi::select(
            'metode_pembayaran',
            DB::raw('COUNT(*) as total_transaksi'),
            DB::raw('SUM(total_belanja) as total_omzet')
        )
            ->where('status', 'selesai')
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->groupBy('metode_pembayaran')
            ->orderByDesc('total_omzet')
            ->get();

        // 6. Produk Terlaris (Top 8)
        $produkTerlaris = DetailTransaksi::select(
            'nama_produk',
            DB::raw('SUM(jumlah) as total_terjual'),
            DB::raw('SUM(subtotal) as total_omzet')
        )
            ->whereHas('transaksi', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'selesai')
                    ->whereDate('tanggal', '>=', $startDate)
                    ->whereDate('tanggal', '<=', $endDate);
            })
            ->groupBy('nama_produk')
            ->orderByDesc('total_terjual')
            ->limit(8)
            ->get();

        // 7. Produk Kurang Laku (Slow Movers)
        $soldProductNames = DetailTransaksi::whereHas('transaksi', function ($q) use ($startDate, $endDate) {
            $q->where('status', 'selesai')
                ->whereDate('tanggal', '>=', $startDate)
                ->whereDate('tanggal', '<=', $endDate);
        })->pluck('nama_produk')->unique()->toArray();

        $produkKurangLaku = Produk::with('kategori')
            ->whereNotIn('nama_produk', $soldProductNames)
            ->where('status', 'aktif')
            ->orderBy('stok', 'desc')
            ->limit(8)
            ->get();

        // 8. Laporan Stok & Aset Inventori
        $laporanStok = [
            'totalItem' => Produk::count(),
            'totalStokUnit' => (int) Produk::sum('stok'),
            'totalNilaiAset' => (float) Produk::sum(DB::raw('stok * harga_beli')),
            'totalPotensiOmzet' => (float) Produk::sum(DB::raw('stok * harga')),
            'stokHabis' => Produk::where('stok', '<=', 0)->count(),
            'stokMenipis' => Produk::where('stok', '>', 0)->whereColumn('stok', '<=', 'stok_minimum')->count(),
        ];

        return Inertia::render('Laporan/Index', [
            'summary' => [
                'totalOmzet' => $totalOmzet,
                'totalModalHPP' => $totalModalHPP,
                'keuntunganKotor' => $keuntunganKotor,
                'jumlahTransaksi' => $jumlahTransaksi,
                'rataRataTransaksi' => $rataRataTransaksi,
            ],
            'penjualanHarian' => $penjualanHarian,
            'laporanKasir' => $laporanKasir,
            'laporanMetode' => $laporanMetode,
            'produkTerlaris' => $produkTerlaris,
            'produkKurangLaku' => $produkKurangLaku,
            'laporanStok' => $laporanStok,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Export reports to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $transactions = Transaksi::with(['kasir', 'pelanggan'])
            ->where('status', 'selesai')
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->orderBy('id_transaksi', 'asc')
            ->get();

        $fileName = "laporan_penjualan_{$startDate}_{$endDate}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['No', 'Nomor Transaksi', 'Tanggal', 'Kasir', 'Pelanggan', 'Metode Bayar', 'Total Belanja', 'Status']);

            $no = 1;
            foreach ($transactions as $t) {
                fputcsv($handle, [
                    $no++,
                    $t->nomor_transaksi ?: "TRX-{$t->id_transaksi}",
                    $t->tanggal,
                    $t->kasir ? $t->kasir->name : 'Kasir',
                    $t->pelanggan ? $t->pelanggan->nama_pelanggan : 'Pelanggan Umum',
                    strtoupper($t->metode_pembayaran),
                    $t->total_belanja,
                    $t->status,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
