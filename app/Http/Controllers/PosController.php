<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use App\Models\Pelanggan;
use App\Models\Pengaturan;
use App\Models\Produk;
use App\Models\StokMutasi;
use App\Models\Transaksi;
use App\Services\PosCheckoutService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        protected PosCheckoutService $checkoutService
    ) {}

    /**
     * Display POS Cashier interface.
     */
    public function index(Request $request): Response
    {
        // Active products for POS catalogue
        $produk = Produk::with('kategori')
            ->where('status', 'aktif')
            ->whereHas('kategori', fn ($query) => $query->where('nama_kategori', '!=', 'Top-up Saldo'))
            ->orderBy('nama_produk', 'asc')
            ->get();

        // Featured products for the automatic rotating showcase
        $featured = Produk::with('kategori')
            ->where('status', 'aktif')
            ->whereHas('kategori', fn ($query) => $query->where('nama_kategori', '!=', 'Top-up Saldo'))
            ->where('is_featured', true)
            ->get();

        $kategoriList = Kategori::where('nama_kategori', '!=', 'Top-up Saldo')->orderBy('nama_kategori', 'asc')->get();
        $pelangganList = Pelanggan::orderBy('nama_pelanggan', 'asc')->get();
        $toko = Pengaturan::getToko();
        $pesananOnline = Transaksi::with(['kasir', 'pelanggan', 'details.produk'])
            ->whereNotNull('alamat_pengiriman')
            ->where('status', 'menunggu')
            ->latest('id_transaksi')
            ->limit(20)
            ->get()
            ->map(fn (Transaksi $transaction): array => [
                'id_transaksi' => $transaction->id_transaksi,
                'nomor_transaksi' => $transaction->nomor_transaksi,
                'pelanggan' => $transaction->pelanggan?->nama_pelanggan,
                'total_belanja' => $transaction->total_belanja,
                'tanggal' => $transaction->tanggal?->format('d/m/Y'),
            ]);

        return Inertia::render('Pos/Index', [
            'katalog' => $produk,
            'featured' => $featured,
            'kategoriList' => $kategoriList,
            'pelangganList' => $pelangganList,
            'toko' => $toko,
            'pesananOnline' => $pesananOnline,
            'duitkuConfigured' => filled(config('payment.duitku.merchant_code')) && filled(config('payment.duitku.api_key')),
            'paymentMethods' => $this->getPaymentMethods(),
            'paymentMethodsError' => session('posPaymentMethodsError') ?: (filled(config('payment.duitku.merchant_code')) && filled(config('payment.duitku.api_key')) ? null : 'Duitku merchant belum diatur pada server. Isi Merchant Code dan API Key di .env, lalu jalankan php artisan config:clear.'),
            'pendingDuitku' => $request->session()->get('pendingDuitku') ?? Transaksi::where('id_user', $request->user()->id)
                ->where('metode_pembayaran', 'duitku')->where('status', 'menunggu')->latest('id_transaksi')->get()
                ->map(fn (Transaksi $transaction): array => [
                    'transaction_id' => $transaction->id_transaksi,
                    'order_id' => $transaction->duitku_order_id,
                    'payment_url' => $transaction->catatan && preg_match('/Duitku URL: (\S+)/', $transaction->catatan, $matches) ? $matches[1] : null,
                ])->first(),
        ]);
    }

    /**
     * Process POS checkout.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id_produk' => ['required', 'integer'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'id_pelanggan' => ['nullable', 'integer'],
            'metode_pembayaran' => ['required', 'in:tunai,transfer,qris,saldo,duitku'],
            'duitku_payment_method' => ['required_if:metode_pembayaran,duitku', 'nullable', 'string', 'size:2'],
            'diskon' => ['nullable', 'numeric', 'min:0'],
            'uang_diterima' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validated['metode_pembayaran'] === 'saldo' && empty($validated['id_pelanggan'])) {
            throw ValidationException::withMessages([
                'id_pelanggan' => 'Pilih pelanggan untuk pembayaran saldo.',
            ]);
        }

        if ($validated['metode_pembayaran'] === 'duitku') {
            return $this->createDuitkuPayment($validated);
        }

        $transaksi = $this->checkoutService->checkout($validated);
        $strukData = $this->checkoutService->getReceiptData($transaksi);

        return redirect()->route('pos.index')->with([
            'success' => "Transaksi {$transaksi->nomor_transaksi} berhasil diproses! Stok produk otomatis terpotong.",
            'struk' => $strukData,
        ]);
    }

    /**
     * Get receipt data for reprint.
     */
    public function getReceipt($id)
    {
        $transaksi = Transaksi::with(['kasir', 'pelanggan', 'details.produk'])->findOrFail($id);
        $strukData = $this->checkoutService->getReceiptData($transaksi);

        return response()->json($strukData);
    }

    public function checkDuitkuPayment(Request $request, int $transaction): RedirectResponse
    {
        $transaction = Transaksi::where('id_transaksi', $transaction)
            ->where('id_user', $request->user()->id)
            ->where('metode_pembayaran', 'duitku')
            ->firstOrFail();

        if ($transaction->status === 'selesai') {
            return back()->with(['success' => 'Pembayaran sudah terverifikasi.', 'struk' => $this->checkoutService->getReceiptData($transaction)]);
        }

        if ($transaction->status !== 'menunggu') {
            return back()->with('error', 'Transaksi ini tidak menunggu pembayaran.');
        }

        if ($this->checkDuitkuStatus($transaction)) {
            $transaction->refresh();

            return back()->with(['success' => 'Pembayaran terverifikasi Duitku. Silakan cetak struk.', 'struk' => $this->checkoutService->getReceiptData($transaction)]);
        }

        return back()->with('info', 'Duitku belum mengonfirmasi pembayaran berhasil. Transaksi dan stok belum diselesaikan.');
    }

    private function getPaymentMethods(): array
    {
        $merchantCode = config('payment.duitku.merchant_code');
        $apiKey = config('payment.duitku.api_key');

        if (! filled($merchantCode) || ! filled($apiKey)) {
            return [];
        }

        $amount = 10000;
        $datetime = now()->format('Y-m-d H:i:s');

        try {
            $response = Http::withOptions($this->duitkuHttpOptions())->acceptJson()->asJson()->connectTimeout(5)->timeout(10)
                ->post(rtrim(config('payment.duitku.base_url'), '/').'/webapi/api/merchant/paymentmethod/getpaymentmethod', [
                    'merchantcode' => $merchantCode,
                    'amount' => $amount,
                    'datetime' => $datetime,
                    'signature' => hash_hmac('sha256', $merchantCode.$amount.$datetime, $apiKey),
                ]);

            if ($response->successful() && $response->json('responseCode') === '00') {
                $methods = collect($response->json('paymentFee', []))->map(fn (array $method): array => [
                    'code' => $method['paymentMethod'],
                    'name' => $method['paymentName'],
                    'image' => $method['paymentImage'] ?? null,
                    'fee' => $method['totalFee'] ?? '0',
                ])->values();

                if ($methods->isEmpty()) {
                    session()->flash('posPaymentMethodsError', 'Duitku merespons sukses tetapi tidak mengirim channel pembayaran untuk konfigurasi merchant ini.');
                }

                return $methods->all();
            }
            Log::warning('POS Duitku payment channel lookup rejected.', [
                'http_status' => $response->status(),
                'response_code' => $response->json('responseCode'),
                'response_message' => $response->json('responseMessage'),
            ]);
            $gatewayMessage = $response->json('Message') ?? $response->json('responseMessage') ?? $response->json('statusMessage');
            session()->flash('posPaymentMethodsError', 'Duitku tidak mengembalikan daftar channel. HTTP '.$response->status().'; '.($gatewayMessage ?: 'periksa konfigurasi Sandbox Merchant.'));
        } catch (ConnectionException|RequestException $exception) {
            Log::warning('POS could not load Duitku payment methods.', ['message' => $exception->getMessage()]);
            session()->flash('posPaymentMethodsError', 'Server tidak dapat menghubungi Duitku: '.$exception->getMessage());
        }

        return [];
    }

    private function createDuitkuPayment(array $data): RedirectResponse
    {
        $merchantCode = (string) config('payment.duitku.merchant_code');
        $apiKey = (string) config('payment.duitku.api_key');
        if ($merchantCode === '' || $apiKey === '') {
            return back()->with('error', 'Pembayaran Duitku belum dikonfigurasi.');
        }

        $customer = ! empty($data['id_pelanggan']) ? Pelanggan::find($data['id_pelanggan']) : null;
        $shop = Pengaturan::getToko();
        $amount = $this->checkoutService->calculateTotal($data);
        if ($amount <= 0) {
            return back()->with('error', 'Total pembayaran harus lebih dari Rp0.');
        }

        $pendingTransaction = Transaksi::where('id_user', auth()->id())
            ->where('metode_pembayaran', 'duitku')
            ->where('status', 'menunggu')
            ->exists();
        if ($pendingTransaction) {
            return back()->with('error', 'Selesaikan atau cek pembayaran Duitku yang masih menunggu sebelum membuat transaksi baru.');
        }

        $orderId = 'POS-'.now()->format('YmdHis').'-'.Str::upper(Str::random(8));
        $signature = hash_hmac('sha256', $merchantCode.$orderId.$amount, $apiKey);

        try {
            $response = Http::withOptions($this->duitkuHttpOptions())->acceptJson()->asJson()->connectTimeout(5)->timeout(15)
                ->post(rtrim(config('payment.duitku.base_url'), '/').'/webapi/api/merchant/v2/inquiry', [
                    'merchantCode' => $merchantCode,
                    'paymentAmount' => $amount,
                    'paymentMethod' => $data['duitku_payment_method'],
                    'merchantOrderId' => $orderId,
                    'productDetails' => 'Pembayaran transaksi POS TOKOKITA',
                    'customerVaName' => mb_substr($customer?->nama_pelanggan ?? 'Pelanggan TOKOKITA', 0, 20),
                    'email' => $customer?->email ?: 'customer@tokokita.local',
                    'phoneNumber' => $customer?->no_hp,
                    'itemDetails' => [[
                        'name' => 'Pembayaran POS TOKOKITA',
                        'price' => $amount,
                        'quantity' => 1,
                    ]],
                    'callbackUrl' => route('wallet.notification'),
                    'returnUrl' => route('wallet.return'),
                    'signature' => $signature,
                    'expiryPeriod' => (int) config('payment.duitku.expiry_period', 1440),
                ]);
        } catch (ConnectionException $exception) {
            Log::warning('POS Duitku inquiry connection failed.', ['order_id' => $orderId, 'message' => $exception->getMessage()]);

            return back()->with('error', 'Tidak dapat menghubungi Duitku. Keranjang tetap tersimpan; silakan coba checkout kembali.');
        }

        if (! $response->successful() || $response->json('statusCode') !== '00' || ! $response->json('paymentUrl')) {
            Log::warning('POS Duitku inquiry rejected.', ['order_id' => $orderId, 'status' => $response->status(), 'response' => $response->json()]);

            $gatewayMessage = $response->json('Message') ?? $response->json('statusMessage') ?? $response->json('responseMessage');
            return back()->with('error', 'Duitku menolak permintaan POS (HTTP '.$response->status().'): '.($gatewayMessage ?: 'periksa channel, nominal, dan kredensial merchant.'));
        }

        $checkoutData = [...$data, 'metode_pembayaran' => 'transfer', 'duitku_order_id' => $orderId, 'uang_diterima' => 0];
        $transaction = $this->checkoutService->checkout($checkoutData);

        $transaction->update([
            'metode_pembayaran' => 'duitku',
            'duitku_order_id' => $orderId,
            'duitku_reference' => $response->json('reference'),
            'catatan' => trim(($transaction->catatan ? $transaction->catatan.' | ' : '').'Channel Duitku: '.$data['duitku_payment_method'].' | Duitku URL: '.$response->json('paymentUrl')),
        ]);

        return back()->with([
            'success' => 'Pembayaran Duitku dibuat. Selesaikan QRIS, lalu tekan Cek pembayaran untuk menutup transaksi dan mencetak struk.',
            'pendingDuitku' => [
                'transaction_id' => $transaction->id_transaksi,
                'order_id' => $orderId,
                'payment_url' => $response->json('paymentUrl'),
            ],
        ]);
    }

    private function checkDuitkuStatus(Transaksi $transaction): bool
    {
        $merchantCode = (string) config('payment.duitku.merchant_code');
        $apiKey = (string) config('payment.duitku.api_key');
        $orderId = (string) $transaction->duitku_order_id;

        try {
            $response = Http::withOptions($this->duitkuHttpOptions())->acceptJson()->asJson()->connectTimeout(5)->timeout(10)
                ->post(rtrim(config('payment.duitku.base_url'), '/').'/webapi/api/merchant/transactionStatus', [
                    'merchantCode' => $merchantCode,
                    'merchantOrderId' => $orderId,
                    'signature' => hash_hmac('sha256', $merchantCode.$orderId, $apiKey),
                ]);
        } catch (ConnectionException $exception) {
            Log::warning('POS Duitku status check connection failed.', ['order_id' => $orderId, 'message' => $exception->getMessage()]);

            return false;
        }

        if (! $response->successful() || (string) $response->json('statusCode') !== '00' || (int) ($response->json('amount') ?? $response->json('Amount')) !== (int) $transaction->total_belanja) {
            return false;
        }

        return $this->completeVerifiedDuitkuTransaction($transaction, $response->json('reference'));
    }

    private function completeVerifiedDuitkuTransaction(Transaksi $transaction, ?string $reference): bool
    {
        return DB::transaction(function () use ($transaction, $reference): bool {
            $locked = Transaksi::whereKey($transaction->id_transaksi)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'selesai') {
                return true;
            }
            if ($locked->status !== 'menunggu') {
                return false;
            }

            $locked->update([
                'status' => 'selesai',
                'uang_diterima' => $locked->total_belanja,
                'duitku_reference' => $reference ?? $locked->duitku_reference,
            ]);

            $locked->load('details');
            foreach ($locked->details as $detail) {
                $product = Produk::whereKey($detail->id_produk)->lockForUpdate()->firstOrFail();
                if ($product->stok < $detail->jumlah) {
                    throw ValidationException::withMessages(['items' => "Stok produk {$product->nama_produk} berubah dan tidak mencukupi untuk menyelesaikan pembayaran."]);
                }

                $stockBefore = $product->stok;
                $product->decrement('stok', $detail->jumlah);
                $product->refresh();
                StokMutasi::create([
                    'id_produk' => $product->id_produk,
                    'jenis' => 'penjualan',
                    'jumlah' => $detail->jumlah,
                    'stok_sebelum' => $stockBefore,
                    'stok_sesudah' => $product->stok,
                    'id_user' => $locked->id_user,
                    'keterangan' => "Penjualan kasir faktur {$locked->nomor_transaksi} (Duitku)",
                ]);
            }

            return true;
        });
    }

    /** @return array{verify: string|bool} */
    private function duitkuHttpOptions(): array
    {
        $caBundle = config('payment.duitku.ca_bundle');

        return ['verify' => is_string($caBundle) && File::exists($caBundle) ? $caBundle : true];
    }
}
