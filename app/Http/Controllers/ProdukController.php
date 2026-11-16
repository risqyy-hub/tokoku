<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\LogAktivitas;
use App\Models\Produk;
use App\Models\StokMutasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProdukController extends Controller
{
    /**
     * Display product catalog listing with filters and pagination.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $kategoriId = $request->input('kategori_id');
        $stokFilter = $request->input('stok_filter'); // all, menipis, habis, normal
        $status = $request->input('status'); // all, aktif, nonaktif

        $query = Produk::with('kategori')
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nama_produk', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%");
                });
            })
            ->when($kategoriId, function ($q, $kategoriId) {
                $q->where('id_kategori', $kategoriId);
            })
            ->when($status && $status !== 'all', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($stokFilter, function ($q, $stokFilter) {
                if ($stokFilter === 'habis') {
                    $q->where('stok', '<=', 0);
                } elseif ($stokFilter === 'menipis') {
                    $q->where('stok', '>', 0)
                        ->whereColumn('stok', '<=', 'stok_minimum');
                } elseif ($stokFilter === 'aman') {
                    $q->whereColumn('stok', '>', 'stok_minimum');
                }
            });

        $produk = $query->orderBy('nama_produk', 'asc')->paginate(15)->withQueryString();

        $kategoriList = Kategori::orderBy('nama_kategori', 'asc')->get();

        // Statistics
        $totalProduk = Produk::count();
        $totalStokMenipis = Produk::where('stok', '>', 0)->whereColumn('stok', '<=', 'stok_minimum')->count();
        $totalStokHabis = Produk::where('stok', '<=', 0)->count();
        $totalUnggulan = Produk::where('is_featured', true)->count();

        return Inertia::render('Produk/Index', [
            'produk' => $produk,
            'kategoriList' => $kategoriList,
            'stats' => [
                'totalProduk' => $totalProduk,
                'totalStokMenipis' => $totalStokMenipis,
                'totalStokHabis' => $totalStokHabis,
                'totalUnggulan' => $totalUnggulan,
            ],
            'filters' => [
                'search' => $search,
                'kategori_id' => $kategoriId,
                'stok_filter' => $stokFilter,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_kategori' => ['required', 'exists:tbl_kategori,id_kategori'],
            'nama_produk' => ['required', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:50', 'unique:tbl_produk,sku'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:tbl_produk,barcode'],
            'brand' => ['nullable', 'string', 'max:100'],
            'harga_beli' => ['required', 'numeric', 'min:0'],
            'harga' => ['required', 'numeric', 'min:0'],
            'stok' => ['required', 'integer', 'min:0'],
            'stok_minimum' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:aktif,nonaktif'],
            'is_featured' => ['boolean'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ], [
            'id_kategori.required' => 'Kategori produk wajib dipilih.',
            'nama_produk.required' => 'Nama produk wajib diisi.',
            'sku.unique' => 'SKU sudah digunakan produk lain.',
            'barcode.unique' => 'Barcode sudah digunakan produk lain.',
            'harga.required' => 'Harga jual wajib diisi.',
            'harga_beli.required' => 'Harga beli (modal) wajib diisi.',
            'stok.required' => 'Jumlah stok wajib diisi.',
        ]);

        // Auto-generate SKU if blank
        if (empty($validated['sku'])) {
            $validated['sku'] = 'SKU-'.strtoupper(Str::random(6));
        }

        // Auto-generate barcode if blank
        if (empty($validated['barcode'])) {
            $validated['barcode'] = '899'.mt_rand(1000000, 9999999);
        }

        // Handle Image Upload
        if ($request->hasFile('foto')) {
            $path = $request->file('foto')->store('produk', 'public');
            $validated['foto'] = '/storage/'.$path;
        }

        $produk = Produk::create($validated);

        // Record Initial Stock Mutation if > 0
        if ($produk->stok > 0) {
            StokMutasi::create([
                'id_produk' => $produk->id_produk,
                'jenis' => 'masuk',
                'jumlah' => $produk->stok,
                'stok_sebelum' => 0,
                'stok_sesudah' => $produk->stok,
                'id_user' => Auth::id(),
                'keterangan' => 'Stok awal produk baru ditambahkan',
            ]);
        }

        LogAktivitas::catat(
            'TAMBAH PRODUK',
            'tbl_produk',
            "Menambahkan produk baru: {$produk->nama_produk} (SKU: {$produk->sku}, Stok: {$produk->stok}, Harga: {$produk->harga})"
        );

        return redirect()->route('produk.index')->with('success', "Produk '{$produk->nama_produk}' berhasil ditambahkan.");
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, $id)
    {
        $produk = Produk::findOrFail($id);

        $validated = $request->validate([
            'id_kategori' => ['required', 'exists:tbl_kategori,id_kategori'],
            'nama_produk' => ['required', 'string', 'max:150'],
            'sku' => ['nullable', 'string', 'max:50', "unique:tbl_produk,sku,{$id},id_produk"],
            'barcode' => ['nullable', 'string', 'max:100', "unique:tbl_produk,barcode,{$id},id_produk"],
            'brand' => ['nullable', 'string', 'max:100'],
            'harga_beli' => ['required', 'numeric', 'min:0'],
            'harga' => ['required', 'numeric', 'min:0'],
            'stok' => ['required', 'integer', 'min:0'],
            'stok_minimum' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:aktif,nonaktif'],
            'is_featured' => ['boolean'],
            'foto' => ['nullable'], // string or image
        ]);

        $stokLama = $produk->stok;
        $stokBaru = (int) $validated['stok'];

        // Handle Image Upload if new file
        if ($request->hasFile('foto')) {
            $request->validate([
                'foto' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            ]);

            // Delete old file if exists in storage
            if ($produk->foto && Str::startsWith($produk->foto, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $produk->foto);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('foto')->store('produk', 'public');
            $validated['foto'] = '/storage/'.$path;
        } else {
            // Keep existing image if not changed
            unset($validated['foto']);
        }

        $produk->update($validated);

        // Record Stock Mutation if stock manually edited
        if ($stokLama !== $stokBaru) {
            $diff = abs($stokBaru - $stokLama);
            $jenis = $stokBaru > $stokLama ? 'masuk' : 'penyesuaian';

            StokMutasi::create([
                'id_produk' => $produk->id_produk,
                'jenis' => $jenis,
                'jumlah' => $diff,
                'stok_sebelum' => $stokLama,
                'stok_sesudah' => $stokBaru,
                'id_user' => Auth::id(),
                'keterangan' => 'Penyesuaian stok manual dari halaman master produk',
            ]);
        }

        LogAktivitas::catat(
            'UPDATE PRODUK',
            'tbl_produk',
            "Mengubah produk ID {$id}: {$produk->nama_produk} (Harga: {$produk->harga}, Stok: {$produk->stok})"
        );

        return redirect()->route('produk.index')->with('success', "Produk '{$produk->nama_produk}' berhasil diperbarui.");
    }

    /**
     * Toggle active status safely.
     */
    public function toggleStatus($id)
    {
        $produk = Produk::findOrFail($id);
        $newStatus = $produk->status === 'aktif' ? 'nonaktif' : 'aktif';
        $produk->status = $newStatus;
        $produk->save();

        LogAktivitas::catat(
            'STATUS PRODUK',
            'tbl_produk',
            "Mengubah status produk ID {$id} ({$produk->nama_produk}) menjadi {$newStatus}"
        );

        return redirect()->back()->with('success', "Status produk '{$produk->nama_produk}' diubah menjadi {$newStatus}.");
    }

    /**
     * Toggle featured status for automatic showcase.
     */
    public function toggleFeatured($id)
    {
        $produk = Produk::findOrFail($id);
        $produk->is_featured = ! $produk->is_featured;
        $produk->save();

        $stateText = $produk->is_featured ? 'ditampilkan di etalase unggulan' : 'dihapus dari etalase unggulan';

        return redirect()->back()->with('success', "Produk '{$produk->nama_produk}' berhasil {$stateText}.");
    }

    /**
     * Remove or safely deactivate the specified product.
     */
    public function destroy($id)
    {
        $produk = Produk::withCount('detailTransaksi')->findOrFail($id);

        // Safety rule: if already sold in historical transactions, don't delete row physically!
        if ($produk->detail_transaksi_count > 0) {
            $produk->status = 'nonaktif';
            $produk->save();

            return redirect()->back()->with(
                'info',
                "Produk '{$produk->nama_produk}' memiliki riwayat transaksi, sehingga statusnya dinonaktifkan secara aman (tidak dihapus fisik demi integritas data penjualan)."
            );
        }

        $nama = $produk->nama_produk;
        $produk->delete();

        LogAktivitas::catat(
            'HAPUS PRODUK',
            'tbl_produk',
            "Menghapus produk: {$nama} (ID: {$id})"
        );

        return redirect()->back()->with('success', "Produk '{$nama}' berhasil dihapus.");
    }
}
