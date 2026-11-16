import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LogoToko from '@/Components/LogoToko';
import {
    Settings,
    Store,
    Printer,
    Percent,
    Save,
    Image,
    CheckCircle2,
    HelpCircle,
    Info,
    Phone,
    MapPin,
    Mail
} from 'lucide-react';

export default function Index({ toko }) {
    const [logoPreview, setLogoPreview] = useState(toko?.logo || '/images/logo-tokokita.jpg');

    const { data, setData, post, processing, errors } = useForm({
        nama_toko: toko?.nama_toko || 'TOKOKITA POS',
        slogan: toko?.slogan || '',
        alamat: toko?.alamat || '',
        no_telepon: toko?.no_telepon || '',
        email: toko?.email || '',
        pesan_struk: toko?.pesan_struk || '',
        pajak_persen: toko?.pajak_persen || 0,
        pajak_aktif: Boolean(toko?.pajak_aktif),
        mode_cetak: toko?.mode_cetak || 'browser_dialog',
        logo: null,
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Using POST with _method=PUT to handle multipart logo upload
        post('/pengaturan?_method=PUT', {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Pengaturan Toko & Printer Struk" />

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Settings className="w-7 h-7 text-blue-600" />
                        <span>Pengaturan Toko & Printer Struk</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Konfigurasi identitas toko pada struk kasir, pajak PPN, dan pengaturan printer thermal Epson TM-T82X 80mm
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION 1: PROFIL & IDENTITAS TOKO */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Store className="w-5 h-5 text-blue-600" />
                            <span>Identitas Toko & Header Struk</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Nama Toko <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_toko}
                                    onChange={(e) => setData('nama_toko', e.target.value)}
                                    placeholder="Contoh: TOKOKITA POS"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {errors.nama_toko && <p className="text-xs text-rose-600 mt-1">{errors.nama_toko}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Slogan Toko
                                </label>
                                <input
                                    type="text"
                                    value={data.slogan}
                                    onChange={(e) => setData('slogan', e.target.value)}
                                    placeholder="Solusi Belanja Cerdas & Lengkap"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.no_telepon}
                                    onChange={(e) => setData('no_telepon', e.target.value)}
                                    placeholder="0812-3456-7890"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {errors.no_telepon && <p className="text-xs text-rose-600 mt-1">{errors.no_telepon}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Email Toko
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="info@tokokita.id"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Alamat Toko Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.alamat}
                                    onChange={(e) => setData('alamat', e.target.value)}
                                    rows="2"
                                    placeholder="Jl. Pahlawan No. 45, Madiun, Jawa Timur"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                                {errors.alamat && <p className="text-xs text-rose-600 mt-1">{errors.alamat}</p>}
                            </div>

                            {/* Logo Toko Upload */}
                            <div className="md:col-span-2 pt-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Logo Toko (Tampil di aplikasi dan struk thermal)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                        <LogoToko src={logoPreview} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Gunakan gambar hitam putih / monokrom untuk hasil cetak thermal terbaik
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: EPSON TM-T82X 80MM PRINTER SPECIFICATION */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Printer className="w-5 h-5 text-blue-600" />
                                <span>Konfigurasi Printer Struk Epson TM-T82X</span>
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>80mm Thermal Ready</span>
                            </span>
                        </div>

                        {/* Informational Guidance Box */}
                        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-sky-900 space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5 text-blue-900">
                                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Petunjuk Penggunaan Printer Epson TM-T82X:</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                1. Sambungkan kabel USB printer Epson TM-T82X dan install driver resmi Epson Advanced Printer Driver (APD).<br />
                                2. Pada dialog cetak browser (Chrome/Edge), pilih printer <strong>EPSON TM-T82X</strong>.<br />
                                3. Atur <strong>Paper Size: Roll Paper 80 x 297 mm</strong> (atau 80 x Roll Paper).<br />
                                4. Atur <strong>Margins: None</strong>, dan nonaktifkan opsi <strong>Headers and Footers</strong> agar struk rapi tanpa URL browser.<br />
                                5. Sistem TOKOKITA telah dilengkapi aturan CSS <code>@page &#123; size: 80mm auto; margin: 0; &#125;</code> sehingga layout tidak akan terpotong.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Mode Eksekusi Pencetakan
                                </label>
                                <select
                                    value={data.mode_cetak}
                                    onChange={(e) => setData('mode_cetak', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="browser_dialog">Browser Printing Dialog (Direkomendasikan untuk USB)</option>
                                    <option value="direct_thermal">Direct Raw Thermal (via QZ Tray / SDK)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Pesan Kaki Struk (Footer Struk Thermal)
                                </label>
                                <textarea
                                    value={data.pesan_struk}
                                    onChange={(e) => setData('pesan_struk', e.target.value)}
                                    rows="3"
                                    placeholder="Terima kasih atas kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: PAJAK PPN */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Percent className="w-5 h-5 text-blue-600" />
                            <span>Pengaturan Pajak (PPN)</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Tarif Pajak Penjualan (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={data.pajak_persen}
                                        onChange={(e) => setData('pajak_persen', e.target.value)}
                                        placeholder="Contoh: 11.00 atau 0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                                        %
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.pajak_aktif}
                                        onChange={(e) => setData('pajak_aktif', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-slate-800">
                                            Aktifkan Perhitungan Pajak di Kasir POS
                                        </span>
                                        <p className="text-[11px] text-slate-400">
                                            Jika diaktifkan, subtotal belanja akan otomatis ditambahkan PPN pada struk
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Pengaturan'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
