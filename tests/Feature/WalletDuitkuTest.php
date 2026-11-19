<?php

namespace Tests\Feature;

use App\Models\Pelanggan;
use App\Models\Topup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WalletDuitkuTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallet_loads_payment_channels_from_duitku(): void
    {
        config([
            'payment.duitku.merchant_code' => 'DTEST',
            'payment.duitku.api_key' => 'test-api-key',
        ]);
        Http::fake([
            'sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod' => Http::response([
                'responseCode' => '00',
                'paymentFee' => [[
                    'paymentMethod' => 'SP',
                    'paymentName' => 'ShopeePay QRIS',
                    'paymentImage' => 'https://example.test/sp.png',
                    'totalFee' => '0',
                ]],
            ]),
        ]);
        config(['payment.duitku.ca_bundle' => null]);

        [$user] = $this->createCustomerAccount();

        $this->actingAs($user)->get('/wallet')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Wallet/Index')
                ->where('duitkuConfigured', true)
                ->where('paymentMethods.0.code', 'SP')
                ->where('paymentMethodsError', null));

        Http::assertSent(fn ($request): bool => $request->url() === 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
            && $request['merchantcode'] === 'DTEST'
            && $request['amount'] === 10000
            && $request['signature'] === hash_hmac('sha256', 'DTEST'.$request['amount'].$request['datetime'], 'test-api-key'));
    }

    public function test_customer_can_start_a_duitku_topup(): void
    {
        config([
            'payment.duitku.merchant_code' => 'DTEST',
            'payment.duitku.api_key' => 'test-api-key',
        ]);
        Http::fake([
            'sandbox.duitku.com/webapi/api/merchant/v2/inquiry' => Http::response([
                'statusCode' => '00',
                'paymentUrl' => 'https://sandbox.duitku.com/payment/test',
                'reference' => 'REF-TEST',
            ]),
        ]);
        config(['payment.duitku.ca_bundle' => null]);

        [$user] = $this->createCustomerAccount();
        $response = $this->actingAs($user)->post('/wallet/topup', [
            'jumlah' => 20000,
            'payment_method' => 'SP',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tbl_topup', [
            'id_pelanggan' => $user->pelanggan->id_pelanggan,
            'jumlah' => 20000,
            'status' => 'pending',
            'gateway_reference' => 'REF-TEST',
        ]);
        Http::assertSent(fn ($request): bool => $request->url() === 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
            && $request['paymentMethod'] === 'SP'
            && $request['paymentAmount'] === 20000);
    }

    public function test_valid_duitku_callback_credits_balance_only_once(): void
    {
        config([
            'payment.duitku.merchant_code' => 'DTEST',
            'payment.duitku.api_key' => 'test-api-key',
        ]);

        [$user, $customer] = $this->createCustomerAccount();
        $topup = Topup::create([
            'order_id' => 'TOPUP-TEST-001',
            'id_pelanggan' => $customer->id_pelanggan,
            'jumlah' => 25000,
        ]);
        $callback = [
            'merchantCode' => 'DTEST',
            'amount' => 25000,
            'merchantOrderId' => $topup->order_id,
            'paymentCode' => 'SP',
            'resultCode' => '00',
            'reference' => 'DUITKU-REF-001',
            'signature' => hash_hmac('sha256', 'DTEST25000'.$topup->order_id, 'test-api-key'),
        ];

        $this->post(route('wallet.notification'), $callback)->assertOk();
        $this->post(route('wallet.notification'), $callback)->assertOk();

        $this->assertSame(25000.0, (float) $customer->fresh()->saldo);
        $this->assertDatabaseCount('tbl_saldo_mutasi', 1);
        $this->assertDatabaseHas('tbl_topup', ['id_topup' => $topup->id_topup, 'status' => 'paid']);
    }

    public function test_invalid_duitku_callback_signature_does_not_credit_balance(): void
    {
        config([
            'payment.duitku.merchant_code' => 'DTEST',
            'payment.duitku.api_key' => 'test-api-key',
        ]);

        [$user, $customer] = $this->createCustomerAccount();
        $topup = Topup::create([
            'order_id' => 'TOPUP-TEST-002',
            'id_pelanggan' => $customer->id_pelanggan,
            'jumlah' => 25000,
        ]);

        $this->post(route('wallet.notification'), [
            'merchantCode' => 'DTEST',
            'amount' => 25000,
            'merchantOrderId' => $topup->order_id,
            'paymentCode' => 'SP',
            'resultCode' => '00',
            'signature' => 'invalid-signature',
        ])->assertForbidden();

        $this->assertSame(0.0, (float) $customer->fresh()->saldo);
        $this->assertDatabaseHas('tbl_topup', ['id_topup' => $topup->id_topup, 'status' => 'pending']);
    }

    /** @return array{User, Pelanggan} */
    private function createCustomerAccount(): array
    {
        $user = User::create([
            'name' => 'Wallet Test Customer',
            'username' => 'wallet-'.uniqid(),
            'email' => uniqid('wallet').'@example.test',
            'password' => bcrypt('password'),
            'role' => 'user',
            'is_active' => true,
        ]);
        $customer = Pelanggan::create([
            'nama_pelanggan' => $user->name,
            'email' => $user->email,
            'user_id' => $user->id,
            'saldo' => 0,
        ]);

        return [$user, $customer];
    }
}
