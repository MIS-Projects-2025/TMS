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
        'rating',
        'item_id',
        'item_name',
        'request_option',
        'handled_by',
        'handled_at',
        'closed_by',
        'closed_at'
    ];

    protected $casts = [

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

    public function getCreatedAtAttribute($value)
    {
        return isset($this->attributes['CREATED_AT'])
            ? \Carbon\Carbon::parse($this->attributes['CREATED_AT'])
            : null;
    }


    public function setCreatedAtAttribute($value)
    {
        $this->attributes['CREATED_AT'] = $value;
    }

    public function getRatingAttribute()
    {
        return $this->attributes['RATING'] ?? null;
    }


    public function setRatingAttribute($value)
    {
        $this->attributes['RATING'] = $value;
    }

    public function employee()
    {
        return $this->belongsTo(Masterlist::class, 'HANDLED_BY', 'EMPLOYID');
    }
    public function handler()
    {
        return $this->belongsTo(Masterlist::class, 'HANDLED_BY', 'EMPLOYID')
            ->select(['EMPLOYID', 'EMPNAME']);
    }
    public function closer()
    {
        return $this->belongsTo(Masterlist::class, 'CLOSED_BY', 'EMPLOYID')
            ->select(['EMPLOYID', 'EMPNAME']);
    }
    public function setClosedByAttribute($value)
    {
        $this->attributes['CLOSED_BY'] = $value;
    }

    public function setClosedAtAttribute($value)
    {
        $this->attributes['CLOSED_AT'] = $value;
    }
    public function setTypeOfRequestAttribute($value)
    {
        $this->attributes['TYPE_OF_REQUEST'] = $value;
    }
    public function getTypeOfRequestAttribute()
    {
        return $this->attributes['TYPE_OF_REQUEST'] ?? null;
    }
}
