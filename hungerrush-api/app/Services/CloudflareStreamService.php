<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class CloudflareStreamService
{
    public function upload(string $videoPath, string $originalFilename): array
    {
        $streamUrl = $this->streamCollectionUrl();

        $response = Http::acceptJson()
            ->withToken($this->apiToken())
            ->timeout((int) config('services.cloudflare_stream.timeout_seconds', 180))
            ->attach('file', fopen($videoPath, 'r'), $originalFilename)
            ->post($streamUrl);

        if (! $response->successful() || ! $response->json('success', false)) {
            $message = $response->json('errors.0.message')
                ?: $response->json('message')
                ?: $response->body();

            throw new RuntimeException("Cloudflare Stream upload failed: {$message}");
        }

        $uid = (string) $response->json('result.uid', '');
        if ($uid === '') {
            throw new RuntimeException('Cloudflare Stream upload did not return a video UID.');
        }

        return $this->get($uid);
    }

    public function get(string $uid): array
    {
        $response = Http::acceptJson()
            ->withToken($this->apiToken())
            ->timeout((int) config('services.cloudflare_stream.timeout_seconds', 180))
            ->get($this->streamVideoUrl($uid));

        if (! $response->successful() || ! $response->json('success', false)) {
            $message = $response->json('errors.0.message')
                ?: $response->json('message')
                ?: $response->body();

            throw new RuntimeException("Cloudflare Stream status lookup failed: {$message}");
        }

        $video = $response->json('result', []);

        return [
            'uid' => (string) ($video['uid'] ?? $uid),
            'ready_to_stream' => (bool) ($video['readyToStream'] ?? false),
            'status' => (string) data_get($video, 'status.state', 'queued'),
            'playback_hls_url' => data_get($video, 'playback.hls') ?: $this->buildPlaybackUrl($uid, 'manifest/video.m3u8'),
            'playback_dash_url' => data_get($video, 'playback.dash') ?: $this->buildPlaybackUrl($uid, 'manifest/video.mpd'),
            'preview_url' => (string) ($video['preview'] ?? $this->buildPlaybackUrl($uid, 'watch')),
            'thumbnail_url' => (string) ($video['thumbnail'] ?? $this->buildPlaybackUrl($uid, 'thumbnails/thumbnail.jpg')),
        ];
    }

    public function delete(string $uid): void
    {
        $response = Http::acceptJson()
            ->withToken($this->apiToken())
            ->timeout((int) config('services.cloudflare_stream.timeout_seconds', 180))
            ->delete($this->streamVideoUrl($uid));

        if ($response->status() === 404) {
            return;
        }

        if (! $response->successful() || ($response->json('success') === false)) {
            $message = $response->json('errors.0.message')
                ?: $response->json('message')
                ?: $response->body();

            throw new RuntimeException("Cloudflare Stream delete failed: {$message}");
        }
    }

    private function apiToken(): string
    {
        $token = (string) config('services.cloudflare_stream.api_token', '');

        if ($token === '') {
            throw new RuntimeException('Cloudflare Stream is not configured. Set CLOUDFLARE_STREAM_API_TOKEN.');
        }

        return $token;
    }

    private function accountId(): string
    {
        $accountId = (string) config('services.cloudflare_stream.account_id', '');

        if ($accountId === '') {
            throw new RuntimeException('Cloudflare Stream is not configured. Set CLOUDFLARE_STREAM_ACCOUNT_ID.');
        }

        return $accountId;
    }

    private function streamCollectionUrl(): string
    {
        return sprintf(
            'https://api.cloudflare.com/client/v4/accounts/%s/stream',
            $this->accountId(),
        );
    }

    private function streamVideoUrl(string $uid): string
    {
        return sprintf(
            'https://api.cloudflare.com/client/v4/accounts/%s/stream/%s',
            $this->accountId(),
            $uid,
        );
    }

    private function buildPlaybackUrl(string $uid, string $path): string
    {
        $customerSubdomain = trim((string) config('services.cloudflare_stream.customer_subdomain', ''));

        if ($customerSubdomain === '') {
            return '';
        }

        return sprintf('https://%s/%s/%s', rtrim($customerSubdomain, '/'), $uid, ltrim($path, '/'));
    }
}
