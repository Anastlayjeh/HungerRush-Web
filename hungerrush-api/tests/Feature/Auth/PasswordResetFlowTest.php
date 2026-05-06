<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset as PasswordResetEvent;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetFlowTest extends TestCase
{
    use RefreshDatabase;

    private const GENERIC_MESSAGE = 'If this email exists, a reset password link has been sent.';

    public function test_forgot_password_sends_reset_link_for_existing_user(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'owner@example.com',
        ]);

        $this->postJson('/api/forgot-password', [
            'email' => 'owner@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', self::GENERIC_MESSAGE);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_does_not_reveal_missing_email(): void
    {
        Notification::fake();

        $this->postJson('/api/forgot-password', [
            'email' => 'missing@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', self::GENERIC_MESSAGE);

        Notification::assertNothingSent();
    }

    public function test_forgot_password_validates_email(): void
    {
        $this->postJson('/api/forgot-password', [
            'email' => 'not-an-email',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'validation_failed')
            ->assertJsonValidationErrors('email');
    }

    public function test_legacy_v1_forgot_password_alias_uses_same_generic_response(): void
    {
        Notification::fake();

        User::factory()->create([
            'email' => 'customer@example.com',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'customer@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', self::GENERIC_MESSAGE);
    }

    public function test_reset_password_page_accepts_valid_token_and_updates_password(): void
    {
        Event::fake([PasswordResetEvent::class]);

        $user = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => Hash::make('OldPassword123!'),
            'remember_token' => 'old-token',
        ]);
        $token = Password::broker()->createToken($user);

        $this->post('/reset-password', [
            'token' => $token,
            'email' => 'owner@example.com',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
            ->assertOk()
            ->assertSeeText('Password reset successfully.');

        $user->refresh();

        $this->assertTrue(Hash::check('NewPassword123!', $user->password));
        $this->assertNotSame('old-token', $user->remember_token);
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'owner@example.com',
        ]);

        Event::assertDispatched(
            PasswordResetEvent::class,
            fn (PasswordResetEvent $event): bool => $event->user->is($user)
        );
    }

    public function test_reset_password_page_rejects_expired_token(): void
    {
        $user = User::factory()->create([
            'email' => 'customer@example.com',
            'password' => Hash::make('OldPassword123!'),
            'remember_token' => 'old-token',
        ]);
        $token = Password::broker()->createToken($user);
        DB::table('password_reset_tokens')
            ->where('email', 'customer@example.com')
            ->update(['created_at' => now()->subMinutes(61)]);

        $from = route('password.reset', [
            'token' => $token,
            'email' => 'customer@example.com',
        ]);

        $this->from($from)->post('/reset-password', [
            'token' => $token,
            'email' => 'customer@example.com',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
            ->assertRedirect($from)
            ->assertSessionHasErrors('email');

        $user->refresh();

        $this->assertTrue(Hash::check('OldPassword123!', $user->password));
        $this->assertSame('old-token', $user->remember_token);
    }

    public function test_reset_password_page_validates_confirmed_password(): void
    {
        $user = User::factory()->create([
            'email' => 'owner@example.com',
        ]);
        $token = Password::broker()->createToken($user);

        $this->from(route('password.reset', [
            'token' => $token,
            'email' => 'owner@example.com',
        ]))->post('/reset-password', [
            'token' => $token,
            'email' => 'owner@example.com',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'different-password',
        ])
            ->assertSessionHasErrors('password');
    }
}
