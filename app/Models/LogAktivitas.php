<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogAktivitas extends Model
{
    use HasFactory;

    protected $table = 'tbl_log';

    protected $primaryKey = 'id_log';

    public $timestamps = false;

    protected $fillable = [
        'aktivitas',
        'nama_tabel',
        'keterangan',
        'waktu',
    ];

    public static function catat(string $aktivitas, ?string $namaTabel = null, ?string $keterangan = null): self
    {
        return self::create([
            'aktivitas' => $aktivitas,
            'nama_tabel' => $namaTabel,
            'keterangan' => $keterangan,
            'waktu' => now(),
        ]);
    }
}
