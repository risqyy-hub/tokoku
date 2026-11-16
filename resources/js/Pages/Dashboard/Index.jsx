import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    TrendingUp,
    Receipt,
    Package,
    ShoppingBag,
    DollarSign,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    ChevronRight,
    Users,
    CheckCircle2,
    Clock,
    Flame,
    Boxes,
    ArrowRight
} from 'lucide-react';

export default function Dashboard({
    stats = {},
    chartData = [],
    produkTerlaris = [],
    produkKritis = [],
    transaksiTerbaru = []
}) {
    const [hoveredBar, setHoveredBar] = useState(null);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    // Calculate maximum omzet for chart scaling
    const maxOmzet = Math.max(...chartData.map((d) => d.omzet), 100000);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Ringkasan Toko" />

            <div className="space-y-6">
                {/* Dashboard Header - Amazon Seller Central Style */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>Pusat Operasional Toko</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold font-mono">
                                LIVE
                            </span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Pantau performa penjualan kasir, perputaran inventori stok, dan tren transaksi harian
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/pos"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Buka Kasir POS</span>
                        </Link>
                    </div>
                </div>

                {/* 1. STATISTIC CARDS ROW (6 METRICS) */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                    {/* Penjualan Hari Ini */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hari Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <DollarSign className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2 font-mono truncate">
                            {formatRupiah(stats.penjualanHariIni)}
                        </h3>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Omzet kasir hari ini</span>
                        </p>
                    </div>

                    {/* Transaksi Hari Ini */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaksi</span>
                            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                <Receipt className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                            {stats.transaksiHariIni || 0}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">Struk tercetak hari ini</p>
                    </div>

                    {/* Total Produk */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Item</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Package className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                            {stats.totalProduk || 0}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">Katalog produk aktif</p>
                    </div>

                    {/* Total Produk Terjual */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Terjual</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                            {stats.totalProdukTerjual || 0}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">Kuantitas unit keluar</p>
                    </div>

                    {/* Stok Menipis & Habis */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Stok Kritis</span>
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-xl font-extrabold text-amber-600 font-mono">
                                {stats.stokMenipisCount || 0}
                            </span>
                            <span className="text-xs text-rose-600 font-bold">
                                ({stats.stokHabisCount || 0} habis)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Butuh pengadaan stok</p>
                    </div>

                    {/* Total Pendapatan Bulan Ini */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bulan Ini</span>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-blue-900 mt-2 font-mono truncate">
                            {formatRupiah(stats.pendapatanBulanIni)}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">Akumulasi bulan berjalan</p>
                    </div>
                </div>

                {/* 2. SALES CHART & BEST SELLERS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sales Chart (Col 8) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-card">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span>Grafik Tren Penjualan (7 Hari Terakhir)</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Pantau grafik fluktuasi omzet penjualan toko
                                </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-xl">
                                Mingguan
                            </span>
                        </div>

                        {/* Interactive Bar Chart Visualization */}
                        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-4 border-b border-slate-100">
                            {chartData.map((d, idx) => {
                                const heightPercent = Math.max(8, Math.round((d.omzet / maxOmzet) * 100));
                                const isHovered = hoveredBar === idx;

                                return (
                                    <div
                                        key={d.tanggal}
                                        onMouseEnter={() => setHoveredBar(idx)}
                                        onMouseLeave={() => setHoveredBar(null)}
                                        className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                                    >
                                        {/* Hover Tooltip */}
                                        {isHovered && (
                                            <div className="absolute -top-12 z-20 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-mono shadow-xl whitespace-nowrap animate-in zoom-in-95">
                                                <div className="font-bold">{formatRupiah(d.omzet)}</div>
                                                <div className="text-[9px] text-slate-400">{d.transaksi} transaksi</div>
                                            </div>
                                        )}

                                        {/* Bar Pillar */}
                                        <div
                                            style={{ height: `${heightPercent}%` }}
                                            className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                                                isHovered
                                                    ? 'bg-blue-600 shadow-md shadow-blue-500/30'
                                                    : 'bg-gradient-to-t from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600'
                                            }`}
                                        />
                                        <span className="text-[10px] font-medium text-slate-500 mt-2 truncate max-w-[60px] text-center">
                                            {d.label.split(',')[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
                            <span>*Arahkan kursor ke pilar untuk melihat rincian omzet harian</span>
                            <span className="font-mono text-slate-600 font-semibold">
                                Total Omzet Keseluruhan: {formatRupiah(stats.totalPendapatanAllTime)}
                            </span>
                        </div>
                    </div>

                    {/* Best Sellers (Col 4) */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-card flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-500" />
                                    <span>Produk Terlaris</span>
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Top 5
                                </span>
                            </div>

                            <div className="space-y-3">
                                {produkTerlaris.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 text-xs">
                                        Belum ada data produk terjual
                                    </div>
                                ) : (
                                    produkTerlaris.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                                                        index === 0
                                                            ? 'bg-amber-400 text-slate-900 shadow-xs'
                                                            : index === 1
                                                            ? 'bg-slate-300 text-slate-800'
                                                            : index === 2
                                                            ? 'bg-amber-700 text-white'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </span>
                                                <div className="max-w-[130px] sm:max-w-[160px]">
                                                    <h5 className="text-xs font-bold text-slate-800 truncate">
                                                        {item.nama_produk}
                                                    </h5>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        Omzet: {formatRupiah(item.total_omzet)}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs font-mono">
                                                {item.total_terjual} terjual
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <Link
                            href="/laporan"
                            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                            <span>Lihat laporan selengkapnya</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                {/* 3. STOCK ALERT & RECENT TRANSACTIONS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Produk Stok Kritis (Col 5) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span>Peringatan Stok Menipis & Habis</span>
                            </h3>
                            <Link href="/stok" className="text-xs text-blue-600 font-semibold hover:underline">
                                Kelola
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {produkKritis.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                                    <span>Semua stok barang berada di batas aman</span>
                                </div>
                            ) : (
                                produkKritis.map((p) => {
                                    const isHabis = p.stok <= 0;
                                    return (
                                        <div
                                            key={p.id_produk}
                                            className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="text-xs font-bold text-slate-800 truncate">
                                                    {p.nama_produk}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    Kategori: {p.kategori?.nama_kategori || '-'}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isHabis
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {isHabis ? 'Stok Habis' : `Sisa ${p.stok} unit`}
                                                </span>
                                                <div className="text-[9px] text-slate-400 mt-0.5">
                                                    Min: {p.stok_minimum} unit
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Aktivitas Transaksi Terbaru (Col 7) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-blue-600" />
                                <span>Aktivitas Transaksi Terbaru</span>
                            </h3>
                            <Link href="/transaksi" className="text-xs text-blue-600 font-semibold hover:underline">
                                Semua Riwayat
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                        <th className="pb-2">No. Faktur</th>
                                        <th className="pb-2">Kasir / Pelanggan</th>
                                        <th className="pb-2 text-center">Metode</th>
                                        <th className="pb-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {transaksiTerbaru.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-6 text-center text-slate-400">
                                                Belum ada transaksi
                                            </td>
                                        </tr>
                                    ) : (
                                        transaksiTerbaru.map((trx) => (
                                            <tr key={trx.id_transaksi} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 font-mono text-slate-900 font-bold">
                                                    {trx.nomor_transaksi || `TRX-${trx.id_transaksi}`}
                                                    <div className="text-[10px] font-normal text-slate-400">
                                                        {trx.tanggal}
                                                    </div>
                                                </td>

                                                <td className="py-2.5">
                                                    <div className="text-slate-800 font-semibold">
                                                        {trx.pelanggan?.nama_pelanggan || 'Pelanggan Umum'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        Kasir: {trx.kasir?.name || 'Kasir Toko'}
                                                    </div>
                                                </td>

                                                <td className="py-2.5 text-center">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                                        {trx.metode_pembayaran || 'tunai'}
                                                    </span>
                                                </td>

                                                <td className="py-2.5 text-right font-mono font-bold text-blue-700">
                                                    {formatRupiah(trx.total_belanja)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
