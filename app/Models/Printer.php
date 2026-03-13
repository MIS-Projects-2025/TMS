<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    protected $connection = 'inventory';
    protected $table = 'printer';

    protected $fillable = [
        'printer_name',
        'ip_address',
        'printer_type',
        'printer_category',
        'location',
        'brand',
        'model',
        'serial_number',
        'dpi',
        'category_status',
        'toner',
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
