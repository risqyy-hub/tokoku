import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

export default function WalletIndex({ balance = 0, topups = [], mutations = [], duitkuConfigured = false, paymentMethods = [], paymentMethodsError = null }) {
    const { flash } = usePage().props;
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const startTopup = () => {
        setIsSubmitting(true);
        router.post('/wallet/topup', { jumlah: amount, payment_method: paymentMethod }, {
            onSuccess: (page) => {
                const createdPaymentUrl = page.props.flash?.paymentUrl;
                if (createdPaymentUrl) {
                    window.open(createdPaymentUrl, '_blank', 'noopener,noreferrer');
                }
            },
            onFinish: () => setIsSubmitting(false),
        });
    };
    return <AuthenticatedLayout><Head title="Saldo Saya"/><div className="mx-auto max-w-3xl space-y-5"><section className="rounded-2xl bg-gradient-to-r from-blue-700 to-sky-600 p-6 text-white"><p>Saldo TOKOKITA</p><h1 className="text-3xl font-black">{money(balance)}</h1></section>{flash?.info && <section className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{flash.info}</section>}<section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Top-up Saldo</h2><p className="mt-1 text-sm text-slate-500">Minimal Rp10.000. Pembayaran diproses aman oleh Duitku.</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><input type="number" min="10000" step="1" value={amount} onChange={(event)=>setAmount(event.target.value)} className="min-w-0 rounded-lg border p-2" placeholder="Nominal top-up"/><select value={paymentMethod} onChange={(event)=>setPaymentMethod(event.target.value)} className="min-w-0 rounded-lg border p-2"><option value="">Pilih pembayaran</option>{paymentMethods.map((method)=><option key={method.code} value={method.code}>{method.name}{Number(method.fee)>0 ? ` (+${money(method.fee)})` : ''}</option>)}</select><button onClick={startTopup} disabled={!duitkuConfigured || !paymentMethod || Number(amount)<10000 || isSubmitting} className="rounded-lg bg-blue-600 px-4 font-bold text-white disabled:opacity-50">{isSubmitting ? 'Menyiapkan pembayaran…' : 'Buat pembayaran'}</button></div>{!duitkuConfigured && <p className="mt-2 text-xs text-amber-700">Duitku belum aktif. Admin perlu mengatur merchant code dan API key.</p>}{paymentMethodsError && <p className="mt-2 text-xs text-amber-700">{paymentMethodsError}</p>}{duitkuConfigured && paymentMethods.length===0 && !paymentMethodsError && <p className="mt-2 text-xs text-amber-700">Channel pembayaran belum tersedia di proyek Duitku ini.</p>}</section><section className="rounded-2xl border bg-white p-5"><h2 className="mb-3 font-bold">Riwayat Saldo</h2>{mutations.map((mutation)=><p key={mutation.id_mutasi} className="border-b py-2 text-sm">{mutation.keterangan}<span className="float-right">{mutation.jumlah > 0 ? '+' : ''}{money(mutation.jumlah)}</span></p>)}{!mutations.length && <p className="text-sm text-slate-500">Belum ada aktivitas saldo.</p>}</section><section className="rounded-2xl border bg-white p-5"><h2 className="mb-3 font-bold">Status Top-up</h2>{topups.map((topup)=><div key={topup.id_topup} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm"><span>{topup.order_id}</span><span>{money(topup.jumlah)} · {topup.status}</span><div className="flex gap-3">{topup.redirect_url && topup.status==='pending' && <a className="text-blue-700" href={topup.redirect_url} target="_blank" rel="noreferrer">Lanjutkan pembayaran</a>}{topup.status==='pending' && <button className="font-semibold text-emerald-700" onClick={()=>router.post(`/wallet/topup/${topup.id_topup}/check`)}>Cek status pembayaran</button>}</div></div>)}{!topups.length && <p className="text-sm text-slate-500">Belum ada top-up.</p>}</section></div></AuthenticatedLayout>;
}
