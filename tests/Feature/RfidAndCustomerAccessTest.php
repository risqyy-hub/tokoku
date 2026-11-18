<?php

namespace Tests\Feature;

use Tests\TestCase;

class RfidAndCustomerAccessTest extends TestCase
{
    public function test_guest_can_open_customer_registration_page(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }
}
