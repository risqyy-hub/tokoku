<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Show the login page.
     */
    public function showLoginForm(): Response
    {
        if (Auth::check()) {
            return Auth::user()->isAdmin()
                ? redirect()->intended(route('dashboard'))
                : redirect()->intended(route('pos.index'));
        }

        return Inertia::render('Auth/Login');
    }

    /**
     * Handle login submission.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'login.required' => 'Username atau email wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        $loginField = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $attemptCredentials = [
            $loginField => $credentials['login'],
            'password' => $credentials['password'],
        ];

        $remember = $request->boolean('remember');

        if (Auth::attempt($attemptCredentials, $remember)) {
            $user = Auth::user();

            if (! $user->is_active) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'login' => 'Akun Anda sedang dinonaktifkan. Hubungi admin.',
                ]);
            }

            $request->session()->regenerate();

            if ($user->isAdmin()) {
                return redirect()->intended(route('dashboard'))->with('success', "Selamat datang kembali, {$user->name}!");
            }

            return redirect()->intended(route('pos.index'))->with('success', "Selamat bertugas di POS, {$user->name}!");
        }

        throw ValidationException::withMessages([
            'login' => 'Kombinasi username/email dan password tidak sesuai.',
        ]);
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('info', 'Anda telah berhasil logout.');
    }
}
