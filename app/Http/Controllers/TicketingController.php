<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Services\TicketService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\UserRoleService;
use Illuminate\Http\Resources\Json\JsonResource;
use Symfony\Component\HttpFoundation\JsonResponse;

class TicketingController extends Controller
{
    protected TicketService $ticketService;
    protected UserRoleService $userRoleService;
    protected NotificationService $notificationService;

    public function __construct(
        TicketService $ticketService,
        UserRoleService $userRoleService,
        NotificationService $notificationService
    ) {
        $this->ticketService = $ticketService;
        $this->userRoleService = $userRoleService;
        $this->notificationService = $notificationService;
    }

    /**
     * Show ticket creation form
     */
    public function showTicketForm(): Response
    {
        $empData = session('emp_data');
        $userRoles = $empData['emp_user_roles'] ?? [];
        $formData = $this->ticketService->getTicketFormData($userRoles);
        return Inertia::render('Ticketing/Create', $formData);
    }

    /**
     * Store new ticket
     */
    public function storeTicket(Request $request)
    {
        $request->validate([
            'request_type' => 'required|string',
            'request_option' => 'required|string',
            'details' => 'required|string',
            'item_name' => 'nullable|string',
            'custom_input' => 'nullable|string',
        ]);

        try {
            $ticketData = $request->only([
                'request_type',
                'request_option',
                'details',
                'item_name',
                'custom_input'
            ]);

            $empData = session('emp_data');
            $employeeData = [
                'emp_id' => $empData['emp_id'] ?? 'Unknown',
                'emp_name' => $empData['emp_name'] ?? 'Unknown',
                'emp_dept' => $empData['emp_dept'] ?? 'Unknown',
                'emp_prodline' => $empData['emp_prodline'] ?? 'Unknown',
                'emp_station' => $empData['emp_station'] ?? 'Unknown',
            ];

            // Create the ticket
            $result = $this->ticketService->createTicket($ticketData, $employeeData);


            return response()->json([
                'success' => true,
                'ticket_id' => $result['ticket_id'],
                'message' => 'Ticket created successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getTicketsDataTable(Request $request)
    {
        $filters = $this->decodeFilters($request->input('f', ''));
        $empData = session('emp_data');
        if (!$empData) return redirect()->route('login');

        // dd($filters);
        $result = $this->ticketService->getTicketsDataTable($filters, $empData);

        return Inertia::render('Ticketing/Table', [
            'tickets' => $result['tickets'],
            'pagination' => $result['pagination'],
            'statusCounts' => $result['statusCounts'],
            'filters' => $result['filters'],
        ])->with('flash', ['message' => 'Tickets loaded successfully']);
    }


    public function getTicketDetails(Request $request, string $ticketId)
    {
        $empData = session('emp_data');
        if (!$empData) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        try {
            $ticketDetails = $this->ticketService
                ->getTicketDetails($ticketId, $empData, $empData['emp_user_roles'] ?? []);

            if (!$ticketDetails) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $ticketDetails
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket details'
            ], 500);
        }
    }

    public function logs(string $ticketId)
    {
        $logs = $this->ticketService->getTicketLogs($ticketId, 5);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'has_more'     => $logs->hasMorePages(),
            ],
        ]);
    }

    public function ticketAction(Request $request)
    {

        $empData = session('emp_data');
        $ticketId = $request->input('ticket_id');
        $remarks = $request->input('remarks');
        $rating = $request->input('rating');
        $assignedEmployee = $request->input('assigned_to');
        $actionType = strtoupper($request->input('action'));

        $request->merge([
            'action' => $actionType
        ]);

        $request->validate([
            'ticket_id' => 'required|string',
            'action' => 'required|string|in:RESOLVE,CLOSE,RETURN,ONGOING,CANCEL,ONPROCESS,ASSIGN',
            'remarks' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'assignedEmployee' => 'nullable|string',
        ]);

        try {
            $success = $this->ticketService->ticketAction($ticketId, $empData['emp_id'], $actionType, $remarks, $rating, $assignedEmployee);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => "Ticket {$actionType} successfully."
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => "Ticket not found."
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ticket: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getAssignedApprovers(string $ticketId): JsonResponse
    {
        try {
            $approvers = $this->ticketService->getAssignedApprovers($ticketId);

            return response()->json([
                'success' => true,
                'data' => $approvers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $e->getMessage() === 'Ticket not found' ? 404 : 500);
        }
    }
    private function decodeFilters(string $encodedFilters): array
    {
        if (empty($encodedFilters)) {
            return [];
        }

        try {
            $decoded = base64_decode($encodedFilters, true);

            if ($decoded === false) {
                return [];
            }

            $filters = json_decode($decoded, true);

            return is_array($filters) ? $filters : [];
        } catch (\Exception $e) {
            return [];
        }
    }
}
