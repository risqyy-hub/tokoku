import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Boxes,
    ArrowDownRight,
    ArrowUpRight,
    RefreshCw,
    Search,
    AlertTriangle,
    Plus,
    X,
    Calendar,
    User,
    CheckCircle2,
    FileText,
    TrendingDown,
    TrendingUp
} from 'lucide-react';

export default function Index({
    mutasi,
    produkKritis = [],
    produkList = [],
    stats = {},
    filters = {}
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [jenisFilter, setJenisFilter] = useState(filters.jenis || '');
    const [modalOpen, setModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        id_produk: '',
        jenis: 'masuk',
        jumlah: '',
        keterangan: '',
    });

    const handleFilter = (e) => {
        if (e) e.preventDefault();
        router.get('/stok', { search, jenis: jenisFilter }, { preserveState: true, replace: true });
    };

    const openMutasiModal = (selectedProduct = null, defaultJenis = 'masuk') => {
        reset();
        clearErrors();
        setData({
            id_produk: selectedProduct ? selectedProduct.id_produk : (produkList[0]?.id_produk || ''),
            jenis: defaultJenis,
            jumlah: '',
            keterangan: '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/stok/mutasi', {
            onSuccess: () => {
                setModalOpen(false);
                reset();
            },
        });
    };

    const selectedProductObj = produkList.find((p) => String(p.id_produk) === String(data.id_produk));

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen & Riwayat Stok" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Boxes className="w-7 h-7 text-blue-600" />
                            <span>Inventori & Manajemen Stok</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola penerimaan stok masuk, stok keluar rusak, penyesuaian opname fisik, dan audit mutasi
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => openMutasiModal()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Input Mutasi Stok</span>
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Stok Fisik</span>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                            {stats.totalStokTersedia || 0}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Unit barang di gudang & rak</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Stok Menipis</span>
                        <h3 className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
                            {stats.totalStokMenipis || 0}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Perlu pengadaan kembali</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Stok Habis (0)</span>
                        <h3 className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">
                            {stats.totalStokHabis || 0}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Tidak dapat dijual di POS</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Mutasi Bulan Ini</span>
                        <h3 className="text-2xl font-extrabold text-blue-600 mt-1 font-mono">
                            {stats.totalMutasiBulanIni || 0}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Aktivitas keluar/masuk/opname</p>
                    </div>
                </div>

                {/* Critical Stock Alert Table if any */}
                {produkKritis.length > 0 && (
                    <div className="bg-amber-50/70 rounded-3xl p-5 border border-amber-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>Peringatan Stok Butuh Perhatian Segera ({produkKritis.length} Produk)</span>
                            </h4>
                            <span className="text-[11px] text-amber-700 font-medium">Restock segera untuk kelancaran kasir</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {produkKritis.map((p) => {
                                const isHabis = p.stok <= 0;
                                return (
                                    <div
                                        key={p.id_produk}
                                        className="bg-white rounded-2xl p-3 border border-amber-200/60 shadow-xs flex items-center justify-between gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-bold text-slate-900 truncate">
                                                {p.nama_produk}
                                            </h5>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                SKU: <span className="font-mono">{p.sku || '-'}</span> &bull; Min: {p.stok_minimum}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    isHabis ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {isHabis ? 'Habis' : `Sisa ${p.stok}`}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => openMutasiModal(p, 'masuk')}
                                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                                title="Tambah Stok Masuk"
                                            >
                                                + Restock
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filter and Mutation History Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Riwayat & Audit Mutasi Stok</span>
                        </h4>

                        <form onSubmit={handleFilter} className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama produk, SKU, barcode..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <select
                                value={jenisFilter}
                                onChange={(e) => {
                                    setJenisFilter(e.target.value);
                                    router.get('/stok', { search, jenis: e.target.value }, { preserveState: true });
                                }}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Semua Jenis Mutasi</option>
                                <option value="masuk">Stok Masuk</option>
                                <option value="keluar">Stok Keluar</option>
                                <option value="penjualan">Penjualan POS</option>
                                <option value="penyesuaian">Penyesuaian Opname</option>
                            </select>

                            <button
                                type="submit"
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                Filter
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-5">Waktu & Tanggal</th>
                                    <th className="py-3 px-5">Produk</th>
                                    <th className="py-3 px-5 text-center">Jenis Mutasi</th>
                                    <th className="py-3 px-5 text-center">Perubahan Qty</th>
                                    <th className="py-3 px-5 text-center">Stok Sebelum &rarr; Sesudah</th>
                                    <th className="py-3 px-5">Petugas / User</th>
                                    <th className="py-3 px-5">Alasan / Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {mutasi.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-400">
                                            <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                            <p className="text-sm font-semibold text-slate-600">Belum ada riwayat mutasi stok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    mutasi.data.map((m) => {
                                        return (
                                            <tr key={m.id_mutasi} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                                    {new Date(m.created_at).toLocaleString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>

                                                <td className="py-3.5 px-5">
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        {m.produk?.nama_produk || 'Produk dihapus'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        SKU: {m.produk?.sku || '-'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-5 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            m.jenis === 'masuk'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : m.jenis === 'keluar'
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : m.jenis === 'penjualan'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        }`}
                                                    >
                                                        {m.jenis === 'masuk' && <ArrowDownRight className="w-3 h-3" />}
                                                        {m.jenis === 'keluar' && <ArrowUpRight className="w-3 h-3" />}
                                                        {m.jenis === 'penjualan' && <TrendingDown className="w-3 h-3" />}
                                                        {m.jenis === 'penyesuaian' && <RefreshCw className="w-3 h-3" />}
                                                        <span>{m.jenis}</span>
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-5 text-center font-mono font-extrabold text-sm">
                                                    <span
                                                        className={
                                                            m.jenis === 'masuk'
                                                                ? 'text-emerald-600'
                                                                : m.jenis === 'keluar' || m.jenis === 'penjualan'
                                                                ? 'text-rose-600'
                                                                : 'text-purple-600'
                                                        }
                                                    >
                                                        {m.jenis === 'masuk' ? `+${m.jumlah}` : `-${m.jumlah}`}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-5 text-center font-mono text-xs">
                                                    <span className="text-slate-500">{m.stok_sebelum}</span>
                                                    <span className="mx-1 text-slate-300">&rarr;</span>
                                                    <span className="font-bold text-slate-900">{m.stok_sesudah}</span>
                                                </td>

                                                <td className="py-3.5 px-5">
                                                    <div className="text-slate-800 font-medium">
                                                        {m.user?.name || 'Sistem POS'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">
                                                    {m.keterangan || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {mutasi.total > mutasi.per_page && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan <span className="font-bold text-slate-800">{mutasi.from}</span> -{' '}
                                <span className="font-bold text-slate-800">{mutasi.to}</span> dari{' '}
                                <span className="font-bold text-slate-800">{mutasi.total}</span> riwayat mutasi
                            </div>
                            <div className="flex items-center gap-1">
                                {mutasi.links.map((link, i) => (
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

            {/* Modal Input Mutasi Stok */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-blue-600" />
                                <span>Input Perubahan Stok</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            {/* Pilih Produk */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Pilih Produk <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.id_produk}
                                    onChange={(e) => setData('id_produk', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {produkList.map((p) => (
                                        <option key={p.id_produk} value={p.id_produk}>
                                            {p.nama_produk} (Stok Saat Ini: {p.stok})
                                        </option>
                                    ))}
                                </select>
                                {errors.id_produk && <p className="text-xs text-rose-600 mt-1">{errors.id_produk}</p>}

                                {selectedProductObj && (
                                    <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex justify-between">
                                        <span>Stok Saat Ini:</span>
                                        <span className="font-bold font-mono">{selectedProductObj.stok} unit</span>
                                    </div>
                                )}
                            </div>

                            {/* Jenis Mutasi */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Jenis Perubahan Stok <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('jenis', 'masuk')}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                            data.jenis === 'masuk'
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Stok Masuk (+)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('jenis', 'keluar')}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                            data.jenis === 'keluar'
                                                ? 'bg-rose-600 text-white border-rose-600'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Stok Keluar (-)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('jenis', 'penyesuaian')}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                            data.jenis === 'penyesuaian'
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Opname Fisik (=)
                                    </button>
                                </div>
                            </div>

                            {/* Jumlah Unit */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    {data.jenis === 'penyesuaian' ? 'Stok Fisik Aktual Terhitung (Unit)' : 'Jumlah Unit Mutasi'}{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.jumlah}
                                    onChange={(e) => setData('jumlah', e.target.value)}
                                    placeholder={data.jenis === 'penyesuaian' ? 'Jumlah stok fisik di rak' : 'Jumlah unit'}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {errors.jumlah && <p className="text-xs text-rose-600 mt-1">{errors.jumlah}</p>}
                            </div>

                            {/* Alasan / Keterangan */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Alasan / Keterangan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    rows="2"
                                    placeholder="Contoh: Kulakan dari supplier A, Barang rusak saat bongkar muat, Penyesuaian stok opname bulanan"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {errors.keterangan && <p className="text-xs text-rose-600 mt-1">{errors.keterangan}</p>}
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
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Proses Mutasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
