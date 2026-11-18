import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FolderTree, Plus, Search, Edit2, Trash2, X, Package, Check, AlertTriangle } from 'lucide-react';

export default function Index({ kategori = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_kategori: '',
    });

    const openAddModal = () => {
        setEditingCategory(null);
        reset();
        clearErrors();
        setModalOpen(true);
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setData('nama_kategori', cat.nama_kategori);
        clearErrors();
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            put(`/kategori/${editingCategory.id_kategori}`, {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/kategori', {
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/kategori', { search }, { preserveState: true, replace: true });
    };

    const confirmDelete = (cat) => {
        setCategoryToDelete(cat);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!categoryToDelete) return;
        router.delete(`/kategori/${categoryToDelete.id_kategori}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setCategoryToDelete(null);
            },
        });
    };

    const totalKategori = kategori.length;
    const totalProdukSemua = kategori.reduce((acc, curr) => acc + (curr.produk_count || 0), 0);

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Kategori Produk" />

            <div className="space-y-6">
                {/* Header Page */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FolderTree className="w-7 h-7 text-blue-600" />
                            <span>Manajemen Kategori</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola kelompok produk toko untuk mempermudah pencarian dan pengelompokan POS
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Kategori Baru</span>
                    </button>
                </div>

                {/* Stat Cards - Amazon Seller Central style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kategori</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalKategori}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Klasifikasi aktif</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FolderTree className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-soft flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Produk Terhubung</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalProdukSemua}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Item dalam kategori</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-800">Daftar Kategori</h4>

                        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama kategori..."
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
                                    <th className="py-3 px-5 w-16">No</th>
                                    <th className="py-3 px-5">ID Kategori</th>
                                    <th className="py-3 px-5">Nama Kategori</th>
                                    <th className="py-3 px-5 text-center">Jumlah Produk</th>
                                    <th className="py-3 px-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {kategori.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-slate-400">
                                            <FolderTree className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                            <p className="text-sm font-semibold text-slate-600">Belum ada kategori yang ditemukan</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan kategori baru untuk toko Anda.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    kategori.map((cat, idx) => (
                                        <tr key={cat.id_kategori} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                            <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                                                KTG-{String(cat.id_kategori).padStart(3, '0')}
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    {cat.nama_kategori}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    cat.produk_count > 0
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {cat.produk_count} Produk
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    {!cat.is_system && <button
                                                        type="button"
                                                        onClick={() => openEditModal(cat)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Edit Kategori"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>}
                                                    {!cat.is_system && <button
                                                        type="button"
                                                        onClick={() => confirmDelete(cat)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Hapus Kategori"
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
                </div>
            </div>

            {/* Modal Tambah / Edit Kategori */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800">
                                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
                                    Nama Kategori <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_kategori}
                                    onChange={(e) => setData('nama_kategori', e.target.value)}
                                    placeholder="Contoh: Makanan Ringan, Alat Tulis, Minuman"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                    autoFocus
                                />
                                {errors.nama_kategori && (
                                    <p className="text-xs text-rose-600 mt-1">{errors.nama_kategori}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteModalOpen && categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Konfirmasi Hapus Kategori</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Apakah Anda yakin ingin menghapus kategori{' '}
                                    <span className="font-bold text-slate-800 font-mono">
                                        "{categoryToDelete.nama_kategori}"
                                    </span>
                                    ?
                                </p>
                                {categoryToDelete.produk_count > 0 && (
                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                                        <strong>Peringatan Keamanan:</strong> Kategori ini memiliki{' '}
                                        {categoryToDelete.produk_count} produk terdaftar. Anda harus memindahkan atau
                                        menghapus produk terkait terlebih dahulu sebelum menghapus kategori ini.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={categoryToDelete.produk_count > 0}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Ya, Hapus Kategori
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
