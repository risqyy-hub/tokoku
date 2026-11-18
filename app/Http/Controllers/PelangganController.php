<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\Pelanggan;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PelangganController extends Controller
{
    /**
     * Display customer listing with aggregate statistics.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $pelanggan = Pelanggan::whereNull('user_id')->with('akun')->withCount('transaksi')
            ->withSum('transaksi', 'total_belanja')
            ->when($search, function ($query, $search) {
                $query->where('nama_pelanggan', 'like', "%{$search}%")
                    ->orWhere('no_kartu', 'like', "%{$search}%")
                    ->orWhere('no_hp', 'like', "%{$search}%")
                    ->orWhere('alamat', 'like', "%{$search}%")
                    ->orWhere('kota', 'like', "%{$search}%");
            })
            ->orderBy('id_pelanggan', 'desc')
            ->paginate(15)
            ->withQueryString();

        $totalPelanggan = Pelanggan::whereNull('user_id')->count();
        $totalBelanjaSemua = Transaksi::whereHas('pelanggan', fn ($query) => $query->whereNull('user_id'))->sum('total_belanja');

        return Inertia::render('Pelanggan/Index', [
            'pelanggan' => $pelanggan,
            'stats' => [
                'totalPelanggan' => $totalPelanggan,
                'totalBelanjaSemua' => (float) $totalBelanjaSemua,
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_pelanggan' => ['required', 'string', 'max:100'],
            'no_kartu' => ['nullable', 'string', 'max:50', 'unique:tbl_pelanggan,no_kartu'],
            'no_hp' => ['nullable', 'string', 'max:25'],
            'alamat' => ['nullable', 'string', 'max:255'],
            'kota' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
        ], [
            'nama_pelanggan.required' => 'Nama pelanggan wajib diisi.',
            'no_kartu.unique' => 'Nomor kartu RFID / Member ini sudah digunakan pelanggan lain.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $validated['user_id'] = null;
        $pelanggan = Pelanggan::create($validated);

        LogAktivitas::catat(
            'TAMBAH PELANGGAN',
            'tbl_pelanggan',
            "Menambahkan pelanggan baru: {$pelanggan->nama_pelanggan} (ID: {$pelanggan->id_pelanggan})"
        );

        // If requested via POS JSON / Inertia modal, return flash or redirect
        return redirect()->back()->with('success', "Pelanggan '{$pelanggan->nama_pelanggan}' berhasil didaftarkan.");
    }

    /**
     * Update customer.
     */
    public function update(Request $request, $id)
    {
        $pelanggan = Pelanggan::findOrFail($id);
        abort_if($pelanggan->user_id, 403, 'Akun pelanggan mandiri hanya dapat dikelola pemiliknya.');

        if (array_key_exists('no_kartu', $request->all()) && $pelanggan->user_id) {
            abort(403, 'RFID akun pelanggan mandiri tidak dapat diubah lewat POS.');
        }

        $validated = $request->validate([
            'nama_pelanggan' => ['required', 'string', 'max:100'],
            'no_kartu' => ['nullable', 'string', 'max:50', 'unique:tbl_pelanggan,no_kartu,'.$id.',id_pelanggan'],
            'no_hp' => ['nullable', 'string', 'max:25'],
            'alamat' => ['nullable', 'string', 'max:255'],
            'kota' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
        ], [
            'nama_pelanggan.required' => 'Nama pelanggan wajib diisi.',
            'no_kartu.unique' => 'Nomor kartu RFID / Member ini sudah digunakan pelanggan lain.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $pelanggan->update($validated);

        LogAktivitas::catat(
            'UPDATE PELANGGAN',
            'tbl_pelanggan',
            "Memperbarui data pelanggan ID {$id}: {$pelanggan->nama_pelanggan}"
        );

        return redirect()->back()->with('success', "Data pelanggan '{$pelanggan->nama_pelanggan}' berhasil diperbarui.");
    }

    /**
     * Get transaction history for a specific customer.
     */
    public function riwayat($id)
    {
        $pelanggan = Pelanggan::with(['transaksi' => function ($q) {
            $q->with('details', 'kasir')->orderBy('id_transaksi', 'desc');
        }])->findOrFail($id);

        return response()->json($pelanggan);
    }

    /**
     * Delete customer if no transactions associated.
     */
    public function destroy($id)
    {
        $pelanggan = Pelanggan::withCount('transaksi')->findOrFail($id);
        abort_if($pelanggan->user_id, 403, 'Akun pelanggan mandiri tidak dapat dihapus lewat panel POS.');

        if ($pelanggan->transaksi_count > 0) {
            return redirect()->back()->with(
                'error',
                "Pelanggan '{$pelanggan->nama_pelanggan}' tidak dapat dihapus karena memiliki {$pelanggan->transaksi_count} riwayat transaksi."
            );
        }

        $nama = $pelanggan->nama_pelanggan;
        $pelanggan->delete();

        LogAktivitas::catat(
            'HAPUS PELANGGAN',
            'tbl_pelanggan',
            "Menghapus data pelanggan: {$nama} (ID: {$id})"
        );

        return redirect()->back()->with('success', "Pelanggan '{$nama}' berhasil dihapus.");
    }
}
