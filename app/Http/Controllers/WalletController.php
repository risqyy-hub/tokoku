<?php

namespace App\Http\Controllers;

use App\Models\Pelanggan;
use App\Models\SaldoMutasi;
use App\Models\Topup;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $request->user()->pelanggan;
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');
        abort_unless($customer, 403, 'Akun pelanggan belum terhubung.');

        return Inertia::render('Wallet/Index', [
            'balance' => $customer->saldo,
            'topups' => Topup::where('id_pelanggan', $customer->id_pelanggan)->latest()->get(),
            'mutations' => SaldoMutasi::where('id_pelanggan', $customer->id_pelanggan)->latest()->limit(30)->get(),
            'midtransConfigured' => filled(config('payment.midtrans.server_key')) && filled(config('payment.midtrans.client_key')),
        ]);
    }

    public function create(Request $request)
    {
        $data = $request->validate(['jumlah' => ['required', 'numeric', 'min:10000', 'max:10000000']]);
        $serverKey = config('payment.midtrans.server_key');
        if (! $serverKey) {
            return back()->with('error', 'Payment gateway belum dikonfigurasi. Admin perlu mengisi kredensial Midtrans.');
        }

        if (! config('payment.midtrans.client_key')) {
            return back()->with('error', 'MIDTRANS_CLIENT_KEY belum dikonfigurasi.');
        }

        $customer = $request->user()->pelanggan;
        $orderId = 'TOPUP-'.now()->format('YmdHis').'-'.Str::upper(Str::random(8));
        $topup = Topup::create(['order_id' => $orderId, 'id_pelanggan' => $customer->id_pelanggan, 'jumlah' => $data['jumlah']]);
        try {
            $response = Http::withBasicAuth($serverKey, '')->acceptJson()->timeout(15)
                ->post(rtrim(config('payment.midtrans.base_url'), '/').'/snap/v1/transactions', [
                    'transaction_details' => ['order_id' => $orderId, 'gross_amount' => (int) $data['jumlah']],
                    'customer_details' => array_filter([
                        'first_name' => $customer->nama_pelanggan,
                        'email' => $customer->email,
                        'phone' => $customer->no_hp,
                    ]),
                    'callbacks' => ['finish' => route('wallet.index')],
                ]);
        } catch (ConnectionException $exception) {
            $topup->update(['status' => 'failed']);

            return back()->with('error', 'Tidak dapat terhubung ke payment gateway. Silakan coba kembali.');
        }

        if (! $response->successful() || ! $response->json('token')) {
            $topup->update(['status' => 'failed']);

            return back()->with('error', 'Gateway pembayaran tidak dapat membuat transaksi. Coba kembali.');
        }

        $topup->update(['snap_token' => $response->json('token'), 'redirect_url' => $response->json('redirect_url')]);

        return back()->with('success', 'Permintaan top-up dibuat. Selesaikan pembayaran melalui Midtrans.');
    }

    public function notification(Request $request)
    {
        $data = $request->validate([
            'order_id' => ['required', 'string'], 'status_code' => ['required', 'string'],
            'gross_amount' => ['required', 'numeric'], 'signature_key' => ['required', 'string'],
            'transaction_status' => ['required', 'string'], 'payment_type' => ['nullable', 'string'],
        ]);

        $expected = hash('sha512', $data['order_id'].$data['status_code'].$data['gross_amount'].config('payment.midtrans.server_key'));
        abort_unless(hash_equals($expected, $data['signature_key']), 403);
        $topup = Topup::where('order_id', $data['order_id'])->firstOrFail();
        abort_unless((int) $topup->jumlah === (int) round((float) $data['gross_amount']), 422);
        if (in_array($data['transaction_status'], ['settlement', 'capture'], true)) {
            abort_unless((string) $topup->jumlah === (string) $data['gross_amount'], 422);
        }

        if ($data['transaction_status'] === 'settlement' || ($data['transaction_status'] === 'capture' && $request->input('fraud_status') === 'accept')) {
            DB::transaction(function () use ($data): void {
                $topup = Topup::where('order_id', $data['order_id'])->lockForUpdate()->firstOrFail();
                if ($topup->status === 'paid') {
                    return;
                }
                $customer = Pelanggan::lockForUpdate()->findOrFail($topup->id_pelanggan);
                $before = (float) $customer->saldo;
                $customer->saldo = $before + $topup->jumlah;
                $customer->save();
                $topup->update(['status' => 'paid', 'paid_at' => now(), 'payment_type' => $data['payment_type'] ?? null]);
                SaldoMutasi::create([
                    'id_pelanggan' => $customer->id_pelanggan, 'jenis' => 'topup', 'jumlah' => $topup->jumlah,
                    'saldo_sebelum' => $before, 'saldo_sesudah' => $customer->saldo,
                    'referensi_gateway' => $topup->order_id, 'keterangan' => 'Top-up terverifikasi Midtrans',
                ]);
            });
        }

        if (in_array($data['transaction_status'], ['deny', 'cancel', 'expire'], true)) {
            DB::transaction(function () use ($data): void {
                $topup = Topup::where('order_id', $data['order_id'])->lockForUpdate()->firstOrFail();
                if ($topup->status === 'pending') {
                    $topup->update(['status' => $data['transaction_status']]);
                }
            });
        }

        return response()->json(['status' => 'ok']);
    }
}
