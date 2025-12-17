<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\NotificationUser;

class AuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {

        // 1️⃣ Get token from query or session
        $tokenFromQuery   = $request->query('key');
        $tokenFromSession = session('emp_data.token');
        $tokenFromCookie  = $request->cookie('sso_token');
        $token = $tokenFromQuery ?? $tokenFromSession ?? $tokenFromCookie;

        // 2️⃣ No token → redirect to login
        if (!$token) {
            $redirectUrl = urlencode($request->fullUrl());
            return redirect("https://192.168.2.221/authify/public/login?redirect={$redirectUrl}");
        }

        // 3️⃣ Session exists and matches token → trust it
        if (session()->has('emp_data') && session('emp_data.token') === $token) {
            if ($tokenFromQuery) {
                return redirect($request->url());
            }
            return $next($request);
        }

        // 4️⃣ Fetch user from authify (only if session missing or token mismatch)
        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

        if (!$currentUser) {
            session()->forget('emp_data');
            setcookie('sso_token', '', time() - 3600, '/');
            $redirectUrl = urlencode($request->fullUrl());
            return redirect("https://192.168.2.221/authify/public/login?redirect={$redirectUrl}");
        }

        // 5️⃣ Assign system roles
        $systemRoles = [];
        $jobTitle = $currentUser->emp_jobtitle ?? '';

        if (stripos($jobTitle, 'MIS Senior Supervisor') !== false) {
            $systemRoles[] = 'supervisor';
        }

        if (
            stripos($jobTitle, 'MIS Support Technician') !== false ||
            stripos($jobTitle, 'Network Technician') !== false ||
            stripos($jobTitle, 'Network') !== false
        ) {
            $systemRoles[] = 'support';
        }

        $seniorApproverIds = DB::connection('mysql')
            ->table('senior_support_approver')
            ->pluck('EMPLOYID')
            ->toArray();

        if (in_array($currentUser->emp_id, $seniorApproverIds)) {
            $systemRoles[] = 'senior approver';
        }

        if (empty($systemRoles)) {
            $systemRoles[] = 'N/A';
        }

        // 6️⃣ Set Laravel session
        session()->put('emp_data', [
            'token'            => $currentUser->token,
            'emp_id'           => $currentUser->emp_id,
            'emp_name'         => $currentUser->emp_name,
            'emp_firstname'    => $currentUser->emp_firstname,
            'emp_position'     => $currentUser->emp_position ?? null,
            'emp_jobtitle'     => $currentUser->emp_jobtitle,
            'emp_dept'         => $currentUser->emp_dept,
            'emp_prodline'     => $currentUser->emp_prodline ?? null,
            'emp_station'      => $currentUser->emp_station ?? null,
            'generated_at'     => $currentUser->generated_at,
            'emp_system_roles' => $systemRoles,
        ]);

        // 7️⃣ Ensure NotificationUser exists
        $user = NotificationUser::firstOrCreate(
            ['emp_id' => $currentUser->emp_id],
            [
                'emp_name' => $currentUser->emp_name,
                'emp_dept' => $currentUser->emp_dept,
            ]
        );

        // 8️⃣ Set user resolver for broadcasting
        $request->setUserResolver(fn() => $user);

        // 9️⃣ Remove key from URL after successful auth
        if ($tokenFromQuery) {
            return redirect($request->url());
        }

        return $next($request);
    }
}
