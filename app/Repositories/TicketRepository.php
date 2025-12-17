<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Ticket;
use App\Models\TicketLogs;
use App\Models\TicketRemarksHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

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

        $lastTicket = Ticket::where('TICKET_ID', 'like', "{$prefix}%")
            ->orderBy('TICKET_ID', 'desc')
            ->first();

        $newNumber = $lastTicket
            ? ((int) substr($lastTicket->TICKET_ID, -3)) + 1
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
        return Ticket::where('TICKET_ID', $ticketId)->first();
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

    public function getAssignedApprovers(string $requestorId): ?array
    {
        $requestor = User::where('EMPLOYID', $requestorId)
            ->select('PRODLINE')
            ->first();

        if (!$requestor || !$requestor->PRODLINE) {
            return null;
        }

        $approvers = User::getApproversByProdline($requestor->PRODLINE);

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

        $userId = $filters['userId'] ?? null;
        $userRoles = $filters['userRoles'] ?? [];

        if ($userId) {
            $query->where(function ($q) use ($userId, $userRoles) {

                // All non-OnProcess tickets OR OnProcess processed by user
                $q->where(function ($q2) use ($userId) {
                    $q2->where('status', '!=', 2)
                        ->orWhere(function ($q3) use ($userId) {
                            $q3->where('status', 2)
                                ->where(function ($sub) use ($userId) {
                                    $sub->where('EMPLOYID', $userId)
                                        ->orWhereExists(function ($w) use ($userId) {
                                            $w->select(DB::raw(1))
                                                ->from('ticketing_support_workflow as w1')
                                                ->whereColumn('w1.TICKET_ID', 'ticketing_support.TICKET_ID')
                                                ->where('w1.ACTION_TYPE', 'ONPROCESS')
                                                ->where('w1.ACTION_BY', $userId)
                                                ->whereRaw('w1.ACTION_AT = (
                                             SELECT MAX(w2.ACTION_AT)
                                             FROM ticketing_support_workflow w2
                                             WHERE w2.TICKET_ID = w1.TICKET_ID
                                             AND w2.ACTION_TYPE = "ONPROCESS"
                                         )');
                                        });
                                });
                        });
                });

                // Support staff filter
                if (in_array('SUPPORT_TECHNICIAN', $userRoles) && !in_array('MIS_SUPERVISOR', $userRoles)) {

                    $q->where(function ($q2) use ($userId, $userRoles) {

                        // Normal request types: handled normally
                        $q2->where('TYPE_OF_REQUEST', '!=', 'Support Services');

                        // Support Services tickets
                        $q2->orWhere(function ($q3) use ($userId, $userRoles) {
                            $q3->where('TYPE_OF_REQUEST', 'Support Services')
                                ->where(function ($sub) use ($userId, $userRoles) {

                                    // Open/OnProcess/Ongoing → only requestor
                                    $sub->where(function ($s) use ($userId) {
                                        $s->where('EMPLOYID', $userId);
                                    })

                                        // Resolved/Closed → requestor or Senior Approver
                                        ->orWhere(function ($s) use ($userRoles) {
                                            if (in_array('SENIOR_APPROVER', $userRoles)) {
                                                $s->whereIn('status', [4, 5]);
                                            }
                                        });
                                });
                        });
                    });
                }
            });
        }

        // Search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('TICKET_ID', 'LIKE', "%{$search}%")
                    ->orWhere('empname', 'LIKE', "%{$search}%")
                    ->orWhere('type_of_request', 'LIKE', "%{$search}%")
                    ->orWhere('request_option', 'LIKE', "%{$search}%")
                    ->orWhere('item_name', 'LIKE', "%{$search}%");
            });
        }

        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $criticalTime = Carbon::now()->subMinutes(30);
            $status = $filters['status'];

            if ($status === 'onProcess' || $status == 2) {
                $query->where('status', 2);
            } elseif ($status === 'critical') {
                $query->where('status', 1)->where('created_at', '<=', $criticalTime);
            } elseif ($status === 'open') {
                $query->where(function ($q) use ($criticalTime) {
                    $q->where(function ($q2) use ($criticalTime) {
                        $q2->where('status', 1)->where('created_at', '>', $criticalTime);
                    })
                        ->orWhere('status', 3);
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

        // Additional where conditions
        foreach ($whereConditions as $condition) {
            $query->where(...$condition);
        }

        // WhereIn conditions
        foreach ($whereInConditions as $condition) {
            $query->whereIn(...$condition);
        }

        return $query->orderBy($filters['sortField'] ?? 'created_at', $filters['sortOrder'] ?? 'desc')
            ->paginate($filters['pageSize'] ?? 10, ['*'], 'page', $filters['page'] ?? 1);
    }

    public function getStatusCounts(array $whereConditions = [], array $filters = []): array
    {
        $criticalTime = Carbon::now()->subMinutes(30);
        $userId = $filters['userId'] ?? null;
        $userRoles = $filters['userRoles'] ?? [];

        $baseQuery = Ticket::query();

        foreach ($whereConditions as $condition) {
            $baseQuery->where(...$condition);
        }

        if ($userId) {
            $baseQuery->where(function ($q) use ($userId, $userRoles) {
                $q->where(function ($q2) use ($userId, $userRoles) {
                    // Support Services tickets
                    $q2->where('TYPE_OF_REQUEST', 'Support Services')
                        ->where(function ($sub) use ($userId, $userRoles) {
                            // Open/OnProcess/Ongoing → only requestor
                            $sub->where('EMPLOYID', $userId)
                                // Resolved/Closed → only requestor or Senior Approver
                                ->orWhere(function ($s) use ($userId, $userRoles) {
                                    if (in_array('SENIOR_APPROVER', $userRoles)) {
                                        $s->whereIn('status', [4, 5]);
                                    }
                                });
                        });
                })
                    // Other request types: normal rules (support staff can see)
                    ->orWhere('TYPE_OF_REQUEST', '!=', 'Support Services');
            });
        }

        // Clone queries for each status
        $allQuery = clone $baseQuery;
        $openQuery = clone $baseQuery;
        $criticalQuery = clone $baseQuery;
        $onProcessQuery = clone $baseQuery;
        $resolvedQuery = clone $baseQuery;
        $closedQuery = clone $baseQuery;
        $returnedQuery = clone $baseQuery;

        return [
            'all' => $allQuery->count(),
            'open' => $openQuery->where(function ($q) use ($criticalTime) {
                $q->where(function ($q2) use ($criticalTime) {
                    $q2->where('status', 1)->where('created_at', '>', $criticalTime);
                })->orWhere('status', 3);
            })->count(),
            'critical' => $criticalQuery->where('status', 1)->where('created_at', '<=', $criticalTime)->count(),
            'onProcess' => $onProcessQuery->where('status', 2)->count(),
            'resolved' => $resolvedQuery->where('status', 4)->count(),
            'closed' => $closedQuery->where('status', 5)->count(),
            'returned' => $returnedQuery->whereIn('status', [6, 7])->count(),
        ];
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
            'open' => $openQuery->where(function ($q) use ($criticalTime) {
                $q->where(function ($q2) use ($criticalTime) {
                    $q2->where('status', 1)
                        ->where('created_at', '>', $criticalTime);
                })
                    ->orWhere('status', 3);
            })->count(),

            'critical' => $criticalQuery->where('status', 1)->where('created_at', '<=', $criticalTime)->count(),
            'onProcess' => $baseQuery->clone()->where('status', 2)->count(),
            'resolved' => $baseQuery->clone()->where('status', 4)->count(),
            'closed' => $baseQuery->clone()->where('status', 5)->count(),
            'returned' => $baseQuery->clone()->whereIn('status', [6, 7])->count(),
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


    /**
     * Get ticket logs (activity history) for a specific ticket
     */
    public function getTicketLogs(string $ticketId): Collection
    {
        $logs = TicketLogs::with('actor')
            ->where('TICKET_ID', $ticketId)
            ->orderBy('created_at', 'desc')
            ->get();

        return $logs->map(function ($log) {
            // Decode metadata safely
            $meta = json_decode($log->METADATA, true);

            return [
                'ID'          => $log->ID,
                'TICKET_ID'   => $log->TICKET_ID,
                'ACTION_TYPE' => $log->ACTION_TYPE,
                'ACTION_BY'   => $log->actor->EMPNAME ?? 'N/A',
                'ACTION_AT'   => $log->ACTION_AT,
                'REMARKS'     => $log->REMARKS,

                // Extract old/new status from metadata if present
                'OLD_STATUS'  => $meta['status_change']['old_status'] ?? null,
                'NEW_STATUS'  => $meta['status_change']['new_status'] ?? null,

                'CREATED_AT'  => $log->CREATED_AT,
                'UPDATED_AT'  => $log->UPDATED_AT,
            ];
        });
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
     * Get all MIS support users (supervisors + technicians)
     */
    public function getMISSupportUsers(): array
    {
        return DB::connection('masterlist')
            ->table('employee_masterlist')
            ->select('EMPLOYID as emp_id', 'EMPNAME as empname')
            ->whereRaw("UPPER(DEPARTMENT) = 'MIS'")
            ->where(function ($query) {
                $query->whereRaw("LOWER(JOB_TITLE) LIKE ?", ['%mis support technician%'])
                    ->orWhere(function ($q) {
                        $q->whereRaw("LOWER(JOB_TITLE) LIKE ?", ['%mis%'])
                            ->whereRaw("LOWER(JOB_TITLE) LIKE ?", ['%supervisor%']);
                    });
            })
            ->get()
            ->toArray();
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
    // Response Time – raise to handled ticket
    public function getResponseTime($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
            ->select(
                'w.ACTION_BY',
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, t.CREATED_AT, w.ACTION_AT)) AS avg_response_minutes'),
                DB::raw('MIN(TIMESTAMPDIFF(MINUTE, t.CREATED_AT, w.ACTION_AT)) AS min_response_minutes'),
                DB::raw('MAX(TIMESTAMPDIFF(MINUTE, t.CREATED_AT, w.ACTION_AT)) AS max_response_minutes')
            )
            ->whereIn('w.ACTION_TYPE', ['HANDLE', 'RESOLVE']); // ONLY valid first response

        if ($userId) {
            $query->where('w.ACTION_BY', $userId);
        }

        $records = $query->groupBy('w.ACTION_BY')
            ->orderBy('avg_response_minutes')
            ->get()
            ->toArray();

        return array_map(function ($item) {
            $user = $this->findUserById($item->ACTION_BY);
            $item->emp_name = $user->empname ?? "Unknown User";
            $item->emp_id = $user->emp_id ?? $item->ACTION_BY;
            return $item;
        }, $records);
    }
    // Tickets per day
    public function getTicketsPerDay($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->select(
                DB::raw('DATE(t.created_at) as day'),
                DB::raw('COUNT(DISTINCT t.TICKET_ID) as total')
            );

        if ($userId) {
            $query->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
                ->where('w.ACTION_BY', $userId);
        }

        return $query->groupBy('day')
            ->orderBy('day')
            ->get()
            ->toArray();
    }

    // Number of tickets handled
    public function getTicketsHandled($userId = null): array
    {
        $query = DB::table('ticketing_support_workflow')
            ->select('ACTION_BY', DB::raw('COUNT(DISTINCT TICKET_ID) as total'))
            ->where('ACTION_TYPE', 'RESOLVE');

        if ($userId) {
            $query->where('ACTION_BY', $userId);
        }

        $records = $query->groupBy('ACTION_BY')
            ->orderByDesc('total')
            ->get()
            ->toArray();

        return array_map(function ($item) {
            $user = $this->findUserById($item->ACTION_BY);
            $item->emp_name = $user->empname ?? "Unknown User";
            $item->emp_id = $user->emp_id ?? $item->ACTION_BY;
            return $item;
        }, $records);
    }


    // Closure rate – no of tickets, no of unhandled tickets, avg response time
    public function getClosureRate($userId = null): array
    {
        // TOTAL TICKETS
        $totalQuery = DB::table('ticketing_support as t');

        if ($userId) {
            // Count tickets handled by this user (ANY action)
            $totalQuery->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
                ->where('w.ACTION_BY', $userId);
        }

        $total = $totalQuery->distinct('t.TICKET_ID')->count('t.TICKET_ID');


        // RESOLVED TICKETS
        $resolvedQuery = DB::table('ticketing_support_workflow as w')
            ->where('w.ACTION_TYPE', 'RESOLVE');

        if ($userId) {
            $resolvedQuery->where('w.ACTION_BY', $userId);
        }

        $resolved = $resolvedQuery->distinct('w.TICKET_ID')->count('w.TICKET_ID');


        // UNHANDLED
        $unhandled = $total - $resolved;

        // CLOSURE RATE
        $closureRate = $total > 0 ? round(($resolved / $total) * 100, 2) : 0;


        // AVG RESPONSE TIME
        $avgResponseQuery = DB::table('ticketing_support as t')
            ->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
            ->where('w.ACTION_TYPE', 'RESOLVE');

        if ($userId) {
            $avgResponseQuery->where('w.ACTION_BY', $userId);
        }

        $avgResponse = $avgResponseQuery->avg(DB::raw('TIMESTAMPDIFF(MINUTE, t.created_at, w.ACTION_AT)'));


        return [
            'total_tickets' => $total,
            'resolved_tickets' => $resolved,
            'unhandled_tickets' => $unhandled,
            'closure_rate' => $closureRate,
            'avg_response_time' => round($avgResponse ?? 0, 2),
        ];
    }


    // Number of issues per request
    public function getIssuesPerRequest($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->select(
                't.TYPE_OF_REQUEST',
                DB::raw('COUNT(DISTINCT t.TICKET_ID) as issue_count')
            );

        if ($userId) {
            $query->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
                ->where('w.ACTION_BY', $userId);
        }

        return $query->groupBy('t.TYPE_OF_REQUEST')
            ->get()
            ->toArray();
    }



    public function getOptionsPerRequest($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
            ->select(
                't.REQUEST_OPTION',
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, t.CREATED_AT, w.ACTION_AT)) as avg_minutes'),
                DB::raw('COUNT(DISTINCT t.TICKET_ID) as count')
            )
            ->where('w.ACTION_TYPE', 'RESOLVE');

        if ($userId) {
            $query->where('w.ACTION_BY', $userId);
        }

        return $query->groupBy('t.REQUEST_OPTION')
            ->orderBy('count', 'desc')
            ->get()
            ->toArray();
    }

    // Avg response time per issue
    public function getAvgResponseTimePerIssue($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
            ->select(
                't.TYPE_OF_REQUEST',
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, t.CREATED_AT, w.ACTION_AT)) as avg_minutes'),
                DB::raw('COUNT(DISTINCT t.TICKET_ID) as count')
            )
            ->where('w.ACTION_TYPE', 'RESOLVE');

        if ($userId) {
            $query->where('w.ACTION_BY', $userId);
        }

        return $query->groupBy('t.TYPE_OF_REQUEST')
            ->orderBy('count', 'desc')
            ->get()
            ->toArray();
    }


    // Pareto chart based on type of request
    public function getParetoByRequestType($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->select(
                't.TYPE_OF_REQUEST',
                DB::raw('COUNT(DISTINCT t.TICKET_ID) as count')
            );

        if ($userId) {
            $query->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
                ->where('w.ACTION_BY', $userId);
        }

        $data = $query->groupBy('t.TYPE_OF_REQUEST')
            ->orderByDesc('count')
            ->get()
            ->toArray();

        $total = array_sum(array_column($data, 'count'));
        $cumulative = 0;

        return array_map(function ($item) use ($total, &$cumulative) {
            $cumulative += $item->count;
            $item->percentage = round(($item->count / $total) * 100, 2);
            $item->cumulative_percentage = round(($cumulative / $total) * 100, 2);
            return $item;
        }, $data);
    }


    // Avg rating per employee
    public function getAvgRatingPerEmployee($userId = null): array
    {
        $query = DB::table('ticketing_support as t')
            ->join('ticketing_support_workflow as w', 't.TICKET_ID', '=', 'w.TICKET_ID')
            ->select(
                'w.ACTION_BY',
                DB::raw('AVG(t.RATING) as avg_rating'),
                DB::raw('COUNT(*) as total_ratings')
            )
            ->whereNotNull('t.RATING')
            ->whereIn('w.ACTION_TYPE', ['RESOLVE']);

        if ($userId) {
            $query->where('w.ACTION_BY', $userId);
        }

        $records = $query->groupBy('w.ACTION_BY')
            ->orderByDesc('avg_rating')
            ->get()
            ->toArray();

        return array_map(function ($item) {
            $user = $this->findUserById($item->ACTION_BY);
            $item->emp_name = $user->empname ?? "Unknown User";
            $item->emp_id = $user->emp_id ?? $item->ACTION_BY;
            $item->avg_rating = round($item->avg_rating, 2);
            return $item;
        }, $records);
    }
}
