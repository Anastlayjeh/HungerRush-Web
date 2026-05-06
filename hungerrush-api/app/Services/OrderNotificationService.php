<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use JsonException;
use Throwable;

class OrderNotificationService
{
    public function notifyNewOrder(Order $order): ?UserNotification
    {
        $order->loadMissing('restaurant');

        if (! $order->restaurant?->owner_user_id) {
            return null;
        }

        return $this->notifyUser(
            userId: $order->restaurant->owner_user_id,
            type: 'restaurant_order',
            title: 'New order received',
            body: 'You received a new order.',
            data: [
                'order_id' => $order->id,
                'restaurant_id' => $order->restaurant_id,
            ],
            push: true
        );
    }

    public function notifyCustomerStatusChange(Order $order, OrderStatus $status): UserNotification
    {
        [$title, $body, $push] = match ($status) {
            OrderStatus::Accepted => ['Order confirmed', 'Your order has been confirmed.', true],
            OrderStatus::Delivered => ['Order delivered', 'Your order has been delivered.', true],
            default => ['Order status updated', "Order #{$order->id} is now {$status->value}.", false],
        };

        return $this->notifyUser(
            userId: $order->customer_id,
            type: 'order_status',
            title: $title,
            body: $body,
            data: [
                'order_id' => $order->id,
                'status' => $status->value,
            ],
            push: $push
        );
    }

    private function notifyUser(
        int $userId,
        string $type,
        string $title,
        string $body,
        array $data = [],
        bool $push = true
    ): UserNotification {
        $notification = UserNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        if ($push) {
            $this->sendPushSafely($userId, $title, $body, array_merge($data, [
                'notification_id' => $notification->id,
                'type' => $type,
            ]));
        }

        return $notification;
    }

    private function sendPushSafely(int $userId, string $title, string $body, array $data): void
    {
        $tokens = DeviceToken::query()
            ->where('user_id', $userId)
            ->get(['id', 'token']);

        if ($tokens->isEmpty()) {
            return;
        }

        try {
            $credentials = $this->firebaseCredentials();
            $accessToken = $this->firebaseAccessToken($credentials);
            $projectId = $credentials['project_id'] ?? null;

            if (blank($projectId) || blank($accessToken)) {
                Log::warning('FCM notification skipped because Firebase credentials are incomplete.', [
                    'user_id' => $userId,
                ]);

                return;
            }

            $payloadData = $this->stringifyData($data);

            foreach ($tokens as $token) {
                try {
                    $response = Http::withToken($accessToken)
                        ->timeout((int) config('services.firebase.timeout_seconds', 10))
                        ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                            'message' => [
                                'token' => $token->token,
                                'notification' => [
                                    'title' => $title,
                                    'body' => $body,
                                ],
                                'data' => $payloadData,
                                'android' => [
                                    'priority' => 'HIGH',
                                    'notification' => [
                                        'channel_id' => 'hungerrush_notifications',
                                        'sound' => 'default',
                                    ],
                                ],
                                'apns' => [
                                    'headers' => [
                                        'apns-priority' => '10',
                                    ],
                                    'payload' => [
                                        'aps' => [
                                            'sound' => 'default',
                                        ],
                                    ],
                                ],
                            ],
                        ]);

                    if ($response->failed()) {
                        Log::warning('FCM notification failed.', [
                            'device_token_id' => $token->id,
                            'status' => $response->status(),
                            'response' => $response->json() ?? $response->body(),
                        ]);
                    }
                } catch (Throwable $exception) {
                    Log::warning('FCM notification failed.', [
                        'device_token_id' => $token->id,
                        'exception' => $exception->getMessage(),
                    ]);
                }
            }
        } catch (Throwable $exception) {
            Log::warning('FCM notification failed.', [
                'user_id' => $userId,
                'exception' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function firebaseCredentials(): array
    {
        $path = $this->firebaseCredentialsPath();

        if ($path === null || ! is_readable($path)) {
            throw new \RuntimeException('Firebase credentials file is not readable.');
        }

        try {
            $credentials = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new \RuntimeException('Firebase credentials file contains invalid JSON.', previous: $exception);
        }

        if (! is_array($credentials)) {
            throw new \RuntimeException('Firebase credentials file is invalid.');
        }

        foreach (['client_email', 'private_key'] as $key) {
            if (blank($credentials[$key] ?? null)) {
                throw new \RuntimeException("Firebase credentials file is missing {$key}.");
            }
        }

        return $credentials;
    }

    private function firebaseCredentialsPath(): ?string
    {
        $path = config('services.firebase.credentials');

        if (blank($path) || ! is_string($path)) {
            return null;
        }

        return str_starts_with($path, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\\/]/', $path) === 1
            ? $path
            : base_path($path);
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function firebaseAccessToken(array $credentials): string
    {
        $cacheKey = 'firebase_access_token:'.sha1(($credentials['client_email'] ?? '').($credentials['project_id'] ?? ''));

        return Cache::remember($cacheKey, now()->addMinutes(55), function () use ($credentials) {
            $jwt = $this->firebaseJwt($credentials);

            $response = Http::asForm()
                ->timeout((int) config('services.firebase.timeout_seconds', 10))
                ->post('https://oauth2.googleapis.com/token', [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $jwt,
                ]);

            if ($response->failed() || blank($response->json('access_token'))) {
                throw new \RuntimeException('Firebase access token request failed.');
            }

            return (string) $response->json('access_token');
        });
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function firebaseJwt(array $credentials): string
    {
        $now = time();
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));
        $claims = $this->base64UrlEncode(json_encode([
            'iss' => $credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ], JSON_THROW_ON_ERROR));

        $unsignedJwt = "{$header}.{$claims}";

        $signed = openssl_sign($unsignedJwt, $signature, (string) $credentials['private_key'], OPENSSL_ALGO_SHA256);

        if (! $signed) {
            throw new \RuntimeException('Unable to sign Firebase JWT.');
        }

        return "{$unsignedJwt}.{$this->base64UrlEncode($signature)}";
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    /**
     * @return array<string, string>
     */
    private function stringifyData(array $data): array
    {
        $stringData = [];

        foreach ($data as $key => $value) {
            $stringData[(string) $key] = is_scalar($value) || $value === null
                ? (string) $value
                : json_encode($value, JSON_THROW_ON_ERROR);
        }

        return $stringData;
    }
}
