<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class TicketRequestTypeRepository
{
    /**
     * Get all request types grouped by category (excluding Support Services)
     */
    public function getAllGrouped(): array
    {
        $types = DB::table('ticket_request_types')
            ->where('is_active', 1)
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

    /**
     * Get all request types as flat array for table display
     */
    public function getAllForTable()
    {
        return DB::table('ticket_request_types')
            ->select('id', 'name', 'category', 'is_active', 'has_data', 'created_at', 'updated_at')
            ->orderBy('category')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get MIS Support Services request types grouped by category
     */
    public function getMisRequestType(): array
    {
        $types = DB::table('ticket_request_types')
            ->where('is_active', 1)
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
            $grouped = $this->getMisRequestType();
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

    /**
     * Create a new request type
     */
    public function create(array $data): object
    {
        $id = DB::table('ticket_request_types')->insertGetId([
            'name' => $data['name'],
            'category' => $data['category'],
            'has_data' => $data['has_data'] ?? false,
            'is_active' => $data['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->findById($id);
    }

    /**
     * Update an existing request type
     */
    public function update(int $id, array $data): ?object
    {
        $updated = DB::table('ticket_request_types')
            ->where('id', $id)
            ->update([
                'name' => $data['name'],
                'category' => $data['category'],
                'has_data' => $data['has_data'] ?? false,
                'is_active' => $data['is_active'] ?? true,
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return null;
        }

        return $this->findById($id);
    }

    /**
     * Delete a request type
     */
    public function delete(int $id): bool
    {
        return DB::table('ticket_request_types')
            ->where('id', $id)
            ->delete() > 0;
    }

    /**
     * Find request type by ID
     */
    public function findById(int $id): ?object
    {
        return DB::table('ticket_request_types')
            ->where('id', $id)
            ->first();
    }
}
