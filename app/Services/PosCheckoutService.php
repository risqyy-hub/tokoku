<?php

namespace App\Services;

use App\Models\DetailTransaksi;
use App\Models\LogAktivitas;
use App\Models\Pengaturan;
use App\Models\Produk;
use App\Models\StokMutasi;
use App\Models\Transaksi;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosCheckoutService
{
    /**
     * Process POS transaction checkout securely with row-level locking.
     *
     * @throws ValidationException|Exception
     */
    public function checkout(array $data): Transaksi
    {
        $items = $data['items'] ?? [];
        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => 'Keranjang belanja kosong. Masukkan minimal 1 produk.',
            ]);
        }

        $idPelanggan = ! empty($data['id_pelanggan']) ? (int) $data['id_pelanggan'] : null;
        $metodePembayaran = $data['metode_pembayaran'] ?? 'tunai';
        $diskon = isset($data['diskon']) ? (float) $data['diskon'] : 0.0;
        $uangDiterima = isset($data['uang_diterima']) ? (float) $data['uang_diterima'] : 0.0;
        $catatan = $data['catatan'] ?? null;
        $userId = Auth::id();

        // Get Shop Settings for tax calculation
        $toko = Pengaturan::getToko();
        $pajakPersen = ($toko->pajak_aktif && $toko->pajak_persen > 0) ? (float) $toko->pajak_persen : 0.0;

        // Perform transactional database write with lockForUpdate to prevent race conditions
        return DB::transaction(function () use (
            $items,
            $idPelanggan,
            $metodePembayaran,
            $diskon,
            $uangDiterima,
            $catatan,
            $userId,
            $pajakPersen
        ) {
            $itemProductIds = array_column($items, 'id_produk');

            // Lock the selected products for update
            $lockedProducts = Produk::whereIn('id_produk', $itemProductIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id_produk');

            $subtotalCalculated = 0.0;
            $itemsToInsert = [];
            $stockReductions = [];

            foreach ($items as $item) {
                $pId = (int) $item['id_produk'];
                $qty = (int) $item['jumlah'];

                if ($qty <= 0) {
                    throw ValidationException::withMessages([
                        'items' => 'Jumlah kuantitas produk tidak valid.',
                    ]);
                }

                if (! $lockedProducts->has($pId)) {
                    throw ValidationException::withMessages([
                        'items' => "Produk ID {$pId} tidak ditemukan di database.",
                    ]);
                }

                /** @var Produk $product */
                $product = $lockedProducts->get($pId);

                if ($product->status !== 'aktif') {
                    throw ValidationException::withMessages([
                        'items' => "Produk '{$product->nama_produk}' sedang nonaktif.",
                    ]);
                }

                // Strictly validate stock before deduction
                if ($product->stok < $qty) {
                    throw ValidationException::withMessages([
                        'items' => "Stok produk '{$product->nama_produk}' tidak mencukupi! Tersedia: {$product->stok}, diminta: {$qty}.",
                    ]);
                }

                $itemPrice = (float) $product->harga;
                $itemCost = (float) $product->harga_beli;
                $itemSubtotal = $itemPrice * $qty;
                $subtotalCalculated += $itemSubtotal;

                $itemsToInsert[] = [
                    'id_produk' => $product->id_produk,
                    'nama_produk' => $product->nama_produk, // Snapshot name
                    'jumlah' => $qty,
                    'harga_satuan' => $itemPrice,           // Snapshot selling price
                    'harga_beli' => $itemCost,              // Snapshot cost price
                    'diskon_item' => 0.0,
                    'subtotal' => $itemSubtotal,
                ];

                $stockReductions[] = [
                    'product' => $product,
                    'qty' => $qty,
                    'stok_sebelum' => $product->stok,
                    'stok_sesudah' => $product->stok - $qty,
                ];
            }

            // Calculate Totals
            $subtotalNet = max(0.0, $subtotalCalculated - $diskon);
            $pajakNominal = $pajakPersen > 0 ? round(($subtotalNet * $pajakPersen) / 100, 2) : 0.0;
            $totalBelanja = $subtotalNet + $pajakNominal;

            // Validate Cash payment
            if ($metodePembayaran === 'tunai' && $uangDiterima < $totalBelanja) {
                throw ValidationException::withMessages([
                    'uang_diterima' => 'Uang yang diterima ('.number_format($uangDiterima, 0, ',', '.').') kurang dari total belanja ('.number_format($totalBelanja, 0, ',', '.').').',
                ]);
            }

            $kembalian = $metodePembayaran === 'tunai' ? max(0.0, $uangDiterima - $totalBelanja) : 0.0;

            // Generate Sequential Invoice Number (e.g. TRX-20261116-0001)
            $datePrefix = date('Ymd');
            $todayCount = Transaksi::whereDate('tanggal', date('Y-m-d'))->count() + 1;
            $invoiceNumber = sprintf('TRX-%s-%04d', $datePrefix, $todayCount);

            // Double check uniqueness
            while (Transaksi::where('nomor_transaksi', $invoiceNumber)->exists()) {
                $todayCount++;
                $invoiceNumber = sprintf('TRX-%s-%04d', $datePrefix, $todayCount);
            }

            // Create Transaction record
            $transaksi = Transaksi::create([
                'nomor_transaksi' => $invoiceNumber,
                'tanggal' => date('Y-m-d'),
                'id_pelanggan' => $idPelanggan,
                'id_user' => $userId,
                'total_belanja' => $totalBelanja,
                'subtotal' => $subtotalCalculated,
                'diskon' => $diskon,
                'pajak' => $pajakNominal,
                'uang_diterima' => $metodePembayaran === 'tunai' ? $uangDiterima : $totalBelanja,
                'kembalian' => $kembalian,
                'metode_pembayaran' => $metodePembayaran,
                'status' => 'selesai',
                'catatan' => $catatan,
            ]);

            // Insert Transaction Details & Reduce Stock
            foreach ($itemsToInsert as $detail) {
                $detail['id_transaksi'] = $transaksi->id_transaksi;
                DetailTransaksi::create($detail);
            }

            foreach ($stockReductions as $red) {
                /** @var Produk $p */
                $p = $red['product'];
                $p->stok = $red['stok_sesudah'];
                $p->save();

                // Record Stock Mutation
                StokMutasi::create([
                    'id_produk' => $p->id_produk,
                    'jenis' => 'penjualan',
                    'jumlah' => $red['qty'],
                    'stok_sebelum' => $red['stok_sebelum'],
                    'stok_sesudah' => $red['stok_sesudah'],
                    'id_user' => $userId,
                    'keterangan' => "Penjualan kasir faktur {$invoiceNumber}",
                ]);
            }

            // Audit Log
            LogAktivitas::catat(
                'TRANSAKSI KASIR',
                'tbl_transaksi',
                "Transaksi berhasil {$invoiceNumber}: Total Rp".number_format($totalBelanja, 0, ',', '.')." ({$metodePembayaran})"
            );

            // Return loaded transaction
            return $transaksi->load(['pelanggan', 'kasir', 'details.produk']);
        });
    }

    /**
     * Format a transaction into thermal 80mm receipt data object.
     */
    public function getReceiptData(Transaksi $transaksi): array
    {
        $toko = Pengaturan::getToko();
        $transaksi->loadMissing(['pelanggan', 'kasir', 'details.produk']);

        return [
            'nomor_transaksi' => $transaksi->nomor_transaksi,
            'tanggal' => $transaksi->tanggal ? $transaksi->tanggal->format('d/m/Y') : date('d/m/Y'),
            'waktu' => $transaksi->created_at ? $transaksi->created_at->format('H:i:s') : date('H:i:s'),
            'kasir' => $transaksi->kasir ? $transaksi->kasir->name : 'Kasir Toko',
            'pelanggan' => $transaksi->pelanggan ? $transaksi->pelanggan->nama_pelanggan : 'Pelanggan Umum',
            'is_member' => (bool) ($transaksi->pelanggan && $transaksi->pelanggan->no_kartu),
            'no_kartu' => $transaksi->pelanggan ? $transaksi->pelanggan->no_kartu : null,
            'metode_pembayaran' => strtoupper($transaksi->metode_pembayaran),
            'items' => $transaksi->details->map(function ($d) {
                return [
                    'nama_produk' => $d->nama_produk ?: ($d->produk ? $d->produk->nama_produk : 'Item'),
                    'jumlah' => $d->jumlah,
                    'harga_satuan' => (float) $d->harga_satuan,
                    'subtotal' => (float) $d->subtotal,
                ];
            })->toArray(),
            'subtotal' => (float) $transaksi->subtotal,
            'diskon' => (float) $transaksi->diskon,
            'pajak' => (float) $transaksi->pajak,
            'total_belanja' => (float) $transaksi->total_belanja,
            'uang_diterima' => (float) $transaksi->uang_diterima,
            'kembalian' => (float) $transaksi->kembalian,
            'catatan' => $transaksi->catatan,
            'toko' => [
                'nama' => $toko->nama_toko,
                'slogan' => $toko->slogan,
                'alamat' => $toko->alamat,
                'telepon' => $toko->no_telepon,
                'logo' => $toko->logo,
                'pesan_kaki' => $toko->pesan_struk,
            ],
        ];
    }
}
