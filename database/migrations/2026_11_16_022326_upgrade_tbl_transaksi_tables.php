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
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_transaksi', 'nomor_transaksi')) {
                $table->string('nomor_transaksi', 60)->nullable()->unique()->after('id_transaksi');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'id_user')) {
                $table->foreignId('id_user')->nullable()->after('nomor_transaksi')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('tbl_transaksi', 'subtotal')) {
                $table->decimal('subtotal', 12, 2)->default(0)->after('total_belanja');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'diskon')) {
                $table->decimal('diskon', 12, 2)->default(0)->after('subtotal');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'pajak')) {
                $table->decimal('pajak', 12, 2)->default(0)->after('diskon');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'uang_diterima')) {
                $table->decimal('uang_diterima', 12, 2)->default(0)->after('pajak');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'kembalian')) {
                $table->decimal('kembalian', 12, 2)->default(0)->after('uang_diterima');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'metode_pembayaran')) {
                $table->enum('metode_pembayaran', ['tunai', 'transfer', 'qris'])->default('tunai')->after('kembalian');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'status')) {
                $table->enum('status', ['selesai', 'batal'])->default('selesai')->after('metode_pembayaran');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'catatan')) {
                $table->text('catatan')->nullable()->after('status');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'created_at')) {
                $table->timestamps();
            }
        });

        Schema::table('tbl_detail_transaksi', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_detail_transaksi', 'nama_produk')) {
                $table->string('nama_produk', 150)->nullable()->after('id_produk');
            }
            if (! Schema::hasColumn('tbl_detail_transaksi', 'harga_beli')) {
                $table->decimal('harga_beli', 12, 2)->default(0)->after('harga_satuan');
            }
            if (! Schema::hasColumn('tbl_detail_transaksi', 'diskon_item')) {
                $table->decimal('diskon_item', 12, 2)->default(0)->after('harga_beli');
            }
            if (! Schema::hasColumn('tbl_detail_transaksi', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            $columns = ['nomor_transaksi', 'id_user', 'subtotal', 'diskon', 'pajak', 'uang_diterima', 'kembalian', 'metode_pembayaran', 'status', 'catatan', 'created_at', 'updated_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('tbl_transaksi', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('tbl_detail_transaksi', function (Blueprint $table) {
            $columns = ['nama_produk', 'harga_beli', 'diskon_item', 'created_at', 'updated_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('tbl_detail_transaksi', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
