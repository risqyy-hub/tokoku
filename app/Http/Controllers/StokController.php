<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\Produk;
use App\Models\StokMutasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StokController extends Controller
{
    /**
     * Display stock inventory and mutation audit trail.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $jenisFilter = $request->input('jenis'); // masuk, keluar, penyesuaian, penjualan

        // 1. Mutation history
        $mutasi = StokMutasi::with(['produk', 'user'])
            ->when($jenisFilter && $jenisFilter !== 'all', function ($q) use ($jenisFilter) {
                $q->where('jenis', $jenisFilter);
            })
            ->when($search, function ($q, $search) {
                $q->whereHas('produk', function ($p) use ($search) {
                    $p->where('nama_produk', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->orderBy('id_mutasi', 'desc')
            ->paginate(15)
            ->withQueryString();

        // 2. Critical stock products
        $produkKritis = Produk::with('kategori')
            ->where(function ($q) {
                $q->where('stok', '<=', 0)
                    ->orWhereColumn('stok', '<=', 'stok_minimum');
            })
            ->orderBy('stok', 'asc')
            ->get();

        // 3. Products list for adjustment modal
        $produkList = Produk::where('status', 'aktif')->orderBy('nama_produk', 'asc')->get();

        $stats = [
            'totalStokTersedia' => (int) Produk::sum('stok'),
            'totalStokMenipis' => Produk::where('stok', '>', 0)->whereColumn('stok', '<=', 'stok_minimum')->count(),
            'totalStokHabis' => Produk::where('stok', '<=', 0)->count(),
            'totalMutasiBulanIni' => StokMutasi::whereMonth('created_at', now()->month)->count(),
        ];

        return Inertia::render('Stok/Index', [
            'mutasi' => $mutasi,
            'produkKritis' => $produkKritis,
            'produkList' => $produkList,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'jenis' => $jenisFilter,
            ],
        ]);
    }

    /**
     * Process stock adjustment (masuk, keluar, penyesuaian).
     */
    public function mutasi(Request $request)
    {
        $validated = $request->validate([
            'id_produk' => ['required', 'exists:tbl_produk,id_produk'],
            'jenis' => ['required', 'in:masuk,keluar,penyesuaian'],
            'jumlah' => ['required', 'integer', 'min:1'],
            'keterangan' => ['required', 'string', 'max:255'],
        ], [
            'id_produk.required' => 'Produk wajib dipilih.',
            'jumlah.min' => 'Jumlah mutasi minimal 1 unit.',
            'keterangan.required' => 'Alasan / keterangan perubahan stok wajib diisi.',
        ]);

        return DB::transaction(function () use ($validated) {
            $produk = Produk::where('id_produk', $validated['id_produk'])
                ->lockForUpdate()
                ->firstOrFail();

            $stokSebelum = $produk->stok;
            $jumlah = (int) $validated['jumlah'];
            $jenis = $validated['jenis'];

            if ($jenis === 'masuk') {
                $stokSesudah = $stokSebelum + $jumlah;
            } elseif ($jenis === 'keluar') {
                if ($stokSebelum < $jumlah) {
                    return redirect()->back()->with(
                        'error',
                        "Gagal mutasi keluar: Stok saat ini ({$stokSebelum}) tidak mencukupi untuk dikurangi {$jumlah} unit!"
                    );
                }
                $stokSesudah = $stokSebelum - $jumlah;
            } else {
                // Penyesuaian: nilai yang dimasukkan menjadi stok baru aktual
                $stokSesudah = $jumlah;
                $jumlah = abs($stokSesudah - $stokSebelum);
            }

            // Update product stock
            $produk->stok = $stokSesudah;
            $produk->save();

            // Record mutation log
            StokMutasi::create([
                'id_produk' => $produk->id_produk,
                'jenis' => $jenis,
                'jumlah' => $jumlah,
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $stokSesudah,
                'id_user' => Auth::id(),
                'keterangan' => $validated['keterangan'],
            ]);

            // Record audit log
            LogAktivitas::catat(
                'MUTASI STOK',
                'tbl_stok_mutasi',
                "Mutasi {$jenis} produk {$produk->nama_produk} oleh ".Auth::user()->name.". Stok {$stokSebelum} -> {$stokSesudah}. Alasan: {$validated['keterangan']}"
            );

            return redirect()->back()->with(
                'success',
                "Mutasi stok '{$produk->nama_produk}' berhasil diproses. Stok terkini: {$stokSesudah} unit."
            );
        });
    }
}
