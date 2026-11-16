<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->is_active) {
            auth()->logout();

            return redirect()->route('login')->withErrors(['username' => 'Akun Anda dinonaktifkan. Silakan hubungi admin.']);
        }

        if (! empty($roles) && ! in_array($user->role, $roles, true)) {
            // If Kasir tries to access admin-only area, redirect to POS with warning
            if ($user->isKasir()) {
                return redirect()->route('pos.index')->with('error', 'Akses ditolak: Anda tidak memiliki hak akses ke halaman tersebut.');
            }

            abort(403, 'Akses Ditolak: Anda tidak memiliki izin untuk mengakses halaman ini.');
        }

        return $next($request);
    }
}
