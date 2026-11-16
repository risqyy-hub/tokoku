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
        if (! Schema::hasTable('tbl_pengaturan')) {
            Schema::create('tbl_pengaturan', function (Blueprint $table) {
                $table->id();
                $table->string('nama_toko')->default('TOKOKITA POS');
                $table->string('slogan')->nullable()->default('Solusi Belanja Cerdas & Lengkap');
                $table->text('alamat')->nullable()->default('Jl. Pahlawan No. 45, Madiun, Jawa Timur');
                $table->string('no_telepon')->nullable()->default('0812-3456-7890');
                $table->string('email')->nullable()->default('info@tokokita.id');
                $table->string('logo')->nullable();
                $table->text('pesan_struk')->nullable()->default('Terima kasih atas kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar kecuali perjanjian.');
                $table->decimal('pajak_persen', 5, 2)->default(0.00);
                $table->boolean('pajak_aktif')->default(false);
                $table->string('mode_cetak')->default('browser_dialog'); // browser_dialog, direct_thermal
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_pengaturan');
    }
};
