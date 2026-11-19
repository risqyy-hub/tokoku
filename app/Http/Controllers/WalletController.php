<?php

namespace App\Http\Controllers;

use App\Models\Pelanggan;
use App\Models\SaldoMutasi;
use App\Models\Topup;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');

        $merchantCode = config('payment.duitku.merchant_code');
        $apiKey = config('payment.duitku.api_key');
        $configured = filled($merchantCode) && filled($apiKey);
        $paymentMethods = [];

        $requestError = null;

        if ($configured) {
            $amount = 10000;
            $datetime = now()->format('Y-m-d H:i:s');
            $signature = hash_hmac('sha256', $merchantCode.$amount.$datetime, $apiKey);

            try {
                $response = Http::withOptions($this->duitkuHttpOptions())->acceptJson()->asJson()->connectTimeout(5)->timeout(10)
                    ->post(rtrim(config('payment.duitku.base_url'), '/').'/webapi/api/merchant/paymentmethod/getpaymentmethod', [
                        'merchantcode' => $merchantCode,
                        'amount' => $amount,
                        'datetime' => $datetime,
                        'signature' => $signature,
                    ]);

                if ($response->successful() && $response->json('responseCode') === '00') {
                    $paymentMethods = collect($response->json('paymentFee', []))
                        ->map(fn (array $method): array => [
                            'code' => $method['paymentMethod'],
                            'name' => $method['paymentName'],
                            'image' => $method['paymentImage'] ?? null,
                            'fee' => $method['totalFee'] ?? '0',
                        ])->values()->all();
                } else {
                    $gatewayError = match (true) {
                        $response->status() === 400 => 'Duitku menolak format/waktu request (HTTP 400). Periksa waktu server dan Merchant Code/API Key dari proyek Sandbox yang sama.',
                        $response->status() === 401 || $response->status() === 404 => 'Duitku menolak kredensial. Pastikan Merchant Code dan API Key berasal dari proyek Sandbox yang sama.',
                        default => 'Duitku belum mengembalikan channel pembayaran. HTTP '.$response->status().'. Coba lagi atau periksa status Sandbox merchant.',
                    };
                    Log::warning('Duitku payment method lookup returned an error.', [
                        'http_status' => $response->status(),
                        'gateway_message' => $response->json('Message') ?? $response->json('responseMessage'),
                        'datetime' => $datetime,
                    ]);
                    $requestError = 'Duitku: '.$gatewayError;
                }
            } catch (ConnectionException $exception) {
                Log::warning('Duitku payment method lookup failed.', ['message' => $exception->getMessage()]);
                $requestError = 'Server tidak dapat terhubung ke Duitku. Periksa koneksi internet.';
            } catch (RequestException $exception) {
                Log::warning('Duitku payment method response could not be processed.', ['message' => $exception->getMessage()]);
                $requestError = 'Respons Duitku tidak dapat diproses. Coba muat ulang beberapa saat lagi.';
            }
        }

        return Inertia::render('Wallet/Index', [
            'balance' => $customer->saldo,
            'topups' => Topup::where('id_pelanggan', $customer->id_pelanggan)->latest()->get(),
            'mutations' => SaldoMutasi::where('id_pelanggan', $customer->id_pelanggan)->latest()->limit(30)->get(),
            'duitkuConfigured' => $configured,
            'paymentMethods' => $paymentMethods,
            'paymentMethodsError' => $requestError ?? null,
        ]);
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'jumlah' => ['required', 'integer', 'min:10000', 'max:10000000'],
            'payment_method' => ['required', 'string', 'size:2'],
        ]);
        $merchantCode = config('payment.duitku.merchant_code');
        $apiKey = config('payment.duitku.api_key');
        if (! $merchantCode || ! $apiKey) {
            return back()->with('error', 'Payment gateway Duitku belum dikonfigurasi.');
        }

        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');
        $orderId = 'TOPUP-'.now()->format('YmdHis').'-'.Str::upper(Str::random(8));
        $topup = Topup::create(['order_id' => $orderId, 'id_pelanggan' => $customer->id_pelanggan, 'jumlah' => $data['jumlah']]);
        $signature = hash_hmac('sha256', $merchantCode.$orderId.$data['jumlah'], $apiKey);
        $customerName = mb_substr($customer->nama_pelanggan, 0, 20);

        try {
            $response = Http::withOptions($this->duitkuHttpOptions())->acceptJson()->asJson()->connectTimeout(5)->timeout(15)
                ->post(rtrim(config('payment.duitku.base_url'), '/').'/webapi/api/merchant/v2/inquiry', [
                    'merchantCode' => $merchantCode,
                    'paymentAmount' => (int) $data['jumlah'],
                    'paymentMethod' => $data['payment_method'],
                    'merchantOrderId' => $orderId,
                    'productDetails' => 'Top-up saldo TOKOKITA',
                    'customerVaName' => $customerName,
                    'email' => $customer->email ?: 'customer@tokokita.local',
                    'phoneNumber' => $customer->no_hp,
                    'itemDetails' => [[
                        'name' => 'Top-up saldo TOKOKITA',
                        'price' => (int) $data['jumlah'],
                        'quantity' => 1,
                    ]],
                    'callbackUrl' => route('wallet.notification'),
                    'returnUrl' => route('wallet.return'),
                    'signature' => $signature,
                    'expiryPeriod' => (int) config('payment.duitku.expiry_period', 1440),
                ]);

            if (! $response->successful() || $response->json('statusCode') !== '00' || ! $response->json('paymentUrl')) {
                $topup->update(['status' => 'failed']);
                Log::warning('Duitku rejected top-up request.', ['order_id' => $orderId, 'response' => $response->json()]);

                return back()->with('error', 'Duitku tidak dapat membuat pembayaran. Periksa channel pembayaran atau pengaturan merchant.');
            }
        } catch (ConnectionException $exception) {
            $topup->update(['status' => 'failed']);
            Log::warning('Duitku top-up request failed.', ['order_id' => $orderId, 'message' => $exception->getMessage()]);

            return back()->with('error', 'Tidak dapat terhubung ke payment gateway. Silakan coba kembali.');
        }

        $topup->update([
            'gateway_reference' => $response->json('reference'),
            'redirect_url' => $response->json('paymentUrl'),
            'payment_type' => $data['payment_method'],
        ]);

        return back()->with('success', 'Permintaan top-up dibuat. Halaman pembayaran Duitku dibuka di tab baru.')
            ->with('paymentUrl', $response->json('paymentUrl'));
    }

    public function check(Request $request, int $topup): RedirectResponse
    {
        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');

        $topup = Topup::where('id_topup', $topup)
            ->where('id_pelanggan', $customer->id_pelanggan)
            ->firstOrFail();

        if ($topup->status === 'paid') {
            return back()->with('success', 'Pembayaran ini sudah terverifikasi dan saldo telah ditambahkan.');
        }

        if ($topup->status !== 'pending') {
            return back()->with('info', 'Top-up ini tidak lagi menunggu pembayaran, jadi statusnya tidak diubah.');
        }

        if ($this->checkTransactionStatus($topup) === 'paid') {
            return back()->with('success', 'Pembayaran terverifikasi oleh Duitku. Saldo top-up sudah ditambahkan.');
        }

        return back()->with('info', 'Duitku belum melaporkan pembayaran sukses untuk transaksi ini. Saldo belum berubah.');
    }

    public function notification(Request $request)
    {
        Log::info('Duitku callback received.', [
            'merchant_order_id' => $request->input('merchantOrderId'),
            'result_code' => $request->input('resultCode'),
            'has_signature' => filled($request->input('signature')),
        ]);

        $data = $request->validate([
            'merchantCode' => ['required', 'string'],
            'amount' => ['required', 'integer'],
            'merchantOrderId' => ['required', 'string', 'max:80'],
            'paymentCode' => ['nullable', 'string'],
            'resultCode' => ['required', 'in:00,01'],
            'reference' => ['nullable', 'string'],
            'signature' => ['required', 'string'],
        ]);

        if ($data['resultCode'] === '00') {
            $this->creditVerifiedTopup([
                'merchantCode' => $data['merchantCode'],
                'amount' => $data['amount'],
                'merchantOrderId' => $data['merchantOrderId'],
                'resultCode' => $data['resultCode'],
                'reference' => $data['reference'] ?? null,
                'signature' => $data['signature'],
            ]);
        } else {
            abort_unless(hash_equals((string) config('payment.duitku.merchant_code'), $data['merchantCode']), 403);
            $expected = hash_hmac('sha256', $data['merchantCode'].$data['amount'].$data['merchantOrderId'], (string) config('payment.duitku.api_key'));
            abort_unless(hash_equals($expected, $data['signature']), 403);

            DB::transaction(function () use ($data): void {
                $topup = Topup::where('order_id', $data['merchantOrderId'])->lockForUpdate()->firstOrFail();
                abort_unless((int) $topup->jumlah === $data['amount'], 422);

                if ($topup->status === 'pending') {
                    $topup->update(['status' => 'failed', 'gateway_reference' => $data['reference'] ?? $topup->gateway_reference]);
                }
            });
        }

        return response()->json(['status' => 'ok']);
    }

    public function return(): RedirectResponse
    {
        $orderId = request()->query('merchantOrderId');
        $reference = request()->query('reference');

        if (is_string($orderId) && $orderId !== '') {
            $topup = Topup::where('order_id', $orderId)->first();

            if ($topup && $topup->status === 'pending') {
                $result = $this->checkTransactionStatus($topup);

                if ($result === 'paid') {
                    return redirect()->route('wallet.index')->with('success', 'Pembayaran terverifikasi. Saldo top-up sudah ditambahkan.');
                }

                if ($result === 'pending') {
                    return redirect()->route('wallet.index')->with('info', 'Duitku belum mengonfirmasi pembayaran. Jika Anda baru menekan tombol sukses demo, cek ulang beberapa saat lagi.');
                }
            }

            if ($topup && $reference && $topup->gateway_reference === $reference && request()->query('resultCode') === '00') {
                return redirect()->route('wallet.index')->with('info', 'Pembayaran dikembalikan Duitku; verifikasi status masih menunggu. Saldo tidak ditambah sebelum status terverifikasi.');
            }
        }

        return redirect()->route('wallet.index')->with('info', 'Kembali dari Duitku. Status dan saldo hanya berubah setelah callback atau verifikasi status resmi diterima.');
    }

    private function checkTransactionStatus(Topup $topup): ?string
    {
        $merchantCode = (string) config('payment.duitku.merchant_code');
        $apiKey = (string) config('payment.duitku.api_key');

        if ($merchantCode === '' || $apiKey === '') {
            return null;
        }

        try {
            $response = Http::withOptions($this->duitkuHttpOptions())->acceptJson()->asJson()->connectTimeout(5)->timeout(10)
                ->post(rtrim(config('payment.duitku.base_url'), '/').'/webapi/api/merchant/transactionStatus', [
                    'merchantCode' => $merchantCode,
                    'merchantOrderId' => $topup->order_id,
                    'signature' => hash_hmac('sha256', $merchantCode.$topup->order_id, $apiKey),
                ]);
        } catch (ConnectionException|RequestException $exception) {
            Log::warning('Duitku transaction status check failed.', [
                'order_id' => $topup->order_id,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }

        if (! $response->successful() || $response->json('statusCode') !== '00') {
            Log::info('Duitku transaction is not confirmed as successful.', [
                'order_id' => $topup->order_id,
                'http_status' => $response->status(),
                'status_code' => $response->json('statusCode'),
            ]);

            return null;
        }

        if ((string) $response->json('amount') !== (string) (int) $topup->jumlah) {
            Log::warning('Duitku transaction status amount does not match top-up.', ['order_id' => $topup->order_id]);

            return null;
        }

        $callback = [
            'merchantCode' => $merchantCode,
            'amount' => (int) $topup->jumlah,
            'merchantOrderId' => $topup->order_id,
            'resultCode' => '00',
            'reference' => $response->json('reference') ?? $topup->gateway_reference,
            'signature' => hash_hmac('sha256', $merchantCode.(int) $topup->jumlah.$topup->order_id, $apiKey),
        ];

        $this->creditVerifiedTopup($callback);

        return 'paid';
    }

    /** @param array{merchantCode: string, amount: int, merchantOrderId: string, resultCode: string, reference: ?string, signature: string} $data */
    private function creditVerifiedTopup(array $data): void
    {
        abort_unless(hash_equals((string) config('payment.duitku.merchant_code'), $data['merchantCode']), 403);
        $expected = hash_hmac('sha256', $data['merchantCode'].$data['amount'].$data['merchantOrderId'], (string) config('payment.duitku.api_key'));
        abort_unless(hash_equals($expected, $data['signature']), 403);

        DB::transaction(function () use ($data): void {
            $topup = Topup::where('order_id', $data['merchantOrderId'])->lockForUpdate()->firstOrFail();
            abort_unless((int) $topup->jumlah === $data['amount'], 422);

            if ($topup->status === 'paid') {
                return;
            }

            abort_unless($topup->status === 'pending', 409);
            $customer = Pelanggan::lockForUpdate()->findOrFail($topup->id_pelanggan);
            $before = (float) $customer->saldo;
            $customer->saldo = $before + $topup->jumlah;
            $customer->save();
            $topup->update([
                'status' => 'paid',
                'paid_at' => now(),
                'gateway_reference' => $data['reference'] ?? $topup->gateway_reference,
            ]);
            SaldoMutasi::create([
                'id_pelanggan' => $customer->id_pelanggan,
                'jenis' => 'topup',
                'jumlah' => $topup->jumlah,
                'saldo_sebelum' => $before,
                'saldo_sesudah' => $customer->saldo,
                'referensi_gateway' => $topup->order_id,
                'keterangan' => 'Top-up terverifikasi Duitku',
            ]);
        });
    }

    /** @return array{verify: string|bool} */
    private function duitkuHttpOptions(): array
    {
        $caBundle = config('payment.duitku.ca_bundle');

        return [
            'verify' => is_string($caBundle) && File::exists($caBundle) ? $caBundle : true,
        ];
    }
}
