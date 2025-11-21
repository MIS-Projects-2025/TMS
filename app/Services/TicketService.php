<?php

namespace App\Services;

use App\Repositories\TicketRepository;
use App\Repositories\TicketRequestTypeRepository;
use App\Services\TicketStatusService;
use App\Services\UserRoleService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use App\Repositories\UserRepository;

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


    public function getTicketFormData(): array
    {
        return [
            'request_types' => $this->requestTypeRepository->getRequestTypesForForm(),
            'hardware_options' => [
                'Desktop' => $this->ticketRepository->getDesktopNames(),
                'Laptop' => $this->ticketRepository->getLaptopNames(),
                'Server' => $this->ticketRepository->getServerNames(),
                'E-Learn Thin Client' => $this->ticketRepository->getELearnThinClientNames(),
            ],
            'printer_options' => [
                'Consigned Printer' => $this->ticketRepository->getConsignedPrinterNames(),
                'Honeywell Printer' => $this->ticketRepository->getHoneywellPrinterNames(),
                'Zebra Printer' => $this->ticketRepository->getZebraPrinterNames(),
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

            // Log creation
            $this->ticketRepository->createTicketLog([
                'ticket_id' => $ticketId,
                'action_type' => 'CREATED',
                'action_by' => $employeeData['emp_id'],
                'action_at' => now(),
                'remarks' => 'Ticket created by user',
                'metadata' => json_encode(['form_data' => $ticketData, 'employee_data' => $employeeData]),
            ]);

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

    public function getTicketsDataTable(array $filters, array $employeeData, array $userRoles): array
    {
        // Business logic: Apply role-based access control
        $whereConditions = $this->buildRoleBasedConditions($employeeData['emp_id'], $userRoles);

        // Get data from repository
        $tickets = $this->ticketRepository->getTicketsWithFilters($filters, $whereConditions);
        $statusCounts = $this->ticketRepository->getStatusCounts($whereConditions);

        $ticketsData = $tickets->getCollection()->map(function ($ticket) use ($employeeData, $userRoles) {
            $status = $ticket->STATUS ?? $ticket->status;
            $ticket->action = $this->determineTicketAction($ticket, $status, $employeeData, $userRoles);
            $ticket->status_label = TicketStatusService::getStatusLabel($ticket);
            $ticket->status_color = TicketStatusService::getStatusColor($ticket);

            // map handled_by_name
            $ticket->handled_by_name = $ticket->handler->EMPNAME ?? 'N/A';
            $ticket->closed_by_name   = $ticket->closer->EMPNAME ?? 'N/A';

            // remove full object
            unset($ticket->handler);

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
        ?int $rating = null
    ): bool {
        $actionType = strtoupper($actionType);
        if (!in_array($actionType, ['RESOLVE', 'CLOSE', 'RETURN', 'ONGOING', 'CANCEL'])) {
            throw new \InvalidArgumentException('Invalid action type');
        }

        return DB::transaction(function () use ($ticketId, $userId, $actionType, $remarks, $rating) {

            $ticket = $this->ticketRepository->findTicketById($ticketId);
            if (!$ticket) return false;

            $oldStatus = $ticket->status;

            $statusMap = [
                'ONGOING' => 2,
                'RESOLVE' => 3,
                'CLOSE' => 4,
                'RETURN' => 5,
                'CANCEL' => 6
            ];
            $newStatus = $statusMap[$actionType];

            $updateData = ['status' => $newStatus];
            if ($actionType === 'RESOLVE') {
                $updateData['handled_by'] = $userId;
                $updateData['handled_at'] = now();
            }
            if ($actionType === 'CLOSE') {
                $updateData['closed_by'] = $userId;
                $updateData['closed_at'] = now();
                if (!is_null($rating)) $updateData['rating'] = $rating;
            }

            $this->ticketRepository->updateTicket($ticket, $updateData);

            // Log action
            $logRemarks = $remarks ?: ucfirst(strtolower($actionType)) . ' by user';
            $this->ticketRepository->createTicketLog([
                'ticket_id' => $ticket->ticket_id,
                'action_type' => $actionType,
                'action_by' => $userId,
                'action_at' => now(),
                'remarks' => $logRemarks,
                'metadata' => json_encode([
                    'ticket' => [
                        'id' => $ticket->id,
                        'request_type' => $ticket->type_of_request,
                        'request_option' => $ticket->request_option,
                        'item_name' => $ticket->item_name,
                        'details' => $ticket->details,
                    ],
                    'status_change' => ['old_status' => $oldStatus, 'new_status' => $newStatus]
                ]),
            ]);

            // Get the actual actor's name
            $actorUser = $this->userRepo->findUserById($userId);
            $actorData = [
                'emp_id' => $userId,
                'name' => $actorUser->empname ?? 'Unknown'
            ];

            // Send notification — recipients determined inside NotificationService
            $this->notificationService->notifyTicketAction($ticket, $actionType, $actorData);

            return true;
        });
    }


    /**
     * Business logic: Determine available action for a ticket
     */
    private function determineTicketAction($ticket, int $status, array $employeeData, array $userRoles): array
    {
        $actions = ['View'];
        $actionLabel = 'Remarks'; // default

        $isRequestor = (($ticket->employid ?? null) == $employeeData['emp_id']);
        $isSupport = in_array('MIS_SUPERVISOR', $userRoles) ||
            in_array('SUPPORT_TECHNICIAN', $userRoles);

        // OPEN (1)
        if ($status == 1) {
            if ($isRequestor) {
                $actions = ['View', 'Cancel'];
            } elseif ($isSupport) {
                $actions = ['Ongoing', 'Resolve', 'Cancel'];
            } else {
                $actions = ['View'];
            }
        }

        // ONGOING (2)
        if ($status == 2) {
            if ($isSupport) {
                $actions = ['Resolve', 'Cancel'];
            } else {
                $actions = ['View'];
            }
        }

        // RESOLVED (3)
        if ($status == 3) {
            if ($isRequestor) {
                $actions = ['Close', 'Return'];
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
    private function buildRoleBasedConditions(string $userId, array $userRoles): array
    {
        $conditions = [];

        if (in_array('MIS_SUPERVISOR', $userRoles) || in_array('SUPPORT_TECHNICIAN', $userRoles) || in_array('OD', $userRoles)) {
            // Full access - no conditions needed
        } elseif (in_array('DEPARTMENT_HEAD', $userRoles)) {
            $approverEmployeeIds = $this->ticketRepository->getApproverIds($userId);
            if (!empty($approverEmployeeIds)) {
                $conditions[] = ['employid', 'IN', $approverEmployeeIds];
            } else {
                $conditions[] = ['employid', '=', $userId];
            }
        } else {
            // Regular user - only their own tickets
            $conditions[] = ['employid', '=', $userId];
        }

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

    public function getTicketDetails(string $ticketId, array $employeeData, array $userRoles): ?array
    {
        // Fetch the ticket
        $ticket = $this->ticketRepository->findTicketById($ticketId);
        if (!$ticket) {
            return null;
        }

        // Get ticket logs (includes old/new status in metadata)
        $logs = $this->ticketRepository->getTicketLogs($ticketId);

        // Determine available actions
        $status = $ticket->status;
        $actions = $this->determineTicketAction($ticket, $status, $employeeData, $userRoles);

        // Add status labels and colors to the ticket itself
        $ticket->status_label = TicketStatusService::getStatusLabel($ticket);
        $ticket->status_color = TicketStatusService::getStatusColor($ticket);
        $ticket->action = $actions;

        // Add labels/colors for old/new status in each log
        $logs = $logs->map(function ($log) {
            $log['OLD_STATUS_LABEL'] = $log['OLD_STATUS'] !== null
                ? TicketStatusService::getStatusLabelById($log['OLD_STATUS'])
                : null;
            $log['OLD_STATUS_COLOR'] = $log['OLD_STATUS'] !== null
                ? TicketStatusService::getStatusColorById($log['OLD_STATUS'])
                : null;

            $log['NEW_STATUS_LABEL'] = $log['NEW_STATUS'] !== null
                ? TicketStatusService::getStatusLabelById($log['NEW_STATUS'])
                : null;
            $log['NEW_STATUS_COLOR'] = $log['NEW_STATUS'] !== null
                ? TicketStatusService::getStatusColorById($log['NEW_STATUS'])
                : null;

            return $log;
        });

        return [
            'ticket' => $ticket,
            'logs' => $logs,
            'actions' => $actions,
        ];
    }
}
