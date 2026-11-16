<?php

namespace App\Http\Middleware;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $toko = Pengaturan::getToko();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'username' => $request->user()->username,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'phone' => $request->user()->phone,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
                'struk' => fn () => $request->session()->get('struk'),
            ],
            'toko' => [
                'nama_toko' => $toko->nama_toko,
                'slogan' => $toko->slogan,
                'alamat' => $toko->alamat,
                'no_telepon' => $toko->no_telepon,
                'email' => $toko->email,
                'logo' => $toko->logo,
                'pesan_struk' => $toko->pesan_struk,
                'pajak_persen' => (float) $toko->pajak_persen,
                'pajak_aktif' => (bool) $toko->pajak_aktif,
                'mode_cetak' => $toko->mode_cetak,
            ],
        ];
    }
}
