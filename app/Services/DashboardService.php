<?php

namespace App\Services;

use App\Repositories\TicketRepository;

class DashboardService
{
    protected $tickets;

    public function __construct(TicketRepository $tickets)
    {
        $this->tickets = $tickets;
    }

    public function getDashboardData(): array
    {
        return [
            'ticketsHandled' => $this->tickets->getTicketsHandledPerSupport(),
            'avgHandlingTime' => $this->tickets->getAverageHandlingTime(),
            'statusCounts' => $this->tickets->getStatusCounts(),
            'ticketsPerDay' => $this->tickets->getTicketsPerDay(),
        ];
    }
}
