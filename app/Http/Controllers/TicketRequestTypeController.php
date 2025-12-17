<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TicketRequestTypeService;
use Inertia\Inertia;

class TicketRequestTypeController extends Controller
{
    protected TicketRequestTypeService $service;

    public function __construct(TicketRequestTypeService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        $requestTypes = $this->service->getAllForTable();
        return Inertia::render('Admin/RequestType', [
            'requestTypes' => $requestTypes
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'category' => 'required|string|max:255',
            'has_data' => 'boolean',
            'is_active' => 'boolean',
        ]);

        try {
            $requestType = $this->service->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Request type created successfully',
                'id' => $requestType->id,
                'data' => $requestType
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create request type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'category' => 'required|string|max:255',
            'has_data' => 'boolean',
            'is_active' => 'boolean',
        ]);

        try {
            $requestType = $this->service->update($id, $validated);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request type not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Request type updated successfully',
                'data' => $requestType
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update request type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $requestType = $this->service->findById($id);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request type not found'
                ], 404);
            }

            $deleted = $this->service->delete($id);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Request type deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete request type'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete request type: ' . $e->getMessage()
            ], 500);
        }
    }
}
