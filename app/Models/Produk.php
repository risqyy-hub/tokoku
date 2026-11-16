<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    use HasFactory;

    protected $table = 'tbl_produk';

    protected $primaryKey = 'id_produk';

    protected $fillable = [
        'id_kategori',
        'sku',
        'barcode',
        'nama_produk',
        'brand',
        'harga',
        'harga_beli',
        'stok',
        'stok_minimum',
        'status',
        'foto',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'float',
            'harga_beli' => 'float',
            'stok' => 'integer',
            'stok_minimum' => 'integer',
            'is_featured' => 'boolean',
        ];
    }

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'id_kategori', 'id_kategori');
    }

    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksi::class, 'id_produk', 'id_produk');
    }

    public function mutasiStok()
    {
        return $this->hasMany(StokMutasi::class, 'id_produk', 'id_produk');
    }

    public function isStokMenipis(): bool
    {
        return $this->stok > 0 && $this->stok <= $this->stok_minimum;
    }

    public function isStokHabis(): bool
    {
        return $this->stok <= 0;
    }
}
