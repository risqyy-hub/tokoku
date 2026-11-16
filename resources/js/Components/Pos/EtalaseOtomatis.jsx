import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingCart, Tag, ChevronRight, Pause, Play, Boxes } from 'lucide-react';

export default function EtalaseOtomatis({ products = [], onAddToCart, cart = [] }) {
    if (!products || products.length === 0) return null;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto rotate every 4.5 seconds with pause on hover
    useEffect(() => {
        if (isPaused || products.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 4500);

        return () => clearInterval(interval);
    }, [isPaused, products.length]);

    const activeProduct = products[currentIndex];
    if (!activeProduct) return null;

    const inCartItem = cart?.find((i) => i.id_produk === activeProduct.id_produk);
    const inCartQty = inCartItem ? inCartItem.jumlah : 0;
    const sisaStok = Math.max(0, activeProduct.stok - inCartQty);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    return (
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-sky-700 to-blue-900 text-white shadow-card p-4 sm:p-5 transition-all duration-500"
        >
            {/* Background ambient lighting effects */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Product Info with Fade Animation */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shrink-0 overflow-hidden shadow-inner flex items-center justify-center">
                        {activeProduct.foto ? (
                            <img
                                src={activeProduct.foto}
                                alt={activeProduct.nama_produk}
                                className="w-full h-full object-cover rounded-xl transition-all duration-700 transform hover:scale-110"
                            />
                        ) : (
                            <Tag className="w-8 h-8 text-sky-200" />
                        )}
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-900 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" /> Promo
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-sky-100 text-[10px] font-bold uppercase tracking-wider">
                                {activeProduct.kategori?.nama_kategori || 'Unggulan Toko'}
                            </span>
                            {activeProduct.brand && (
                                <span className="text-sky-200 text-xs font-medium">
                                    Brand: {activeProduct.brand}
                                </span>
                            )}
                            {isPaused && (
                                <span className="text-[10px] text-sky-300 italic flex items-center gap-0.5">
                                    <Pause className="w-2.5 h-2.5" /> Jeda
                                </span>
                            )}
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold tracking-tight truncate text-white">
                            {activeProduct.nama_produk}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2.5 mt-1">
                            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                                {formatRupiah(activeProduct.harga)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                sisaStok <= 0
                                    ? 'bg-rose-500/80 text-white'
                                    : sisaStok <= activeProduct.stok_minimum
                                    ? 'bg-amber-400 text-slate-900 font-black'
                                    : 'bg-white/20 backdrop-blur-xs text-sky-100'
                            }`}>
                                <Boxes className="w-3.5 h-3.5" />
                                <span>
                                    {sisaStok <= 0
                                        ? 'Stok Habis'
                                        : `Tersisa ${sisaStok} unit${inCartQty > 0 ? ` (${inCartQty} di keranjang)` : ''}`}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions & Carousel Indicators */}
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    {/* Dots indicator */}
                    <div className="flex items-center gap-1.5">
                        {products.map((p, idx) => (
                            <button
                                key={p.id_produk}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    idx === currentIndex
                                        ? 'w-6 bg-amber-400'
                                        : 'w-2 bg-white/30 hover:bg-white/60'
                                }`}
                                title={p.nama_produk}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => onAddToCart(activeProduct)}
                        disabled={sisaStok <= 0}
                        className="px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-sky-50 text-xs font-bold shadow-lg shadow-black/10 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                        <span>{sisaStok <= 0 ? 'Stok Habis' : '+ Keranjang'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
