import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Phone,
    MapPin,
    Receipt,
    Calendar,
    DollarSign,
    ShoppingBag,
    Eye,
    ChevronRight,
    ArrowUpRight,
    CreditCard,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

export default function Index({ pelanggan, stats = {}, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_pelanggan: '',
        no_kartu: '',
        no_hp: '',
        alamat: '',
        kota: '',
        email: '',
    });

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/pelanggan', { search }, { preserveState: true, replace: true });
    };

    const openAddModal = () => {
        setEditingCustomer(null);
        reset();
        clearErrors();
        setModalOpen(true);
    };

    const openEditModal = (cust) => {
        setEditingCustomer(cust);
        clearErrors();
        setData({
            nama_pelanggan: cust.nama_pelanggan,
            no_kartu: cust.no_kartu || '',
            no_hp: cust.no_hp || '',
            alamat: cust.alamat || '',
            kota: cust.kota || '',
            email: cust.email || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCustomer) {
            put(`/pelanggan/${editingCustomer.id_pelanggan}`, {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/pelanggan', {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        }
    };

    const openHistory = async (cust) => {
        setLoadingHistory(true);
        setHistoryModalOpen(true);
        try {
            const res = await fetch(`/pelanggan/${cust.id_pelanggan}/riwayat`);
            const json = await res.json();
            setSelectedCustomerHistory(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDelete = (cust) => {
        if (confirm(`Hapus pelanggan "${cust.nama_pelanggan}"?`)) {
            router.delete(`/pelanggan/${cust.id_pelanggan}`);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Data Pelanggan Toko" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Users className="w-7 h-7 text-blue-600" />
                            <span>Manajemen Pelanggan</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola data member, loyalitas, kontak, dan riwayat belanja pelanggan toko
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Pelanggan Baru</span>
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pelanggan Terdaftar</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalPelanggan || 0}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Basis data member & umum</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Akumulasi Transaksi Toko</p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                                {formatRupiah(stats.totalBelanjaSemua)}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Omzet tercatat di sistem</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-800">Daftar Pelanggan</h4>

                        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, no hp, alamat, kota..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-5">ID Member</th>
                                    <th className="py-3 px-5">Nama Pelanggan</th>
                                    <th className="py-3 px-5">Kontak & Telepon</th>
                                    <th className="py-3 px-5">Alamat & Kota</th>
                                    <th className="py-3 px-5 text-center">Transaksi</th>
                                    <th className="py-3 px-5 text-right">Total Belanja</th>
                                    <th className="py-3 px-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {pelanggan.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-400">
                                            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                            <p className="text-sm font-semibold text-slate-600">Pelanggan tidak ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    pelanggan.data.map((item) => (
                                        <tr key={item.id_pelanggan} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                                                CUST-{String(item.id_pelanggan).padStart(4, '0')}
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                                    <span>{item.nama_pelanggan}</span>
                                                    {item.no_kartu && (
                                                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-extrabold text-[10px] flex items-center gap-1 border border-purple-200">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            <span>Diskon 5%</span>
                                                        </span>
                                                    )}
                                                </div>
                                                {item.no_kartu ? (
                                                    <div className="text-[11px] font-mono text-purple-700 font-semibold flex items-center gap-1 mt-0.5">
                                                        <CreditCard className="w-3 h-3 text-purple-500" />
                                                        <span>RFID: {item.no_kartu}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-slate-400 mt-0.5 italic">
                                                        Non-member (Tanpa RFID)
                                                    </div>
                                                )}
                                                {item.email && (
                                                    <div className="text-[11px] text-slate-400 mt-0.5">{item.email}</div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-5">
                                                {item.no_hp ? (
                                                    <div className="flex items-center gap-1.5 font-mono text-slate-700">
                                                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>{item.no_hp}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Belum ada no. HP</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-5">
                                                <div className="text-slate-700">{item.alamat || '-'}</div>
                                                {item.kota && (
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3 text-slate-400" />
                                                        <span>{item.kota}</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-5 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    {item.transaksi_count || 0}x
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                                                {formatRupiah(item.transaksi_sum_total_belanja || 0)}
                                            </td>

                                            <td className="py-3.5 px-5 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openHistory(item)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                        title="Lihat Riwayat Belanja"
                                                    >
                                                        <Receipt className="w-3.5 h-3.5" />
                                                    </button>
                                                    {!item.user_id && <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Edit Data Pelanggan"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>}
                                                    {!item.user_id && <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Hapus Pelanggan"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pelanggan.total > pelanggan.per_page && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan <span className="font-bold text-slate-800">{pelanggan.from}</span> -{' '}
                                <span className="font-bold text-slate-800">{pelanggan.to}</span> dari{' '}
                                <span className="font-bold text-slate-800">{pelanggan.total}</span> pelanggan
                            </div>
                            <div className="flex items-center gap-1">
                                {pelanggan.links.map((link, i) => (
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

            {/* Modal Tambah / Edit Pelanggan */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800">
                                {editingCustomer ? 'Edit Data Pelanggan' : 'Daftarkan Pelanggan Baru'}
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
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Nama Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_pelanggan}
                                    onChange={(e) => setData('nama_pelanggan', e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                    autoFocus
                                />
                                {errors.nama_pelanggan && <p className="text-xs text-rose-600 mt-1">{errors.nama_pelanggan}</p>}
                            </div>

                            {/* Nomor Kartu RFID Member (Diskon 5%) */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Nomor Kartu RFID Member</span>
                                    </span>
                                    <span className="text-[10px] text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                        Diskon 5% Otomatis
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={data.no_kartu}
                                    onChange={(e) => setData('no_kartu', e.target.value)}
                                    placeholder="Tempel / Tap Kartu RFID di Reader USB..."
                                    className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                                />
                                {errors.no_kartu && <p className="text-xs text-rose-600 mt-1">{errors.no_kartu}</p>}
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Pemegang kartu RFID ini akan otomatis mendapatkan diskon 5% di setiap transaksi kasir.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Nomor Handphone / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    value={data.no_hp}
                                    onChange={(e) => setData('no_hp', e.target.value)}
                                    placeholder="Contoh: 08123456789"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Kota Asal
                                </label>
                                <input
                                    type="text"
                                    value={data.kota}
                                    onChange={(e) => setData('kota', e.target.value)}
                                    placeholder="Contoh: Madiun, Ponorogo, Surabaya"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Alamat Lengkap
                                </label>
                                <textarea
                                    value={data.alamat}
                                    onChange={(e) => setData('alamat', e.target.value)}
                                    rows="2"
                                    placeholder="Jl. Melati No. 12 RT 01 RW 02"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
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
                                    {processing ? 'Menyimpan...' : editingCustomer ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Drawer Riwayat Belanja Pelanggan */}
            {historyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-blue-600" />
                                    <span>Riwayat Belanja Member</span>
                                </h3>
                                {selectedCustomerHistory && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {selectedCustomerHistory.nama_pelanggan} ({selectedCustomerHistory.no_hp || 'No HP -'})
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setHistoryModalOpen(false);
                                    setSelectedCustomerHistory(null);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-4 space-y-3">
                            {loadingHistory ? (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-xs font-medium">Memuat riwayat transaksi...</p>
                                </div>
                            ) : !selectedCustomerHistory?.transaksi || selectedCustomerHistory.transaksi.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                    <p className="text-sm font-semibold text-slate-600">Belum ada riwayat transaksi</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Pelanggan ini belum melakukan transaksi kasir.</p>
                                </div>
                            ) : (
                                selectedCustomerHistory.transaksi.map((trx) => (
                                    <div
                                        key={trx.id_transaksi}
                                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <span className="font-mono text-xs font-bold text-slate-800">
                                                    {trx.nomor_transaksi || `TRX-${trx.id_transaksi}`}
                                                </span>
                                                <span className="text-[11px] text-slate-400 ml-2">
                                                    {trx.tanggal}
                                                </span>
                                            </div>
                                            <span className="font-mono text-xs font-extrabold text-blue-700">
                                                {formatRupiah(trx.total_belanja)}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200/60">
                                            {trx.details?.length > 0 ? (
                                                trx.details.map((d) => (
                                                    <div key={d.id_detail} className="flex justify-between">
                                                        <span>
                                                            {d.nama_produk || d.produk?.nama_produk} &times; {d.jumlah}
                                                        </span>
                                                        <span className="font-mono">{formatRupiah(d.subtotal)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="italic text-slate-400">Transaksi legacy (tanpa rincian item)</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setHistoryModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
