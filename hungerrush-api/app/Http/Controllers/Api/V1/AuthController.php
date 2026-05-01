<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create($request->validated());
        $token = $this->createAccessToken($user, $request->input('device_name', 'default-device'));

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], message: 'Registration successful.', status: 201);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $query = User::query();

        if (!empty($validated['email'])) {
            $query->where('email', $validated['email']);
        } else {
            $query->where('phone', $validated['phone'] ?? '');
        }

        /** @var User|null $user */
        $user = $query->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse('Invalid credentials.', code: 'invalid_credentials', status: 401);
        }

        if ($user->status !== 'active') {
            return $this->errorResponse('Account is suspended.', code: 'account_suspended', status: 403);
        }

        if (!empty($validated['role']) && $user->role?->value !== $validated['role']) {
            return $this->errorResponse('Role mismatch.', code: 'role_mismatch', status: 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $this->createAccessToken($user, $validated['device_name'] ?? 'default-device');

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], message: 'Login successful.');
    }

    public function google(Request $request)
    {
        $idToken = $request->input('id_token');

        if (!is_string($idToken) || blank(trim($idToken))) {
            return $this->errorResponse(
                'The id_token field is required.',
                ['id_token' => ['The id_token field is required.']],
                code: 'missing_token',
                status: 400
            );
        }

        try {
            // Do not disable SSL verification here. If local Windows PHP cannot verify
            // Google's certificate chain, fix php.ini by pointing curl.cainfo and
            // openssl.cafile to a current CA bundle such as cacert.pem.
            $response = Http::acceptJson()
                ->timeout(5)
                ->retry(3, 200, function (Throwable $exception) {
                    return $exception instanceof ConnectionException
                        || ($exception instanceof RequestException
                            && $exception->response !== null
                            && $exception->response->serverError());
                }, throw: false)
                ->get('https://oauth2.googleapis.com/tokeninfo', [
                    'id_token' => $idToken,
                ]);
        } catch (ConnectionException $exception) {
            Log::error('Google token verification request failed.', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Google token verification is currently unavailable',
            ], 503);
        } catch (Throwable $exception) {
            Log::error('Google token verification request failed.', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Google token verification is currently unavailable',
            ], 503);
        }

        if (!$response->ok()) {
            Log::warning('Google token verification failed.', [
                'status' => $response->status(),
                'reason' => 'non_200_response',
            ]);

            return response()->json([
                'message' => 'Invalid Google token',
            ], 401);
        }

        $googleUser = $response->json();

        if (!is_array($googleUser)) {
            Log::warning('Google token verification failed.', [
                'status' => $response->status(),
                'reason' => 'invalid_response_payload',
            ]);

            return response()->json([
                'message' => 'Invalid Google token',
            ], 401);
        }

        $email = filter_var($googleUser['email'] ?? null, FILTER_VALIDATE_EMAIL);
        $providerId = $googleUser['sub'] ?? null;
        $name = $googleUser['name'] ?? null;
        $avatar = $googleUser['picture'] ?? null;
        $audience = $googleUser['aud'] ?? null;
        $expectedAudience = config('services.google.client_id');

        if (!is_string($email) || !is_string($providerId) || blank($providerId)) {
            Log::warning('Google token verification failed.', [
                'status' => $response->status(),
                'reason' => 'missing_required_google_claims',
            ]);

            return response()->json([
                'message' => 'Invalid Google token',
            ], 401);
        }

        if (filled($expectedAudience) && $audience !== $expectedAudience) {
            Log::warning('Google token verification failed.', [
                'status' => $response->status(),
                'reason' => 'audience_mismatch',
                'google_aud' => $audience,
                'expected_aud' => $expectedAudience,
            ]);

            return response()->json([
                'message' => 'Invalid Google token',
            ], 401);
        }

        if (!is_string($name) || blank(trim($name))) {
            $name = Str::before($email, '@');
        }

        if (!is_string($avatar) || blank(trim($avatar))) {
            $avatar = null;
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        if ($user) {
            if ($user->status !== 'active') {
                return $this->errorResponse('Account is suspended.', code: 'account_suspended', status: 403);
            }

            $updates = ['last_login_at' => now()];

            if (blank($user->provider)) {
                $updates['provider'] = 'google';
                $updates['provider_id'] = $providerId;
            } elseif ($user->provider === 'google' && $user->provider_id !== $providerId) {
                $updates['provider_id'] = $providerId;
            }

            if ($avatar !== null && (blank($user->provider) || $user->provider === 'google') && $user->avatar !== $avatar) {
                $updates['avatar'] = $avatar;
            }

            if ($user->email_verified_at === null) {
                $updates['email_verified_at'] = now();
            }

            $user->forceFill($updates)->save();
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Str::random(40),
                'provider' => 'google',
                'provider_id' => $providerId,
                'avatar' => $avatar,
                'last_login_at' => now(),
            ]);

            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

        $token = $this->createAccessToken($user, 'google-auth');

        return $this->successResponse([
            'user' => $user->fresh(),
            'token' => $token,
        ], message: 'Google sign-in successful.');
    }

    public function me(Request $request)
    {
        return $this->successResponse($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->successResponse(['logged_out' => true], message: 'Logout successful.');
    }

    public function forgotPassword(Request $request)
    {
        return $this->successResponse(['queued' => true], message: 'Password reset flow placeholder.');
    }

    public function resetPassword(Request $request)
    {
        return $this->successResponse(['reset' => true], message: 'Password reset endpoint placeholder.');
    }

    protected function createAccessToken(User $user, string $deviceName): string
    {
        return $user->createToken($deviceName)->plainTextToken;
    }
}
