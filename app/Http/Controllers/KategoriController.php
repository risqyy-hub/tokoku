<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KategoriController extends Controller
{
    /**
     * Display category listing.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $kategori = Kategori::withCount('produk')
            ->when($search, function ($query, $search) {
                $query->where('nama_kategori', 'like', "%{$search}%");
            })
            ->orderBy('id_kategori', 'asc')
            ->get();

        return Inertia::render('Kategori/Index', [
            'kategori' => $kategori,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kategori' => ['required', 'string', 'max:100', 'unique:tbl_kategori,nama_kategori'],
        ], [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.unique' => 'Nama kategori sudah digunakan.',
            'nama_kategori.max' => 'Nama kategori maksimal 100 karakter.',
        ]);

        if (mb_strtolower(trim($validated['nama_kategori'])) === 'top-up saldo') {
            return redirect()->back()->withErrors(['nama_kategori' => 'Nama kategori ini disediakan untuk fitur top-up saldo.']);
        }

        $kategori = Kategori::create($validated);

        LogAktivitas::catat(
            'TAMBAH KATEGORI',
            'tbl_kategori',
            "Menambahkan kategori baru: {$kategori->nama_kategori} (ID: {$kategori->id_kategori})"
        );

        return redirect()->back()->with('success', "Kategori '{$kategori->nama_kategori}' berhasil ditambahkan.");
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $kategori = Kategori::findOrFail($id);

        if ($kategori->is_system) {
            return redirect()->back()->with('error', 'Kategori sistem tidak dapat diubah.');
        }

        $validated = $request->validate([
            'nama_kategori' => ['required', 'string', 'max:100', "unique:tbl_kategori,nama_kategori,{$id},id_kategori"],
        ], [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.unique' => 'Nama kategori sudah digunakan.',
        ]);

        if (mb_strtolower(trim($validated['nama_kategori'])) === 'top-up saldo') {
            return redirect()->back()->withErrors(['nama_kategori' => 'Nama kategori ini disediakan untuk fitur top-up saldo.']);
        }

        $oldName = $kategori->nama_kategori;
        $kategori->update($validated);

        LogAktivitas::catat(
            'UPDATE KATEGORI',
            'tbl_kategori',
            "Mengubah kategori ID {$id} dari '{$oldName}' menjadi '{$kategori->nama_kategori}'"
        );

        return redirect()->back()->with('success', "Kategori '{$kategori->nama_kategori}' berhasil diperbarui.");
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        $kategori = Kategori::withCount('produk')->findOrFail($id);

        if ($kategori->is_system) {
            return redirect()->back()->with('error', 'Kategori sistem tidak dapat dihapus.');
        }

        if ($kategori->produk_count > 0) {
            return redirect()->back()->with(
                'error',
                "Kategori '{$kategori->nama_kategori}' tidak dapat dihapus karena masih digunakan oleh {$kategori->produk_count} produk."
            );
        }

        $nama = $kategori->nama_kategori;
        $kategori->delete();

        LogAktivitas::catat(
            'HAPUS KATEGORI',
            'tbl_kategori',
            "Menghapus kategori: {$nama} (ID: {$id})"
        );

        return redirect()->back()->with('success', "Kategori '{$nama}' berhasil dihapus.");
    }
}
