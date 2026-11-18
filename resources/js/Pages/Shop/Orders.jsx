import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ReceiptText } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

export default function Orders({ orders = [] }) {
    const { auth } = usePage().props;

    return <AuthenticatedLayout>
        <Head title="Pesanan Saya" />
        <div className="mx-auto max-w-3xl space-y-4">
            <div>
                <h1 className="text-2xl font-black">Pesanan Saya</h1>
                <p className="text-sm text-slate-500">Nota digital pesanan Anda tersimpan di halaman ini.</p>
            </div>
            {orders.length === 0 && <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">Belum ada pesanan.</div>}
            {orders.map((order) => (
                <article key={order.id_transaksi} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-slate-50 p-4">
                        <div className="flex items-center gap-2">
                            <ReceiptText className="h-5 w-5 text-blue-700" />
                            <div><p className="text-xs text-slate-500">NOTA PEMBELIAN</p><strong>{order.nomor_transaksi}</strong></div>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{order.status === 'menunggu' && order.metode_pembayaran === 'tunai' ? 'Menunggu pembayaran COD' : order.status}</span>
                    </header>
                    <div className="space-y-1 p-4 text-sm">
                        <p><span className="text-slate-500">Tanggal:</span> {order.tanggal}</p>
                        <p><span className="text-slate-500">Pelanggan:</span> {auth?.user?.name}</p>
                        <p><span className="text-slate-500">Pembayaran:</span> {order.metode_pembayaran === 'tunai' ? 'Tunai / COD' : order.metode_pembayaran}</p>
                        <p><span className="text-slate-500">Alamat pengiriman:</span> {order.alamat_pengiriman}</p>
                    </div>
                    <div className="mx-4 border-t" />
                    <div className="space-y-2 p-4">
                        {order.details?.map((item) => (
                            <div key={item.id_detail} className="flex justify-between gap-3 text-sm">
                                <span>{item.nama_produk} × {item.jumlah} <span className="text-slate-500">({money(item.harga_satuan)} / item)</span></span>
                                <span className="shrink-0">{money(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                    <footer className="space-y-1 border-t bg-slate-50 p-4 text-sm">
                        <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
                        {Number(order.diskon) > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{money(order.diskon)}</span></div>}
                        {Number(order.pajak) > 0 && <div className="flex justify-between"><span>Pajak</span><span>{money(order.pajak)}</span></div>}
                        <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{money(order.total_belanja)}</span></div>
                        <p className="pt-2 text-center text-xs text-slate-500">Terima kasih telah berbelanja di TOKOKITA</p>
                    </footer>
                </article>
            ))}
        </div>
    </AuthenticatedLayout>;
}
