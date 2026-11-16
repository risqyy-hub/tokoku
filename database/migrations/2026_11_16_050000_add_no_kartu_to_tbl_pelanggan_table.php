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
        Schema::table('tbl_pelanggan', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_pelanggan', 'no_kartu')) {
                $table->string('no_kartu', 50)->nullable()->unique()->after('nama_pelanggan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_pelanggan', function (Blueprint $table) {
            if (Schema::hasColumn('tbl_pelanggan', 'no_kartu')) {
                $table->dropColumn('no_kartu');
            }
        });
    }
};
