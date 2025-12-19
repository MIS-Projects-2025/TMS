<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Terminal extends Model
{
    protected $connection = 'inventory';
    protected $table = 'terminal_table';

    protected $fillable = [
        'hostname',
        'ip_address',
        'model',
        'location',
        'scanner_sn',
        'scanner_brand',
        'mouse_brand',
        'keyboard_brand',
        'monitor_brand',
        'category',
        'status',
        'installed_by',
        'remarks',
        'status',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
