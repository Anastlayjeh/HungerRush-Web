<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\Video;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class RestaurantVideoIngestionService
{
    private ?string $moderationVideoUrl = null;

    public function __construct(
        private readonly FoodVideoModerationService $foodVideoModerationService,
        private readonly CloudflareStreamService $cloudflareStreamService,
    ) {
    }

    public function ingest(UploadedFile $videoFile, Restaurant $restaurant): array
    {
        return $this->ingestWithReport($videoFile, $restaurant)['video_attributes'];
    }

    public function ingestWithReport(UploadedFile $videoFile, Restaurant $restaurant): array
    {
        $this->moderationVideoUrl = null;
        $videoPath = $videoFile->getRealPath();

        if (! $videoPath) {
            throw new RuntimeException('The uploaded video could not be read.');
        }

        $streamProvider = $this->streamProvider();
        $requiresRemoteModeration = $streamProvider === 'local' || ! $this->localProbingEnabled();
        $moderation = $requiresRemoteModeration
            ? $this->pendingModerationReport()
            : $this->foodVideoModerationService->moderate($videoPath);

        if ($requiresRemoteModeration) {
            $this->moderationVideoUrl = $this->storeTemporaryModerationVideo($videoFile, $restaurant);
        }

        if ($streamProvider === 'local') {
            $videoAttributes = $this->storeLocalVideo($videoFile, $restaurant, $moderation);

            return [
                'video_attributes' => $videoAttributes,
                'moderation_video_url' => $this->moderationVideoUrl,
                'moderation' => $moderation,
                'stream' => null,
            ];
        }

        $stream = $this->cloudflareStreamService->upload($videoPath, $videoFile->getClientOriginalName());

        if (($stream['playback_hls_url'] ?? '') === '') {
            throw new RuntimeException(
                'Cloudflare Stream did not return an HLS playback URL. Set CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN if your account requires derived playback URLs.'
            );
        }

        return [
            'video_attributes' => [
                'media_url' => $stream['playback_hls_url'],
                'thumbnail_url' => $stream['thumbnail_url'],
                'cloudflare_stream_uid' => $stream['uid'],
                'duration_seconds' => $moderation['duration_seconds'],
                'stream_status' => $stream['status'],
                'stream_ready' => $requiresRemoteModeration ? false : $stream['ready_to_stream'],
                'stream_hls_url' => $stream['playback_hls_url'],
                'stream_dash_url' => $stream['playback_dash_url'],
                'stream_preview_url' => $stream['preview_url'],
            ],
            'moderation_video_url' => $this->moderationVideoUrl,
            'moderation' => $moderation,
            'stream' => $stream,
        ];
    }

    public function localProbingEnabled(): bool
    {
        return (bool) config('services.video_processing.local_probing_enabled', true);
    }

    public function streamProvider(): string
    {
        $provider = strtolower(trim((string) config('services.video_processing.stream_provider', 'cloudflare')));

        if (! in_array($provider, ['cloudflare', 'local'], true)) {
            throw new RuntimeException("Unsupported video stream provider [{$provider}].");
        }

        return $provider;
    }

    public function requiresRemoteModeration(): bool
    {
        return $this->streamProvider() === 'local' || ! $this->localProbingEnabled();
    }

    public function moderationVideoUrl(): ?string
    {
        return $this->moderationVideoUrl;
    }

    public function requestRemoteModeration(Video $video, ?string $sourceVideoUrl = null): void
    {
        $workerUrl = rtrim((string) config('services.video_worker.url', ''), '/');
        $workerToken = (string) config('services.video_worker.token', '');
        $moderationVideoUrl = trim((string) $sourceVideoUrl);

        if ($this->isCloudflarePlaybackUrl($moderationVideoUrl)) {
            Log::error('Video worker moderation request blocked because the worker video URL points to Cloudflare Stream.', [
                'video_id' => $video->id,
                'worker_video_url' => $moderationVideoUrl,
            ]);
            $this->markRemoteModerationFailed($video, 'Video moderation failed');

            return;
        }

        $moderationVideoUrl = $this->workerModerationVideoUrl($moderationVideoUrl);

        if ($workerUrl === '' || $moderationVideoUrl === '') {
            Log::warning('Video worker moderation request skipped because configuration or video URL is missing.', [
                'video_id' => $video->id,
                'has_worker_url' => $workerUrl !== '',
                'has_video_url' => $moderationVideoUrl !== '',
            ]);
            $this->markRemoteModerationFailed($video, 'Video moderation failed');

            return;
        }

        $this->rememberTemporaryModerationVideoPath($video, $moderationVideoUrl);

        try {
            $pendingRequest = Http::acceptJson()
                ->timeout((int) config('services.video_worker.timeout_seconds', 15));

            if ($workerToken !== '') {
                $pendingRequest = $pendingRequest->withHeaders(['X-Video-Worker-Token' => $workerToken]);
            }

            Log::info('Dispatching video moderation worker', [
                'video_id' => $video->id,
                'worker_video_url' => $moderationVideoUrl,
            ]);

            $response = $pendingRequest->post("{$workerUrl}/moderate-video", [
                'video_id' => $video->id,
                'video_url' => $moderationVideoUrl,
                'callback_url' => (string) config('services.video_worker.callback_url'),
            ]);

            if (! $response->successful()) {
                Log::warning('Video worker moderation request failed.', [
                    'video_id' => $video->id,
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 500),
                ]);
                $this->markRemoteModerationFailed($video, $this->workerResponseErrorMessage($response));
            }
        } catch (Throwable $throwable) {
            Log::warning('Video worker moderation request threw an exception.', [
                'video_id' => $video->id,
                'message' => $throwable->getMessage(),
            ]);
            $this->markRemoteModerationFailed($video, $throwable->getMessage());
        }
    }

    private function pendingModerationReport(): array
    {
        return [
            'status' => 'draft',
            'duration_seconds' => null,
            'frame_count' => 0,
            'food_frame_count' => 0,
            'food_frame_ratio' => 0.0,
        ];
    }

    private function storeTemporaryModerationVideo(UploadedFile $videoFile, Restaurant $restaurant): string
    {
        $path = $videoFile->storePubliclyAs(
            "moderation-videos/restaurants/{$restaurant->id}",
            Str::uuid() . '.mp4',
            'public'
        );

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('The uploaded video could not be stored for moderation.');
        }

        return $this->publicDiskUrl($path);
    }

    private function storeLocalVideo(UploadedFile $videoFile, Restaurant $restaurant, array $moderation): array
    {
        $path = $videoFile->storePublicly("videos/restaurants/{$restaurant->id}", 'public');

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('The uploaded video could not be stored on public storage.');
        }

        $videoUrl = $this->publicDiskUrl($path);

        return [
            'media_url' => $videoUrl,
            'thumbnail_url' => null,
            'cloudflare_stream_uid' => null,
            'duration_seconds' => $moderation['duration_seconds'],
            'stream_status' => 'pending',
            'stream_ready' => false,
            'stream_hls_url' => $videoUrl,
            'stream_dash_url' => null,
            'stream_preview_url' => $videoUrl,
        ];
    }

    private function publicDiskUrl(string $path): string
    {
        $configuredUrl = rtrim((string) config('filesystems.disks.public.url', ''), '/');

        if ($configuredUrl !== '') {
            return "{$configuredUrl}/" . ltrim($path, '/');
        }

        $videoUrl = Storage::disk('public')->url($path);

        if (! Str::startsWith($videoUrl, ['http://', 'https://'])) {
            $videoUrl = url($videoUrl);
        }

        return $videoUrl;
    }

    private function rememberTemporaryModerationVideoPath(Video $video, string $videoUrl): void
    {
        $path = $this->publicDiskPathFromUrl($videoUrl);

        if ($path === null || ! Str::startsWith($path, 'moderation-videos/')) {
            return;
        }

        try {
            Cache::put($this->temporaryModerationVideoCacheKey($video), $path, now()->addDay());
        } catch (Throwable $throwable) {
            Log::warning('Temporary moderation video path could not be cached.', [
                'video_id' => $video->id,
                'message' => $throwable->getMessage(),
            ]);
        }
    }

    private function publicDiskPathFromUrl(string $videoUrl): ?string
    {
        $urlPath = (string) parse_url($videoUrl, PHP_URL_PATH);
        $storagePrefix = '/storage/';
        $position = strpos($urlPath, $storagePrefix);

        if ($position === false) {
            return null;
        }

        $path = ltrim(substr($urlPath, $position + strlen($storagePrefix)), '/');

        return $path !== '' ? $path : null;
    }

    private function temporaryModerationVideoCacheKey(Video $video): string
    {
        return "video-moderation-path:{$video->id}";
    }

    private function workerModerationVideoUrl(?string $sourceVideoUrl): string
    {
        $videoUrl = trim((string) $sourceVideoUrl);

        if (
            $videoUrl === ''
            || $this->isCloudflarePlaybackUrl($videoUrl)
            || ! $this->isTemporaryModerationVideoUrl($videoUrl)
        ) {
            return '';
        }

        return $videoUrl;
    }

    private function isCloudflarePlaybackUrl(string $videoUrl): bool
    {
        $normalizedUrl = strtolower($videoUrl);

        return Str::contains($normalizedUrl, [
            'cloudflarestream.com',
            '/manifest/video.m3u8',
            '/manifest/video.mpd',
        ]);
    }

    private function isTemporaryModerationVideoUrl(string $videoUrl): bool
    {
        $path = $this->publicDiskPathFromUrl($videoUrl);

        return $path !== null && Str::startsWith($path, 'moderation-videos/restaurants/');
    }

    private function markRemoteModerationFailed(Video $video, string $reason): void
    {
        try {
            $video->forceFill([
                'status' => 'draft',
                'stream_ready' => false,
                'published_at' => null,
                'moderation_status' => 'failed',
                'moderation_reason' => $reason !== '' ? $reason : 'Video moderation failed',
                'moderation_confidence' => null,
                'moderation_checked_at' => now(),
            ])->save();
        } catch (Throwable $throwable) {
            Log::warning('Failed to persist video moderation failure state.', [
                'video_id' => $video->id,
                'message' => $throwable->getMessage(),
            ]);
        }
    }

    private function workerResponseErrorMessage($response): string
    {
        $message = $response->json('error') ?: $response->json('message');

        if (is_string($message) && trim($message) !== '') {
            return trim($message);
        }

        $body = trim((string) $response->body());

        return $body !== ''
            ? Str::limit($body, 500)
            : "Video worker request failed with status {$response->status()}.";
    }
}
