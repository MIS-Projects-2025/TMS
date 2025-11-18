<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia; // ✅ Add this line
use App\Models\NotificationUser;

class AuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->query('key') ?? session('emp_data.token');

        // dd($request->all());
        if (!$token) {
            $redirectUrl = urlencode($request->fullUrl());
            return redirect("http://192.168.2.221/authify/public/login?redirect={$redirectUrl}");
        }
        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();


        // $isAdmin = DB::table('admin')
        //     ->where('emp_id', $currentUser->emp_id)
        //     ->first();

        session([
            'emp_data' => [
                'token' => $currentUser->token,
                'emp_id' => $currentUser->emp_id,
                'emp_name' => $currentUser->emp_name,
                'emp_firstname' => $currentUser->emp_firstname,
                'emp_jobtitle' => $currentUser->emp_jobtitle,
                'emp_dept' => $currentUser->emp_dept,
                'emp_prodline' => $currentUser->emp_prodline,
                'emp_station' => $currentUser->emp_station,
                'generated_at' => $currentUser->generated_at,
                // 'emp_system_role' => $isAdmin->emp_role ?? null,
            ]
        ]);

        return $next($request);
    }
}
