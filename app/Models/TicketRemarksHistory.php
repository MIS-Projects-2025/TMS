<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketRemarksHistory extends Model
{
    protected $table = 'ticket_remarks_history';

    // Map your desired attribute names to actual database columns
    protected $fillable = [
        'ticket_id',
        'remark_type',
        'remark_text',
        'old_status',
        'new_status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Define the column mapping for UPPERCASE database columns
     */
    public function getTicketIdAttribute()
    {
        return $this->attributes['TICKET_ID'] ?? null;
    }

    public function setTicketIdAttribute($value)
    {
        $this->attributes['TICKET_ID'] = $value;
    }

    public function getRemarkTypeAttribute()
    {
        return $this->attributes['REMARK_TYPE'] ?? null;
    }

    public function setRemarkTypeAttribute($value)
    {
        $this->attributes['REMARK_TYPE'] = $value;
    }

    public function getRemarkTextAttribute()
    {
        return $this->attributes['REMARK_TEXT'] ?? null;
    }

    public function setRemarkTextAttribute($value)
    {
        $this->attributes['REMARK_TEXT'] = $value;
    }

    public function getOldStatusAttribute()
    {
        return $this->attributes['OLD_STATUS'] ?? null;
    }

    public function setOldStatusAttribute($value)
    {
        $this->attributes['OLD_STATUS'] = $value;
    }

    public function getNewStatusAttribute()
    {
        return $this->attributes['NEW_STATUS'] ?? null;
    }

    public function setNewStatusAttribute($value)
    {
        $this->attributes['NEW_STATUS'] = $value;
    }
}
