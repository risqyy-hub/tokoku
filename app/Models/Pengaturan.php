<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    use HasFactory;

    protected $table = 'tbl_pengaturan';

    protected $fillable = [
        'nama_toko',
        'slogan',
        'alamat',
        'no_telepon',
        'email',
        'logo',
        'pesan_struk',
        'pajak_persen',
        'pajak_aktif',
        'mode_cetak',
    ];

    protected function casts(): array
    {
        return [
            'pajak_persen' => 'float',
            'pajak_aktif' => 'boolean',
        ];
    }

    public static function getToko()
    {
        return static::firstOrCreate([], [
            'nama_toko' => 'TOKOKITA POS',
            'slogan' => 'Solusi Belanja Cerdas & Lengkap',
            'alamat' => 'Jl. Pahlawan No. 45, Madiun, Jawa Timur',
            'no_telepon' => '0812-3456-7890',
            'email' => 'info@tokokita.id',
            'pesan_struk' => 'Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar kecuali ada perjanjian sebelumnya.',
            'pajak_persen' => 0.0,
            'pajak_aktif' => false,
            'mode_cetak' => 'browser_dialog',
        ]);
    }
}
