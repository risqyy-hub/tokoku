<?php

namespace App\Http\Controllers;

use App\Models\LogAktivitas;
use App\Models\Pelanggan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PenggunaController extends Controller
{
    /**
     * Display listing of application users.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $role = $request->input('role');

        $users = User::query()
            ->whereIn('role', ['admin', 'kasir'])
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role && in_array($role, ['admin', 'kasir'], true), function ($q) use ($role) {
                $q->where('role', $role);
            })
            ->orderBy('id', 'asc')
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'totalUsers' => User::whereIn('role', ['admin', 'kasir'])->count(),
            'totalAdmin' => User::where('role', 'admin')->count(),
            'totalKasir' => User::where('role', 'kasir')->count(),
            'totalPelanggan' => Pelanggan::whereNotNull('user_id')->count(),
            'totalAktif' => User::where('is_active', true)->count(),
        ];

        return Inertia::render('Pengguna/Index', [
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
        ]);
    }

    /**
     * Store new user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:admin,kasir'],
            'phone' => ['nullable', 'string', 'max:25'],
            'is_active' => ['boolean'],
        ], [
            'username.unique' => 'Username sudah digunakan oleh akun lain.',
            'email.unique' => 'Email sudah terdaftar.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $request->boolean('is_active', true);

        $user = User::create($validated);

        LogAktivitas::catat(
            'TAMBAH PENGGUNA',
            'users',
            "Menambahkan pengguna baru: {$user->name} (@{$user->username}, Role: {$user->role})"
        );

        return redirect()->back()->with('success', "Pengguna '{$user->name}' berhasil ditambahkan.");
    }

    /**
     * Update user.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:100', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', 'in:admin,kasir'],
            'phone' => ['nullable', 'string', 'max:25'],
            'is_active' => ['boolean'],
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        // Prevent admin from deactivating their own currently logged-in account
        if ($user->id === Auth::id() && (! $validated['is_active'] || $validated['role'] !== 'admin')) {
            return redirect()->back()->with('error', 'Anda tidak dapat menonaktifkan atau mengubah role akun Anda sendiri saat sedang aktif.');
        }

        $user->update($validated);

        LogAktivitas::catat(
            'UPDATE PENGGUNA',
            'users',
            "Memperbarui pengguna ID {$id}: {$user->name} (Role: {$user->role})"
        );

        return redirect()->back()->with('success', "Data pengguna '{$user->name}' berhasil diperbarui.");
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);

        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        LogAktivitas::catat(
            'STATUS PENGGUNA',
            'users',
            "Akun {$user->name} (@{$user->username}) telah {$status}"
        );

        return redirect()->back()->with('success', "Akun '{$user->name}' berhasil {$status}.");
    }

    /**
     * Delete user safely.
     */
    public function destroy($id)
    {
        $user = User::withCount('transaksi')->findOrFail($id);

        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        if ($user->transaksi_count > 0) {
            $user->is_active = false;
            $user->save();

            return redirect()->back()->with('info', "Pengguna '{$user->name}' memiliki {$user->transaksi_count} transaksi kasir. Akun dinonaktifkan secara aman.");
        }

        $nama = $user->name;
        $user->delete();

        LogAktivitas::catat(
            'HAPUS PENGGUNA',
            'users',
            "Menghapus pengguna: {$nama} (ID: {$id})"
        );

        return redirect()->back()->with('success', "Pengguna '{$nama}' berhasil dihapus.");
    }
}
