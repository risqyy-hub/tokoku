<?php

namespace Tests\Feature;

use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\StokMutasi;
use App\Models\Transaksi;
use App\Models\User;
use App\Services\PosCheckoutService;
use Tests\TestCase;

class PosAdvancedFeaturesTest extends TestCase
{
    /**
     * Test admin can perform stock mutation (Stok Masuk & Opname).
     */
    public function test_admin_can_perform_stock_mutation(): void
    {
        $admin = User::where('role', 'admin')->first();
        $produk = Produk::first();

        $initialStock = $produk->stok;
        $addAmount = 10;

        $response = $this->actingAs($admin)->post('/stok/mutasi', [
            'id_produk' => $produk->id_produk,
            'jenis' => 'masuk',
            'jumlah' => $addAmount,
            'keterangan' => 'Pengujian otomatis stok masuk supplier',
        ]);

        $response->assertSessionHas('success');

        $produk->refresh();
        $this->assertEquals($initialStock + $addAmount, $produk->stok);

        // Verify mutation log exists
        $mutasi = StokMutasi::where('id_produk', $produk->id_produk)
            ->where('jenis', 'masuk')
            ->latest('id_mutasi')
            ->first();

        $this->assertNotNull($mutasi);
        $this->assertEquals($addAmount, $mutasi->jumlah);
    }

    /**
     * Test voiding / cancelling a transaction properly restores product stock.
     */
    public function test_cancelling_transaction_restores_product_stock(): void
    {
        $admin = User::where('role', 'admin')->first();
        $kasir = User::where('role', 'kasir')->first();
        $produk = Produk::where('status', 'aktif')->where('stok', '>=', 10)->first();

        $initialStock = $produk->stok;
        $orderQty = 3;

        // Perform POS checkout
        $this->actingAs($kasir)->post('/pos/checkout', [
            'items' => [
                [
                    'id_produk' => $produk->id_produk,
                    'jumlah' => $orderQty,
                ],
            ],
            'metode_pembayaran' => 'tunai',
            'diskon' => 0,
            'uang_diterima' => $produk->harga * $orderQty * 2,
            'catatan' => 'Checkout untuk di-void',
        ]);

        $produk->refresh();
        $this->assertEquals($initialStock - $orderQty, $produk->stok);

        $latestTrx = Transaksi::latest('id_transaksi')->first();

        // Admin cancels / voids the transaction
        $cancelResponse = $this->actingAs($admin)->post("/transaksi/{$latestTrx->id_transaksi}/batalkan", [
            'alasan' => 'Uji coba pembatalan otomatis retur barang',
        ]);

        $cancelResponse->assertSessionHas('success');

        $latestTrx->refresh();
        $this->assertEquals('batal', $latestTrx->status);

        // Verify stock has been restored
        $produk->refresh();
        $this->assertEquals($initialStock, $produk->stok);
    }

    /**
     * Test receipt data payload contains all required 17 thermal receipt elements.
     */
    public function test_receipt_data_contains_required_thermal_elements(): void
    {
        $checkoutService = app(PosCheckoutService::class);
        $trx = Transaksi::with(['pelanggan', 'kasir', 'details.produk'])->latest('id_transaksi')->first();

        $receipt = $checkoutService->getReceiptData($trx);

        // Check essential elements
        $this->assertArrayHasKey('nomor_transaksi', $receipt);
        $this->assertArrayHasKey('tanggal', $receipt);
        $this->assertArrayHasKey('waktu', $receipt);
        $this->assertArrayHasKey('kasir', $receipt);
        $this->assertArrayHasKey('pelanggan', $receipt);
        $this->assertArrayHasKey('items', $receipt);
        $this->assertArrayHasKey('subtotal', $receipt);
        $this->assertArrayHasKey('diskon', $receipt);
        $this->assertArrayHasKey('pajak', $receipt);
        $this->assertArrayHasKey('total_belanja', $receipt);
        $this->assertArrayHasKey('uang_diterima', $receipt);
        $this->assertArrayHasKey('kembalian', $receipt);
        $this->assertArrayHasKey('toko', $receipt);

        $this->assertArrayHasKey('nama', $receipt['toko']);
        $this->assertArrayHasKey('alamat', $receipt['toko']);
        $this->assertArrayHasKey('telepon', $receipt['toko']);
        $this->assertArrayHasKey('pesan_kaki', $receipt['toko']);
    }

    /**
     * Test customer registration with RFID card.
     */
    public function test_can_register_new_customer(): void
    {
        $kasir = User::where('role', 'kasir')->first();
        $uniqueCard = 'RFID-'.strtoupper(substr(uniqid(), -8));

        $response = $this->actingAs($kasir)->post('/pelanggan', [
            'nama_pelanggan' => 'Siti Rahmawati POS Test',
            'no_kartu' => $uniqueCard,
            'no_hp' => '089912345678',
            'alamat' => 'Jl. Pemuda No. 10',
            'kota' => 'Madiun',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('tbl_pelanggan', [
            'nama_pelanggan' => 'Siti Rahmawati POS Test',
            'no_kartu' => $uniqueCard,
            'no_hp' => '089912345678',
        ]);
    }

    /**
     * Test RFID member customer gets 5% discount and receipt reflects member status.
     */
    public function test_rfid_member_checkout_receives_5_percent_discount(): void
    {
        $kasir = User::where('role', 'kasir')->first();
        $produk = Produk::where('status', 'aktif')->where('stok', '>=', 5)->first();

        // Retrieve or create an RFID member customer
        $member = Pelanggan::firstOrCreate(
            ['no_kartu' => 'RFID-MEMBER-5PCT'],
            [
                'nama_pelanggan' => 'Member Setia Toko',
                'no_hp' => '081299988877',
                'alamat' => 'Jl. Pahlawan No. 45',
                'kota' => 'Ponorogo',
            ]
        );

        $orderQty = 2;
        $subtotal = $produk->harga * $orderQty;
        $diskon5Percent = round($subtotal * 0.05);
        $totalHarusDibayar = $subtotal - $diskon5Percent;

        // Perform POS checkout with member ID and 5% discount
        $response = $this->actingAs($kasir)->post('/pos/checkout', [
            'items' => [
                [
                    'id_produk' => $produk->id_produk,
                    'jumlah' => $orderQty,
                ],
            ],
            'id_pelanggan' => $member->id_pelanggan,
            'metode_pembayaran' => 'tunai',
            'diskon' => $diskon5Percent,
            'uang_diterima' => $subtotal * 2,
            'catatan' => 'Transaksi Member RFID 5% test',
        ]);

        $response->assertSessionHas('success');
        $response->assertSessionHas('struk');

        $struk = session('struk');
        $this->assertEquals($diskon5Percent, $struk['diskon']);
        $this->assertTrue($struk['is_member']);
        $this->assertEquals($member->no_kartu, $struk['no_kartu']);
        $this->assertEquals($member->nama_pelanggan, $struk['pelanggan']);

        // Verify in database
        $this->assertDatabaseHas('tbl_transaksi', [
            'id_pelanggan' => $member->id_pelanggan,
            'diskon' => $diskon5Percent,
            'subtotal' => $subtotal,
        ]);
    }
}
