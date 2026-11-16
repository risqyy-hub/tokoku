<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanController extends Controller
{
    /**
     * Display shop settings page.
     */
    public function index(): Response
    {
        $toko = Pengaturan::getToko();

        return Inertia::render('Pengaturan/Index', [
            'toko' => $toko,
        ]);
    }

    /**
     * Update shop settings.
     */
    public function update(Request $request)
    {
        $toko = Pengaturan::getToko();

        $validated = $request->validate([
            'nama_toko' => ['required', 'string', 'max:100'],
            'slogan' => ['nullable', 'string', 'max:150'],
            'alamat' => ['required', 'string', 'max:255'],
            'no_telepon' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'pesan_struk' => ['nullable', 'string', 'max:500'],
            'pajak_persen' => ['required', 'numeric', 'min:0', 'max:100'],
            'pajak_aktif' => ['boolean'],
            'mode_cetak' => ['required', 'in:browser_dialog,direct_thermal'],
            'logo' => ['nullable'],
        ]);

        if ($request->hasFile('logo')) {
            $request->validate([
                'logo' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            ]);

            $path = $request->file('logo')->store('toko', 'public');
            $validated['logo'] = '/storage/'.$path;
        } else {
            unset($validated['logo']);
        }

        $validated['pajak_aktif'] = $request->boolean('pajak_aktif');

        $toko->update($validated);

        LogAktivitas::catat(
            'UPDATE PENGATURAN',
            'tbl_pengaturan',
            "Memperbarui profil toko {$toko->nama_toko} dan pengaturan printer struk thermal"
        );

        return redirect()->back()->with('success', 'Pengaturan toko dan printer struk berhasil disimpan.');
    }
}
