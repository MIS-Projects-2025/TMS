<?php

namespace App\Services;

use App\Repositories\TicketRepository;
use App\Repositories\TicketRequestTypeRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class TicketService
{
    protected TicketRepository $ticketRepository;
    protected TicketRequestTypeRepository $requestTypeRepository;

    public function __construct(
        TicketRepository $ticketRepository,
        TicketRequestTypeRepository $requestTypeRepository
    ) {
        $this->ticketRepository = $ticketRepository;
        $this->requestTypeRepository = $requestTypeRepository;
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
        // Business validation
        $this->validateTicketData($ticketData);

        // Business logic: Generate ticket number
        $ticketId = $this->ticketRepository->generateTicketNumber();

        // Business logic: Prepare ticket structure
        $mainTicketData = [
            'ticket_id' => $ticketId,
            'employid' => $employeeData['emp_id'],
            'empname' => $employeeData['emp_name'],
            'department' => $employeeData['emp_dept'],
            'prodline' => $employeeData['emp_prodline'],
            'station' => $employeeData['emp_station'],
            'type_of_request' => $ticketData['request_type'],
            'request_option' => $ticketData['request_option'],
            'item_name' => $ticketData['item_name'],
            'details' => $ticketData['details'],
            'status' => 1, // Business rule: new tickets are open
            'created_at' => now(),
        ];

        // Business transaction
        return DB::transaction(function () use ($mainTicketData, $ticketId, $ticketData, $employeeData) {
            // Create ticket
            $ticket = $this->ticketRepository->createTicket($mainTicketData);

            // Business logic: Create audit trail
            $this->ticketRepository->createTicketLog([
                'ticket_id' => $ticketId,
                'action_type' => 'CREATED',
                'action_by' => $employeeData['emp_id'],
                'action_at' => now(),
                'remarks' => 'Ticket created by user',
                'metadata' => json_encode([
                    'form_data' => $ticketData,
                    'employee_data' => $employeeData
                ]),
            ]);

            return [
                'ticket' => $ticket,
                'ticket_id' => $ticketId
            ];
        });
    }

    public function getTicketsDataTable(array $filters, array $employeeData, array $userRoles): array
    {
        // Business logic: Apply role-based access control
        $whereConditions = $this->buildRoleBasedConditions($employeeData['emp_id'], $userRoles);

        // Get data from repository
        $tickets = $this->ticketRepository->getTicketsWithFilters($filters, $whereConditions);
        $statusCounts = $this->ticketRepository->getStatusCounts($whereConditions);

        // Business logic: Determine available actions for each ticket
        $ticketsData = $tickets->getCollection()->map(function ($ticket) use ($employeeData, $userRoles) {
            $status = $ticket->STATUS ?? $ticket->status;
            $ticket->action = $this->determineTicketAction($ticket, $status, $employeeData, $userRoles);
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

    public function ticketAction(string $ticketId, string $userId, string $actionType = 'RESOLVE'): bool
    {
        // Business validation
        if (!in_array(strtoupper($actionType), ['RESOLVE', 'CLOSE', 'RETURN'])) {
            throw new \InvalidArgumentException('Invalid action type');
        }

        return DB::transaction(function () use ($ticketId, $userId, $actionType) {
            // Find ticket
            $ticket = $this->ticketRepository->findTicketById($ticketId);
            if (!$ticket) {
                return false;
            }

            // Business logic: Determine new status
            $statusMap = ['RESOLVE' => 2, 'CLOSE' => 3, 'RETURN'  => 4,];
            $newStatus = $statusMap[strtoupper($actionType)];

            // Business logic: Update ticket
            $updateData = [
                'status' => $newStatus,
                'handled_by' => $userId,
                'handled_at' => now(),
            ];

            if (!$this->ticketRepository->updateTicket($ticket, $updateData)) {
                throw new \Exception('Failed to update ticket');
            }

            // Business logic: Create audit log
            $this->ticketRepository->createTicketLog([
                'ticket_id' => $ticket->ticket_id,
                'action_type' => strtoupper($actionType),
                'action_by' => $userId,
                'action_at' => now(),
                'remarks' => ucfirst(strtolower($actionType)) . ' by user',
                'metadata' => json_encode([
                    'ticket' => [
                        'id' => $ticket->id,
                        'request_type' => $ticket->type_of_request,
                        'request_option' => $ticket->request_option,
                        'item_name' => $ticket->item_name,
                        'details' => $ticket->details,
                    ],
                    'employee' => [
                        'id' => $ticket->employid,
                        'name' => $ticket->empname,
                        'department' => $ticket->department,
                        'station' => $ticket->station,
                        'prodline' => $ticket->prodline,
                    ]
                ]),
            ]);

            return true;
        });
    }

    /**
     * Business logic: Determine available action for a ticket
     */
    private function determineTicketAction($ticket, int $status, array $employeeData, array $userRoles): string
    {
        $action = 'View';

        // Requestor can Close if status = resolved
        if (($ticket->employid ?? null) == $employeeData['emp_id'] && $status == 2) {
            $action = 'Close';
        }
        // Support staff can Resolve if status = open or returned
        elseif (in_array('MIS_SUPERVISOR', $userRoles) || in_array('SUPPORT_TECHNICIAN', $userRoles)) {
            if ($status == 1 || $status == 4) {
                $action = 'Resolve';
            }
        }

        return $action;
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
}
