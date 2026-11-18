<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Services\PosCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(): Response
    {
        abort_unless(auth()->user()->pelanggan, 403, 'Akun pelanggan belum terhubung.');

        return Inertia::render('Shop/Index', [
            'products' => Produk::where('status', 'aktif')->where('stok', '>', 0)
                ->whereHas('kategori', fn ($query) => $query->where('nama_kategori', '!=', 'Top-up Saldo'))
                ->with('kategori')->orderBy('nama_produk')->get(),
            'categories' => Kategori::orderBy('nama_kategori')->get(),
            'customer' => auth()->user()->pelanggan()->firstOrFail(),
        ]);
    }

    public function checkout(Request $request, PosCheckoutService $checkoutService)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_produk' => ['required', 'integer'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'alamat_pengiriman' => ['required', 'string', 'max:1000'],
            'metode_pembayaran' => ['required', 'in:tunai,saldo'],
        ]);

        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');
        $transaction = DB::transaction(function () use ($data, $customer, $checkoutService): Transaksi {
            $customer = Pelanggan::whereKey($customer->id_pelanggan)->lockForUpdate()->firstOrFail();
            $customer->alamat = $data['alamat_pengiriman'];
            $customer->save();

            return $checkoutService->checkout([
                ...$data,
                'id_pelanggan' => $customer->id_pelanggan,
                'alamat_pengiriman' => $data['alamat_pengiriman'],
            ]);
        });

        $paymentMessage = $transaction->metode_pembayaran === 'tunai' ? 'menunggu pembayaran tunai saat pesanan diterima (COD)' : 'dibayar dengan saldo';

        return redirect()->route('shop.orders')->with('success', "Pesanan {$transaction->nomor_transaksi} berhasil dibuat, {$paymentMessage}.");
    }

    public function orders(Request $request): Response
    {
        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');
        $orders = Transaksi::where('id_pelanggan', $customer->id_pelanggan)->with('details')->latest('id_transaksi')->get();

        return Inertia::render('Shop/Orders', ['orders' => $orders]);
    }

    public function profile(Request $request): Response
    {
        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');

        return Inertia::render('Shop/Profile', ['customer' => $customer]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'nama_pelanggan' => ['required', 'string', 'max:100'],
            'no_hp' => ['nullable', 'string', 'max:25'],
            'alamat' => ['required', 'string', 'max:1000'],
        ]);

        $request->user()->pelanggan()->update($validated);
        $request->user()->update(['name' => $validated['nama_pelanggan'], 'phone' => $validated['no_hp'] ?? null]);

        return back()->with('success', 'Profil dan alamat berhasil diperbarui.');
    }
}
