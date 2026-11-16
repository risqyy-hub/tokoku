import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    BarChart3,
    Calendar,
    Download,
    DollarSign,
    Receipt,
    TrendingUp,
    Flame,
    Boxes,
    CreditCard,
    User,
    AlertCircle,
    ArrowUpRight,
    PieChart,
    Wallet
} from 'lucide-react';

export default function Index({
    summary = {},
    penjualanHarian = [],
    laporanKasir = [],
    laporanMetode = [],
    produkTerlaris = [],
    produkKurangLaku = [],
    laporanStok = {},
    filters = {}
}) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [activeTab, setActiveTab] = useState('harian'); // harian, produk, kasir, stok

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/laporan', { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    const setQuickRange = (type) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (type === 'today') {
            // today
        } else if (type === 'week') {
            const day = now.getDay() || 7;
            start.setDate(now.getDate() - day + 1);
        } else if (type === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        const sStr = start.toISOString().split('T')[0];
        const eStr = end.toISOString().split('T')[0];
        setStartDate(sStr);
        setEndDate(eStr);
        router.get('/laporan', { start_date: sStr, end_date: eStr }, { preserveState: true });
    };

    const handleExportCsv = () => {
        window.location.href = `/laporan/export?start_date=${startDate}&end_date=${endDate}`;
    };

    const profitPercentage =
        summary.totalOmzet > 0
            ? Math.round((summary.keuntunganKotor / summary.totalOmzet) * 100)
            : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Penjualan & Analitik Toko" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <BarChart3 className="w-7 h-7 text-blue-600" />
                            <span>Laporan Penjualan & Keuangan</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Laporan omzet, estimasi laba kotor, performa kasir, dan perputaran inventori toko
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>Ekspor Laporan (CSV)</span>
                        </button>
                    </div>
                </div>

                {/* Filter Date Range Toolbar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Quick Range Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                        <button
                            type="button"
                            onClick={() => setQuickRange('today')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0"
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickRange('week')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0"
                        >
                            Minggu Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => setQuickRange('month')}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer shrink-0"
                        >
                            Bulan Ini
                        </button>
                    </div>

                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-2.5">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-slate-400 text-xs font-medium">s/d</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer w-full sm:w-auto"
                        >
                            Tampilkan
                        </button>
                    </form>
                </div>

                {/* Financial KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Omzet */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Omzet Penjualan</span>
                        <h3 className="text-2xl font-extrabold text-blue-900 mt-1 font-mono">
                            {formatRupiah(summary.totalOmzet)}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">{summary.jumlahTransaksi} transaksi berhasil</p>
                    </div>

                    {/* Estimasi Keuntungan Kotor */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Estimasi Laba Kotor</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black">
                                {profitPercentage}% Margin
                            </span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                            {formatRupiah(summary.keuntunganKotor)}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">Modal HPP: {formatRupiah(summary.totalModalHPP)}</p>
                    </div>

                    {/* Rata-rata Transaksi (Basket Size) */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata per Faktur</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                            {formatRupiah(summary.rataRataTransaksi)}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">Average Order Value (AOV)</p>
                    </div>

                    {/* Nilai Aset Stok Gudang */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nilai Aset Stok Toko</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                            {formatRupiah(laporanStok.totalNilaiAset)}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">{laporanStok.totalStokUnit} total unit barang</p>
                    </div>
                </div>

                {/* Report Section Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('harian')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === 'harian'
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Penjualan Harian
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('produk')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === 'produk'
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Analisis Produk Terlaris & Kurang Laku
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('kasir')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === 'kasir'
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Laporan Kasir & Metode Bayar
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('stok')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            activeTab === 'stok'
                                ? 'border-blue-600 text-blue-700'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Inventori & Aset Stok
                    </button>
                </div>

                {/* TAB 1: PENJUALAN HARIAN */}
                {activeTab === 'harian' && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
                        <div className="p-5 border-b border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900">Rincian Penjualan Harian</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Riwayat transaksi terkonsolidasi per tanggal dalam rentang filter
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="py-3 px-5">Tanggal</th>
                                        <th className="py-3 px-5 text-center">Jumlah Transaksi</th>
                                        <th className="py-3 px-5 text-right">Rata-rata Transaksi</th>
                                        <th className="py-3 px-5 text-right">Total Omzet</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                    {penjualanHarian.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-10 text-center text-slate-400">
                                                Tidak ada transaksi dalam rentang tanggal ini
                                            </td>
                                        </tr>
                                    ) : (
                                        penjualanHarian.map((h, i) => {
                                            const avg = h.total_transaksi > 0 ? h.total_omzet / h.total_transaksi : 0;
                                            return (
                                                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5 px-5 font-bold text-slate-900">
                                                        {h.tanggal}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center font-mono">
                                                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                                                            {h.total_transaksi} faktur
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                                                        {formatRupiah(avg)}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-right font-mono font-extrabold text-blue-700 text-sm">
                                                        {formatRupiah(h.total_omzet)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: ANALISIS PRODUK */}
                {activeTab === 'produk' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top 8 Best Sellers */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Flame className="w-4 h-4 text-amber-500" />
                                <span>Produk Terlaris (Best Sellers)</span>
                            </h4>

                            <div className="space-y-2.5">
                                {produkTerlaris.length === 0 ? (
                                    <div className="py-10 text-center text-slate-400 text-xs">
                                        Belum ada data transaksi
                                    </div>
                                ) : (
                                    produkTerlaris.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <div className="font-bold text-slate-900 truncate max-w-[180px]">
                                                        {p.nama_produk}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        Omzet: {formatRupiah(p.total_omzet)}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-extrabold font-mono">
                                                {p.total_terjual} terjual
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Slow Movers (Kurang Laku) */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4 text-slate-400" />
                                <span>Produk Kurang Laku / Belum Terjual di Periode Ini</span>
                            </h4>

                            <div className="space-y-2.5">
                                {produkKurangLaku.length === 0 ? (
                                    <div className="py-10 text-center text-slate-400 text-xs">
                                        Semua produk aktif terjual dengan baik!
                                    </div>
                                ) : (
                                    produkKurangLaku.map((p) => (
                                        <div
                                            key={p.id_produk}
                                            className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">{p.nama_produk}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    Kategori: {p.kategori?.nama_kategori} &bull; Harga: {formatRupiah(p.harga)}
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">
                                                Stok Rak: {p.stok}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: KASIR & METODE BAYAR */}
                {activeTab === 'kasir' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Performa Kasir */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-blue-600" />
                                <span>Produktivitas & Laporan Per Kasir</span>
                            </h4>

                            <div className="space-y-3">
                                {laporanKasir.map((k, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                                    >
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-sm">{k.nama_kasir}</h5>
                                            <p className="text-xs text-slate-400 mt-0.5">{k.total_transaksi} faktur dilayani</p>
                                        </div>
                                        <div className="text-right font-mono">
                                            <span className="text-sm font-black text-blue-700">
                                                {formatRupiah(k.total_omzet)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metode Pembayaran */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                <span>Laporan Berdasarkan Metode Pembayaran</span>
                            </h4>

                            <div className="space-y-3">
                                {laporanMetode.map((m, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                                    >
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-sm uppercase">
                                                {m.metode_pembayaran || 'tunai'}
                                            </h5>
                                            <p className="text-xs text-slate-400 mt-0.5">{m.total_transaksi} kali digunakan</p>
                                        </div>
                                        <div className="text-right font-mono">
                                            <span className="text-sm font-black text-slate-900">
                                                {formatRupiah(m.total_omzet)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: LAPORAN STOK & ASET */}
                {activeTab === 'stok' && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-6">
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-blue-600" />
                            <span>Valuasi Aset Inventori & Ringkasan Stok</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Modal Aset Fisik</span>
                                <div className="text-2xl font-black text-blue-900 font-mono mt-1">
                                    {formatRupiah(laporanStok.totalNilaiAset)}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Berdasarkan harga modal beli barang</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Potensi Omzet Penjualan</span>
                                <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
                                    {formatRupiah(laporanStok.totalPotensiOmzet)}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Jika seluruh stok saat ini terjual habis</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Kondisi Stok Kritis</span>
                                <div className="text-2xl font-black text-amber-900 font-mono mt-1">
                                    {laporanStok.stokMenipis} <span className="text-xs font-normal">menipis</span> / {laporanStok.stokHabis} <span className="text-xs font-normal text-rose-600">habis</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Dari total {laporanStok.totalItem} jenis produk</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
