<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'tbl_transaksi';

    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'nomor_transaksi',
        'tanggal',
        'id_pelanggan',
        'id_user',
        'total_belanja',
        'subtotal',
        'diskon',
        'pajak',
        'uang_diterima',
        'kembalian',
        'metode_pembayaran',
        'status',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'total_belanja' => 'float',
            'subtotal' => 'float',
            'diskon' => 'float',
            'pajak' => 'float',
            'uang_diterima' => 'float',
            'kembalian' => 'float',
        ];
    }

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class, 'id_pelanggan', 'id_pelanggan');
    }

    public function kasir()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function details()
    {
        return $this->hasMany(DetailTransaksi::class, 'id_transaksi', 'id_transaksi');
    }
}
