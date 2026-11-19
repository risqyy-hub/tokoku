<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_topup', function (Blueprint $table): void {
            $table->string('gateway_reference')->nullable()->after('snap_token');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_topup', function (Blueprint $table): void {
            $table->dropColumn('gateway_reference');
        });
    }
};
