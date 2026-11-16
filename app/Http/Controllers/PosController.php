<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Pelanggan;
use App\Models\Pengaturan;
use App\Models\Produk;
use App\Models\Transaksi;
use App\Services\PosCheckoutService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        protected PosCheckoutService $checkoutService
    ) {}

    /**
     * Display POS Cashier interface.
     */
    public function index(): Response
    {
        // Active products for POS catalogue
        $produk = Produk::with('kategori')
            ->where('status', 'aktif')
            ->orderBy('nama_produk', 'asc')
            ->get();

        // Featured products for the automatic rotating showcase
        $featured = Produk::with('kategori')
            ->where('status', 'aktif')
            ->where('is_featured', true)
            ->get();

        $kategoriList = Kategori::orderBy('nama_kategori', 'asc')->get();
        $pelangganList = Pelanggan::orderBy('nama_pelanggan', 'asc')->get();
        $toko = Pengaturan::getToko();

        return Inertia::render('Pos/Index', [
            'katalog' => $produk,
            'featured' => $featured,
            'kategoriList' => $kategoriList,
            'pelangganList' => $pelangganList,
            'toko' => $toko,
        ]);
    }

    /**
     * Process POS checkout.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_produk' => ['required', 'integer'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'id_pelanggan' => ['nullable', 'integer'],
            'metode_pembayaran' => ['required', 'in:tunai,transfer,qris'],
            'diskon' => ['nullable', 'numeric', 'min:0'],
            'uang_diterima' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string', 'max:255'],
        ]);

        $transaksi = $this->checkoutService->checkout($validated);
        $strukData = $this->checkoutService->getReceiptData($transaksi);

        return redirect()->route('pos.index')->with([
            'success' => "Transaksi {$transaksi->nomor_transaksi} berhasil diproses! Stok produk otomatis terpotong.",
            'struk' => $strukData,
        ]);
    }

    /**
     * Get receipt data for reprint.
     */
    public function getReceipt($id)
    {
        $transaksi = Transaksi::findOrFail($id);
        $strukData = $this->checkoutService->getReceiptData($transaksi);

        return response()->json($strukData);
    }
}
