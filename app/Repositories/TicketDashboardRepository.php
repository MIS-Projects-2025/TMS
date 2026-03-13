<?php
namespace App\Repositories;

use App\Models\Ticket;
use App\Models\TicketLogs;
use Illuminate\Support\Facades\DB;

class TicketDashboardRepository
{
     public function findUserById(string $empId): ?object
    {
        return DB::connection('masterlist')
            ->table('employee_masterlist')
            ->where('EMPLOYID', $empId)
            ->select('EMPLOYID as emp_id', 'EMPNAME as empname')
            ->first();
    }
   /**
 * Response Time – from ticket creation to ONPROCESS
 */
public function getResponseTime($userId = null): array
{
    $query = TicketLogs::query()
        ->where('loggable_type', Ticket::class)
        ->where('action_type', 'ONPROCESS')
        ->join('ticketing_support as t', 't.ticket_id', '=', 'ticket_logs.loggable_id')
        ->select(
            't.handled_by',
            DB::raw('AVG(TIMESTAMPDIFF(MINUTE, t.created_at, ticket_logs.action_at)) as avg_response_minutes'),
            DB::raw('MIN(TIMESTAMPDIFF(MINUTE, t.created_at, ticket_logs.action_at)) as min_response_minutes'),
            DB::raw('MAX(TIMESTAMPDIFF(MINUTE, t.created_at, ticket_logs.action_at)) as max_response_minutes')
        )
        ->whereNotNull('t.handled_by');

    if ($userId) {
        $query->where('t.handled_by', $userId);
    }

    return $query->groupBy('t.handled_by')
        ->orderBy('avg_response_minutes')
        ->get()
        ->map(function ($item) {

            $user = $this->findUserById($item->handled_by);

            return [
                'emp_id' => $user->emp_id ?? $item->handled_by,
                'emp_name' => $user->empname ?? 'Unknown User',
                'avg_response_minutes' => round($item->avg_response_minutes, 2),
                'min_response_minutes' => $item->min_response_minutes,
                'max_response_minutes' => $item->max_response_minutes,
            ];
        })
        ->toArray();
}

    /**
     * Tickets per day
     */
    public function getTicketsPerDay($userId = null): array
    {
        $query = Ticket::selectRaw('DATE(created_at) as day, COUNT(DISTINCT ticket_id) as total');

        if ($userId) {
            $query->whereHas('logs', fn($q) => $q->where('action_by', $userId));
        }

        return $query->groupBy('day')
            ->orderBy('day')
            ->get()
            ->toArray();
    }

    /**
     * Number of tickets handled
     */
    public function getTicketsHandled($userId = null): array
    {
        $query = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'RESOLVE')
            ->select('action_by', DB::raw('COUNT(DISTINCT loggable_id) as total'));

        if ($userId) $query->where('action_by', $userId);

        return $query->groupBy('action_by')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                $user = $this->findUserById($item->action_by);
                return [
                    'emp_id' => $user->emp_id ?? $item->action_by,
                    'emp_name' => $user->empname ?? 'Unknown User',
                    'total' => $item->total,
                ];
            })
            ->toArray();
    }

    /**
     * Closure rate – tickets, unhandled tickets, avg response time
     */
    public function getClosureRate($userId = null): array
    {
        $totalQuery = Ticket::query();
        if ($userId) $totalQuery->whereHas('logs', fn($q) => $q->where('action_by', $userId));
        $total = $totalQuery->distinct('ticket_id')->count('ticket_id');

        $resolvedQuery = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'RESOLVE');
        if ($userId) $resolvedQuery->where('action_by', $userId);
        $resolved = $resolvedQuery->distinct('loggable_id')->count('loggable_id');

        $unhandled = $total - $resolved;
        $closureRate = $total > 0 ? round(($resolved / $total) * 100, 2) : 0;

        $avgResponseQuery = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'RESOLVE')
            ->join('ticketing_support as t', 't.ticket_id', '=', 'ticket_logs.loggable_id');
        if ($userId) $avgResponseQuery->where('action_by', $userId);

        $avgResponse = $avgResponseQuery->avg(DB::raw('TIMESTAMPDIFF(MINUTE, t.created_at, ticket_logs.action_at)'));

        return [
            'total_tickets' => $total,
            'resolved_tickets' => $resolved,
            'unhandled_tickets' => $unhandled,
            'closure_rate' => $closureRate,
            'avg_response_time' => round($avgResponse ?? 0, 2),
        ];
    }

    /**
     * Number of issues per request
     */
    public function getIssuesPerRequest($userId = null): array
    {
        $query = Ticket::select('type_of_request', DB::raw('COUNT(DISTINCT ticket_id) as issue_count'));
        if ($userId) $query->whereHas('logs', fn($q) => $q->where('action_by', $userId));

        return $query->groupBy('type_of_request')
            ->get()
            ->toArray();
    }

    /**
     * Options per request with avg response time
     */
    public function getOptionsPerRequest($userId = null): array
    {
        $query = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'RESOLVE')
            ->join('ticketing_support as t', 't.ticket_id', '=', 'ticket_logs.loggable_id')
            ->select(
                't.request_option',
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, t.created_at, ticket_logs.action_at)) as avg_minutes'),
                DB::raw('COUNT(DISTINCT t.ticket_id) as count')
            );

        if ($userId) $query->where('ticket_logs.action_by', $userId);

        return $query->groupBy('t.request_option')
            ->orderByDesc('count')
            ->get()
            ->toArray();
    }

    /**
     * Avg response time per issue
     */
    public function getAvgResponseTimePerIssue($userId = null): array
    {
        $query = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'RESOLVE')
            ->join('ticketing_support as t', 't.ticket_id', '=', 'ticket_logs.loggable_id')
            ->select(
                't.type_of_request',
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, t.created_at, ticket_logs.action_at)) as avg_minutes'),
                DB::raw('COUNT(DISTINCT t.ticket_id) as count')
            );

        if ($userId) $query->where('ticket_logs.action_by', $userId);

        return $query->groupBy('t.type_of_request')
            ->orderByDesc('count')
            ->get()
            ->toArray();
    }

    /**
     * Pareto chart based on type of request
     */
    public function getParetoByRequestType($userId = null): array
    {
        $query = Ticket::select('type_of_request', DB::raw('COUNT(DISTINCT ticket_id) as count'));
        if ($userId) $query->whereHas('logs', fn($q) => $q->where('action_by', $userId));

        $data = $query->groupBy('type_of_request')
            ->orderByDesc('count')
            ->get()
            ->toArray();

        $total = array_sum(array_column($data, 'count'));
        $cumulative = 0;

        return array_map(function ($item) use ($total, &$cumulative) {
            $cumulative += $item['count'];
            $item['percentage'] = round(($item['count'] / $total) * 100, 2);
            $item['cumulative_percentage'] = round(($cumulative / $total) * 100, 2);
            return $item;
        }, $data);
    }

    /**
     * Avg rating per employee
     */
    public function getAvgRatingPerEmployee($userId = null): array
    {
        $query = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'RESOLVE')
            ->join('ticketing_support as t', 't.ticket_id', '=', 'ticket_logs.loggable_id')
            ->whereNotNull('t.rating')
            ->select(
                'ticket_logs.action_by',
                DB::raw('AVG(t.rating) as avg_rating'),
                DB::raw('COUNT(*) as total_ratings')
            );

        if ($userId) $query->where('ticket_logs.action_by', $userId);

        return $query->groupBy('ticket_logs.action_by')
            ->orderByDesc('avg_rating')
            ->get()
            ->map(function ($item) {
                $user = $this->findUserById($item->action_by);
                return [
                    'emp_id' => $user->emp_id ?? $item->action_by,
                    'emp_name' => $user->empname ?? 'Unknown User',
                    'avg_rating' => round($item->avg_rating, 2),
                    'total_ratings' => $item->total_ratings,
                ];
            })
            ->toArray();
    }

    /**
     * Get overall auto-closed tickets summary for pie chart
     * Returns total tickets vs auto-closed tickets across all data
     */
    public function getAutoClosedTickets($userId = null): array
    {
        // Get total tickets
        $totalQuery = Ticket::query();
        if ($userId) {
            $totalQuery->whereHas('logs', fn($q) => $q->where('action_by', $userId));
        }
       $totalTickets = $totalQuery
    ->where('status', 5)          
    ->distinct('ticket_id')      
    ->count('ticket_id');          


        // Get auto-closed tickets
        $autoClosedQuery = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'AUTO_CLOSE');
        
        if ($userId) {
            $autoClosedQuery->where('action_by', $userId);
        }
        
        $autoClosedTickets = $autoClosedQuery->distinct('loggable_id')->count('loggable_id');

        // Calculate percentage
        $percentage = $totalTickets > 0 ? round(($autoClosedTickets / $totalTickets) * 100, 2) : 0;

        return [
            'total_tickets' => $totalTickets,
            'auto_closed' => $autoClosedTickets,
            'manually_handled' => $totalTickets - $autoClosedTickets,
            'percentage' => $percentage,
        ];
    }

    /**
     * Total count of auto-closed tickets (distinct) - returns percentage
     */
    public function getAutoClosedTicketsCount($userId = null): float
    {
        // Get total auto-closed tickets
        $autoClosedQuery = TicketLogs::where('loggable_type', Ticket::class)
            ->where('action_type', 'AUTO_CLOSE');
        
        if ($userId) {
            $autoClosedQuery->where('action_by', $userId);
        }
        
        $autoClosed = $autoClosedQuery->distinct('loggable_id')->count('loggable_id');

        // Get total tickets
        $totalQuery = Ticket::query();
        if ($userId) {
            $totalQuery->whereHas('logs', fn($q) => $q->where('action_by', $userId));
            }
            $total = $totalQuery->where('status', 5)->distinct('ticket_id')->count('ticket_id');

        // Return percentage
        return $total > 0 ? round(($autoClosed / $total) * 100, 2) : 0;
    }
}