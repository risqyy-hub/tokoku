<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
            return redirect()->intended(Auth::user()->isAdmin() ? route('dashboard') : (Auth::user()->isCustomer() ? route('shop.index') : route('pos.index')));
        }

        return Inertia::render('Auth/Login');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:25'],
            'address' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = DB::transaction(function () use ($validated): User {
            $validated['phone'] = isset($validated['phone']) ? mb_substr($validated['phone'], 0, 20) : null;
            $user = User::create([
                'name' => $validated['name'],
                'username' => $validated['username'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => 'user',
                'is_active' => true,
            ]);

            Pelanggan::create([
                'nama_pelanggan' => $validated['name'],
                'no_hp' => $validated['phone'] ?? null,
                'alamat' => $validated['address'],
                'email' => $validated['email'],
                'user_id' => $user->id,
            ]);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('shop.index')->with('success', 'Pendaftaran berhasil. Selamat berbelanja!');
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

            if (! in_array($user->role, ['admin', 'kasir', 'user'], true)) {
                Auth::logout();
                throw ValidationException::withMessages(['login' => 'Role akun tidak memiliki akses.']);
            }

            if (! $user->is_active) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'login' => 'Akun Anda sedang dinonaktifkan. Hubungi admin.',
                ]);
            }

            $request->session()->regenerate();

            $destination = $user->isAdmin() ? route('dashboard') : ($user->isCustomer() ? route('shop.index') : route('pos.index'));

            return redirect()->intended($destination)->with('success', "Selamat datang kembali, {$user->name}!");
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
