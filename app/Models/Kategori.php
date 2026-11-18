<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    use HasFactory;

    protected $table = 'tbl_kategori';

    protected $primaryKey = 'id_kategori';

    public $timestamps = false;

    protected $fillable = [
        'nama_kategori',
        'is_system',
    ];

    protected $attributes = [
        'is_system' => false,
    ];

    public function produk()
    {
        return $this->hasMany(Produk::class, 'id_kategori', 'id_kategori');
    }
}
