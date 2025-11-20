<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketLogs extends Model
{
    protected $table = 'ticketing_support_workflow';

    // Keep fillable as lowercase for create operations
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

    // Add attribute accessors if you need to read from this model
    public function getTicketIdAttribute()
    {
        return $this->attributes['TICKET_ID'] ?? null;
    }

    public function getActionTypeAttribute()
    {
        return $this->attributes['ACTION_TYPE'] ?? null;
    }

    public function getActionByAttribute()
    {
        return $this->attributes['ACTION_BY'] ?? null;
    }

    public function getActionAtAttribute()
    {
        return $this->attributes['ACTION_AT'] ?? null;
    }

    public function getRemarksAttribute()
    {
        return $this->attributes['REMARKS'] ?? null;
    }

    public function getMetadataAttribute()
    {
        return $this->attributes['METADATA'] ?? null;
    }

    // Add mutators if you need to update this model
    public function setTicketIdAttribute($value)
    {
        $this->attributes['TICKET_ID'] = $value;
    }

    public function setActionTypeAttribute($value)
    {
        $this->attributes['ACTION_TYPE'] = $value;
    }

    public function setActionByAttribute($value)
    {
        $this->attributes['ACTION_BY'] = $value;
    }

    public function setActionAtAttribute($value)
    {
        $this->attributes['ACTION_AT'] = $value;
    }

    public function setRemarksAttribute($value)
    {
        $this->attributes['REMARKS'] = $value;
    }

    public function setMetadataAttribute($value)
    {
        $this->attributes['METADATA'] = $value;
    }
    public function actor()
    {
        return $this->belongsTo(Masterlist::class, 'ACTION_BY', 'EMPLOYID')
            ->select(['EMPLOYID', 'EMPNAME']);
    }
}
