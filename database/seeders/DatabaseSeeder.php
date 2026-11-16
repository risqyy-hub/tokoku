<?php

namespace Database\Seeders;

use App\Models\Pelanggan;
use App\Models\Pengaturan;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users (Admin & Kasir)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator Toko',
                'email' => 'admin@tokokita.id',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'phone' => '081234567890',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['username' => 'kasir'],
            [
                'name' => 'Kasir Tokokita',
                'email' => 'kasir@tokokita.id',
                'password' => Hash::make('kasir123'),
                'role' => 'kasir',
                'phone' => '081234567891',
                'is_active' => true,
            ]
        );

        // 2. Seed Toko Settings
        Pengaturan::getToko();

        // 3. Enrich existing 4 products
        $existingProductData = [
            1 => ['sku' => 'BRS-005KG', 'barcode' => '8991001001', 'brand' => 'Raja Lele', 'harga_beli' => 68000, 'stok_minimum' => 5, 'is_featured' => true],
            2 => ['sku' => 'MYK-001LT', 'barcode' => '8991001002', 'brand' => 'Bimoli', 'harga_beli' => 15500, 'stok_minimum' => 10, 'is_featured' => true],
            3 => ['sku' => 'AIR-600ML', 'barcode' => '8991001003', 'brand' => 'Aqua', 'harga_beli' => 3800, 'stok_minimum' => 20, 'is_featured' => true],
            4 => ['sku' => 'SBN-001PC', 'barcode' => '8991001004', 'brand' => 'Lifebuoy', 'harga_beli' => 9500, 'stok_minimum' => 15, 'is_featured' => true],
        ];

        foreach ($existingProductData as $id => $data) {
            $p = Produk::find($id);
            if ($p) {
                $p->update($data);
            }
        }

        // Additional retail products for richer POS testing
        $additionalProducts = [
            [
                'id_kategori' => 1,
                'sku' => 'MIE-001PC',
                'barcode' => '8991001005',
                'nama_produk' => 'Indomie Goreng Spesial',
                'brand' => 'Indofood',
                'harga' => 3500,
                'harga_beli' => 2900,
                'stok' => 120,
                'stok_minimum' => 24,
                'status' => 'aktif',
                'is_featured' => true,
            ],
            [
                'id_kategori' => 1,
                'sku' => 'GUL-001KG',
                'barcode' => '8991001006',
                'nama_produk' => 'Gula Pasir Kristal 1 Kg',
                'brand' => 'Gulaku',
                'harga' => 17500,
                'harga_beli' => 15000,
                'stok' => 50,
                'stok_minimum' => 10,
                'status' => 'aktif',
                'is_featured' => false,
            ],
            [
                'id_kategori' => 2,
                'sku' => 'TEH-001BT',
                'barcode' => '8991001007',
                'nama_produk' => 'Teh Pucuk Harum 350ml',
                'brand' => 'Mayora',
                'harga' => 4000,
                'harga_beli' => 3100,
                'stok' => 80,
                'stok_minimum' => 15,
                'status' => 'aktif',
                'is_featured' => true,
            ],
            [
                'id_kategori' => 2,
                'sku' => 'KPI-001SC',
                'barcode' => '8991001008',
                'nama_produk' => 'Kopi Kapal Api Spesial Mix 10s',
                'brand' => 'Kapal Api',
                'harga' => 15000,
                'harga_beli' => 12500,
                'stok' => 45,
                'stok_minimum' => 10,
                'status' => 'aktif',
                'is_featured' => true,
            ],
            [
                'id_kategori' => 3,
                'sku' => 'PST-001TB',
                'barcode' => '8991001009',
                'nama_produk' => 'Pepsodent Pencegah Gigi Berlubang 190g',
                'brand' => 'Pepsodent',
                'harga' => 14000,
                'harga_beli' => 11200,
                'stok' => 35,
                'stok_minimum' => 8,
                'status' => 'aktif',
                'is_featured' => false,
            ],
            [
                'id_kategori' => 3,
                'sku' => 'SHP-001BT',
                'barcode' => '8991001010',
                'nama_produk' => 'Sunsilk Black Shine Shampoo 160ml',
                'brand' => 'Sunsilk',
                'harga' => 22000,
                'harga_beli' => 18000,
                'stok' => 25,
                'stok_minimum' => 5,
                'status' => 'aktif',
                'is_featured' => true,
            ],
        ];

        foreach ($additionalProducts as $prod) {
            Produk::firstOrCreate(['barcode' => $prod['barcode']], $prod);
        }

        // 4. Sync Pelanggan data from table `pelanggan` into `tbl_pelanggan`
        if (DB::getSchemaBuilder()->hasTable('pelanggan')) {
            $legacyCustomers = DB::table('pelanggan')->get();
            foreach ($legacyCustomers as $legacy) {
                DB::table('tbl_pelanggan')
                    ->where('id_pelanggan', $legacy->id_pelanggan)
                    ->update([
                        'no_hp' => $legacy->no_hp,
                        'alamat' => $legacy->alamat,
                    ]);
            }
        }
    }
}
