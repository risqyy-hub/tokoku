<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tbl_produk', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_produk', 'sku')) {
                $table->string('sku', 50)->nullable()->unique()->after('id_kategori');
            }
            if (! Schema::hasColumn('tbl_produk', 'barcode')) {
                $table->string('barcode', 100)->nullable()->index()->after('sku');
            }
            if (! Schema::hasColumn('tbl_produk', 'brand')) {
                $table->string('brand', 100)->nullable()->after('nama_produk');
            }
            if (! Schema::hasColumn('tbl_produk', 'harga_beli')) {
                $table->decimal('harga_beli', 12, 2)->default(0)->after('harga');
            }
            if (! Schema::hasColumn('tbl_produk', 'stok_minimum')) {
                $table->integer('stok_minimum')->default(5)->after('stok');
            }
            if (! Schema::hasColumn('tbl_produk', 'status')) {
                $table->enum('status', ['aktif', 'nonaktif'])->default('aktif')->after('stok_minimum');
            }
            if (! Schema::hasColumn('tbl_produk', 'foto')) {
                $table->string('foto')->nullable()->after('status');
            }
            if (! Schema::hasColumn('tbl_produk', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('foto');
            }
            if (! Schema::hasColumn('tbl_produk', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_produk', function (Blueprint $table) {
            $columns = ['sku', 'barcode', 'brand', 'harga_beli', 'stok_minimum', 'status', 'foto', 'is_featured', 'created_at', 'updated_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('tbl_produk', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
