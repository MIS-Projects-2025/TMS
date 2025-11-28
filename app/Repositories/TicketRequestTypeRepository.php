<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class TicketRequestTypeRepository
{
    /**
     * Get all request types grouped by category
     */
    public function getAllGrouped(): array
    {
        $types = DB::table('ticket_request_types')
            ->whereNot('category', 'Support Services')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        // Group by category
        $grouped = [];
        foreach ($types as $type) {
            $grouped[$type->category][] = [
                'name' => $type->name,
                'has_data' => (bool) $type->has_data,
            ];
        }

        return $grouped;
    }
    public function getMisRequestType(): array
    {
        $types = DB::table('ticket_request_types')
            ->where('category', 'Support Services')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        // Group by category
        $grouped = [];
        foreach ($types as $type) {
            $grouped[$type->category][] = [
                'name' => $type->name,
                'has_data' => (bool) $type->has_data,
            ];
        }

        return $grouped;
    }
    /**
     * Get request types with their options for form display
     */
    public function getRequestTypesForForm($userRoles): array
    {
        // If the user has MIS roles, get only MIS request types
        if (in_array('MIS_SUPERVISOR', $userRoles) || in_array('SUPPORT_TECHNICIAN', $userRoles)) {
            $grouped = $this->getMisRequestType(); // note: typo in your function name
        } else {
            $grouped = $this->getAllGrouped();
        }

        // Transform to the format expected by the frontend
        $formatted = [];
        foreach ($grouped as $category => $options) {
            $formatted[$category] = array_column($options, 'name');
        }

        return $formatted;
    }
}
