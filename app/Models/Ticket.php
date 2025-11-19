<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $table = 'ticketing_support'; // Your main tickets table
    protected $fillable = [
        'ticket_id',
        'employid',
        'empname',
        'department',
        'prodline',
        'station',
        'type_of_request',
        'details',
        'status',
        'item_id',
        'item_name',
        'request_option'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'handled_at' => 'datetime',
        'closed_at' => 'datetime',
        'deleted_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
