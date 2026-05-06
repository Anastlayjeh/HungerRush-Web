<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceTokenApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_device_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/device-tokens', [
                'token' => 'test-fcm-token',
                'platform' => 'android',
            ])
            ->assertCreated()
            ->assertJsonPath('data.token', 'test-fcm-token')
            ->assertJsonPath('data.platform', 'android');

        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'token' => 'test-fcm-token',
            'platform' => 'android',
        ]);
    }

    public function test_user_can_deactivate_device_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/device-tokens', [
                'token' => 'test-fcm-token',
                'platform' => 'android',
            ])
            ->assertCreated();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/device-tokens/deactivate', [
                'token' => 'test-fcm-token',
            ])
            ->assertOk()
            ->assertJsonPath('data.deactivated', true);

        $this->assertDatabaseMissing('device_tokens', [
            'user_id' => $user->id,
            'token' => 'test-fcm-token',
        ]);
    }
}
