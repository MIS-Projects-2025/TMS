<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserRepository
{
    /**
     * Get all MIS support technicians and supervisors
     */
    public function getMISSupportUsers(): array
    {
        try {
            return DB::connection('masterlist')
                ->table('employee_masterlist')
                ->select('EMPLOYID as emp_id', 'EMPNAME as empname', 'JOB_TITLE')
                ->where('DEPARTMENT', 'MIS')
                ->where(function ($query) {
                    $query->whereRaw('LOWER(JOB_TITLE) LIKE ?', ['%mis support technician%'])
                        ->orWhere(function ($q) {
                            $q->whereRaw('LOWER(JOB_TITLE) LIKE ?', ['%mis%'])
                                ->whereRaw('LOWER(JOB_TITLE) LIKE ?', ['%supervisor%']);
                        })
                        ->orWhereRaw('LOWER(JOB_TITLE) LIKE ?', ['%network technician%']);
                })
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            Log::error("Failed to fetch MIS support members: " . $e->getMessage());
            return [];
        }
    }


    /**
     * Find a user by employee ID
     */
    public function findUserById(string $empId): ?object
    {
        try {
            return DB::connection('masterlist')
                ->table('employee_masterlist')
                ->select('EMPLOYID as emp_id', 'EMPNAME as empname', 'JOB_TITLE')
                ->where('EMPLOYID', $empId)
                ->first();
        } catch (\Exception $e) {
            Log::error("Failed to fetch user {$empId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get senior approver IDs
     */
    public function getSeniorApproverIds(): array
    {
        try {
            return DB::connection('mysql')
                ->table('senior_support_approver')
                ->pluck('EMPLOYID')
                ->toArray();
        } catch (\Exception $e) {
            Log::error("Failed to fetch senior approver IDs: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Check if user is a department head
     */
    public function isDepartmentHead(string $userId): bool
    {
        try {
            $result = DB::connection('masterlist')->select("
                SELECT COUNT(*) as count 
                FROM employee_masterlist 
                WHERE APPROVER2 = ? OR APPROVER3 = ?
            ", [$userId, $userId]);

            return ($result[0]->count ?? 0) > 0;
        } catch (\Exception $e) {
            Log::error("Failed to check department head status for user {$userId}: " . $e->getMessage());
            return false;
        }
    }
}
