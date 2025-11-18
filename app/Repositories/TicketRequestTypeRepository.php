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
    public function getRequestTypesForForm(): array
    {
        $grouped = $this->getAllGrouped();

        // Transform to the format expected by the frontend
        $formatted = [];
        foreach ($grouped as $category => $options) {
            $formatted[$category] = array_column($options, 'name');
        }

        return $formatted;
    }
}
