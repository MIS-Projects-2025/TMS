<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $table = 'ticketing_support';
    protected $primaryKey = 'ID';

    // Keep fillable as lowercase for create operations
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

    // Add attribute accessors for uppercase database columns
    public function getTicketIdAttribute()
    {
        return $this->attributes['TICKET_ID'] ?? null;
    }

    public function getEmployidAttribute()
    {
        return $this->attributes['EMPLOYID'] ?? null;
    }

    public function getStatusAttribute()
    {
        return $this->attributes['STATUS'] ?? null;
    }

    public function getIdAttribute()
    {
        return $this->attributes['ID'] ?? null;
    }

    // Add mutators for updates
    public function setStatusAttribute($value)
    {
        $this->attributes['STATUS'] = $value;
    }

    public function setHandledByAttribute($value)
    {
        $this->attributes['HANDLED_BY'] = $value;
    }

    public function setHandledAtAttribute($value)
    {
        $this->attributes['HANDLED_AT'] = $value;
    }
}
