<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Ticket;
use App\Models\TicketLogs;
use Carbon\Carbon;

class TicketRepository
{
    public function getComputerNamesByType(string $type): Collection
    {
        return DB::connection('inventory')
            ->table('mis_table')
            ->select('id', 'hostname as name')
            ->whereRaw('LOWER(category) = ?', [strtolower($type)])
            ->orderBy('hostname')
            ->get();
    }

    public function getDesktopNames(): Collection
    {
        return $this->getComputerNamesByType('Desktop');
    }

    public function getLaptopNames(): Collection
    {
        return $this->getComputerNamesByType('Laptop');
    }

    public function getServerNames(): Collection
    {
        return $this->getComputerNamesByType('Server');
    }

    public function getELearnThinClientNames(): Collection
    {
        return $this->getComputerNamesByType('e learn thin client');
    }

    public function getPrinterNamesByType(string $type): Collection
    {
        return DB::connection('inventory')
            ->table('printer_table')
            ->select('id', 'printer_name as name')
            ->whereRaw('LOWER(category) = ?', [strtolower($type)])
            ->whereRaw('LOWER(status) = ?', [strtolower('active')])
            ->whereRaw('LOWER(printer_name) != ?', [strtolower('n/a')])
            ->orderBy('printer_name')
            ->get();
    }

    public function getConsignedPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Consigned Printer');
    }

    public function getHoneywellPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Honeywell Printer');
    }

    public function getZebraPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Zebra Printer');
    }

    public function getTerminalNames(string $type): Collection
    {
        return DB::connection('inventory')
            ->table('terminal_table')
            ->select('id', 'hostname as name')
            ->whereRaw('LOWER(status) = ?', ['active'])
            ->whereRaw('LOWER(category) = ?', [strtolower($type)])
            ->orderBy('hostname')
            ->get();
    }

    public function getPromisTerminalNames(): Collection
    {
        return $this->getTerminalNames('Promis Terminal');
    }

    public function generateTicketNumber(): string
    {
        $year = date('Y');
        $prefix = "TKTSPRT-{$year}-";

        $lastTicket = Ticket::where('ticket_id', 'like', "{$prefix}%")
            ->orderBy('ticket_id', 'desc')
            ->first();

        $newNumber = $lastTicket
            ? ((int) substr($lastTicket->ticket_id, -3)) + 1
            : 1;

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    public function createTicket(array $ticketData): Ticket
    {
        return Ticket::create($ticketData);
    }

    public function createTicketLog(array $logData): TicketLogs
    {
        return TicketLogs::create($logData);
    }

    public function findTicketById(string $ticketId): ?Ticket
    {
        return Ticket::where('ticket_id', $ticketId)->first();
    }

    public function updateTicket(Ticket $ticket, array $data): bool
    {
        return $ticket->update($data);
    }

    public function getApproverIds(string $userId): array
    {
        return DB::connection('masterlist')
            ->table('employee_masterlist')
            ->whereRaw("? IN (APPROVER1, APPROVER2, APPROVER3)", [$userId])
            ->pluck('EMPLOYID')
            ->toArray();
    }

    /**
     * Get tickets with basic filtering (no business logic)
     */
    public function getTicketsWithFilters(
        array $filters = [],
        array $whereConditions = [],
        array $whereInConditions = []
    ): LengthAwarePaginator {
        $query = Ticket::query();

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ticket_id', 'LIKE', "%{$search}%")
                    ->orWhere('empname', 'LIKE', "%{$search}%")
                    ->orWhere('type_of_request', 'LIKE', "%{$search}%")
                    ->orWhere('request_option', 'LIKE', "%{$search}%")
                    ->orWhere('item_name', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter (basic data filtering only)
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            if ($filters['status'] === 'critical') {
                $criticalTime = Carbon::now()->subMinutes(30);
                $query->where('status', 1)->where('created_at', '<=', $criticalTime);
            } elseif ($filters['status'] === 'open') {
                $criticalTime = Carbon::now()->subMinutes(30);
                $query->where('status', 1)->where('created_at', '>', $criticalTime);
            } elseif (in_array($filters['status'], ['resolved', 'closed', 'returned'])) {
                $statusMap = ['resolved' => 2, 'closed' => 3, 'returned' => 4];
                $query->where('status', $statusMap[$filters['status']]);
            } elseif (is_numeric($filters['status'])) {
                $query->where('status', $filters['status']);
            }
        }

        // Apply additional where conditions
        foreach ($whereConditions as $condition) {
            if (count($condition) === 3) {
                $query->where($condition[0], $condition[1], $condition[2]);
            } elseif (count($condition) === 2) {
                $query->where($condition[0], $condition[1]);
            }
        }

        // Apply whereIn conditions
        foreach ($whereInConditions as $condition) {
            if (count($condition) === 2) {
                $query->whereIn($condition[0], $condition[1]);
            }
        }

        // Apply sorting and pagination
        return $query->orderBy($filters['sortField'] ?? 'created_at', $filters['sortOrder'] ?? 'desc')
            ->paginate($filters['pageSize'] ?? 10, ['*'], 'page', $filters['page'] ?? 1);
    }

    /**
     * Get ticket counts by status (basic counting only)
     */
    public function getTicketCounts(array $whereConditions = [], array $whereInConditions = []): array
    {
        $criticalTime = Carbon::now()->subMinutes(30);

        $baseQuery = Ticket::query();

        // Apply where conditions
        foreach ($whereConditions as $condition) {
            if (count($condition) === 3) {
                $baseQuery->where($condition[0], $condition[1], $condition[2]);
            } elseif (count($condition) === 2) {
                $baseQuery->where($condition[0], $condition[1]);
            }
        }

        // Apply whereIn conditions
        foreach ($whereInConditions as $condition) {
            if (count($condition) === 2) {
                $baseQuery->whereIn($condition[0], $condition[1]);
            }
        }

        $openQuery = clone $baseQuery;
        $criticalQuery = clone $baseQuery;

        return [
            'all' => $baseQuery->count(),
            'open' => $openQuery->where('status', 1)->where('created_at', '>', $criticalTime)->count(),
            'critical' => $criticalQuery->where('status', 1)->where('created_at', '<=', $criticalTime)->count(),
            'resolved' => $baseQuery->clone()->where('status', 2)->count(),
            'closed' => $baseQuery->clone()->where('status', 3)->count(),
            'returned' => $baseQuery->clone()->where('status', 4)->count(),
        ];
    }

    /**
     * Get all tickets for a specific employee
     */
    public function getTicketsByEmployeeId(string $employeeId): Collection
    {
        return Ticket::where('employid', $employeeId)->get();
    }

    /**
     * Get tickets by multiple employee IDs
     */
    public function getTicketsByEmployeeIds(array $employeeIds): Collection
    {
        return Ticket::whereIn('employid', $employeeIds)->get();
    }

    /**
     * Get all open tickets
     */
    public function getOpenTickets(): Collection
    {
        return Ticket::where('status', 1)->get();
    }

    /**
     * Get tickets that need attention (critical)
     */
    public function getCriticalTickets(): Collection
    {
        $criticalTime = Carbon::now()->subMinutes(30);
        return Ticket::where('status', 1)
            ->where('created_at', '<=', $criticalTime)
            ->get();
    }
    public function getStatusCounts(array $whereConditions = []): array
    {
        $criticalTime = Carbon::now()->subMinutes(30);

        $baseQuery = Ticket::query();
        foreach ($whereConditions as $condition) {
            $baseQuery->where(...$condition);
        }

        $openQuery = clone $baseQuery;
        $criticalQuery = clone $baseQuery;

        return [
            'all' => $baseQuery->count(),
            'open' => $openQuery->where('status', 1)->where('created_at', '>', $criticalTime)->count(),
            'critical' => $criticalQuery->where('status', 1)->where('created_at', '<=', $criticalTime)->count(),
            'resolved' => $baseQuery->clone()->where('status', 2)->count(),
            'closed' => $baseQuery->clone()->where('status', 3)->count(),
            'returned' => $baseQuery->clone()->where('status', 4)->count(),
        ];
    }
}
