import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Printer, ReceiptText } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);

export default function Orders({ orders = [] }) {
    const { auth } = usePage().props;
    const printNote = (order) => {
        const items = (order.details || []).map((item) => `<tr><td>${escapeHtml(item.nama_produk)} × ${escapeHtml(item.jumlah)}</td><td style="text-align:right">${money(item.subtotal)}</td></tr>`).join('');
        const status = order.status === 'menunggu' && order.metode_pembayaran === 'tunai' ? 'Menunggu pembayaran COD' : order.status;
        const printWindow = window.open('', '_blank', 'width=480,height=720');

        if (!printWindow) {
            window.alert('Izinkan pop-up untuk mencetak nota pesanan.');
            return;
        }

        printWindow.document.write(`<!doctype html><html><head><title>Nota ${escapeHtml(order.nomor_transaksi)}</title><meta charset="utf-8"><style>body{font:14px Arial,sans-serif;color:#111;max-width:680px;margin:24px auto;padding:24px}h1,p{text-align:center;margin:6px 0}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px 4px;border-bottom:1px solid #ddd}.total{font-weight:bold;font-size:18px;border-top:2px solid #111;padding-top:12px}.muted{color:#555;font-size:12px}.status{padding:10px;background:#f1f5f9;text-align:center;font-weight:bold}@media print{body{margin:0 auto;padding:12mm;max-width:none}}</style></head><body><h1>TOKOKITA</h1><p>Nota Pesanan Online</p><hr><p><b>${escapeHtml(order.nomor_transaksi)}</b></p><p class="muted">Tanggal: ${escapeHtml(order.tanggal)} · Pelanggan: ${escapeHtml(auth?.user?.name)}</p><p class="muted">Pembayaran: ${order.metode_pembayaran === 'tunai' ? 'Tunai / COD' : escapeHtml(order.metode_pembayaran)}</p><p class="muted">Alamat: ${escapeHtml(order.alamat_pengiriman || '-')}</p><div class="status">${escapeHtml(status)}</div><table>${items}</table><p class="total">TOTAL: ${money(order.total_belanja)}</p><p class="muted">Terima kasih telah berbelanja di TOKOKITA</p><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
        printWindow.document.close();
    };

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
                    <div className="flex justify-end px-4 pt-3"><button type="button" onClick={() => printNote(order)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Printer className="h-4 w-4" />Cetak Nota</button></div>
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
