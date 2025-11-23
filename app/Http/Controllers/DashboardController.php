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
        $data = $this->dash->getDashboardData();

        return Inertia::render('Dashboard', [
            'dashboard' => $data
        ]);
    }
}
