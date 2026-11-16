import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import LogoToko from '@/Components/LogoToko';
import { Lock, User, Eye, EyeOff, ShieldCheck, ShoppingCart, ArrowRight } from 'lucide-react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { toko } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        login: '',
        password: '',
        remember: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    const fillCredentials = (role) => {
        if (role === 'admin') {
            setData({
                login: 'admin',
                password: 'admin123',
                remember: true,
            });
        } else {
            setData({
                login: 'kasir',
                password: 'kasir123',
                remember: true,
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100/60 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
            <Head title="Masuk ke Akun POS" />

            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/30 mb-4">
                        <LogoToko src={toko?.logo} className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        TOKOKITA <span className="text-blue-600 font-black">POS</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        Sistem Kasir Modern, Cepat & Terpercaya
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-7 sm:p-8 shadow-card border border-white/60">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Selamat Datang</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Silakan masuk menggunakan akun kasir atau administrator
                        </p>
                    </div>

                    {errors.login && (
                        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
                            <span className="font-semibold text-rose-600">Perhatian:</span>
                            <span>{errors.login}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Username / Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={data.login}
                                    onChange={(e) => setData('login', e.target.value)}
                                    placeholder="Masukkan username atau email"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan kata sandi"
                                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Ingat sesi masuk</span>
                            </label>
                            <span className="text-slate-400 text-[11px]">Epson TM-T82X Ready</span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                        >
                            {processing ? (
                                <span>Memproses...</span>
                            ) : (
                                <>
                                    <span>Masuk ke Sistem POS</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Access Buttons */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
                            Akses Cepat Mode Uji Coba:
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => fillCredentials('admin')}
                                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Akun Admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fillCredentials('kasir')}
                                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/70 text-sky-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
                                <span>Akun Kasir</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer info */}
                <p className="text-center text-xs text-slate-400 mt-6 font-medium">
                    &copy; 2026 TOKOKITA POS &bull; MariaDB 10.4 &bull; Thermal 80mm
                </p>
            </div>
        </div>
    );
}
