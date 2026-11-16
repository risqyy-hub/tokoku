<?php

namespace Tests\Feature;

use App\Models\Kategori;
use App\Models\Produk;
use App\Models\User;
use Tests\TestCase;

class PosCheckoutTest extends TestCase
{
    /**
     * Test POS page is accessible by authenticated Kasir.
     */
    public function test_kasir_can_access_pos(): void
    {
        $kasir = User::where('role', 'kasir')->first();
        if (! $kasir) {
            $kasir = User::create([
                'name' => 'Kasir Test',
                'username' => 'kasirtest',
                'email' => 'kasirtest@tokokita.id',
                'password' => bcrypt('password'),
                'role' => 'kasir',
                'is_active' => true,
            ]);
        }

        $response = $this->actingAs($kasir)->get('/pos');
        $response->assertStatus(200);
    }

    /**
     * Test kasir cannot access admin-only pages (dashboard, kategori, etc).
     */
    public function test_kasir_is_redirected_away_from_admin_pages(): void
    {
        $kasir = User::where('role', 'kasir')->first();

        $response = $this->actingAs($kasir)->get('/dashboard');
        $response->assertRedirect('/pos');
    }

    /**
     * Test Admin can access dashboard.
     */
    public function test_admin_can_access_dashboard(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin)->get('/dashboard');
        $response->assertStatus(200);
    }

    /**
     * Test POS checkout successfully creates transaction and reduces stock.
     */
    public function test_pos_checkout_creates_transaction_and_reduces_stock(): void
    {
        $kasir = User::where('role', 'kasir')->first();
        $produk = Produk::where('status', 'aktif')->where('stok', '>=', 5)->first();

        $this->assertNotNull($produk, 'Produk aktif harus tersedia untuk pengujian POS');

        $initialStock = $produk->stok;
        $orderQty = 2;

        $response = $this->actingAs($kasir)->post('/pos/checkout', [
            'items' => [
                [
                    'id_produk' => $produk->id_produk,
                    'jumlah' => $orderQty,
                ],
            ],
            'metode_pembayaran' => 'tunai',
            'diskon' => 0,
            'uang_diterima' => $produk->harga * $orderQty + 10000,
            'catatan' => 'Uji Coba Otomatis Checkout POS',
        ]);

        $response->assertRedirect('/pos');
        $response->assertSessionHas('success');
        $response->assertSessionHas('struk');

        // Check stock reduced in database
        $produk->refresh();
        $this->assertEquals($initialStock - $orderQty, $produk->stok);
    }
}
