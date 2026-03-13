<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Terminal extends Model
{
    protected $connection = 'inventory';
    protected $table = 'promis_terminal';

    protected $fillable = [
        'promis_name',
        'ip_address',
        'model',
        'location',
        'scanner',
        'mouse',
        'keyboard',
        'monitor',
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
