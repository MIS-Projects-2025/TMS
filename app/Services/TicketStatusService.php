<?php

namespace App\Services;

use App\Models\Ticket;
use Carbon\Carbon;

class TicketStatusService
{
    public const STATUS_LABELS = [
        1 => 'Open',
        2 => 'Ongoing',
        3 => 'Resolved',
        4 => 'Closed',
        5 => 'Returned',
        6 => 'Cancelled',
    ];

    public const STATUS_COLORS = [
        1 => 'blue',
        2 => 'cyan',
        3 => 'yellow',
        4 => 'green',
        5 => 'gray',
        6 => 'red',
    ];

    // Existing methods for Ticket object
    public static function getStatusLabel(Ticket $ticket): string
    {
        if ($ticket->status == 1 && $ticket->created_at->diffInMinutes(now()) > 30) {
            return 'Critical';
        }
        return self::STATUS_LABELS[$ticket->status] ?? '-';
    }

    public static function getStatusColor(Ticket $ticket): string
    {
        if ($ticket->status == 1 && $ticket->created_at->diffInMinutes(now()) > 30) {
            return 'red';
        }
        return self::STATUS_COLORS[$ticket->status] ?? 'default';
    }

    // New helper methods for numeric status IDs (used in remarks)
    public static function getStatusLabelById(?int $statusId): string
    {
        return self::STATUS_LABELS[$statusId] ?? '-';
    }

    public static function getStatusColorById(?int $statusId): string
    {
        return self::STATUS_COLORS[$statusId] ?? 'default';
    }
}
