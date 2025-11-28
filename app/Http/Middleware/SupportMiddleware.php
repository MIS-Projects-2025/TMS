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

        // Get roles (array)
        $roles = $empData['emp_system_roles'] ?? [];

        // Allowed roles
        $allowedRoles = ['support', 'supervisor', 'senior approver'];

        // Check if user has at least one allowed role
        if (!array_intersect($roles, $allowedRoles)) {
            // Redirect non-allowed users to Generate Ticket page
            return redirect()->route('tickets');
        }

        return $next($request);
    }
}
