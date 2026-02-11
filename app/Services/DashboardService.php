<?php

namespace App\Services;

use App\Repositories\TicketDashboardRepository; 

class DashboardService
{
    protected $tickets;

    public function __construct(TicketDashboardRepository $tickets) 
    {
        $this->tickets = $tickets;
    }

    public function getDashboardData($user): array
    {
        $roles = $user['emp_user_roles'] ?? $user['emp_system_role'] ?? ['SUPPORT_TECHNICIAN'];

        if (!is_array($roles)) {
            $roles = [$roles];
        }

        $managerRoles = ['MIS_SUPERVISOR', 'supervisor', 'manager', 'admin'];
        $isSupervisorOrAbove = !empty(array_intersect($roles, $managerRoles));
        $userId = $isSupervisorOrAbove ? null : ($user['emp_id'] ?? null);

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
            'autoClosedTicketsChart' => $this->tickets->getAutoClosedTickets($userId),
            'autoClosedTicketsCount' => $this->tickets->getAutoClosedTicketsCount($userId),
        ];
    }
}