<?php

namespace App\Http\Controllers;

use App\Services\TicketService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\UserRoleService;

class TicketingController extends Controller
{
    protected TicketService $ticketService;
    protected UserRoleService $userRoleService;

    public function __construct(TicketService $ticketService, UserRoleService $userRoleService)
    {
        $this->ticketService = $ticketService;
        $this->userRoleService = $userRoleService;
    }

    /**
     * Show ticket creation form
     */
    public function showTicketForm(): Response
    {
        $formData = $this->ticketService->getTicketFormData();
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
        $empData = session('emp_data');
        if (!$empData) return redirect()->route('login');

        $userRoles = $this->userRoleService->getUserAccountType($empData);

        $filters = [
            'page' => (int) $request->input('page', 1),
            'pageSize' => (int) $request->input('pageSize', 10),
            'search' => trim($request->input('search', '')),
            'sortField' => $request->input('sortField', 'created_at'),
            'sortOrder' => $request->input('sortOrder', 'desc'),
            'status' => $request->input('status', 'open'),
            'project' => $request->input('project', ''),
        ];

        $result = $this->ticketService->getTicketsDataTable($filters, $empData, $userRoles);

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

        $userRoles = $this->userRoleService->getUserAccountType($empData);

        try {
            $ticketDetails = $this->ticketService->getTicketDetails($ticketId, $empData, $userRoles);

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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket details: ' . $e->getMessage()
            ], 500);
        }
    }

    public function ticketAction(Request $request)
    {
        // dd($request->all());
        $empData = session('emp_data');
        $ticketId = $request->input('ticket_id');
        $remarks = $request->input('remarks');
        $rating = $request->input('rating');
        $actionType = strtoupper($request->input('action'));
        $request->merge([
            'action' => $actionType
        ]);

        $request->validate([
            'ticket_id' => 'required|string',
            'action' => 'required|string|in:RESOLVE,CLOSE,RETURN,ONGOING,CANCEL',
            'remarks' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        try {
            $success = $this->ticketService->ticketAction($ticketId, $empData['emp_id'], $actionType, $remarks, $rating);

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
}
