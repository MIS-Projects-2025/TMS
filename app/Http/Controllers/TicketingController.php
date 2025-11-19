<?php

namespace App\Http\Controllers;

use App\Services\TicketService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketingController extends Controller
{
    protected TicketService $ticketService;

    public function __construct(TicketService $ticketService)
    {
        $this->ticketService = $ticketService;
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
            // Get employee data (you might need to adjust this based on your auth)
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
}
