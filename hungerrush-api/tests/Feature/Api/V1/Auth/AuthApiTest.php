<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

    public function test_google_auth_requires_id_token(): void
    {
        $response = $this->postJson('/api/auth/google', []);

        $response->assertStatus(400)
            ->assertJsonPath('code', 'missing_token')
            ->assertJsonPath('errors.id_token.0', 'The id_token field is required.');
    }

    public function test_google_auth_rejects_invalid_token(): void
    {
        Log::spy();

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response([
                'error_description' => 'Invalid Value',
            ], 400),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'bad-token',
        ]);

        $response->assertUnauthorized()
            ->assertExactJson([
                'message' => 'Invalid Google token',
            ]);

        Log::shouldHaveReceived('warning')->once()->withArgs(function (string $message, array $context): bool {
            return $message === 'Google token verification failed.'
                && $context['status'] === 400
                && $context['reason'] === 'non_200_response';
        });
    }

    public function test_google_auth_rejects_a_token_with_the_wrong_audience(): void
    {
        config(['services.google.client_id' => 'expected-client-id']);
        Log::spy();

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response([
                'email' => 'google-user@example.com',
                'name' => 'Google User',
                'sub' => 'google-sub-123',
                'picture' => 'https://example.com/avatar.png',
                'aud' => 'different-client-id',
            ], 200),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
        ]);

        $response->assertUnauthorized()
            ->assertExactJson([
                'message' => 'Invalid Google token',
            ]);

        Log::shouldHaveReceived('warning')->once()->withArgs(function (string $message, array $context): bool {
            return $message === 'Google token verification failed.'
                && $context['status'] === 200
                && $context['reason'] === 'audience_mismatch'
                && $context['google_aud'] === 'different-client-id'
                && $context['expected_aud'] === 'expected-client-id';
        });
    }

    public function test_google_auth_returns_503_for_google_connection_failures(): void
    {
        Log::spy();

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::failedConnection('cURL error 60: SSL certificate problem'),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
        ]);

        $response->assertStatus(503)
            ->assertExactJson([
                'message' => 'Google token verification is currently unavailable',
            ]);

        Http::assertSentCount(3);

        Log::shouldHaveReceived('error')->once()->withArgs(function (string $message, array $context): bool {
            return $message === 'Google token verification request failed.'
                && str_contains($context['message'], 'SSL certificate problem');
        });
    }

    public function test_google_auth_retries_transient_google_failures_before_succeeding(): void
    {
        config(['services.google.client_id' => 'expected-client-id']);

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::sequence()
                ->push(['error' => 'server_error'], 500)
                ->push(['error' => 'server_error'], 500)
                ->push([
                    'email' => 'google-user@example.com',
                    'name' => 'Google User',
                    'sub' => 'google-sub-123',
                    'picture' => 'https://example.com/avatar.png',
                    'aud' => 'expected-client-id',
                ], 200),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'google-user@example.com');

        Http::assertSentCount(3);
    }

    public function test_google_auth_creates_a_new_user_and_returns_a_token(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response([
                'email' => 'google-user@example.com',
                'name' => 'Google User',
                'sub' => 'google-sub-123',
                'picture' => 'https://example.com/avatar.png',
                'aud' => 'expected-client-id',
            ], 200),
        ]);

        config(['services.google.client_id' => 'expected-client-id']);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'google-user@example.com')
            ->assertJsonPath('data.user.provider', 'google')
            ->assertJsonPath('data.user.provider_id', 'google-sub-123')
            ->assertJsonPath('data.user.avatar', 'https://example.com/avatar.png')
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', [
            'email' => 'google-user@example.com',
            'provider' => 'google',
            'provider_id' => 'google-sub-123',
            'avatar' => 'https://example.com/avatar.png',
        ]);
    }

    public function test_google_auth_updates_provider_for_existing_user_when_missing(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
            'provider' => null,
            'provider_id' => null,
            'avatar' => null,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/*' => Http::response([
                'email' => 'existing@example.com',
                'name' => 'Existing User',
                'sub' => 'google-sub-existing',
                'picture' => 'https://example.com/existing-avatar.png',
                'aud' => 'expected-client-id',
            ], 200),
        ]);

        config(['services.google.client_id' => 'expected-client-id']);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'valid-token',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.provider', 'google')
            ->assertJsonPath('data.user.provider_id', 'google-sub-existing')
            ->assertJsonPath('data.user.avatar', 'https://example.com/existing-avatar.png')
            ->assertJsonStructure(['data' => ['user', 'token']]);
    }
}
