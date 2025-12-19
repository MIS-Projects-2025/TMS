<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketLogs extends Model
{
    protected $table = 'ticket_logs'; // new unified log table

    protected $fillable = [
        'loggable_type',
        'loggable_id',
        'action_type',
        'action_by',
        'action_at',
        'remarks',
        'metadata',
        'old_values',
        'new_values',
        'related_type',
        'related_id',
    ];

    protected $casts = [
        'action_at' => 'datetime',
        'metadata' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * User who performed the action
     */
    public function actor()
    {
        return $this->belongsTo(Masterlist::class, 'action_by', 'employid')
            ->select(['employid', 'empname']);
    }

    /**
     * Optional polymorphic relation for related models (if needed)
     */
    public function related()
    {
        return $this->morphTo('related', 'related_type', 'related_id');
    }
}
