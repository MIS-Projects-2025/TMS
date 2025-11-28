<?php

namespace App\Services;

use App\Repositories\UserRepository;

class UserRoleService
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Check if employee is a MIS Support or Network Technician
     */
    public function isMisSupport(array $empData): bool
    {
        $dept = strtoupper($empData['emp_dept'] ?? '');
        $jobTitle = strtolower($empData['emp_jobtitle'] ?? '');

        return $dept === 'MIS' && (
            str_contains($jobTitle, 'mis support technician') ||
            str_contains($jobTitle, 'network technician')
        );
    }

    /**
     * Check if employee is a MIS Supervisor
     */
    public function isMISSupervisor(array $empData): bool
    {
        $dept = strtoupper($empData['emp_dept'] ?? '');
        $jobTitle = strtolower($empData['emp_jobtitle'] ?? '');

        return $dept === 'MIS' && str_contains($jobTitle, 'supervisor');
    }

    /**
     * Check if employee is a Senior Approver
     */
    public function isSeniorApprover(array $empData): bool
    {
        $userId = $empData['emp_id'] ?? null;
        if (!$userId) return false;

        $seniorApproverIds = $this->userRepository->getSeniorApproverIds();
        return in_array($userId, $seniorApproverIds);
    }

    /**
     * Check if employee is Operations Director or in Operations
     */
    public function isODAccount(array $empData): bool
    {
        $dept = strtoupper($empData['emp_dept'] ?? '');
        $jobTitle = strtoupper($empData['emp_jobtitle'] ?? '');

        return $dept === 'OPERATIONS' || $jobTitle === 'OPERATIONS DIRECTOR';
    }

    /**
     * Check if employee is a Department Head (has approval rights in masterlist)
     */
    public function isDepartmentHead(array $empData): bool
    {
        $userId = $empData['emp_id'] ?? null;
        if (!$userId) return false;

        return $this->userRepository->isDepartmentHead($userId);
    }

    /**
     * Get all account types / roles for the employee
     */
    public function getUserAccountTypes(array $empData): array
    {
        $roles = [];

        if ($this->isMISSupervisor($empData)) {
            $roles[] = 'MIS_SUPERVISOR';
            $roles[] = 'SUPPORT_TECHNICIAN'; // Supervisor is also support
        } elseif ($this->isMisSupport($empData)) {
            $roles[] = 'SUPPORT_TECHNICIAN';
        }

        if ($this->isODAccount($empData)) {
            $roles[] = 'OD';
        }

        if ($this->isDepartmentHead($empData)) {
            $roles[] = 'DEPARTMENT_HEAD';
        }

        if ($this->isSeniorApprover($empData)) {
            $roles[] = 'SENIOR_APPROVER';
        }

        return $roles ?: ['UNKNOWN'];
    }

    /**
     * Helper: check if employee has a specific account type
     */
    public function hasRole(array $empData, string $role): bool
    {
        $roles = $this->getUserAccountTypes($empData);
        return in_array(strtoupper($role), $roles);
    }

    /**
     * Get all MIS support technicians and supervisors
     */
    public function getMISSupportUsers(): array
    {
        return $this->userRepository->getMISSupportUsers();
    }

    /**
     * Find a user by employee ID
     */
    public function findUserById(string $empId): ?object
    {
        return $this->userRepository->findUserById($empId);
    }
}
