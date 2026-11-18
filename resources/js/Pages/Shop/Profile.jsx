import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Profile({ customer = {} }) {
    const { data, setData, put, processing } = useForm({ nama_pelanggan: customer.nama_pelanggan || '', no_hp: customer.no_hp || '', alamat: customer.alamat || '' });
    return <AuthenticatedLayout><Head title="Profil Pelanggan"/><form onSubmit={(event) => { event.preventDefault(); put('/shop/profile'); }} className="max-w-xl space-y-4 rounded-2xl border bg-white p-6"><h1 className="text-xl font-black">Profil dan Alamat</h1>{[['nama_pelanggan','Nama'],['no_hp','Nomor telepon'],['alamat','Alamat pengiriman']].map(([key,label])=><label key={key} className="block text-sm font-semibold">{label}{key==='alamat'?<textarea required rows="4" value={data[key]} onChange={(event)=>setData(key,event.target.value)} className="mt-1 w-full rounded-lg border p-2"/>:<input value={data[key]} onChange={(event)=>setData(key,event.target.value)} className="mt-1 w-full rounded-lg border p-2"/>}</label>)}<button disabled={processing} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white">Simpan</button></form></AuthenticatedLayout>;
}
