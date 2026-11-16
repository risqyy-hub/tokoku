import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EtalaseOtomatis from '@/Components/Pos/EtalaseOtomatis';
import ThermalReceipt from '@/Components/Pos/ThermalReceipt';
import {
    ShoppingCart,
    Search,
    Barcode,
    Trash2,
    Plus,
    Minus,
    User,
    UserPlus,
    CreditCard,
    Banknote,
    QrCode,
    Printer,
    Check,
    AlertCircle,
    CheckCircle2,
    X,
    Package,
    Sparkles,
    RefreshCw,
    Percent,
    Tag,
    Boxes
} from 'lucide-react';

export default function PosIndex({
    katalog = [],
    featured = [],
    kategoriList = [],
    pelangganList = [],
    toko = {}
}) {
    const { flash } = usePage().props;

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKategori, setSelectedKategori] = useState('');
    const barcodeInputRef = useRef(null);

    // Cart State
    const [cart, setCart] = useState([]);
    const [selectedPelanggan, setSelectedPelanggan] = useState('');
    const [metodePembayaran, setMetodePembayaran] = useState('tunai');
    const [diskonNominal, setDiskonNominal] = useState(0);
    const [uangDiterima, setUangDiterima] = useState('');
    const [catatan, setCatatan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Receipt Modal State
    const [receiptModalData, setReceiptModalData] = useState(null);
    const [autoPrintTrigger, setAutoPrintTrigger] = useState(false);
    const lastProcessedTrxRef = useRef(null);

    // Scanner & Feedback State
    const [scanFeedback, setScanFeedback] = useState(null);
    const scannerBufferRef = useRef('');
    const lastKeyTimeRef = useRef(0);

    // Quick Add Customer Modal
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerRfid, setNewCustomerRfid] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val || 0);
    };

    // Auto-focus barcode input on initial page mount
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    // Clear scanner feedback toast after 4 seconds
    useEffect(() => {
        if (scanFeedback) {
            const timer = setTimeout(() => {
                setScanFeedback(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [scanFeedback]);

    // Audio beep player using Web Audio API (standard POS scanner audio)
    const playAudioBeep = (type = 'success') => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'rfid') {
                // Cheerful member chime (E6 -> A6)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1318, ctx.currentTime);
                osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'success') {
                // High crisp beep (1760 Hz) for successful scan
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1760, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else {
                // Low double buzz (280 Hz) for error / out of stock / not found
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, ctx.currentTime);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
                osc.start();
                osc.stop(ctx.currentTime + 0.22);
            }
        } catch {
            // Audio context not allowed or not supported
        }
    };

    // Process Barcode Scan (Exact, SKU, No-Leading-Zero, Name, or Member RFID Card)
    const processBarcodeScan = (rawCode) => {
        if (!rawCode) return false;
        const cleanCode = String(rawCode).replace(/[\r\n\t]/g, '').trim();
        if (!cleanCode) return false;

        const query = cleanCode.toLowerCase();

        // 0. Check if scanned code matches a Customer RFID Card
        const cleanNoZero = cleanCode.replace(/^0+/, '');
        const foundMember = (pelangganList || []).find((c) => {
            if (!c.no_kartu) return false;
            const cCard = String(c.no_kartu).trim();
            const cCardNoZero = cCard.replace(/^0+/, '');
            return (
                cCard.toLowerCase() === query ||
                (cleanNoZero.length > 0 && cCardNoZero.toLowerCase() === cleanNoZero.toLowerCase())
            );
        });

        if (foundMember) {
            setSelectedPelanggan(foundMember.id_pelanggan);
            playAudioBeep('rfid');
            setScanFeedback({
                type: 'member',
                message: `Kartu RFID Terdeteksi: "${foundMember.nama_pelanggan}" (No: ${foundMember.no_kartu}) — Diskon Member 5% Otomatis Diterapkan!`,
            });
            setSearchQuery('');
            if (barcodeInputRef.current) {
                barcodeInputRef.current.value = '';
                barcodeInputRef.current.focus();
            }
            return true;
        }

        // 1. Exact match on Barcode or SKU
        let found = katalog.find((p) => {
            const pBarcode = String(p.barcode || '').trim().toLowerCase();
            const pSku = String(p.sku || '').trim().toLowerCase();
            return pBarcode === query || pSku === query;
        });

        // 2. Match without leading zeros (e.g. 08991001 vs 8991001)
        if (!found) {
            const noZeroQuery = query.replace(/^0+/, '');
            if (noZeroQuery.length > 0) {
                found = katalog.find((p) => {
                    const pBarcodeNoZero = String(p.barcode || '').trim().toLowerCase().replace(/^0+/, '');
                    const pSkuNoZero = String(p.sku || '').trim().toLowerCase().replace(/^0+/, '');
                    return pBarcodeNoZero === noZeroQuery || pSkuNoZero === noZeroQuery;
                });
            }
        }

        // 3. Exact match on product name
        if (!found) {
            found = katalog.find((p) => String(p.nama_produk || '').trim().toLowerCase() === query);
        }

        // 4. Partial match on product name if length >= 3
        if (!found && query.length >= 3) {
            found = katalog.find((p) => String(p.nama_produk || '').toLowerCase().includes(query));
        }

        if (found) {
            if (found.stok <= 0) {
                playAudioBeep('error');
                setScanFeedback({
                    type: 'error',
                    message: `Stok produk "${found.nama_produk}" habis (0 unit)!`,
                });
            } else {
                const inCart = cart.find((i) => i.id_produk === found.id_produk);
                if (inCart && inCart.jumlah >= found.stok) {
                    playAudioBeep('error');
                    setScanFeedback({
                        type: 'error',
                        message: `Stok produk "${found.nama_produk}" di keranjang sudah maksimal (${found.stok} unit)!`,
                    });
                } else {
                    addToCart(found);
                    playAudioBeep('success');
                    setScanFeedback({
                        type: 'success',
                        message: `"${found.nama_produk}" (Barcode: ${found.barcode || found.sku}) berhasil ditambahkan (+1)`,
                    });
                }
            }
            setSearchQuery('');
            if (barcodeInputRef.current) {
                barcodeInputRef.current.value = '';
                barcodeInputRef.current.focus();
            }
            return true;
        } else {
            playAudioBeep('error');
            setScanFeedback({
                type: 'error',
                message: `Barcode / SKU "${cleanCode}" tidak terdaftar di sistem katalog!`,
            });
            setSearchQuery('');
            if (barcodeInputRef.current) {
                barcodeInputRef.current.value = '';
                barcodeInputRef.current.focus();
            }
            return false;
        }
    };

    // Listen for transaction success and pop-up receipt
    useEffect(() => {
        if (flash?.struk && flash.struk.nomor_transaksi !== lastProcessedTrxRef.current) {
            lastProcessedTrxRef.current = flash.struk.nomor_transaksi;
            setReceiptModalData(flash.struk);
            // Clear cart & reset customer upon successful transaction
            setCart([]);
            setDiskonNominal(0);
            setUangDiterima('');
            setCatatan('');
            setSelectedPelanggan('');
        }
    }, [flash]);

    const handleCloseReceiptModal = () => {
        setReceiptModalData(null);
        setAutoPrintTrigger(false);
        setTimeout(() => {
            barcodeInputRef.current?.focus();
        }, 100);
    };

    // Handle Enter key on the barcode input
    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = (e.target.value || searchQuery || '').trim();
            if (val) {
                processBarcodeScan(val);
            }
        }
    };

    // Global Keydown Listener for USB Barcode Scanners (intercepts scan even if unfocused)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // F2 shortcut to manually focus barcode input
            if (e.key === 'F2') {
                e.preventDefault();
                barcodeInputRef.current?.focus();
                barcodeInputRef.current?.select();
                return;
            }

            // If user is currently typing in an input other than the barcode input (e.g. customer modal, notes, cash amount),
            // do not intercept normal typing
            const activeElement = document.activeElement;
            const activeTag = activeElement?.tagName?.toLowerCase();
            const isOtherInput =
                (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') &&
                activeElement !== barcodeInputRef.current;

            if (isOtherInput) {
                return;
            }

            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            // When Enter key is received (common scanner terminator)
            if (e.key === 'Enter') {
                const bufferVal = scannerBufferRef.current.trim();
                const inputVal = (barcodeInputRef.current?.value || searchQuery || '').trim();
                const codeToScan = inputVal || bufferVal;

                if (codeToScan.length >= 2) {
                    e.preventDefault();
                    processBarcodeScan(codeToScan);
                    scannerBufferRef.current = '';
                    return;
                }
                scannerBufferRef.current = '';
                return;
            }

            // Buffer single printable characters
            if (e.key.length === 1) {
                // If scanner buffer has been idle for more than 150ms and input is not focused, reset buffer
                if (timeDiff > 150 && document.activeElement !== barcodeInputRef.current) {
                    scannerBufferRef.current = '';
                }

                scannerBufferRef.current += e.key;

                // If barcode input is not focused, automatically redirect focus so characters flow directly
                if (document.activeElement !== barcodeInputRef.current) {
                    barcodeInputRef.current?.focus();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [katalog, cart, searchQuery, pelangganList]);

    // Filtered Products
    const filteredProducts = katalog.filter((p) => {
        const matchesCategory = selectedKategori === '' || String(p.id_kategori) === String(selectedKategori);
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
            q === '' ||
            p.nama_produk.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toLowerCase().includes(q));

        return matchesCategory && matchesQuery;
    });

    // Add to Cart
    const addToCart = (product) => {
        if (product.stok <= 0) {
            alert(`Stok produk "${product.nama_produk}" habis (0 unit)!`);
            return;
        }

        setCart((prev) => {
            const existingIndex = prev.findIndex((item) => item.id_produk === product.id_produk);

            if (existingIndex > -1) {
                const currentQty = prev[existingIndex].jumlah;
                if (currentQty >= product.stok) {
                    alert(`Stok produk "${product.nama_produk}" hanya tersisa ${product.stok} unit.`);
                    return prev;
                }
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    jumlah: currentQty + 1,
                    subtotal: (currentQty + 1) * product.harga,
                };
                return updated;
            } else {
                return [
                    ...prev,
                    {
                        id_produk: product.id_produk,
                        nama_produk: product.nama_produk,
                        brand: product.brand,
                        harga: product.harga,
                        stok_maks: product.stok,
                        jumlah: 1,
                        subtotal: product.harga,
                        foto: product.foto,
                    },
                ];
            }
        });
    };

    // Update Quantity in Cart
    const updateQuantity = (id_produk, delta) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.id_produk === id_produk) {
                        const newQty = item.jumlah + delta;
                        if (newQty <= 0) return null;
                        if (newQty > item.stok_maks) {
                            alert(`Maksimal stok tercapai: ${item.stok_maks}`);
                            return item;
                        }
                        return {
                            ...item,
                            jumlah: newQty,
                            subtotal: newQty * item.harga,
                        };
                    }
                    return item;
                })
                .filter(Boolean);
        });
    };

    // Remove item from Cart
    const removeFromCart = (id_produk) => {
        setCart((prev) => prev.filter((item) => item.id_produk !== id_produk));
    };

    // Clear Cart
    const clearCart = () => {
        if (cart.length === 0) return;
        if (confirm('Kosongkan semua barang dari keranjang belanja?')) {
            setCart([]);
            setDiskonNominal(0);
            setUangDiterima('');
        }
    };

    // Selected Customer & RFID Member 5% Status
    const selectedCustomerObj = (pelangganList || []).find(
        (c) => String(c.id_pelanggan) === String(selectedPelanggan)
    );
    const isMember = Boolean(selectedCustomerObj && selectedCustomerObj.no_kartu);

    // Calculations
    const subtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
    // 5% discount for RFID member
    const diskonMemberNominal = isMember ? Math.round(subtotal * 0.05) : 0;
    const diskonTambahanNominal = Number(diskonNominal) || 0;
    const totalDiskon = diskonMemberNominal + diskonTambahanNominal;
    const diskonSafe = Math.min(totalDiskon, subtotal);
    const subtotalAfterDiskon = Math.max(0, subtotal - diskonSafe);

    // Tax calculation based on store settings
    const pajakPersen = toko?.pajak_aktif ? Number(toko.pajak_persen || 0) : 0;
    const pajakNominal = pajakPersen > 0 ? (subtotalAfterDiskon * pajakPersen) / 100 : 0;
    const totalPembayaran = subtotalAfterDiskon + pajakNominal;

    const nominalUangDiterima = Number(uangDiterima) || 0;
    const kembalian =
        metodePembayaran === 'tunai'
            ? Math.max(0, nominalUangDiterima - totalPembayaran)
            : 0;

    // Quick cash buttons
    const setQuickCash = (amount) => {
        setUangDiterima(amount);
    };

    // Handle Quick Add Customer
    const handleQuickAddCustomer = (e) => {
        e.preventDefault();
        if (!newCustomerName.trim()) return;

        router.post(
            '/pelanggan',
            {
                nama_pelanggan: newCustomerName,
                no_kartu: newCustomerRfid ? newCustomerRfid.trim() : null,
                no_hp: newCustomerPhone,
                alamat: newCustomerAddress,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCustomerModalOpen(false);
                    setNewCustomerName('');
                    setNewCustomerRfid('');
                    setNewCustomerPhone('');
                    setNewCustomerAddress('');
                    setTimeout(() => {
                        barcodeInputRef.current?.focus();
                    }, 100);
                },
            }
        );
    };

    // Process Transaction (Bayar)
    const handleCheckout = (withPrint = true) => {
        if (cart.length === 0) {
            alert('Keranjang belanja kosong!');
            return;
        }

        if (metodePembayaran === 'tunai' && nominalUangDiterima < totalPembayaran) {
            alert(`Uang diterima (${formatRupiah(nominalUangDiterima)}) kurang dari total pembayaran (${formatRupiah(totalPembayaran)})!`);
            return;
        }

        setAutoPrintTrigger(withPrint);
        setIsSubmitting(true);

        router.post(
            '/pos/checkout',
            {
                items: cart.map((i) => ({
                    id_produk: i.id_produk,
                    jumlah: i.jumlah,
                })),
                id_pelanggan: selectedPelanggan || null,
                metode_pembayaran: metodePembayaran,
                diskon: diskonSafe,
                uang_diterima: metodePembayaran === 'tunai' ? nominalUangDiterima : totalPembayaran,
                catatan: catatan
                    ? (isMember ? `[RFID Member 5%: ${selectedCustomerObj.no_kartu}] ${catatan}` : catatan)
                    : (isMember ? `[RFID Member 5%: ${selectedCustomerObj.no_kartu}]` : null),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kasir Toko - POS Terminal" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* =========================================
                    LEFT SECTION (COL 7 / 8): CATALOG & SEARCH
                   ========================================= */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    {/* 1. ETALASE PRODUK OTOMATIS (FEATURED SHOWCASE) */}
                    <EtalaseOtomatis products={featured} onAddToCart={addToCart} cart={cart} />

                    {/* 2. SEARCH & BARCODE SCANNER TOOLBAR */}
                    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-soft">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                                    <Barcode className="w-5 h-5" />
                                </div>
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleBarcodeKeyDown}
                                    placeholder="Scan barcode USB / ketik nama / SKU (Tekan Enter)..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] font-bold text-emerald-700 shrink-0">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="hidden md:inline">Scanner USB Siap</span>
                                    <span className="md:hidden">USB Siap</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        barcodeInputRef.current?.focus();
                                        barcodeInputRef.current?.select();
                                    }}
                                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 cursor-pointer transition-colors"
                                    title="Klik atau tekan F2 untuk fokus scanner"
                                >
                                    F2: Barcode
                                </button>
                            </div>
                        </div>

                        {/* Scanner Feedback Live Toast Banner */}
                        {scanFeedback && (
                            <div
                                className={`mt-3 p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in slide-in-from-top-1 duration-200 shadow-sm ${
                                    scanFeedback.type === 'member'
                                        ? 'bg-purple-50 border-purple-300 text-purple-950 ring-2 ring-purple-400/20'
                                        : scanFeedback.type === 'success'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                        : 'bg-rose-50 border-rose-300 text-rose-900'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {scanFeedback.type === 'member' ? (
                                        <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                    ) : scanFeedback.type === 'success' ? (
                                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                    <span>{scanFeedback.message}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setScanFeedback(null)}
                                    className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 pt-1">
                            <button
                                type="button"
                                onClick={() => setSelectedKategori('')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                                    selectedKategori === ''
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                            >
                                Semua Produk ({katalog.length})
                            </button>
                            {kategoriList.map((kat) => {
                                const countInKat = katalog.filter(
                                    (p) => String(p.id_kategori) === String(kat.id_kategori)
                                ).length;
                                return (
                                    <button
                                        key={kat.id_kategori}
                                        type="button"
                                        onClick={() => setSelectedKategori(kat.id_kategori)}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                                            String(selectedKategori) === String(kat.id_kategori)
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {kat.nama_kategori} ({countInKat})
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. PRODUCT CATALOG GRID (PINTEREST / AMAZON INSPIRED) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 shadow-soft">
                                <Package className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                                <h4 className="text-base font-bold text-slate-700">Produk Tidak Ditemukan</h4>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                    Tidak ada produk yang cocok dengan kata kunci "{searchQuery}". Pastikan barcode atau ejaan benar.
                                </p>
                            </div>
                        ) : (
                            filteredProducts.map((p) => {
                                const inCartItem = cart.find((i) => i.id_produk === p.id_produk);
                                const inCartQty = inCartItem ? inCartItem.jumlah : 0;
                                const sisaStok = Math.max(0, p.stok - inCartQty);
                                const isHabis = p.stok <= 0;
                                const isCartMax = !isHabis && sisaStok <= 0;

                                return (
                                    <div
                                        key={p.id_produk}
                                        onClick={() => !isHabis && !isCartMax && addToCart(p)}
                                        className={`group relative bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                                            isHabis
                                                ? 'opacity-65 bg-slate-50 border-slate-200 cursor-not-allowed'
                                                : isCartMax
                                                ? 'border-amber-300 bg-amber-50/20 shadow-soft cursor-not-allowed'
                                                : inCartItem
                                                ? 'border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20 cursor-pointer'
                                                : 'border-slate-100 shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-blue-300 cursor-pointer'
                                        }`}
                                    >
                                        {/* Product Image */}
                                        <div className="relative aspect-square w-full rounded-xl bg-slate-100 mb-2.5 overflow-hidden flex items-center justify-center border border-slate-100">
                                            {p.foto ? (
                                                <img
                                                    src={p.foto}
                                                    alt={p.nama_produk}
                                                    className={`w-full h-full object-cover transition-transform duration-300 ${isHabis ? 'grayscale' : 'group-hover:scale-105'}`}
                                                />
                                            ) : (
                                                <Package className={`w-8 h-8 text-slate-300 transition-colors ${!isHabis && 'group-hover:text-blue-400'}`} />
                                            )}

                                            {/* In-Cart Badge */}
                                            {inCartQty > 0 && (
                                                <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-md animate-in zoom-in-75">
                                                    <ShoppingCart className="w-3 h-3" />
                                                    <span>{inCartQty}</span>
                                                </span>
                                            )}

                                            {/* Stock badge */}
                                            <span
                                                className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-xs ${
                                                    isHabis
                                                        ? 'bg-rose-600 text-white'
                                                        : isCartMax
                                                        ? 'bg-amber-600 text-white'
                                                        : sisaStok <= p.stok_minimum
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-emerald-600 text-white'
                                                }`}
                                            >
                                                <Boxes className="w-2.5 h-2.5" />
                                                <span>
                                                    {isHabis
                                                        ? 'Habis'
                                                        : isCartMax
                                                        ? 'Maks di Cart'
                                                        : `Sisa: ${sisaStok}`}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                {p.brand ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                                        {p.brand}
                                                    </span>
                                                ) : <span />}
                                                <span className="text-[9px] font-mono text-slate-400">
                                                    {p.sku || p.barcode || ''}
                                                </span>
                                            </div>
                                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                                {p.nama_produk}
                                            </h4>

                                            {/* Dedicated Prominent Stock Box */}
                                            <div className="mt-2 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                    <span>Stok Toko:</span>
                                                </span>
                                                <span
                                                    className={`text-xs font-black font-mono flex items-center gap-1 ${
                                                        isHabis
                                                            ? 'text-rose-600'
                                                            : sisaStok <= p.stok_minimum
                                                            ? 'text-amber-600'
                                                            : 'text-emerald-700'
                                                    }`}
                                                >
                                                    {isHabis ? (
                                                        '0 (Habis)'
                                                    ) : (
                                                        <>
                                                            <span>{sisaStok} unit</span>
                                                            {inCartQty > 0 && (
                                                                <span className="text-[10px] font-normal text-slate-400">
                                                                    ({p.stok} total)
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                                    Harga
                                                </span>
                                                <span className="font-mono text-xs sm:text-sm font-extrabold text-blue-700">
                                                    {formatRupiah(p.harga)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isHabis || isCartMax}
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                                    isHabis || isCartMax
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shadow-xs cursor-pointer'
                                                }`}
                                                title={isHabis ? 'Stok habis' : isCartMax ? 'Maksimal stok tercapai' : '+ Keranjang'}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* =========================================
                    RIGHT SECTION (COL 5 / 4): POS CART & PAY
                   ========================================= */}
                <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-card p-4 sm:p-5 flex flex-col sticky top-20">
                    {/* Cart Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900">Keranjang Kasir</h3>
                                <p className="text-[11px] text-slate-400">{cart.length} jenis produk</p>
                            </div>
                        </div>

                        {cart.length > 0 && (
                            <button
                                type="button"
                                onClick={clearCart}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Kosongkan Keranjang"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Customer Selection */}
                    <div className="py-3 border-b border-slate-100">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-purple-600" />
                                <span>Pelanggan / Member RFID</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setCustomerModalOpen(true)}
                                className="text-blue-600 hover:underline flex items-center gap-0.5 lowercase text-[11px]"
                            >
                                <UserPlus className="w-3 h-3" />
                                <span>+ Pelanggan baru</span>
                            </button>
                        </label>

                        <div className="relative">
                            <select
                                value={selectedPelanggan}
                                onChange={(e) => setSelectedPelanggan(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition-colors ${
                                    isMember
                                        ? 'bg-purple-50/60 border-purple-300 text-purple-950 font-bold focus:ring-purple-500/20 focus:border-purple-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500/20 focus:border-blue-500'
                                }`}
                            >
                                <option value="">-- Pelanggan Umum (Walk-in) --</option>
                                {pelangganList.map((c) => (
                                    <option key={c.id_pelanggan} value={c.id_pelanggan}>
                                        {c.no_kartu ? `★ [MEMBER 5%] ${c.nama_pelanggan} (RFID: ${c.no_kartu})` : `${c.nama_pelanggan} ${c.no_hp ? `(${c.no_hp})` : ''}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Member Active Status Card */}
                        {isMember && selectedCustomerObj && (
                            <div className="mt-2 p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 font-black text-purple-950">
                                            <span>{selectedCustomerObj.nama_pelanggan}</span>
                                            <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded font-black text-[9px] tracking-wider uppercase border border-purple-300">
                                                DISKON 5%
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-purple-700 font-semibold mt-0.5">
                                            RFID: {selectedCustomerObj.no_kartu}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPelanggan('')}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5"
                                    title="Lepas status member"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {!isMember && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                <CreditCard className="w-3 h-3 text-purple-400 shrink-0" />
                                <span>Tap kartu RFID di scanner/reader untuk diskon 5%</span>
                            </div>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto max-h-[300px] py-3 space-y-2.5 divide-y divide-slate-100">
                        {cart.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <ShoppingCart className="w-10 h-10 mx-auto text-slate-200 mb-2 stroke-1" />
                                <p className="text-xs font-semibold text-slate-500">Keranjang Masih Kosong</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Klik produk di katalog atau scan barcode untuk menambahkan
                                </p>
                            </div>
                        ) : (
                            cart.map((item) => {
                                const sisaStokToko = Math.max(0, item.stok_maks - item.jumlah);
                                const isMaks = item.jumlah >= item.stok_maks;

                                return (
                                    <div key={item.id_produk} className="pt-2.5 pb-1 first:pt-0 flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-bold text-slate-800 truncate">
                                                {item.nama_produk}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-mono font-bold text-blue-700">
                                                    {formatRupiah(item.harga)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    &bull; Sisa stok: <strong className={sisaStokToko <= 2 ? 'text-amber-600 font-mono font-bold' : 'text-slate-600 font-mono font-bold'}>{sisaStokToko}</strong> unit
                                                </span>
                                            </div>
                                        </div>

                                        {/* Qty controls */}
                                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id_produk, -1)}
                                                className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                                title="Kurangi 1"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center font-mono font-bold text-xs text-slate-800">
                                                {item.jumlah}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id_produk, 1)}
                                                disabled={isMaks}
                                                className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                                                title={isMaks ? `Maksimal stok tercapai (${item.stok_maks})` : 'Tambah 1'}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Subtotal */}
                                        <div className="text-right font-mono text-xs font-bold text-slate-900 w-20">
                                            {formatRupiah(item.subtotal)}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.id_produk)}
                                            className="text-slate-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                            title="Hapus dari keranjang"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Summary & Calculations */}
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        {/* Subtotal */}
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal Belanja</span>
                            <span className="font-mono font-medium text-slate-800">{formatRupiah(subtotal)}</span>
                        </div>

                        {/* Diskon Member RFID 5% */}
                        {isMember && (
                            <div className="flex items-center justify-between text-purple-800 bg-purple-50/90 px-2.5 py-1.5 rounded-xl border border-purple-200">
                                <span className="flex items-center gap-1.5 font-bold">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Diskon Member RFID (5%)</span>
                                </span>
                                <span className="font-mono font-black text-purple-900">
                                    -{formatRupiah(diskonMemberNominal)}
                                </span>
                            </div>
                        )}

                        {/* Diskon Tambahan / Manual */}
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1">
                                <Percent className="w-3 h-3 text-emerald-600" />
                                <span>{isMember ? 'Diskon Tambahan (Rp)' : 'Diskon (Rp)'}</span>
                            </span>
                            <input
                                type="number"
                                min="0"
                                value={diskonNominal || ''}
                                onChange={(e) => setDiskonNominal(Number(e.target.value) || 0)}
                                placeholder="0"
                                className="w-24 px-2 py-1 text-right font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Total Diskon if any */}
                        {totalDiskon > 0 && isMember && (
                            <div className="flex justify-between text-emerald-600 font-bold text-[11px] px-1">
                                <span>Total Potongan Diskon</span>
                                <span className="font-mono">-{formatRupiah(diskonSafe)}</span>
                            </div>
                        )}

                        {/* Pajak */}
                        {pajakPersen > 0 && (
                            <div className="flex justify-between text-slate-500">
                                <span>Pajak (PPN {pajakPersen}%)</span>
                                <span className="font-mono text-slate-800">+{formatRupiah(pajakNominal)}</span>
                            </div>
                        )}

                        {/* TOTAL AKHIR */}
                        <div className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                            isMember
                                ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-purple-200'
                                : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-100'
                        }`}>
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isMember ? 'text-purple-700' : 'text-blue-600'}`}>
                                    Total Tagihan {isMember ? '(Hemat 5%)' : ''}
                                </span>
                                <div className={`text-xl sm:text-2xl font-black font-mono ${isMember ? 'text-purple-950' : 'text-blue-900'}`}>
                                    {formatRupiah(totalPembayaran)}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-white font-extrabold text-[10px] uppercase ${isMember ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                {metodePembayaran}
                            </span>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="pt-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Metode Pembayaran
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMetodePembayaran('tunai')}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        metodePembayaran === 'tunai'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <Banknote className="w-3.5 h-3.5" />
                                    <span>Tunai</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMetodePembayaran('qris')}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        metodePembayaran === 'qris'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>QRIS</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMetodePembayaran('transfer')}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        metodePembayaran === 'transfer'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Transfer</span>
                                </button>
                            </div>
                        </div>

                        {/* Cash Input & Change Calculation */}
                        {metodePembayaran === 'tunai' && (
                            <div className="space-y-2 pt-1">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                        Nominal Uang Tunai Diterima (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={uangDiterima}
                                        onChange={(e) => setUangDiterima(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                {/* Quick Cash Buttons */}
                                <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setQuickCash(totalPembayaran)}
                                        className="py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                        Uang Pas
                                    </button>
                                    {[20000, 50000, 100000].map((nominal) => (
                                        <button
                                            key={nominal}
                                            type="button"
                                            onClick={() => setQuickCash(nominal)}
                                            className="py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                                        >
                                            {formatRupiah(nominal).replace(',00', '')}
                                        </button>
                                    ))}
                                </div>

                                {/* Kembalian Display */}
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200/80">
                                    <span className="text-xs font-bold text-slate-600">Kembalian Kasir:</span>
                                    <span
                                        className={`font-mono text-sm font-black ${
                                            nominalUangDiterima >= totalPembayaran
                                                ? 'text-emerald-700'
                                                : 'text-rose-600'
                                        }`}
                                    >
                                        {formatRupiah(kembalian)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Checkout Buttons */}
                    <div className="pt-4 border-t border-slate-100 space-y-2 mt-2">
                        {/* 1. BAYAR & CETAK STRUK */}
                        <button
                            type="button"
                            onClick={() => handleCheckout(true)}
                            disabled={isSubmitting || cart.length === 0}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>
                                {isSubmitting ? 'Memproses Transaksi...' : 'BAYAR & CETAK STRUK (80mm)'}
                            </span>
                        </button>

                        {/* 2. BAYAR TANPA CETAK */}
                        <button
                            type="button"
                            onClick={() => handleCheckout(false)}
                            disabled={isSubmitting || cart.length === 0}
                            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                        >
                            <Check className="w-3.5 h-3.5 text-slate-500" />
                            <span>Bayar Tanpa Cetak</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Add Customer Modal */}
            {customerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <UserPlus className="w-4 h-4 text-blue-600" />
                                <span>Tambah Member Cepat</span>
                            </h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomerModalOpen(false);
                                    setTimeout(() => barcodeInputRef.current?.focus(), 100);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickAddCustomer} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Nama Pelanggan <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    placeholder="Contoh: Rina Kusuma"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Nomor Kartu RFID Member */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Nomor Kartu RFID (Opsional)</span>
                                    </span>
                                    <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                        Diskon 5%
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={newCustomerRfid}
                                    onChange={(e) => setNewCustomerRfid(e.target.value)}
                                    placeholder="Tap kartu RFID di USB reader..."
                                    className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    No. Handphone / WA
                                </label>
                                <input
                                    type="text"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    placeholder="08123456789"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Alamat Singkat
                                </label>
                                <input
                                    type="text"
                                    value={newCustomerAddress}
                                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                                    placeholder="Kota / Daerah"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomerModalOpen(false);
                                        setTimeout(() => barcodeInputRef.current?.focus(), 100);
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Simpan Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Thermal Receipt Preview & Printing Modal */}
            {receiptModalData && (
                <ThermalReceipt
                    receipt={receiptModalData}
                    autoPrint={autoPrintTrigger}
                    onClose={handleCloseReceiptModal}
                />
            )}
        </AuthenticatedLayout>
    );
}
