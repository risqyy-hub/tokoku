import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    UserCog,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    ShieldCheck,
    ShoppingCart,
    CheckCircle2,
    AlertCircle,
    Lock,
    Mail,
    Phone,
    UserCheck,
    UserX,
    Key
} from 'lucide-react';

export default function Index({ users, stats = {}, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'kasir',
        phone: '',
        is_active: true,
    });

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/pengguna', { search, role: roleFilter }, { preserveState: true, replace: true });
    };

    const openAddModal = () => {
        setEditingUser(null);
        reset();
        clearErrors();
        setModalOpen(true);
    };

    const openEditModal = (u) => {
        setEditingUser(u);
        clearErrors();
        setData({
            name: u.name,
            username: u.username,
            email: u.email,
            password: '',
            role: u.role,
            phone: u.phone || '',
            is_active: Boolean(u.is_active),
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(`/pengguna/${editingUser.id}`, {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/pengguna', {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        }
    };

    const toggleStatus = (id) => {
        router.post(`/pengguna/${id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDelete = (u) => {
        if (confirm(`Yakin ingin menghapus atau menonaktifkan pengguna "${u.name}"?`)) {
            router.delete(`/pengguna/${u.id}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kelola Pengguna Sistem POS" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <UserCog className="w-7 h-7 text-blue-600" />
                            <span>Hak Akses & Pengguna</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Atur izin login, akun kasir toko, dan administrator sistem POS
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pengguna Baru</span>
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pengguna</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalUsers || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Akun terdaftar</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Administrator</span>
                        <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{stats.totalAdmin || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Akses penuh fitur</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Kasir Toko</span>
                        <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.totalKasir || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Operasional transaksi</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Pelanggan</span>
                        <h3 className="text-2xl font-extrabold text-violet-600 mt-1">{stats.totalPelanggan || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Akun belanja</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">Status Aktif</span>
                        <h3 className="text-2xl font-extrabold text-sky-600 mt-1">{stats.totalAktif || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Dapat login sistem</p>
                    </div>
                </div>

                {/* Filter and Search */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, username, email..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                router.get('/pengguna', { search, role: e.target.value }, { preserveState: true });
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-44"
                        >
            <option value="">Semua Role</option>
                            <option value="admin">Administrator</option>
                            <option value="kasir">Kasir</option>
                        </select>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer w-full sm:w-auto"
                        >
                            Filter
                        </button>
                    </form>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-5">Nama Pengguna</th>
                                    <th className="py-3 px-5">Username</th>
                                    <th className="py-3 px-5">Email & No. HP</th>
                                    <th className="py-3 px-5 text-center">Hak Akses (Role)</th>
                                    <th className="py-3 px-5 text-center">Status</th>
                                    <th className="py-3 px-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-400">
                                            <UserCog className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                            <p className="text-sm font-semibold text-slate-600">Pengguna tidak ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                                                        <div className="text-[10px] text-slate-400">ID: USR-{u.id}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-5 font-mono text-slate-700 font-semibold">
                                                @{u.username}
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <div className="text-slate-800">{u.email}</div>
                                                {u.phone && (
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.phone}</div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        u.role === 'admin'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}
                                                >
                                                    {u.role === 'admin' ? (
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ShoppingCart className="w-3.5 h-3.5" />
                                                    )}
                                                    <span className="capitalize">{u.role}</span>
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStatus(u.id)}
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                                        u.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-5 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(u)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Edit Pengguna"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(u)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Hapus / Nonaktifkan"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.total > users.per_page && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan <span className="font-bold text-slate-800">{users.from}</span> -{' '}
                                <span className="font-bold text-slate-800">{users.to}</span> dari{' '}
                                <span className="font-bold text-slate-800">{users.total}</span> pengguna
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'text-slate-600 hover:bg-slate-100'
                                                : 'text-slate-300 pointer-events-none'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah / Edit Pengguna */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800">
                                {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Budi Kasir 1"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Username <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="kasir1"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                    {errors.username && <p className="text-xs text-rose-600 mt-1">{errors.username}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Role / Hak Akses <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    >
                                        <option value="kasir">Kasir POS</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                    {errors.role && <p className="text-xs text-rose-600 mt-1">{errors.role}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Alamat Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="kasir@tokokita.id"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                />
                                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Nomor Telepon
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="08123456789"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                                    <span>Kata Sandi {editingUser && '(Opsional)'}</span>
                                    {editingUser && <span className="text-[10px] text-slate-400">Kosongkan jika tidak diubah</span>}
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder={editingUser ? '••••••••' : 'Minimal 6 karakter'}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required={!editingUser}
                                />
                                {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-700">Akun Aktif (Dapat Login)</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
