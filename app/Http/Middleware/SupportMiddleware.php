<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SupportMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $empData = session('emp_data');

        // Check if user is logged in
        if (!$empData) {
            abort(403, 'Unauthorized: Please log in to access this page.');
        }

        // Get role
        $role = $empData['emp_system_role'] ?? null;

        // Allow only support or supervisor
        if (!in_array($role, ['support', 'supervisor'])) {
            // Redirect non-support users to Generate Ticket page
            return redirect()->route('tickets');
        }

        return $next($request);
    }
}
