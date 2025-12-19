<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hardware extends Model
{

    protected $connection = 'inventory';
    protected $table = 'hardware_table';

    protected $fillable = [
        'hostname',
        'issued_to',
        'category',
        'location',
        'model',
        'brand',
        'processor',
        'motherboard',
        'serial',
        'ip_address',
        'wifi_mac',
        'lan_mac',
        'remarks',
        'status',
        'issued_to',
        'installed_by',
        'date_issued',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_issued' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
