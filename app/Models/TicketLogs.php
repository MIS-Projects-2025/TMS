<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketLogs extends Model
{
    protected $table = 'ticketing_support_workflow';
    protected $fillable = [
        'ticket_id',
        'action_type',
        'action_by',
        'action_at',
        'remarks',
        'metadata'
    ];

    protected $casts = [
        'action_at' => 'datetime',
        'metadata' => 'array'
    ];
}
