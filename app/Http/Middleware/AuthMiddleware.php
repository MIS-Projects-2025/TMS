<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Models\NotificationUser;
use App\Services\UserRoleService;

class AuthMiddleware
{
    protected UserRoleService $userRoleService;

    public function __construct(UserRoleService $userRoleService)
    {
        $this->userRoleService = $userRoleService;
    }

    public function handle(Request $request, Closure $next)
    {
         $cookieName = env('SSO_COOKIE_NAME', 'sso_token');

        // 1️⃣ Get token sources (priority: query → cookie → session)
        $tokenFromQuery   = $request->query('key');
        $tokenFromCookie  = $request->cookie($cookieName);
        $tokenFromSession = session('emp_data.token');

        $token = $tokenFromQuery ?? $tokenFromCookie ?? $tokenFromSession;

        Log::info('AuthMiddleware token check', [
            'query'   => $tokenFromQuery,
            'cookie'  => $tokenFromCookie,
            'session' => $tokenFromSession,
            'used'    => $token,
        ]);

        // 🔹 2️⃣ No token → redirect to login
        if (!$token) {
            return $this->redirectToLogin($request);
        }

         // 3️⃣ Session already exists AND token matches → verify DB then trust it
        if (session()->has('emp_data') && session('emp_data.token') === $token) {
            // Clean URL if token came from query
            if ($tokenFromQuery) {
                $cookie = cookie($cookieName, $token, 60 * 24 * 7);
                return redirect($request->url())->withCookie($cookie);
            }

            return $next($request);
        }

        // 🔹 4️⃣ Fetch user from authify if session missing or token mismatch
        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

       
        if (!$currentUser) {
            session()->forget('emp_data');
            // Clear this system's own cookie only
            $expiredCookie = cookie()->forget($cookieName);
            return $this->redirectToLogin($request)->withCookie($expiredCookie);
        }


        // 🔹 5️⃣ Access control
    $canAccess = empty($currentUser->emp_from);

        if (!$canAccess) {
            session()->forget('emp_data');
            session()->flush();
            $redirectUrl = urlencode(route('dashboard'));
            $authifyUrl  = "http://192.168.2.221:8200/logout?redirect={$redirectUrl}";

            return Inertia::render('Unauthorized', [
                'logoutUrl' => $authifyUrl,
                'message'   => 'Access Restricted: You do not have permission to access this app.',
            ])->toResponse($request)->setStatusCode(403);
        }

        // 🔹 6️⃣ Determine system roles
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

        // 🔹 7️⃣ Determine user roles via UserRoleService
        $userRoles = $this->userRoleService->getUserAccountTypes((array) $currentUser);

        Log::info('User roles fetched', ['emp_id' => $currentUser->emp_id]);

        // 🔹 8️⃣ Set session
        session(['emp_data' => [
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
            'emp_user_roles'   => $userRoles,
        ]]);

        session()->save();

        // 🔹 9️⃣ Create or update notification user
        $user = NotificationUser::firstOrCreate(
            ['emp_id' => $currentUser->emp_id],
            ['emp_name' => $currentUser->emp_name, 'emp_dept' => $currentUser->emp_dept]
        );

        $request->setUserResolver(fn() => $user);

         $cookie = cookie($cookieName, $currentUser->token, 60 * 24 * 7);

        // 🔹 🔟 Redirect once if token came from query
        if ($tokenFromQuery) {
            $url = $request->url();
            $query = $request->query();
            unset($query['key']);
            if (!empty($query)) {
                $url .= '?' . http_build_query($query);
            }
            return redirect($url)->withCookie($cookie);
        }

        // 🔹 1️⃣1️⃣ Continue request and attach cookie
        return $next($request)->withCookie($cookie);
    }

    private function redirectToLogin(Request $request)
    {
        $redirectUrl = urlencode($request->fullUrl());
        return redirect("http://192.168.2.221:8200/login?redirect={$redirectUrl}");
    }
}

// namespace App\Http\Middleware;

// use Closure;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
// use Inertia\Inertia;
// use App\Models\NotificationUser;
// use App\Services\UserRoleService;

// class AuthMiddleware
// {
//     protected UserRoleService $userRoleService;

//     public function __construct(UserRoleService $userRoleService)
//     {
//         $this->userRoleService = $userRoleService;
//     }

//     public function handle(Request $request, Closure $next)
//     {
//         // 🔹 1️⃣ Get token from query, session, or cookie
//         $tokenFromQuery   = $request->query('key');
//         $tokenFromSession = session('emp_data.token');
//         $tokenFromCookie  = $request->cookie('sso_token');
//         $token = $tokenFromQuery ?? $tokenFromSession ?? $tokenFromCookie;

//         Log::info('AuthMiddleware token check', [
//             'query'   => $tokenFromQuery,
//             'cookie'  => $tokenFromCookie,
//             'session' => $tokenFromSession,
//             'used'    => $token,
//         ]);

//         // 🔹 2️⃣ No token → redirect to login
//         if (!$token) {
//             return $this->redirectToLogin($request);
//         }

//         // 🔹 3️⃣ Session exists and token matches → continue
//         if (session()->has('emp_data') && session('emp_data.token') === $token) {
//             // Remove ?key if present
//             if ($tokenFromQuery) {
//                 $url = $request->url();
//                 return redirect($url)->withCookie(cookie('sso_token', $token, 60 * 24 * 7));
//             }
//             return $next($request);
//         }

//         // 🔹 4️⃣ Fetch user from authify if session missing or token mismatch
//         $currentUser = DB::connection('authify')
//             ->table('authify_sessions')
//             ->where('token', $token)
//             ->first();

//         if (!$currentUser) {
//             session()->forget('emp_data');
//             setcookie('sso_token', '', time() - 3600, '/');
//             return $this->redirectToLogin($request);
//         }
//   $canAccess = $currentUser->emp_from == NULL;
//         if (!$canAccess) {
//             session()->forget('emp_data');
//             session()->flush();
//             $redirectUrl = urlencode(route('dashboard'));
//             $authifyUrl = "http://192.168.2.221:8200/authify/public/logout?redirect={$redirectUrl}";
//             return Inertia::render('Unauthorized', [
//                 'logoutUrl' => $authifyUrl,
//                 'message' => 'Access Restricted: You do not have permission to access this app.',
//             ])->toResponse($request)->setStatusCode(403);
//         }
//         // 🔹 5️⃣ Determine system roles
//         $systemRoles = [];
//         $jobTitle = $currentUser->emp_jobtitle ?? '';

//         if (stripos($jobTitle, 'MIS Senior Supervisor') !== false) {
//             $systemRoles[] = 'supervisor';
//         }

//         if (
//             stripos($jobTitle, 'MIS Support Technician') !== false ||
//             stripos($jobTitle, 'Network Technician') !== false ||
//             stripos($jobTitle, 'Network') !== false
//         ) {
//             $systemRoles[] = 'support';
//         }

//         $seniorApproverIds = DB::connection('mysql')
//             ->table('senior_support_approver')
//             ->pluck('EMPLOYID')
//             ->toArray();

//         if (in_array($currentUser->emp_id, $seniorApproverIds)) {
//             $systemRoles[] = 'senior approver';
//         }

//         // 🔹 6️⃣ Determine user roles via UserRoleService
//         $userRoles = $this->userRoleService->getUserAccountTypes((array)$currentUser);

//         // 🔹 7️⃣ Set Laravel session with roles
//         session(['emp_data' => [
//             'token'            => $currentUser->token,
//             'emp_id'           => $currentUser->emp_id,
//             'emp_name'         => $currentUser->emp_name,
//             'emp_firstname'    => $currentUser->emp_firstname,
//             'emp_position'     => $currentUser->emp_position ?? null,
//             'emp_jobtitle'     => $currentUser->emp_jobtitle,
//             'emp_dept'         => $currentUser->emp_dept,
//             'emp_prodline'     => $currentUser->emp_prodline ?? null,
//             'emp_station'      => $currentUser->emp_station ?? null,
//             'generated_at'     => $currentUser->generated_at,
//             'emp_system_roles' => $systemRoles,
//             'emp_user_roles'   => $userRoles,
//         ]]);

//         // ✅ Force session to save immediately
//         session()->save();

//         // 🔹 8️⃣ Set sso_token cookie for 7 days
//         $cookie = cookie('sso_token', $currentUser->token, 60 * 24 * 7);

//         // 🔹 9️⃣ Ensure NotificationUser exists
//         $user = NotificationUser::firstOrCreate(
//             ['emp_id' => $currentUser->emp_id],
//             [
//                 'emp_name' => $currentUser->emp_name,
//                 'emp_dept' => $currentUser->emp_dept,
//             ]
//         );

//         $request->setUserResolver(fn() => $user);

//         // 🔹 🔟 Remove ?key from URL after first login
//         if ($tokenFromQuery) {
//             $url = $request->url();
//             $query = $request->query();
//             unset($query['key']);
//             if (!empty($query)) {
//                 $url .= '?' . http_build_query($query);
//             }
//             return redirect($url)->withCookie($cookie);
//         }

//         // 🔹 1️⃣1️⃣ Continue request and attach cookie
//         $response = $next($request);
//         return $response->withCookie($cookie);
//     }

//     private function redirectToLogin(Request $request)
//     {
//         $redirectUrl = urlencode($request->fullUrl());
//         return redirect("http://192.168.2.221:8200/authify/public/login?redirect={$redirectUrl}");
//     }
// }
