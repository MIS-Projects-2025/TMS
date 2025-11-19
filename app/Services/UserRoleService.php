<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class UserRoleService
{
    public function getMisSupports($empData)
    {
        $dept = strtoupper($empData['emp_dept']);
        $jobTitle = strtolower($empData['emp_jobtitle']);

        return $dept === 'MIS' &&
            (
                strpos($jobTitle, 'mis support technician') !== false ||
                (strpos($jobTitle, 'mis') !== false && strpos($jobTitle, 'supervisor') !== false)
            );
    }

    public function isDepartmentHead($empData)
    {
        $userId = $empData['emp_id'];
        $hasApprovalRights = DB::connection('masterlist')->select("
            SELECT COUNT(*) as count FROM employee_masterlist 
            WHERE (APPROVER2 = ? OR APPROVER3 = ?)
        ", [$userId, $userId]);

        return $hasApprovalRights[0]->count > 0;
    }

    public function isODAccount($empData)
    {
        return strtoupper($empData['emp_dept']) === 'OPERATIONS' ||
            strtoupper($empData['emp_jobtitle']) === 'OPERATIONS DIRECTOR';
    }

    public function isMISSupervisor($empData)
    {
        return strtoupper($empData['emp_dept']) === 'MIS' &&
            stripos($empData['emp_jobtitle'], 'supervisor') !== false;
    }

    public function getUserAccountType($empData)
    {
        $roles = [];

        if ($this->isMISSupervisor($empData)) {
            $roles[] = 'MIS_SUPERVISOR';
            $roles[] = 'SUPPORT_TECHNICIAN';
        } elseif ($this->getMisSupports($empData)) {
            $roles[] = 'SUPPORT_TECHNICIAN';
        }

        if ($this->isODAccount($empData)) {
            $roles[] = 'OD';
        }

        if ($this->isDepartmentHead($empData)) {
            $roles[] = 'DEPARTMENT_HEAD';
        }

        return $roles ?: ['UNKNOWN'];
    }
}
