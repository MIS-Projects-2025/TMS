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
            $users = DB::connection('masterlist')
                ->table('employee_masterlist')
                ->select('EMPLOYID as emp_id', 'EMPNAME as empname', 'JOB_TITLE')
                ->where('DEPARTMENT', 'MIS')
                ->where(function ($query) {
                    $query->whereRaw('LOWER(JOB_TITLE) LIKE ?', ['%mis support technician%'])
                        ->orWhere(function ($q) {
                            $q->whereRaw('LOWER(JOB_TITLE) LIKE ?', ['%mis%'])
                                ->whereRaw('LOWER(JOB_TITLE) LIKE ?', ['%supervisor%']);
                        });
                })
                ->get();

            return $users->toArray();
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
}
