<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Loggable;

class Ticket extends Model
{
    use SoftDeletes, Loggable;

    protected $table = 'ticketing_support';
    protected $primaryKey = 'id';
    public string|null $currentAction = null;
    public string|null $currentRemarks = null; // Add this property

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
        'rating',
        'item_name',
        'request_option',
        'handled_by',
        'handled_at',
        'closed_by',
        'closed_at',
        'assigned_to',
        'assigned_at',
        'assigned_by'
    ];

    protected $casts = [
        'handled_at' => 'datetime',
        'closed_at' => 'datetime',
        'deleted_at' => 'datetime',
        'updated_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by', 'EMPLOYID');
    }

    public function closer()
    {
        return $this->belongsTo(User::class, 'closed_by', 'EMPLOYID');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to', 'EMPLOYID');
    }
}