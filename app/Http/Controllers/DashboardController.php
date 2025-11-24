<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\DashboardService;

class DashboardController extends Controller
{
    protected $dash;

    public function __construct(DashboardService $dash)
    {
        $this->dash = $dash;
    }

    public function index(Request $request)
    {
        $user = session('emp_data');
        $data = $this->dash->getDashboardData($user);

        return Inertia::render('Dashboard', [
            'dashboard' => $data,
            'userRole' => $user['emp_system_role'] ?? 'support'
        ]);
    }
}
