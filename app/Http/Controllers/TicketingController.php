<?php

namespace App\Http\Controllers;

use App\Services\TicketService;
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
     *
     * @return Response
     */
    public function showTicketForm(): Response
    {
        $formData = $this->ticketService->getTicketFormData();

        return Inertia::render('Ticketing/Create', $formData);
    }
}
