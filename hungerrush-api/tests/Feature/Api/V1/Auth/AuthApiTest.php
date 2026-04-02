<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Anas',
            'email' => 'anas@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'restaurant_owner',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'anas@example.com')
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_user_can_login_and_fetch_me(): void
    {
        $user = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'Password123!',
            'role' => 'restaurant_owner',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@example.com',
            'password' => 'Password123!',
            'role' => 'restaurant_owner',
        ]);

        $token = $login->json('data.token');
        $this->assertNotEmpty($token);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }
}
