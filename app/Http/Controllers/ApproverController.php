<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ApproverService;
use Inertia\Inertia;

class ApproverController extends Controller
{
    protected ApproverService $approverService;

    public function __construct(ApproverService $approverService)
    {
        $this->approverService = $approverService;
    }
    public function index()
    {
        $approvers = $this->approverService->approverTable();
        $approverOptions = $this->approverService->getApproversOptions();
        return Inertia::render('Admin/ApproverList', [
            'approverList' => $approvers,
            'approverOptions' => $approverOptions
        ]);
    }
    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'employid' => 'required|integer',
            'empname' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'prodline' => 'required|string|max:255',
            'station' => 'required|string|max:255',
        ]);

        try {
            $requestType = $this->approverService->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Approver created successfully',
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
    public function destroy($id)
    {
        try {
            $requestType = $this->approverService->findById($id);

            if (!$requestType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Approver not found'
                ], 404);
            }

            $deleted = $this->approverService->delete($id);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Approver deleted successfully'
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete approver'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete approver: ' . $e->getMessage()
            ], 500);
        }
    }
}
