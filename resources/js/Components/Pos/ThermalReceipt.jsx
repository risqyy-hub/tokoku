import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, CheckCircle, X } from 'lucide-react';
import LogoToko from '@/Components/LogoToko';

export default function ThermalReceipt({ receipt, onClose, autoPrint = false }) {
    if (!receipt) return null;

    const hasAutoPrintedRef = useRef(false);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (autoPrint && !hasAutoPrintedRef.current) {
            hasAutoPrintedRef.current = true;
            const timer = setTimeout(() => {
                window.print();
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [autoPrint]);

    return (
        <>
            {/* Modal Box for On-Screen Preview */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 no-print">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] no-print">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                            <h3 className="text-base font-bold text-slate-800">Transaksi Selesai</h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Simulated 80mm Thermal Receipt On-Screen */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 font-mono text-[11px] text-slate-800 shadow-inner max-w-[320px] mx-auto leading-relaxed">
                            {/* 1. Logo Toko */}
                            <div className="text-center mb-2">
                                <LogoToko src={receipt.toko?.logo} className="w-12 h-12 mx-auto object-contain" />
                            </div>

                            {/* 2, 3, 4. Nama Toko, Alamat, Nomor Telepon */}
                            <div className="text-center border-b border-dashed border-slate-300 pb-2.5 mb-2.5">
                                <h4 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                                    {receipt.toko?.nama || 'TOKOKITA POS'}
                                </h4>
                                {receipt.toko?.slogan && (
                                    <p className="text-[10px] text-slate-500">{receipt.toko.slogan}</p>
                                )}
                                <p className="text-[10px] text-slate-600 mt-0.5">{receipt.toko?.alamat}</p>
                                <p className="text-[10px] text-slate-600">Telp: {receipt.toko?.telepon || '-'}</p>
                            </div>

                            {/* 5, 6, 7. Nomor Transaksi, Waktu, Kasir, Pelanggan */}
                            <div className="text-[10px] border-b border-dashed border-slate-300 pb-2 mb-2 space-y-0.5">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">No. Trx:</span>
                                    <span className="font-bold text-slate-900">{receipt.nomor_transaksi}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Waktu:</span>
                                    <span>{receipt.tanggal} {receipt.waktu}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Kasir:</span>
                                    <span>{receipt.kasir}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Pelanggan:</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        <span>{receipt.pelanggan}</span>
                                        {receipt.is_member && (
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-200">
                                                RFID MEMBER 5%
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 8, 9, 10, 11. Daftar Barang (Nama, Qty, Harga Satuan, Subtotal) */}
                            <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase flex justify-between mb-1">
                                    <span>Item</span>
                                    <span>Total</span>
                                </div>
                                <div className="space-y-1.5">
                                    {receipt.items?.map((item, idx) => (
                                        <div key={idx} className="text-[10px]">
                                            <div className="font-bold text-slate-900 truncate">
                                                {item.nama_produk}
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>
                                                    {item.jumlah} &times; {formatRupiah(item.harga_satuan)}
                                                </span>
                                                <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 12, 13, 14, 15, 16. Subtotal, Diskon, Pajak, Total, Uang Diterima, Kembalian */}
                            <div className="text-[10px] space-y-1 border-b border-dashed border-slate-300 pb-2 mb-2">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(receipt.subtotal)}</span>
                                </div>
                                {receipt.diskon > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>{receipt.is_member ? 'Diskon Member (5%)' : 'Diskon'}</span>
                                        <span>-{formatRupiah(receipt.diskon)}</span>
                                    </div>
                                )}
                                {receipt.pajak > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>Pajak (PPN)</span>
                                        <span>+{formatRupiah(receipt.pajak)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                                    <span>TOTAL</span>
                                    <span>{formatRupiah(receipt.total_belanja)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 pt-0.5">
                                    <span>Metode Bayar</span>
                                    <span className="font-bold">{receipt.metode_pembayaran}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Uang Diterima</span>
                                    <span>{formatRupiah(receipt.uang_diterima)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900">
                                    <span>Kembalian</span>
                                    <span>{formatRupiah(receipt.kembalian)}</span>
                                </div>
                            </div>

                            {/* 17. Ucapan Terima Kasih & Catatan Toko */}
                            <div className="text-center text-[10px] text-slate-500 pt-1 leading-tight">
                                <p className="font-bold text-slate-700">
                                    {receipt.toko?.pesan_kaki || 'Terima kasih atas kunjungan Anda!'}
                                </p>
                                <p className="text-[9px] text-slate-400 mt-1">Epson TM-T82X &bull; Kertas Thermal 80mm</p>
                            </div>
                        </div>
                    </div>

                    {/* Modal Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
                        >
                            Tutup / Baru
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Struk (80mm)</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* =======================================================
                PRINTER CONTAINER SPECIFICALLY FOR EPSON TM-T82X 80MM
                Portaled directly to document.body outside #app
                ======================================================= */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <div id="receipt-print-area">
                        {/* 1. Header Toko */}
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <LogoToko
                                src={receipt.toko?.logo}
                                style={{
                                    display: 'block',
                                    width: '18mm',
                                    height: '18mm',
                                    objectFit: 'contain',
                                    margin: '0 auto 4px',
                                }}
                            />
                            <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {receipt.toko?.nama || 'TOKOKITA POS'}
                            </div>
                            {receipt.toko?.slogan && (
                                <div style={{ fontSize: '10px' }}>{receipt.toko.slogan}</div>
                            )}
                            <div style={{ fontSize: '10px' }}>{receipt.toko?.alamat}</div>
                            <div style={{ fontSize: '10px' }}>Telp: {receipt.toko?.telepon || '-'}</div>
                        </div>

                        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

                        {/* Info Transaksi */}
                        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                            <div>No. Trx : {receipt.nomor_transaksi}</div>
                            <div>Waktu   : {receipt.tanggal} {receipt.waktu}</div>
                            <div>Kasir   : {receipt.kasir}</div>
                            <div>Member  : {receipt.pelanggan} {receipt.is_member ? '(RFID MEMBER 5%)' : ''}</div>
                        </div>

                        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

                        {/* Items */}
                        <div style={{ fontSize: '10px' }}>
                            {receipt.items?.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '4px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.nama_produk}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{item.jumlah} x {formatRupiah(item.harga_satuan)}</span>
                                        <span>{formatRupiah(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

                        {/* Summary */}
                        <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Subtotal:</span>
                                <span>{formatRupiah(receipt.subtotal)}</span>
                            </div>
                            {receipt.diskon > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>{receipt.is_member ? 'Diskon Member (5%):' : 'Diskon:'}</span>
                                    <span>-{formatRupiah(receipt.diskon)}</span>
                                </div>
                            )}
                            {receipt.pajak > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Pajak (PPN):</span>
                                    <span>+{formatRupiah(receipt.pajak)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
                                <span>TOTAL:</span>
                                <span>{formatRupiah(receipt.total_belanja)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                <span>Bayar ({receipt.metode_pembayaran}):</span>
                                <span>{formatRupiah(receipt.uang_diterima)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>Kembalian:</span>
                                <span>{formatRupiah(receipt.kembalian)}</span>
                            </div>
                        </div>

                        <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

                        {/* Footer Message */}
                        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px' }}>
                            <div>{receipt.toko?.pesan_kaki || 'Terima kasih atas kunjungan Anda!'}</div>
                            <div style={{ fontSize: '9px', marginTop: '2px' }}>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
