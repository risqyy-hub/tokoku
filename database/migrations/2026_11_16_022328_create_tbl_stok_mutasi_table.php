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
        if (! Schema::hasTable('tbl_stok_mutasi')) {
            Schema::create('tbl_stok_mutasi', function (Blueprint $table) {
                $table->id('id_mutasi');
                $table->integer('id_produk');
                $table->enum('jenis', ['masuk', 'keluar', 'penyesuaian', 'penjualan', 'batal']);
                $table->integer('jumlah');
                $table->integer('stok_sebelum');
                $table->integer('stok_sesudah');
                $table->foreignId('id_user')->nullable()->constrained('users')->nullOnDelete();
                $table->text('keterangan')->nullable();
                $table->timestamps();

                $table->foreign('id_produk', 'fk_mutasi_produk')
                    ->references('id_produk')
                    ->on('tbl_produk')
                    ->onDelete('cascade');
                $table->index('jenis');
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_stok_mutasi');
    }
};
