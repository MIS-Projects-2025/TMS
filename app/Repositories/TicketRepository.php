<?php

namespace App\Repositories;

use App\Models\Hardware;
use App\Models\Printer;
use App\Models\Terminal;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Ticket;
use App\Models\TicketLogs;
use App\Models\TicketRemarksHistory;
use App\Models\User;
use App\Services\TicketStatusService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TicketRepository
{
    public function getComputerNamesByType(string $type): Collection
    {
        return Hardware::select('id', 'hostname as name')
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
    public function getPromisTerminalNames(): Collection
    {
        return $this->getComputerNamesByType('Promis Terminal');
    }
  public function getPrinterNamesByType(string $type): Collection
{
    return Printer::whereRaw('LOWER(printer_category) = ?', [strtolower($type)])
        ->where('status', '1')
        ->orderBy('printer_name')
        ->get(['id', 'printer_name as name', 'location']);
}

    public function getConsignedPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Consigned Printer');
    }

    public function getBarcodePrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Bardcode Printer');
    }

    public function getZebraPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Zebra Printer');
    }

//  public function getTerminalNames(string $type): Collection
// {
//     return Terminal::select('id', 'promis_name as name')
//         ->where('status', '1')
//         ->orderBy('promis_name')
//         ->get();
        
// }



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
            ->where('ACCSTATUS', 1)
            ->pluck('EMPLOYID')
            ->toArray();
    }

    public function getAssignedApprovers(string $ticketId): ?array
    {
        $requestorId = Ticket::where('ticket_id', $ticketId)->value('employid');

        $requestor = User::where('EMPLOYID', $requestorId)
            ->where('ACCSTATUS', 1)
            ->select('PRODLINE', 'DEPARTMENT')
            ->first();

        if (!$requestor || !$requestor->PRODLINE || !$requestor->DEPARTMENT) {
            return null;
        }

        // Make sure this method also filters ACCSTATUS = 1
        $approvers = User::getApproversByProdline(
            $requestor->PRODLINE,
            $requestor->DEPARTMENT
        );

        return [
            'approvers' => $approvers,
        ];
    }


    /**
     * Get tickets with basic filtering (no business logic)
     */
    public function getTicketsWithFilters(
        array $filters = [],
        array $whereConditions = [],
        array $whereInConditions = []
    ): LengthAwarePaginator {
        $query = Ticket::with('handler', 'closer');

        // Handle special DEPARTMENT_HEAD access
        if (isset($whereConditions['dept_head_access'])) {
            $deptHeadData = $whereConditions['dept_head_access'];
            $userId = $deptHeadData['user_id'];
            $approverIds = $deptHeadData['approver_ids'];

            $query->where(function ($q) use ($approverIds, $userId) {
                // Show tickets from team members OR tickets assigned to dept head
                $q->whereIn('employid', $approverIds)
                    ->orWhere('assigned_to', $userId);
            });

            unset($whereConditions['dept_head_access']);
        }

        $this->applyUserFilters($query, $filters);
        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyStatusFilter($query, $filters['status'] ?? null);

        // Additional where conditions
        foreach ($whereConditions as $condition) {
            if (is_array($condition)) {
                $query->where(...$condition);
            }
        }

        // WhereIn conditions
        foreach ($whereInConditions as $condition) {
            $query->whereIn(...$condition);
        }

        return $query->orderBy(
            $filters['sortField'] ?? 'created_at',
            $filters['sortOrder'] ?? 'desc'
        )
            ->paginate(
                $filters['pageSize'] ?? 10,
                ['*'],
                'page',
                $filters['page'] ?? 1
            );
    }

    /**
     * Get ticket counts per status
     */
    public function getStatusCounts(array $filters = [], array $whereConditions = []): array
    {
        $criticalTime = Carbon::now()->subMinutes(30);
        $query = Ticket::query();

        foreach ($whereConditions as $condition) {
            $query->where(...$condition);
        }

        $this->applyUserFilters($query, $filters);

        return [
            'all' => (clone $query)->count(),
            'open' => (clone $query)->where(function ($q) use ($criticalTime) {
                $q->where(function ($q2) use ($criticalTime) {
                    $q2->where('status', 1)->where('created_at', '>', $criticalTime);
                })->orWhere('status', 3);
            })->count(),
            'critical' => (clone $query)->where('status', 1)->where('created_at', '<=', $criticalTime)->count(),
            'onProcess' => (clone $query)->where('status', 2)->count(),
            'resolved' => (clone $query)->where('status', 4)->count(),
            'closed' => (clone $query)->where('status', 5)->count(),
            'returned' => (clone $query)->whereIn('status', [6, 7])->count(),
        ];
    }

    /**
     * Apply user and role-based filters
     */
    private function applyUserFilters($query, array $filters)
{
    $userId = $filters['userId'] ?? null;
    $userRoles = $filters['userRoles'] ?? [];

    if (!$userId) return;

    // Check if user has full access roles
    $hasFullAccess = in_array('MIS_SUPERVISOR', $userRoles) ||
        in_array('SUPPORT_TECHNICIAN', $userRoles) ||
        in_array('OD', $userRoles);

    $isSeniorApprover = in_array('SENIOR_APPROVER', $userRoles);

    $query->where(function ($q) use ($userId, $userRoles, $hasFullAccess, $isSeniorApprover) {
        $q->where(function ($sub) use ($userId, $isSeniorApprover) {
            $sub->where('status', '!=', 2)
                ->orWhere(function ($q2) use ($userId, $isSeniorApprover) {
                    $q2->where('status', 2)
                        ->where(function ($s) use ($userId, $isSeniorApprover) {
                            if ($isSeniorApprover) {
                                // Senior approvers see status 2 only for non-Support Services
                                $s->where(function ($sa) use ($userId) {
                                    $sa->where('type_of_request', '!=', 'Support Services')
                                        ->orWhere('EMPLOYID', $userId)
                                        ->orWhereExists(function ($w) use ($userId) {
                                            $w->select(DB::raw(1))
                                                ->from('ticket_logs as w1')
                                                ->whereColumn('w1.loggable_id', 'ticketing_support.ticket_id')
                                                ->where('w1.action_type', 'ONPROCESS')
                                                ->where('w1.action_by', $userId)
                                                ->whereRaw('w1.action_at = (
                                                    SELECT MAX(w2.action_at)
                                                    FROM ticket_logs w2
                                                    WHERE w2.loggable_id = w1.loggable_id
                                                    AND w2.action_type = "ONPROCESS"
                                                )');
                                        });
                                });
                                return;
                            }
                            // Normal users
                            $s->where('EMPLOYID', $userId)
                                ->orWhereExists(function ($w) use ($userId) {
                                    $w->select(DB::raw(1))
                                        ->from('ticket_logs as w1')
                                        ->whereColumn('w1.loggable_id', 'ticketing_support.ticket_id')
                                        ->where('w1.action_type', 'ONPROCESS')
                                        ->where('w1.action_by', $userId)
                                        ->whereRaw('w1.action_at = (
                                            SELECT MAX(w2.action_at)
                                            FROM ticket_logs w2
                                            WHERE w2.loggable_id = w1.loggable_id
                                            AND w2.action_type = "ONPROCESS"
                                        )');
                                });
                        });
                });
        });

        // Only apply ownership filter for non-full-access users
        if (!$hasFullAccess) {
            $q->where(function ($ownership) use ($userId) {
                $ownership->where('EMPLOYID', $userId)
                    ->orWhere('assigned_to', $userId);
            });
        }

        if (in_array('SUPPORT_TECHNICIAN', $userRoles) && !in_array('MIS_SUPERVISOR', $userRoles)) {
            $q->where(function ($q2) use ($userId, $userRoles) {
                $q2->where('type_of_request', '!=', 'Support Services')
                    ->orWhere(function ($sub) use ($userId, $userRoles) {
                        $sub->where('type_of_request', 'Support Services')
                            ->where(function ($s) use ($userId, $userRoles) {
                                $s->where('EMPLOYID', $userId)
                                    ->orWhere('assigned_to', $userId)
                                    ->orWhere(function ($s2) use ($userRoles) {
                                        if (in_array('SENIOR_APPROVER', $userRoles)) {
                                            $s2->whereIn('status', [4, 5]);
                                        }
                                    });
                            });
                    });
            });
        }
    });
}

    /**
     * Apply search filter
     */
    private function applySearchFilter($query, ?string $search)
    {
        if (!$search) return;

        $query->where(function ($q) use ($search) {
            $q->where('ticket_id', 'LIKE', "%{$search}%")
                ->orWhere('empname', 'LIKE', "%{$search}%")
                ->orWhere('type_of_request', 'LIKE', "%{$search}%")
                ->orWhere('request_option', 'LIKE', "%{$search}%")
                ->orWhere('item_name', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Apply status filter
     */
    private function applyStatusFilter($query, $status)
    {
        if (!$status || $status === 'all') return;

        $criticalTime = Carbon::now()->subMinutes(30);

        if ($status === 'onProcess' || $status == 2) {
            $query->where('status', 2);
        } elseif ($status === 'critical') {
            $query->where('status', 1)->where('created_at', '<=', $criticalTime);
        } elseif ($status === 'open') {
            $query->where(function ($q) use ($criticalTime) {
                $q->where(function ($q2) use ($criticalTime) {
                    $q2->where('status', 1)->where('created_at', '>', $criticalTime);
                })->orWhere('status', 3);
            });
        } elseif ($status === 'returned') {
            $query->whereIn('status', [6, 7]);
        } elseif (in_array($status, ['resolved', 'closed'])) {
            $statusMap = ['resolved' => 4, 'closed' => 5];
            $query->where('status', $statusMap[$status]);
        } elseif (is_numeric($status)) {
            $query->where('status', $status);
        }
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


    /**
     * Get ticket logs (activity history) for a specific ticket
     */


    public function getTicketLogs(string $ticketId, int $perPage = 5): LengthAwarePaginator
{
    $logs = TicketLogs::with('actor')
        ->where('loggable_type', Ticket::class)
        ->where('loggable_id', $ticketId)
        ->where('action_type', '!=', 'CREATED')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

    $userFields = ['employid', 'closed_by', 'assigned_to', 'assigned_by', 'handled_by'];
    $statusFields = ['status'];

    // Collect EMPLOYIDs from old_values and new_values
    $empIds = [];
    foreach ($logs->items() as $log) {
        $oldValues = $log->old_values ?? [];
        $newValues = $log->new_values ?? [];

        foreach ($userFields as $field) {
            if (!empty($oldValues[$field])) $empIds[] = $oldValues[$field];
            if (!empty($newValues[$field])) $empIds[] = $newValues[$field];
        }
    }

    $users = User::whereIn('EMPLOYID', array_unique($empIds))
        ->pluck('EMPNAME', 'EMPLOYID')
        ->toArray();

    $logs->getCollection()->transform(function ($log) use ($users, $userFields, $statusFields) {
        $oldValues = $log->old_values ?? [];
        $newValues = $log->new_values ?? [];
        $metadata  = $log->metadata ?? [];

        // Store original numeric status values before mapping
        $oldStatusId = $oldValues['status'] ?? null;
        $newStatusId = $newValues['status'] ?? null;

        // Map EMPLOYID to names
        foreach ($userFields as $field) {
            if (!empty($oldValues[$field]) && isset($users[$oldValues[$field]])) {
                $oldValues[$field] = $users[$oldValues[$field]];
            }
            if (!empty($newValues[$field]) && isset($users[$newValues[$field]])) {
                $newValues[$field] = $users[$newValues[$field]];
            }
        }

        // Map numeric STATUS to labels
        foreach ($statusFields as $field) {
            if (isset($oldValues[$field])) {
                $oldValues[$field] = TicketStatusService::getStatusLabelById((int) $oldValues[$field]);
            }
            if (isset($newValues[$field])) {
                $newValues[$field] = TicketStatusService::getStatusLabelById((int) $newValues[$field]);
            }
        }

        return [
            'ID'               => $log->id,
            'ACTION_TYPE'      => $log->action_type,
            'ACTION_BY'        => $log->actor->empname ?? 'N/A',
            'ACTION_AT'        => $log->action_at,
            'OLD_VALUES'       => $oldValues,
            'NEW_VALUES'       => $newValues,
            'REMARKS'          => $log->remarks,
            'METADATA'         => $metadata,
            'OLD_STATUS_ID'    => $oldStatusId,
            'NEW_STATUS_ID'    => $newStatusId,
        ];
    });

    return $logs;
}


    /**
     * Get complete ticket history (logs + remarks combined)
     */
    public function getTicketHistory(string $ticketId): array
    {
        return [
            'logs' => $this->getTicketLogs($ticketId),

        ];
    }

    /**
     * Find a user by their employee ID
     */
    public function findUserById(string $empId): ?object
    {
        return DB::connection('masterlist')
            ->table('employee_masterlist')
            ->where('EMPLOYID', $empId)
            ->select('EMPLOYID as emp_id', 'EMPNAME as empname')
            ->first();
    }
    public function getJobTitle(string $empId): ?string
    {
        return DB::connection('masterlist')
            ->table('employee_masterlist')
            ->where('EMPLOYID', $empId)
            ->value('JOB_TITLE');
    }

    /**
     * Find tickets that have been resolved for more than 24 hours
     * and need to be automatically closed
     */
    public function findResolvedTicketsForAutoClose(): Collection
    {
         $threshold = Carbon::now('Asia/Manila')->subHours(24);

        return Ticket::where('status', '4') // STATUS_RESOLVED
            ->where('handled_at', '<=', $threshold)
            ->whereNotNull('handled_at')
            ->get();
    }

    /**
     * Update ticket status to Closed (auto-close after 24 hours)
     * Uses the Loggable trait to automatically log the change
     */
    public function updateTicketToAutoClosed(Ticket $ticket, string $systemUserId = 'SYSTEM'): bool
    {
        try {
            // Set the current action type for the Loggable trait
            $ticket->currentAction = 'AUTO_CLOSE';

            // Store old status for logging
            $oldStatus = $ticket->status;

            // Temporarily set session data for system user
            $originalSession = session('emp_data');
            session(['emp_data' => [
                'emp_id' => $systemUserId,
                'EMPLOYID' => $systemUserId,
            ]]);

            // Update the ticket - Loggable trait will handle logging
            $result = $ticket->update([
                'status' => 5, // STATUS_CLOSED
                'closed_by' => $ticket->employid, // Original requestor
                'closed_at' => now(),
            ]);

            // Add system-generated remark
            $this->addSystemRemarkForAutoClose($ticket, $oldStatus);

            // Restore original session
            if ($originalSession) {
                session(['emp_data' => $originalSession]);
            } else {
                session()->forget('emp_data');
            }

            return $result;
        } catch (\Exception $e) {
            Log::error("Failed to auto-close ticket {$ticket->ticket_id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add a system-generated remark for auto-close action
     */
    protected function addSystemRemarkForAutoClose(Ticket $ticket, int $oldStatus): void
    {
        try {
            TicketLogs::create([
                'loggable_type' => Ticket::class,
                'loggable_id' => $ticket->ticket_id,
                'action_type' => 'AUTO_CLOSE',
                'action_by' => 'SYSTEM',
                'action_at' => now()->format('Y-m-d H:i:s'),
                'old_values' => null,
                'new_values' => null,
                'remarks' => "Status automatically changed from " . 
                    TicketStatusService::getStatusLabelById($oldStatus) . 
                    " to " . TicketStatusService::getStatusLabelById(5) . 
                    " after 24 hours from resolution. Ticket handled at: " . 
                    $ticket->handled_at->format('Y-m-d H:i:s'),
                'metadata' => json_encode([
                    'auto_close_trigger' => '24_hours_after_resolution',
                    'handled_at' => $ticket->handled_at->format('Y-m-d H:i:s'),
                    'auto_closed_at' => now()->format('Y-m-d H:i:s'),
                ]),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to add system remark for ticket {$ticket->ticket_id}: " . $e->getMessage());
        }
    }



  
}