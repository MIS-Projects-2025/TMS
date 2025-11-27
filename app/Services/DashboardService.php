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

    public function getDashboardData($user): array
    {
        // Determine if user is support or supervisor+
        $isSupervisorOrAbove = in_array($user['emp_system_role'] ?? 'support', ['supervisor', 'manager', 'admin']);
        $userId = $isSupervisorOrAbove ? null : ($user['emp_id'] ?? null);
        // dd($user['emp_system_role']);
        return [
            'responseTime' => $this->tickets->getResponseTime($userId),
            'ticketsPerDay' => $this->tickets->getTicketsPerDay($userId),
            'ticketsHandled' => $this->tickets->getTicketsHandled($userId),
            'closureRate' => $this->tickets->getClosureRate($userId),
            'issuesPerRequest' => $this->tickets->getIssuesPerRequest($userId),
            'optionsPerRequest' => $this->tickets->getOptionsPerRequest($userId),
            'avgResponseTimePerIssue' => $this->tickets->getAvgResponseTimePerIssue($userId),
            'paretoByType' => $this->tickets->getParetoByRequestType($userId),
            'avgRatingPerEmployee' => $this->tickets->getAvgRatingPerEmployee($userId),
        ];
    }
}
