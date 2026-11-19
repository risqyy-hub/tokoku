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
        Schema::table('tbl_transaksi', function (Blueprint $table): void {
            $table->string('duitku_order_id', 80)->nullable()->unique();
            $table->string('duitku_reference')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table): void {
            $table->dropUnique(['duitku_order_id']);
            $table->dropColumn(['duitku_order_id', 'duitku_reference']);
        });
    }
};
