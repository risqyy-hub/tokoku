<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaldoMutasi extends Model
{
    protected $table = 'tbl_saldo_mutasi';

    protected $primaryKey = 'id_mutasi';

    protected $fillable = [
        'id_pelanggan', 'jenis', 'jumlah', 'saldo_sebelum', 'saldo_sesudah',
        'id_transaksi', 'referensi_gateway', 'keterangan',
    ];

    protected function casts(): array
    {
        return ['jumlah' => 'float', 'saldo_sebelum' => 'float', 'saldo_sesudah' => 'float'];
    }
}
