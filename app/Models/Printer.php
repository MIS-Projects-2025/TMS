<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    protected $connection = 'inventory';
    protected $table = 'printer_table';

    protected $fillable = [
        'printer_name',
        'ip_address',
        'printer_type',
        'location',
        'brand',
        'printer_model',
        'serial_num',
        'dpi',
        'category',
        'supplier',
        'status',
        'remarks',
        'installed_by',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
