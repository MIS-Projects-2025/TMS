<?php

namespace App\Services;

use App\Models\Ticket;
use Carbon\Carbon;

class TicketStatusService
{
    public const STATUS_LABELS = [
        1 => 'Open',
        2 => 'On Process',
        3 => 'Ongoing',
        4 => 'Resolved',
        5 => 'Closed',
        6 => 'Returned',
        7 => 'Cancelled',
    ];

    public const STATUS_COLORS = [
        1 => 'blue',
        2 => 'blue',
        3 => 'cyan',
        4 => 'yellow',
        5 => 'green',
        6 => 'gray',
        7 => 'red',
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
