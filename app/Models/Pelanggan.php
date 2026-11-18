<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    use HasFactory;

    protected $table = 'tbl_pelanggan';

    protected $primaryKey = 'id_pelanggan';

    protected $fillable = [
        'nama_pelanggan',
        'no_kartu',
        'no_hp',
        'alamat',
        'email',
        'kota',
        'user_id',
        'saldo',
    ];

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_pelanggan', 'id_pelanggan');
    }

    public function akun()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
