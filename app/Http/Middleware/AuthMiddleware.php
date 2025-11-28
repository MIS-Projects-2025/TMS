<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\NotificationUser;

class AuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->query('key') ?? session('emp_data.token');

        // Redirect if no token
        if (!$token) {
            $redirectUrl = urlencode($request->fullUrl());
            return redirect("http://192.168.2.221/authify/public/login?redirect={$redirectUrl}");
        }

        // Fetch user if no session or a new key is passed
        if (!session()->has('emp_data') || $request->query('key')) {
            $currentUser = DB::connection('authify')
                ->table('authify.authify_sessions')
                ->where('token', $token)
                ->first();

            if (!$currentUser) {
                $redirectUrl = urlencode($request->fullUrl());
                return redirect("http://192.168.2.221/authify/public/login?redirect={$redirectUrl}");
            }

            // Assign system roles
            $systemRoles = [];

            // Supervisor
            if (stripos($currentUser->emp_jobtitle, 'MIS Senior Supervisor') !== false) {
                $systemRoles[] = 'supervisor';
            }

            // Support
            if (
                stripos($currentUser->emp_jobtitle, 'MIS Support Technician') !== false ||
                stripos($currentUser->emp_jobtitle, 'Network Technician') !== false ||
                stripos($currentUser->emp_jobtitle, 'Network') !== false
            ) {
                $systemRoles[] = 'support';
            }

            // Senior Approver
            $seniorApproverIds = DB::connection('mysql')
                ->table('senior_support_approver')
                ->pluck('EMPLOYID')
                ->toArray();

            if (in_array($currentUser->emp_id, $seniorApproverIds)) {
                $systemRoles[] = 'senior approver';
            }

            // Default role if none assigned
            if (empty($systemRoles)) {
                $systemRoles[] = 'N/A';
            }

            // Set session
            session(['emp_data' => [
                'token' => $currentUser->token,
                'emp_id' => $currentUser->emp_id,
                'emp_name' => $currentUser->emp_name,
                'emp_position' => $currentUser->emp_position,
                'emp_firstname' => $currentUser->emp_firstname,
                'emp_jobtitle' => $currentUser->emp_jobtitle,
                'emp_dept' => $currentUser->emp_dept,
                'emp_prodline' => $currentUser->emp_prodline,
                'emp_station' => $currentUser->emp_station,
                'generated_at' => $currentUser->generated_at,
                'emp_system_roles' => $systemRoles,
            ]]);

            // Ensure NotificationUser exists
            $user = NotificationUser::firstOrCreate(
                ['emp_id' => $currentUser->emp_id],
                [
                    'emp_name' => $currentUser->emp_name,
                    'emp_dept' => $currentUser->emp_dept,
                ]
            );

            // Set user for broadcasting
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
        }

        return $next($request);
    }
}
