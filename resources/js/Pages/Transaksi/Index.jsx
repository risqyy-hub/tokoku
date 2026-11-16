import React, { useState } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ThermalReceipt from '@/Components/Pos/ThermalReceipt';
import {
    ReceiptText,
    Search,
    Printer,
    Eye,
    X,
    Calendar,
    User,
    DollarSign,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RotateCcw,
    CreditCard,
    Filter,
    ChevronRight,
    ShoppingBag
} from 'lucide-react';

export default function Index({
    transaksi,
    kasirList = [],
    pelangganList = [],
    stats = {},
    filters = {}
}) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';

    // Filters State
    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [kasirId, setKasirId] = useState(filters.kasir_id || '');
    const [pelangganId, setPelangganId] = useState(filters.pelanggan_id || '');
    const [metode, setMetode] = useState(filters.metode || '');
    const [status, setStatus] = useState(filters.status || '');

    // Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState(null);

    // Reprint Receipt State
    const [receiptData, setReceiptData] = useState(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);

    // Cancel Transaction Modal State
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [trxToCancel, setTrxToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleFilterSubmit = (e) => {
        if (e) e.preventDefault();
        router.get(
            '/transaksi',
            {
                search,
                start_date: startDate,
                end_date: endDate,
                kasir_id: kasirId,
                pelanggan_id: pelangganId,
                metode,
                status,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setKasirId('');
        setPelangganId('');
        setMetode('');
        setStatus('');
        router.get('/transaksi', {}, { replace: true });
    };

    // Open Reprint Receipt Modal
    const handleReprintReceipt = async (trxId) => {
        setLoadingReceipt(true);
        try {
            const res = await fetch(`/transaksi/${trxId}/receipt`);
            const data = await res.json();
            setReceiptData(data);
        } catch (err) {
            console.error('Gagal mengambil data struk:', err);
            alert('Gagal mengambil data struk.');
        } finally {
            setLoadingReceipt(false);
        }
    };

    // Open Cancel Modal
    const openCancelModal = (trx) => {
        setTrxToCancel(trx);
        setCancelReason('');
        setCancelModalOpen(true);
    };

    // Process Transaction Void
    const handleConfirmCancel = (e) => {
        e.preventDefault();
        if (!trxToCancel || !cancelReason.trim()) return;

        setIsCancelling(true);
        router.post(
            `/transaksi/${trxToCancel.id_transaksi}/batalkan`,
            { alasan: cancelReason },
            {
                onSuccess: () => {
                    setCancelModalOpen(false);
                    setTrxToCancel(null);
                    setCancelReason('');
                    if (detailModalOpen) setDetailModalOpen(false);
                },
                onFinish: () => {
                    setIsCancelling(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Transaksi & Cetak Ulang Struk" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <ReceiptText className="w-7 h-7 text-blue-600" />
                            <span>Riwayat Transaksi Kasir</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Lacak faktur penjualan, cetak ulang struk thermal 80mm, dan riwayat belanja pelanggan
                        </p>
                    </div>

                    <Link
                        href="/pos"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Buka Kasir POS Baru</span>
                    </Link>
                </div>

                {/* Stat Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transaksi</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                                {stats.totalTransaksi || 0}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Semua faktur tercatat</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ReceiptText className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Omzet Bersih</p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                                {formatRupiah(stats.totalOmzet)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Dari transaksi berstatus selesai</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Transaksi Dibatalkan</p>
                            <h3 className="text-3xl font-extrabold text-rose-600 mt-1 font-mono">
                                {stats.totalBatal || 0}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Stok dikembalikan ke gudang</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <RotateCcw className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
                    <form onSubmit={handleFilterSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari No. Transaksi / Pelanggan..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Date Start */}
                            <div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title="Mulai Tanggal"
                                />
                            </div>

                            {/* Date End */}
                            <div>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title="Sampai Tanggal"
                                />
                            </div>

                            {/* Filter Kasir */}
                            <div>
                                <select
                                    value={kasirId}
                                    onChange={(e) => setKasirId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Semua Kasir</option>
                                    {kasirList.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            Kasir: {k.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                            {/* Filter Pelanggan */}
                            <div>
                                <select
                                    value={pelangganId}
                                    onChange={(e) => setPelangganId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Semua Pelanggan</option>
                                    {pelangganList.map((c) => (
                                        <option key={c.id_pelanggan} value={c.id_pelanggan}>
                                            {c.nama_pelanggan}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Metode Bayar */}
                            <div>
                                <select
                                    value={metode}
                                    onChange={(e) => setMetode(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Semua Metode</option>
                                    <option value="tunai">Tunai</option>
                                    <option value="qris">QRIS</option>
                                    <option value="transfer">Transfer Bank</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="selesai">Selesai</option>
                                    <option value="batal">Dibatalkan</option>
                                </select>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                                >
                                    Terapkan Filter
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-5">Nomor Faktur</th>
                                    <th className="py-3 px-5">Tanggal & Waktu</th>
                                    <th className="py-3 px-5">Kasir & Pelanggan</th>
                                    <th className="py-3 px-5 text-right">Total Belanja</th>
                                    <th className="py-3 px-5 text-center">Metode</th>
                                    <th className="py-3 px-5 text-center">Status</th>
                                    <th className="py-3 px-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {transaksi.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-400">
                                            <ReceiptText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                            <p className="text-sm font-semibold text-slate-600">Tidak ada riwayat transaksi</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transaksi.data.map((trx) => {
                                        const isBatal = trx.status === 'batal';
                                        return (
                                            <tr key={trx.id_transaksi} className={`hover:bg-slate-50/80 transition-colors ${isBatal ? 'bg-rose-50/30' : ''}`}>
                                                <td className="py-3.5 px-5 font-mono text-slate-900 font-bold text-xs">
                                                    {trx.nomor_transaksi || `TRX-${trx.id_transaksi}`}
                                                    {trx.details?.length > 0 && (
                                                        <span className="block text-[10px] text-slate-400 font-normal">
                                                            {trx.details.length} item barang
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                                                    <div>{trx.tanggal}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {trx.created_at ? new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-5">
                                                    <div className="font-bold text-slate-900">
                                                        {trx.pelanggan?.nama_pelanggan || 'Pelanggan Umum'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        Kasir: {trx.kasir?.name || 'Kasir Toko'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-5 text-right font-mono font-black text-slate-900 text-xs">
                                                    {formatRupiah(trx.total_belanja)}
                                                </td>

                                                <td className="py-3.5 px-5 text-center">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                                        {trx.metode_pembayaran || 'tunai'}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-5 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            isBatal
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-emerald-100 text-emerald-800'
                                                        }`}
                                                    >
                                                        {isBatal ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                                        <span>{trx.status}</span>
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-5 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {/* Detail Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTrx(trx);
                                                                setDetailModalOpen(true);
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                            title="Lihat Detail Transaksi"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Reprint Button (Epson TM-T82X 80mm) */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReprintReceipt(trx.id_transaksi)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                            title="Cetak Ulang Struk Thermal 80mm"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Cancel / Void Button (Admin or authorized) */}
                                                        {!isBatal && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openCancelModal(trx)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                title="Batalkan Transaksi / Retur"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transaksi.total > transaksi.per_page && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan <span className="font-bold text-slate-800">{transaksi.from}</span> -{' '}
                                <span className="font-bold text-slate-800">{transaksi.to}</span> dari{' '}
                                <span className="font-bold text-slate-800">{transaksi.total}</span> faktur
                            </div>
                            <div className="flex items-center gap-1">
                                {transaksi.links.map((link, i) => (
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

            {/* Modal Detail Transaksi */}
            {detailModalOpen && selectedTrx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <ReceiptText className="w-5 h-5 text-blue-600" />
                                    <span>Detail Faktur #{selectedTrx.nomor_transaksi || selectedTrx.id_transaksi}</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedTrx.tanggal} &bull; Kasir: {selectedTrx.kasir?.name || 'Kasir Toko'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 space-y-4">
                            {/* Member info */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Pelanggan</span>
                                    <span className="font-bold text-slate-800">
                                        {selectedTrx.pelanggan?.nama_pelanggan || 'Pelanggan Umum (Walk-in)'}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                    selectedTrx.status === 'batal' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    Status: {selectedTrx.status}
                                </span>
                            </div>

                            {/* Items List */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                                    Rincian Barang Belanja:
                                </span>
                                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                    {selectedTrx.details?.map((d) => (
                                        <div key={d.id_detail} className="p-3 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-slate-800">
                                                    {d.nama_produk || d.produk?.nama_produk}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono">
                                                    {d.jumlah} &times; {formatRupiah(d.harga_satuan)}
                                                </div>
                                            </div>
                                            <div className="font-mono font-bold text-slate-900">
                                                {formatRupiah(d.subtotal)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Calculations */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs font-medium text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono font-bold">{formatRupiah(selectedTrx.subtotal || selectedTrx.total_belanja)}</span>
                                </div>
                                {selectedTrx.diskon > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Diskon</span>
                                        <span className="font-mono">-{formatRupiah(selectedTrx.diskon)}</span>
                                    </div>
                                )}
                                {selectedTrx.pajak > 0 && (
                                    <div className="flex justify-between">
                                        <span>Pajak (PPN)</span>
                                        <span className="font-mono">+{formatRupiah(selectedTrx.pajak)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                                    <span>Total Akhir</span>
                                    <span className="font-mono text-blue-700">{formatRupiah(selectedTrx.total_belanja)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] pt-1">
                                    <span>Metode Pembayaran:</span>
                                    <span className="font-bold uppercase">{selectedTrx.metode_pembayaran || 'tunai'}</span>
                                </div>
                            </div>

                            {selectedTrx.catatan && (
                                <div className="p-3 bg-amber-50 rounded-2xl text-xs text-amber-800">
                                    <strong>Catatan:</strong> {selectedTrx.catatan}
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => handleReprintReceipt(selectedTrx.id_transaksi)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Ulang Struk</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Batalkan Transaksi */}
            {cancelModalOpen && trxToCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Batalkan Transaksi / Retur</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Pembatalan faktur{' '}
                                    <span className="font-bold text-slate-800 font-mono">
                                        {trxToCancel.nomor_transaksi || trxToCancel.id_transaksi}
                                    </span>{' '}
                                    akan otomatis mengembalikan stok barang ke inventori.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmCancel} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Alasan Pembatalan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Contoh: Pelanggan salah beli, barang cacat, kasir salah input kuantitas"
                                    rows="2"
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCancelModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCancelling}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {isCancelling ? 'Memproses...' : 'Ya, Batalkan Transaksi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Cetak Ulang Struk (Thermal 80mm) */}
            {receiptData && (
                <ThermalReceipt
                    receipt={receiptData}
                    autoPrint={false}
                    onClose={() => setReceiptData(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
