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
            if (! Schema::hasColumn('tbl_pelanggan', 'no_hp')) {
                $table->string('no_hp', 25)->nullable()->after('nama_pelanggan');
            }
            if (! Schema::hasColumn('tbl_pelanggan', 'alamat')) {
                $table->text('alamat')->nullable()->after('no_hp');
            }
            if (! Schema::hasColumn('tbl_pelanggan', 'email')) {
                $table->string('email', 100)->nullable()->after('alamat');
            }
            if (! Schema::hasColumn('tbl_pelanggan', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_pelanggan', function (Blueprint $table) {
            $columns = ['no_hp', 'alamat', 'email', 'created_at', 'updated_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('tbl_pelanggan', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
