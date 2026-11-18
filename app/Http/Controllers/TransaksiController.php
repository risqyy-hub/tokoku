<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\SaldoMutasi;
use App\Models\StokMutasi;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\PosCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransaksiController extends Controller
{
    public function __construct(
        protected PosCheckoutService $checkoutService
    ) {}

    /**
     * Display transactions history with filters.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $kasirId = $request->input('kasir_id');
        $pelangganId = $request->input('pelanggan_id');
        $metode = $request->input('metode');
        $status = $request->input('status');

        $query = Transaksi::with(['kasir', 'pelanggan', 'details.produk'])
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nomor_transaksi', 'like', "%{$search}%")
                        ->orWhereHas('pelanggan', function ($p) use ($search) {
                            $p->where('nama_pelanggan', 'like', "%{$search}%");
                        });
                });
            })
            ->when($startDate, function ($q, $startDate) {
                $q->whereDate('tanggal', '>=', $startDate);
            })
            ->when($endDate, function ($q, $endDate) {
                $q->whereDate('tanggal', '<=', $endDate);
            })
            ->when($kasirId, function ($q, $kasirId) {
                $q->where('id_user', $kasirId);
            })
            ->when($pelangganId, function ($q, $pelangganId) {
                $q->where('id_pelanggan', $pelangganId);
            })
            ->when($metode, function ($q, $metode) {
                $q->where('metode_pembayaran', $metode);
            })
            ->when($status, function ($q, $status) {
                $q->where('status', $status);
            });

        $transaksi = $query->orderBy('id_transaksi', 'desc')->paginate(15)->withQueryString();

        $kasirList = User::whereIn('role', ['admin', 'kasir'])->orderBy('name', 'asc')->get();
        $pelangganList = Pelanggan::orderBy('nama_pelanggan', 'asc')->get();

        $stats = [
            'totalTransaksi' => Transaksi::count(),
            'totalOmzet' => (float) Transaksi::where('status', 'selesai')->sum('total_belanja'),
            'totalBatal' => Transaksi::where('status', 'batal')->count(),
        ];

        return Inertia::render('Transaksi/Index', [
            'transaksi' => $transaksi,
            'kasirList' => $kasirList,
            'pelangganList' => $pelangganList,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'kasir_id' => $kasirId,
                'pelanggan_id' => $pelangganId,
                'metode' => $metode,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Get thermal receipt data for reprinting.
     */
    public function receipt($id)
    {
        $transaksi = Transaksi::findOrFail($id);
        $struk = $this->checkoutService->getReceiptData($transaksi);

        return response()->json($struk);
    }

    /**
     * Cancel / void transaction safely with stock restoration.
     */
    public function batalkan(Request $request, $id)
    {
        $request->validate([
            'alasan' => ['required', 'string', 'max:255'],
        ], [
            'alasan.required' => 'Alasan pembatalan transaksi wajib diisi.',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $transaksi = Transaksi::with('details')->lockForUpdate()->findOrFail($id);

            if ($transaksi->status === 'batal') {
                return redirect()->back()->with('error', 'Transaksi ini sudah dibatalkan sebelumnya.');
            }

            if ($transaksi->status === 'menunggu') {
                return redirect()->back()->with('error', 'Pesanan online yang menunggu tidak dapat dibatalkan lewat POS.');
            }

            // Restore stocks
            foreach ($transaksi->details as $item) {
                $produk = Produk::lockForUpdate()->find($item->id_produk);
                if ($produk) {
                    $stokSebelum = $produk->stok;
                    $stokSesudah = $stokSebelum + $item->jumlah;
                    $produk->stok = $stokSesudah;
                    $produk->save();

                    // Record stock mutation
                    StokMutasi::create([
                        'id_produk' => $produk->id_produk,
                        'jenis' => 'batal',
                        'jumlah' => $item->jumlah,
                        'stok_sebelum' => $stokSebelum,
                        'stok_sesudah' => $stokSesudah,
                        'id_user' => Auth::id(),
                        'keterangan' => "Retur pembatalan faktur {$transaksi->nomor_transaksi}. Alasan: {$request->alasan}",
                    ]);
                }
            }

            $transaksi->status = 'batal';
            $transaksi->catatan = ($transaksi->catatan ? $transaksi->catatan.' | ' : '')."Dibatalkan: {$request->alasan}";
            $transaksi->save();

            if ($transaksi->metode_pembayaran === 'saldo') {
                $sudahRefund = SaldoMutasi::where('id_transaksi', $transaksi->id_transaksi)
                    ->where('jenis', 'refund')
                    ->exists();
                if ($sudahRefund) {
                    return redirect()->back()->with('error', 'Pengembalian saldo transaksi ini sudah pernah diproses.');
                }

                $customer = Pelanggan::lockForUpdate()->findOrFail($transaksi->id_pelanggan);
                $saldoSebelum = (float) $customer->saldo;
                $customer->saldo += $transaksi->total_belanja;
                $customer->save();
                SaldoMutasi::create([
                    'id_pelanggan' => $customer->id_pelanggan,
                    'jenis' => 'refund',
                    'jumlah' => $transaksi->total_belanja,
                    'saldo_sebelum' => $saldoSebelum,
                    'saldo_sesudah' => $customer->saldo,
                    'id_transaksi' => $transaksi->id_transaksi,
                    'keterangan' => "Pengembalian dana transaksi {$transaksi->nomor_transaksi}",
                ]);
            }

            LogAktivitas::catat(
                'PEMBATALAN TRANSAKSI',
                'tbl_transaksi',
                "Membatalkan faktur {$transaksi->nomor_transaksi} (Total Rp".number_format($transaksi->total_belanja, 0, ',', '.')."). Alasan: {$request->alasan}"
            );

            return redirect()->back()->with('success', "Transaksi {$transaksi->nomor_transaksi} berhasil dibatalkan dan stok produk telah dikembalikan.");
        });
    }
}
