<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topup extends Model
{
    protected $table = 'tbl_topup';

    protected $primaryKey = 'id_topup';

    protected $fillable = ['order_id', 'id_pelanggan', 'jumlah', 'status', 'snap_token', 'gateway_reference', 'redirect_url', 'payment_type', 'paid_at'];

    protected function casts(): array
    {
        return ['jumlah' => 'float', 'paid_at' => 'datetime'];
    }
}
