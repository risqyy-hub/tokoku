import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Package,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Star,
    AlertCircle,
    CheckCircle2,
    UploadCloud,
    Filter,
    Barcode,
    Layers,
    DollarSign,
    Boxes,
    ChevronLeft,
    ChevronRight,
    Tag
} from 'lucide-react';

export default function Index({ produk, kategoriList = [], stats = {}, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [kategoriId, setKategoriId] = useState(filters.kategori_id || '');
    const [stokFilter, setStokFilter] = useState(filters.stok_filter || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        id_kategori: '',
        nama_produk: '',
        sku: '',
        barcode: '',
        brand: '',
        harga_beli: '',
        harga: '',
        stok: '',
        stok_minimum: 5,
        status: 'aktif',
        is_featured: false,
        foto: null,
    });

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
            '/produk',
            {
                search,
                kategori_id: kategoriId,
                stok_filter: stokFilter,
                status: statusFilter,
            },
            { preserveState: true, replace: true }
        );
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setImagePreview(null);
        reset();
        clearErrors();
        if (kategoriList.length > 0) {
            setData('id_kategori', kategoriList[0].id_kategori);
        }
        setModalOpen(true);
    };

    const openEditModal = (p) => {
        setEditingProduct(p);
        setImagePreview(p.foto || null);
        clearErrors();
        setData({
            id_kategori: p.id_kategori,
            nama_produk: p.nama_produk,
            sku: p.sku || '',
            barcode: p.barcode || '',
            brand: p.brand || '',
            harga_beli: p.harga_beli,
            harga: p.harga,
            stok: p.stok,
            stok_minimum: p.stok_minimum,
            status: p.status,
            is_featured: Boolean(p.is_featured),
            foto: null,
        });
        setModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('foto', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingProduct) {
            // Using POST with _method=PUT to handle multipart/form-data safely in Laravel
            router.post(`/produk/${editingProduct.id_produk}?_method=PUT`, data, {
                forceFormData: true,
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/produk', {
                forceFormData: true,
                onSuccess: () => {
                    setModalOpen(false);
                    reset();
                },
            });
        }
    };

    const toggleFeatured = (id) => {
        router.post(`/produk/${id}/toggle-featured`, {}, { preserveScroll: true });
    };

    const toggleStatus = (id) => {
        router.post(`/produk/${id}/toggle-status`, {}, { preserveScroll: true });
    };

    const confirmDelete = (p) => {
        setProductToDelete(p);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!productToDelete) return;
        router.delete(`/produk/${productToDelete.id_produk}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setProductToDelete(null);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Produk POS" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Package className="w-7 h-7 text-blue-600" />
                            <span>Katalog & Master Produk</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola inventori, SKU, barcode scanner, harga jual, dan etalase unggulan POS
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk Baru</span>
                    </button>
                </div>

                {/* Amazon Seller Central Style Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Item</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Package className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-2">{stats.totalProduk || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Produk terdaftar</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Stok Menipis</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-extrabold text-amber-600 mt-2">{stats.totalStokMenipis || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Di bawah stok minimum</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Stok Habis</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-extrabold text-rose-600 mt-2">{stats.totalStokHabis || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Perlu restock segera</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-500">Etalase Unggulan</span>
                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                <Star className="w-4 h-4" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-extrabold text-sky-600 mt-2">{stats.totalUnggulan || 0}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Tampil di slider otomatis</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative lg:col-span-2">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama produk, SKU, barcode, brand..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <select
                                value={kategoriId}
                                onChange={(e) => {
                                    setKategoriId(e.target.value);
                                    router.get('/produk', { search, kategori_id: e.target.value, stok_filter: stokFilter, status: statusFilter }, { preserveState: true });
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">Semua Kategori</option>
                                {kategoriList.map((k) => (
                                    <option key={k.id_kategori} value={k.id_kategori}>
                                        {k.nama_kategori}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={stokFilter}
                                onChange={(e) => {
                                    setStokFilter(e.target.value);
                                    router.get('/produk', { search, kategori_id: kategoriId, stok_filter: e.target.value, status: statusFilter }, { preserveState: true });
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">Semua Kondisi Stok</option>
                                <option value="aman">Stok Aman</option>
                                <option value="menipis">Stok Menipis</option>
                                <option value="habis">Stok Habis</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    router.get('/produk', { search, kategori_id: kategoriId, stok_filter: stokFilter, status: e.target.value }, { preserveState: true });
                                }}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Nonaktif</option>
                            </select>

                            <button
                                type="submit"
                                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                            >
                                Filter
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-4 w-12 text-center">Etalase</th>
                                    <th className="py-3 px-4">Produk & Brand</th>
                                    <th className="py-3 px-4">SKU / Barcode</th>
                                    <th className="py-3 px-4">Kategori</th>
                                    <th className="py-3 px-4 text-right">Harga Beli</th>
                                    <th className="py-3 px-4 text-right">Harga Jual</th>
                                    <th className="py-3 px-4 text-center">Stok</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                                {produk.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-slate-400">
                                            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                                            <p className="text-sm font-semibold text-slate-600">Tidak ada produk yang sesuai kriteria</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau reset filter.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    produk.data.map((item) => {
                                        const isMenipis = item.stok > 0 && item.stok <= item.stok_minimum;
                                        const isHabis = item.stok <= 0;

                                        return (
                                            <tr key={item.id_produk} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFeatured(item.id_produk)}
                                                        title={item.is_featured ? 'Hapus dari etalase unggulan' : 'Jadikan etalase unggulan'}
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            item.is_featured
                                                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                                                : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <Star className={`w-4 h-4 ${item.is_featured ? 'fill-amber-400' : ''}`} />
                                                    </button>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                            {item.foto ? (
                                                                <img
                                                                    src={item.foto}
                                                                    alt={item.nama_produk}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm leading-tight">
                                                                {item.nama_produk}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                                Brand: <span className="font-medium text-slate-600">{item.brand || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-mono text-[11px] text-slate-700 font-semibold">
                                                        {item.sku || '-'}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Barcode className="w-3 h-3 text-slate-400" />
                                                        <span>{item.barcode || '-'}</span>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                                                        {item.kategori?.nama_kategori || 'Tanpa Kategori'}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                                                    {formatRupiah(item.harga_beli)}
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">
                                                    {formatRupiah(item.harga)}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                isHabis
                                                                    ? 'bg-rose-100 text-rose-700'
                                                                    : isMenipis
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-emerald-100 text-emerald-800'
                                                            }`}
                                                        >
                                                            {item.stok}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 mt-0.5">
                                                            Min: {item.stok_minimum}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(item.id_produk)}
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                                            item.status === 'aktif'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </button>
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(item)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                            title="Edit Produk"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => confirmDelete(item)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                            title="Hapus / Nonaktifkan"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
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
                    {produk.total > produk.per_page && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan <span className="font-bold text-slate-800">{produk.from}</span> -{' '}
                                <span className="font-bold text-slate-800">{produk.to}</span> dari{' '}
                                <span className="font-bold text-slate-800">{produk.total}</span> produk
                            </div>

                            <div className="flex items-center gap-1">
                                {produk.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white shadow-xs'
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

            {/* Modal Tambah / Edit Produk */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">
                                    {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Lengkapi data produk untuk mendukung barcode scan dan pencatatan transaksi kasir
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nama Produk */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Nama Produk <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nama_produk}
                                        onChange={(e) => setData('nama_produk', e.target.value)}
                                        placeholder="Contoh: Beras Raja Lele 5 Kg"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                    {errors.nama_produk && <p className="text-xs text-rose-600 mt-1">{errors.nama_produk}</p>}
                                </div>

                                {/* Kategori */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Kategori <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.id_kategori}
                                        onChange={(e) => setData('id_kategori', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {kategoriList.map((k) => (
                                            <option key={k.id_kategori} value={k.id_kategori}>
                                                {k.nama_kategori}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_kategori && <p className="text-xs text-rose-600 mt-1">{errors.id_kategori}</p>}
                                </div>

                                {/* Brand */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Brand / Merek
                                    </label>
                                    <input
                                        type="text"
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                        placeholder="Contoh: Indofood, Unilever, Bimoli"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                {/* SKU */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        SKU (Stock Keeping Unit)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        placeholder="Kosongkan jika auto-generate"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    {errors.sku && <p className="text-xs text-rose-600 mt-1">{errors.sku}</p>}
                                </div>

                                {/* Barcode Scanner Code */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                                        <span>Barcode (USB Scanner)</span>
                                        <span className="text-[10px] text-blue-600 font-semibold">Bisa discan langsung</span>
                                    </label>
                                    <div className="relative">
                                        <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={data.barcode}
                                            onChange={(e) => setData('barcode', e.target.value)}
                                            placeholder="Arahkan barcode scanner ke sini..."
                                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                    {errors.barcode && <p className="text-xs text-rose-600 mt-1">{errors.barcode}</p>}
                                </div>

                                {/* Harga Beli */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Harga Beli / Modal (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.harga_beli}
                                        onChange={(e) => setData('harga_beli', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                    {errors.harga_beli && <p className="text-xs text-rose-600 mt-1">{errors.harga_beli}</p>}
                                </div>

                                {/* Harga Jual */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Harga Jual POS (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.harga}
                                        onChange={(e) => setData('harga', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                    {errors.harga && <p className="text-xs text-rose-600 mt-1">{errors.harga}</p>}
                                </div>

                                {/* Stok Tersedia */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Stok Saat Ini <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.stok}
                                        onChange={(e) => setData('stok', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                    {errors.stok && <p className="text-xs text-rose-600 mt-1">{errors.stok}</p>}
                                </div>

                                {/* Stok Minimum Alert */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Peringatan Stok Minimum <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={data.stok_minimum}
                                        onChange={(e) => setData('stok_minimum', e.target.value)}
                                        placeholder="5"
                                        min="0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        required
                                    />
                                    {errors.stok_minimum && <p className="text-xs text-rose-600 mt-1">{errors.stok_minimum}</p>}
                                </div>

                                {/* Foto Produk Upload */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Foto Produk
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Format JPG, PNG, WEBP maks 2MB. Tampil di katalog kasir & etalase otomatis.
                                            </p>
                                        </div>
                                    </div>
                                    {errors.foto && <p className="text-xs text-rose-600 mt-1">{errors.foto}</p>}
                                </div>

                                {/* Status & Featured Toggles */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Status Produk
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                    >
                                        <option value="aktif">Aktif (Tersedia di POS)</option>
                                        <option value="nonaktif">Nonaktif (Sembunyikan)</option>
                                    </select>
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={data.is_featured}
                                            onChange={(e) => setData('is_featured', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-800">Tampilkan di Etalase Unggulan</span>
                                            <p className="text-[10px] text-slate-400">
                                                Produk akan berputar otomatis di carousel etalase kasir
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Produk */}
            {deleteModalOpen && productToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Hapus Produk</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Apakah Anda yakin ingin menghapus produk{' '}
                                    <span className="font-bold text-slate-800">"{productToDelete.nama_produk}"</span>?
                                </p>
                                <p className="text-[11px] text-slate-400 mt-2">
                                    Catatan: Jika produk ini pernah terjual dalam transaksi masa lalu, sistem akan otomatis
                                    menonaktifkannya untuk melindungi integritas laporan dan riwayat kasir.
                                </p>
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
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
