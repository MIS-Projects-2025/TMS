<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\TicketRepository;
use App\Repositories\TicketRequestTypeRepository;
use App\Services\TicketStatusService;
use App\Services\UserRoleService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Log;

class TicketService
{
    protected TicketRepository $ticketRepository;
    protected TicketRequestTypeRepository $requestTypeRepository;
    protected NotificationService $notificationService;
    protected UserRoleService $userRoleService;
    protected UserRepository $userRepo;

    public function __construct(
        TicketRepository $ticketRepository,
        TicketRequestTypeRepository $requestTypeRepository,
        NotificationService $notificationService,
        UserRoleService $userRoleService,
        UserRepository $userRepo
    ) {
        $this->ticketRepository = $ticketRepository;
        $this->requestTypeRepository = $requestTypeRepository;
        $this->notificationService = $notificationService;
        $this->userRoleService = $userRoleService;
        $this->userRepo = $userRepo;
    }


    public function getTicketFormData($userRoles): array
    {
        return [
            'request_types' => $this->requestTypeRepository->getRequestTypesForForm($userRoles),
            'hardware_options' => [
                'Desktop' => $this->ticketRepository->getDesktopNames(),
                'Laptop' => $this->ticketRepository->getLaptopNames(),
                'Server' => $this->ticketRepository->getServerNames(),
                'E-Learn Thin Client' => $this->ticketRepository->getELearnThinClientNames(),
            ],
            'printer_options' => [
                'Consigned Printer' => $this->ticketRepository->getConsignedPrinterNames(),
                'Barcode Printer' => $this->ticketRepository->getBarcodePrinterNames(),
            ],
            'promis_options' => [
                'Promis Terminal' => $this->ticketRepository->getPromisTerminalNames(),
            ]
        ];
    }

    public function createTicket(array $ticketData, array $employeeData): array
    {
        $this->validateTicketData($ticketData);

        $ticketId = $this->ticketRepository->generateTicketNumber();
        $mainTicketData = [
            'ticket_id' => $ticketId,
            'employid' => $employeeData['emp_id'],
            'empname' => $employeeData['emp_name'],
            'department' => $employeeData['emp_dept'],
            'prodline' => $employeeData['emp_prodline'],
            'station' => $employeeData['emp_station'],
            'type_of_request' => $ticketData['request_type'],
            'request_option' => $ticketData['request_option'],
            'item_name' => $ticketData['item_name'] ?? null,
            'details' => $ticketData['details'],
            'status' => 1, // Open
            'created_at' => now(),
        ];

        return DB::transaction(function () use ($mainTicketData, $ticketId, $ticketData, $employeeData) {

            $ticket = $this->ticketRepository->createTicket($mainTicketData);



            // Notify MIS support
            $this->notificationService->notifyTicketAction(
                $ticket,
                'Created',
                ['emp_id' => $employeeData['emp_id'], 'name' => $employeeData['emp_name']],
                $employeeData,
                ['MIS_SUPERVISOR', 'SUPPORT_TECHNICIAN']
            );

            return ['ticket' => $ticket, 'ticket_id' => $ticketId];
        });
    }

    public function getTicketsDataTable(array $filters, array $employeeData): array
    {
        // Get user roles from emp_user_roles inside employeeData
        $userRoles = $employeeData['emp_user_roles'] ?? [];

        // Role-based access
        $whereConditions = $this->buildRoleBasedConditions($employeeData);

        $filters['userId'] = $employeeData['emp_id'];
        $filters['userRoles'] = $userRoles;

        // Get tickets
        $tickets = $this->ticketRepository->getTicketsWithFilters($filters, $whereConditions);

        $statusCounts = $this->ticketRepository->getStatusCounts($filters, $whereConditions);

        $ticketsData = $tickets->getCollection()->map(function ($ticket) use ($employeeData) {
            $status = $ticket->status ?? $ticket->status;
            $ticket->action = $this->determineTicketAction($ticket, $status, $employeeData);
            $ticket->status_label = TicketStatusService::getStatusLabel($ticket);
            $ticket->status_color = TicketStatusService::getStatusColor($ticket);

            $ticket->handled_by_name = $ticket->handler->EMPNAME ?? 'N/A';
            $ticket->closed_by_name   = $ticket->closer->EMPNAME ?? 'N/A';

            unset($ticket->handler, $ticket->closer);

            return $ticket;
        });

        return [
            'tickets' => $ticketsData->toArray(),
            'pagination' => [
                'current_page' => $tickets->currentPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
                'last_page' => $tickets->lastPage(),
            ],
            'statusCounts' => $statusCounts,
            'filters' => $filters,
        ];
    }
public function ticketAction(
    string $ticketId,
    string $userId,
    string $actionType = 'RESOLVE',
    string $remarks = '',
    ?int $rating = null,
    ?string $assignedTo = null
): bool {
    $actionType = strtoupper($actionType);
    if (!in_array($actionType, ['RESOLVE', 'CLOSE', 'RETURN', 'ONGOING', 'CANCEL', 'ONPROCESS', 'ASSIGN'])) {
        throw new \InvalidArgumentException('Invalid action type');
    }

    return DB::transaction(function () use ($ticketId, $userId, $actionType, $remarks, $rating, $assignedTo) {

        $ticket = $this->ticketRepository->findTicketById($ticketId);
        if (!$ticket) return false;

        $oldStatus = $ticket->status;

        $statusMap = [
            'ONPROCESS' => 2,
            'ONGOING' => 3,
            'RESOLVE' => 4,
            'ASSIGN' => 4,
            'CLOSE' => 5,
            'RETURN' => 6,
            'CANCEL' => 7
        ];
        $newStatus = $statusMap[$actionType];

        $updateData = ['status' => $newStatus];

        if ($actionType === 'ASSIGN' || $actionType === 'RESOLVE') {
            if ($assignedTo) {
                $updateData['assigned_to'] = $assignedTo;
                $updateData['assigned_at'] = now();
                $updateData['assigned_by'] = $userId;
            }
        }

        if ($actionType === 'RESOLVE') {
            $updateData['handled_by'] = $userId;
            $updateData['handled_at'] = now();
        }

        if ($actionType === 'CLOSE') {
            $updateData['closed_by'] = $userId;
            $updateData['closed_at'] = now();
            if (!is_null($rating)) $updateData['rating'] = $rating;
        }

        // Set the action type and remarks on the model
        $ticket->currentAction = $actionType;
        $ticket->currentRemarks = $remarks; // Add this property

        $this->ticketRepository->updateTicket($ticket, $updateData);

        // Get the actual actor's name
        $actorUser = $this->userRepo->findUserById($userId);
        $actorData = [
            'emp_id' => $userId,
            'name' => $actorUser->empname ?? 'Unknown'
        ];

        // Send notification
        $this->notificationService->notifyTicketAction($ticket, $actionType, $actorData);

        return true;
    });
}


    /**
     * Business logic: Determine available action for a ticket
     */
    private function determineTicketAction($ticket, int $status, array $employeeData): array
    {
        $userRoles = $employeeData['emp_user_roles'] ?? [];
        $actions = ['View'];
        $actionLabel = 'Remarks'; // default

        $isRequestor = (($ticket->employid ?? null) == $employeeData['emp_id']);
        $isSupport = in_array('MIS_SUPERVISOR', $userRoles) ||
            in_array('SUPPORT_TECHNICIAN', $userRoles);
        $isSeniorApprover = in_array('SENIOR_APPROVER', $userRoles);

        $isSupportService = ($ticket->type_of_request ?? '') === 'Support Services';

        // NEW: Check if current user is the assigned employee
        $isAssignedEmployee = !empty($ticket->assigned_to) &&
            ($ticket->assigned_to == $employeeData['emp_id']);
        // dd($ticket->type_of_request);
        // dd($isSupport, $isSupportService, $isSeniorApprover);
        // OPEN (1)
        if ($status == 1) {
            if ($isRequestor && !$isSupportService) {
                $actions = ['View', 'Cancel'];
            } elseif ($isRequestor && $isSupport && $isSupportService) {
                $actions = ['Ongoing', 'Resolve', 'Cancel'];
            } elseif ($isSupport) {
                $actions = ['Ongoing', 'Resolve', 'Cancel'];
            } else {
                $actions = ['View'];
            }
        }

        // ONPROCESS (2)
        if ($status == 2) {
            if ($isSupport) {
                $actions = ['Ongoing', 'Resolve',];
            } else {
                $actions = ['View'];
            }
        }
        // ONGOING (3)
        if ($status == 3) {
            if ($isSupport) {
                $actions = ['Ongoing', 'Resolve',];
            } else {
                $actions = ['View'];
            }
        }

        // RESOLVED (4)
        if ($status == 4) {
            // Support staff can always view and manage assignments (even if already assigned)
            if ($isSupport && !$isAssignedEmployee&&!$isSupportService) {
                $actions = ['Assign']; // Support can view and reassign via drawer UI
                $actionLabel = 'Assignment'; // Special label to show assignment is available
            }
            // If someone is assigned, ONLY they can close (not original requestor)
            elseif (!empty($ticket->assigned_to)) {
                if ($isAssignedEmployee) {
                    $actions = ['Close', 'Return'];
                } else {
                    $actions = ['View'];
                }
            }
            // No assignment - use default logic
            else {
                if ($isRequestor && !$isSupportService) {
                    $actions = ['Close', 'Return'];
                } elseif ($isSupportService && $isSeniorApprover && !$isRequestor) {
                    $actions = ['Close', 'Return'];
                } else {
                    $actions = ['View'];
                }
            }
        }


        // RETURNED (6)
        if ($status == 6) {
            if ($isSupport) {
                $actions = ['Ongoing', 'Resolve',];
            } else {
                $actions = ['View'];
            }
        }


        // Determine action label
        if ($actions === ['View', 'Cancel'] || $actions === ['Close', 'Return']) {
            $actionLabel = 'Remarks';
        } elseif (in_array('Ongoing', $actions) || in_array('Resolve', $actions)) {
            $actionLabel = 'Assessment';
        }

        return [
            'actions' => $actions,
            'label' => $actionLabel,
        ];
    }


/**
 * Business logic: Build role-based access conditions
 */
private function buildRoleBasedConditions(array $employeeData): array
{
    $userId = $employeeData['emp_id'];
    $userRoles = $employeeData['emp_user_roles'] ?? [];

    $conditions = [];

    if (in_array('MIS_SUPERVISOR', $userRoles) || in_array('SUPPORT_TECHNICIAN', $userRoles) || in_array('OD', $userRoles)) {
        // Full access - no conditions needed
    } elseif (in_array('DEPARTMENT_HEAD', $userRoles)) {
        $approverEmployeeIds = $this->ticketRepository->getApproverIds($userId);
        if (!empty($approverEmployeeIds)) {
            // For dept heads with team: show team tickets OR tickets assigned to them
            $conditions['dept_head_access'] = [
                'user_id' => $userId,
                'approver_ids' => $approverEmployeeIds
            ];
        }
        // If no approver IDs, let applyUserFilters handle it (own tickets + assigned)
    }
    // Regular users: no conditions - applyUserFilters handles (own tickets + assigned)

    return $conditions;
}

    /**
     * Business validation for ticket data
     */
    private function validateTicketData(array $ticketData): void
    {
        $requiredFields = ['request_type', 'request_option', 'details'];
        foreach ($requiredFields as $field) {
            if (empty($ticketData[$field])) {
                throw new \InvalidArgumentException("Missing required field: {$field}");
            }
        }
    }

    public function getTicketDetails(string $ticketId, array $employeeData): ?array
    {
        $ticket = $this->ticketRepository->findTicketById($ticketId);
        if (!$ticket) return null;

        $actions = $this->determineTicketAction(
            $ticket,
            $ticket->status,
            $employeeData
        );

        $ticket->status_label = TicketStatusService::getStatusLabel($ticket);
        $ticket->status_color = TicketStatusService::getStatusColor($ticket);
        $ticket->action = $actions;
        $ticket->assigned_to_name = null;
        if (!empty($ticket->assigned_to)) {
            $assignedUser = User::find($ticket->assigned_to);
            $ticket->assigned_to_name = $assignedUser->EMPNAME ?? null;
        }
        return [
            'ticket'  => $ticket,
            'actions' => $actions,
        ];
    }

  public function getTicketLogs(string $ticketId, int $perPage = 5)
{
    $logs = $this->ticketRepository->getTicketLogs($ticketId, $perPage);

    $logs->getCollection()->transform(function ($log) {
        // Get the already converted labels from OLD_VALUES/NEW_VALUES
        $oldStatusLabel = $log['OLD_VALUES']['status'] ?? null;
        $newStatusLabel = $log['NEW_VALUES']['status'] ?? null;

        // Get colors using the original numeric IDs
        $log['OLD_STATUS_LABEL'] = $oldStatusLabel;
        $log['OLD_STATUS_COLOR'] = $log['OLD_STATUS_ID']
            ? TicketStatusService::getStatusColorById((int) $log['OLD_STATUS_ID'])
            : null;

        $log['NEW_STATUS_LABEL'] = $newStatusLabel;
        $log['NEW_STATUS_COLOR'] = $log['NEW_STATUS_ID']
            ? TicketStatusService::getStatusColorById((int) $log['NEW_STATUS_ID'])
            : null;

        // Clean up the temporary ID fields
        unset($log['OLD_STATUS_ID'], $log['NEW_STATUS_ID']);

        return $log;
    });

    return $logs;
}


    public function getAssignedApprovers(string $ticketId)
    {
        return $this->ticketRepository->getAssignedApprovers($ticketId);
    }

        /**
     * Process all tickets that need auto-closing
     * Returns array with summary of processed tickets
     */
    public function processAutoCloseTickets(): array
    {
        $tickets = $this->ticketRepository->findResolvedTicketsForAutoClose();
        $processed = 0;
        $failed = 0;
        $failedTickets = [];

        foreach ($tickets as $ticket) {
            try {
                $this->ticketRepository->updateTicketToAutoClosed($ticket);
                $processed++;
                Log::info("Auto-closed ticket: {$ticket->ticket_id}");
            } catch (\Exception $e) {
                $failed++;
                $failedTickets[] = $ticket->ticket_id;
                Log::error("Failed to auto-close ticket {$ticket->ticket_id}: " . $e->getMessage());
            }
        }

        return [
            'total_found' => $tickets->count(),
            'processed' => $processed,
            'failed' => $failed,
            'failed_tickets' => $failedTickets,
        ];
    }
}
