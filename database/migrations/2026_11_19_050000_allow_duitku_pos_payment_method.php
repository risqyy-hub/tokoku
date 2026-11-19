<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table): void {
            $table->enum('metode_pembayaran', ['tunai', 'transfer', 'qris', 'saldo', 'duitku'])->default('tunai')->change();
        });
    }

    public function down(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table): void {
            $table->enum('metode_pembayaran', ['tunai', 'transfer', 'qris', 'saldo'])->default('tunai')->change();
        });
    }
};
