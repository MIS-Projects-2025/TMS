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
        // Get roles - handle both array and string cases
        $roles = $user['emp_user_roles'] ?? $user['emp_system_role'] ?? ['SUPPORT_TECHNICIAN'];
        
        // Ensure it's an array
        if (!is_array($roles)) {
            $roles = [$roles];
        }
        
        // Define manager-level roles
        $managerRoles = ['MIS_SUPERVISOR', 'supervisor', 'manager', 'admin'];
        
        // Check if user has any manager-level role
        $isSupervisorOrAbove = !empty(array_intersect($roles, $managerRoles));
        
        // If supervisor or above, show all data (userId = null)
        // Otherwise, filter by their specific emp_id
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
        ];
    }
}