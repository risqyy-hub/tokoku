import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Minus, Plus, Trash2 } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

export default function ShopIndex({ products = [], categories = [], customer = {} }) {
    const { errors = {} } = usePage().props;
    const [cart, setCart] = useState([]);
    const [address, setAddress] = useState(customer?.alamat || '');
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const add = (product) => setCart((current) => {
        const existing = current.find((item) => item.id_produk === product.id_produk);
        if (existing) return current.map((item) => item.id_produk === product.id_produk ? { ...item, jumlah: Math.min(item.jumlah + 1, product.stok) } : item);
        return [...current, { id_produk: product.id_produk, nama_produk: product.nama_produk, harga: product.harga, jumlah: 1, stok: product.stok }];
    });
    const changeQuantity = (productId, amount) => setCart((current) => current
        .map((item) => item.id_produk === productId ? { ...item, jumlah: item.jumlah + amount } : item)
        .filter((item) => item.jumlah > 0));
    const total = cart.reduce((sum, item) => sum + item.harga * item.jumlah, 0);
    const checkout = () => router.post('/shop/checkout', { items: cart.map(({ id_produk, jumlah }) => ({ id_produk, jumlah })), alamat_pengiriman: address, metode_pembayaran: paymentMethod });

    return <AuthenticatedLayout><Head title="Belanja Online" /><div className="space-y-5">
        <section className="rounded-2xl bg-blue-700 p-5 text-white"><h1 className="text-2xl font-black">Belanja TOKOKITA</h1><p className="mt-1">Pilih produk dan bayar tunai saat pesanan diterima.</p></section>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]"><section className="grid grid-cols-2 gap-3 sm:grid-cols-3">{products.map((product) => <button key={product.id_produk} onClick={() => add(product)} className="rounded-xl border bg-white p-3 text-left shadow-sm"><div className="aspect-square rounded-lg bg-slate-100">{product.foto && <img src={product.foto} alt={product.nama_produk} className="h-full w-full rounded-lg object-cover" />}</div><strong className="mt-2 block">{product.nama_produk}</strong><span className="text-sm text-blue-700">{money(product.harga)}</span><span className="block text-xs text-slate-500">Stok {product.stok}</span></button>)}</section>
         <aside className="h-fit space-y-3 rounded-2xl border bg-white p-4"><h2 className="font-bold">Keranjang ({cart.length})</h2>{cart.map((item) => <div key={item.id_produk} className="flex items-center justify-between gap-2 border-b py-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.nama_produk}</p><p className="text-xs text-slate-500">{money(item.harga)} / item</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" aria-label={`Kurangi ${item.nama_produk}`} onClick={() => changeQuantity(item.id_produk, -1)} className="rounded-md border p-1.5 hover:bg-slate-50">{item.jumlah === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</button><span className="min-w-6 text-center text-sm font-semibold">{item.jumlah}</span><button type="button" aria-label={`Tambah ${item.nama_produk}`} disabled={item.jumlah >= item.stok} onClick={() => changeQuantity(item.id_produk, 1)} className="rounded-md border p-1.5 hover:bg-slate-50 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button></div><strong className="shrink-0 text-sm">{money(item.harga * item.jumlah)}</strong></div>)}<label className="block text-xs font-semibold">Alamat pengiriman<textarea value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm" rows="4" required /></label><fieldset className="space-y-2"><legend className="text-xs font-semibold">Metode pembayaran</legend><label className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="radio" name="payment" value="tunai" checked={paymentMethod === 'tunai'} onChange={() => setPaymentMethod('tunai')} />Tunai saat barang diterima (COD)</label><label className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="radio" name="payment" value="saldo" checked={paymentMethod === 'saldo'} onChange={() => setPaymentMethod('saldo')} />Saldo pelanggan</label></fieldset>{errors.metode_pembayaran && <p className="text-sm text-rose-600">{errors.metode_pembayaran}</p>}{errors.alamat_pengiriman && <p className="text-sm text-rose-600">{errors.alamat_pengiriman}</p>}<p className="font-bold">Total: {money(total)}</p><button disabled={!cart.length || !address.trim()} onClick={checkout} className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white disabled:opacity-50">Buat Pesanan</button></aside></div>
    </div></AuthenticatedLayout>;
}
