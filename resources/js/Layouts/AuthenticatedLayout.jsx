import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import LogoToko from '@/Components/LogoToko';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    FolderTree,
    Boxes,
    Users,
    ReceiptText,
    BarChart3,
    UserCog,
    Settings,
    LogOut,
    Menu,
    X,
    CheckCircle2,
    AlertCircle,
    Info,
    ChevronDown,
    Clock,
    Sparkles
} from 'lucide-react';

export default function AuthenticatedLayout({ children, title }) {
    const { auth, flash, toko } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [toast, setToast] = useState(null);

    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    // Live Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Flash Toast handler
    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', message: flash.success });
        } else if (flash?.error) {
            setToast({ type: 'error', message: flash.error });
        } else if (flash?.info) {
            setToast({ type: 'info', message: flash.info });
        }

        if (flash?.success || flash?.error || flash?.info) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const navigation = [
        // POS is top priority for quick access
        {
            name: 'POS / Kasir',
            href: '/pos',
            icon: ShoppingCart,
            badge: 'Kasir',
            roles: ['admin', 'kasir'],
            highlight: true,
        },
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            roles: ['admin'],
        },
        {
            name: 'Katalog Produk',
            href: '/produk',
            icon: Package,
            roles: ['admin'],
        },
        {
            name: 'Kategori',
            href: '/kategori',
            icon: FolderTree,
            roles: ['admin'],
        },
        {
            name: 'Manajemen Stok',
            href: '/stok',
            icon: Boxes,
            roles: ['admin'],
        },
        {
            name: 'Data Pelanggan',
            href: '/pelanggan',
            icon: Users,
            roles: ['admin', 'kasir'],
        },
        {
            name: 'Riwayat Transaksi',
            href: '/transaksi',
            icon: ReceiptText,
            roles: ['admin', 'kasir'],
        },
        {
            name: 'Laporan Penjualan',
            href: '/laporan',
            icon: BarChart3,
            roles: ['admin'],
        },
        {
            name: 'Kelola Pengguna',
            href: '/pengguna',
            icon: UserCog,
            roles: ['admin'],
        },
        {
            name: 'Pengaturan Toko',
            href: '/pengaturan',
            icon: Settings,
            roles: ['admin'],
        },
    ];

    const currentUrl = window.location.pathname;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
            {/* Topbar for mobile & desktop */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shadow-sm no-print">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 shrink-0">
                                <LogoToko src={toko?.logo} className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                                    {toko?.nama_toko || 'TOKOKITA POS'}
                                </h1>
                                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 hidden sm:block">
                                    {toko?.slogan || 'Sistem Kasir Modern'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Live Clock Badge */}
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{currentTime || '--:--:--'}</span>
                        </div>

                        {/* Quick POS button for fast action */}
                        {currentUrl !== '/pos' && (
                            <Link
                                href="/pos"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/30 transition-all cursor-pointer"
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Buka POS</span>
                            </Link>
                        )}

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer text-left"
                            >
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 text-white font-bold text-xs flex items-center justify-center">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="hidden sm:block">
                                    <div className="text-xs font-bold text-slate-800 leading-none">
                                        {user?.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 capitalize leading-none mt-1 flex items-center gap-1">
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-blue-600' : 'bg-emerald-500'}`}></span>
                                        {user?.role}
                                    </div>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {userMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-150"
                                    onMouseLeave={() => setUserMenuOpen(false)}
                                >
                                    <div className="px-4 py-2.5 border-b border-slate-100">
                                        <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                                        <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">@{user?.username} ({user?.email})</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                                            isAdmin ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            Role: {user?.role?.toUpperCase()}
                                        </span>
                                    </div>

                                    {isAdmin && (
                                        <Link
                                            href="/pengaturan"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Pengaturan Toko</span>
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Keluar (Logout)</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Backdrop on mobile */}
                {sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
                    />
                )}

                {/* Sidebar Navigation */}
                <aside
                    className={`fixed lg:sticky top-0 lg:top-[57px] bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } no-print`}
                    style={{ height: 'calc(100vh - 57px)' }}
                >
                    <div className="p-4 border-b border-slate-100 lg:hidden flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Menu Navigasi</span>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Operasional Kasir
                        </div>

                        {navigation
                            .filter((item) => item.roles.includes(user?.role || 'kasir'))
                            .map((item, index) => {
                                const isActive = currentUrl.startsWith(item.href);
                                const isPos = item.href === '/pos';

                                return (
                                    <React.Fragment key={item.name}>
                                        {index === 2 && (
                                            <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Master Data & Toko
                                            </div>
                                        )}
                                        {index === 7 && (
                                            <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Analitik & Pengaturan
                                            </div>
                                        )}

                                        <Link
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                                                isActive
                                                    ? isPos
                                                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon
                                                    className={`w-4 h-4 transition-colors ${
                                                        isActive
                                                            ? isPos
                                                                ? 'text-white'
                                                                : 'text-blue-600'
                                                            : 'text-slate-400 group-hover:text-slate-600'
                                                    }`}
                                                />
                                                <span>{item.name}</span>
                                            </div>

                                            {item.badge && (
                                                <span
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                                        isActive && isPos
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </React.Fragment>
                                );
                            })}
                    </div>

                    {/* Printer Status Badge at bottom of sidebar */}
                    <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-sky-100 text-slate-600">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[11px] font-bold text-slate-800">Epson TM-T82X Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                            Format kertas 80mm presisi. Cetak langsung & dialog didukung.
                        </p>
                    </div>

                    {/* User Mini Bar */}
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user?.name}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Logout"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {/* Floating Toast Notification */}
                    {toast && (
                        <div className="fixed top-18 right-6 z-50 max-w-md animate-in slide-in-from-top duration-200">
                            <div
                                className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 ${
                                    toast.type === 'success'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                        : toast.type === 'error'
                                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                                        : 'bg-blue-50 border-blue-200 text-blue-900'
                                }`}
                            >
                                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                    <p className="text-xs font-bold leading-tight">
                                        {toast.type === 'success' ? 'Sukses' : toast.type === 'error' ? 'Peringatan' : 'Informasi'}
                                    </p>
                                    <p className="text-xs mt-0.5 font-medium leading-snug">{toast.message}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setToast(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
