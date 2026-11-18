<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'kasir', 'user'])->default('kasir')->change();
        });

        Schema::table('tbl_pelanggan', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_pelanggan', 'user_id')) {
                $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('tbl_pelanggan', 'saldo')) {
                $table->decimal('saldo', 12, 2)->default(0);
            }
        });

        Schema::create('tbl_saldo_mutasi', function (Blueprint $table) {
            $table->id('id_mutasi');
            $table->integer('id_pelanggan');
            $table->foreign('id_pelanggan')->references('id_pelanggan')->on('tbl_pelanggan')->cascadeOnDelete();
            $table->enum('jenis', ['topup', 'pembelian', 'refund']);
            $table->decimal('jumlah', 12, 2);
            $table->decimal('saldo_sebelum', 12, 2);
            $table->decimal('saldo_sesudah', 12, 2);
            $table->unsignedBigInteger('id_transaksi')->nullable();
            $table->string('referensi_gateway')->nullable()->unique();
            $table->text('keterangan')->nullable();
            $table->timestamps();
            $table->index(['id_pelanggan', 'created_at']);
        });

        Schema::create('tbl_topup', function (Blueprint $table) {
            $table->id('id_topup');
            $table->string('order_id', 80)->unique();
            $table->integer('id_pelanggan');
            $table->foreign('id_pelanggan')->references('id_pelanggan')->on('tbl_pelanggan')->cascadeOnDelete();
            $table->decimal('jumlah', 12, 2);
            $table->string('status', 30)->default('pending')->index();
            $table->string('snap_token')->nullable();
            $table->text('redirect_url')->nullable();
            $table->string('payment_type')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_transaksi', 'alamat_pengiriman')) {
                $table->text('alamat_pengiriman')->nullable();
            }
            $table->enum('metode_pembayaran', ['tunai', 'transfer', 'qris', 'saldo'])->default('tunai')->change();
            $table->enum('status', ['selesai', 'batal', 'menunggu'])->default('selesai')->change();
        });

        Schema::table('tbl_kategori', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_kategori', 'is_system')) {
                $table->boolean('is_system')->default(false);
            }
        });
        DB::table('tbl_kategori')->updateOrInsert(['nama_kategori' => 'Top-up Saldo'], ['is_system' => true]);

    }

    public function down(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            $table->enum('metode_pembayaran', ['tunai', 'transfer', 'qris'])->default('tunai')->change();
            $table->enum('status', ['selesai', 'batal'])->default('selesai')->change();
            $table->dropColumn('alamat_pengiriman');
        });
        Schema::table('tbl_kategori', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });
        Schema::dropIfExists('tbl_topup');
        Schema::dropIfExists('tbl_saldo_mutasi');
        Schema::table('tbl_pelanggan', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn('saldo');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'kasir'])->default('kasir')->change();
        });
    }
};
