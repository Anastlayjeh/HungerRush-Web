<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\Video;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class RestaurantVideoIngestionService
{
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
        $videoPath = $videoFile->getRealPath();

        if (! $videoPath) {
            throw new RuntimeException('The uploaded video could not be read.');
        }

        $requiresRemoteModeration = $this->requiresRemoteModeration();
        $moderation = $requiresRemoteModeration
            ? $this->pendingModerationReport()
            : $this->foodVideoModerationService->moderate($videoPath);

        if ($this->streamProvider() === 'local') {
            return [
                'video_attributes' => $this->storeLocalVideo($videoFile, $restaurant, $moderation),
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

    public function requestRemoteModeration(Video $video): void
    {
        $workerUrl = rtrim((string) config('services.video_worker.url', ''), '/');
        $workerToken = (string) config('services.video_worker.token', '');
        $videoUrl = (string) ($video->stream_hls_url ?: $video->media_url);

        if ($workerUrl === '' || $videoUrl === '') {
            Log::warning('Video worker moderation request skipped because configuration or video URL is missing.', [
                'video_id' => $video->id,
                'has_worker_url' => $workerUrl !== '',
                'has_video_url' => $videoUrl !== '',
            ]);

            return;
        }

        try {
            $pendingRequest = Http::acceptJson()
                ->timeout((int) config('services.video_worker.timeout_seconds', 15));

            if ($workerToken !== '') {
                $pendingRequest = $pendingRequest->withHeaders(['X-Video-Worker-Token' => $workerToken]);
            }

            $response = $pendingRequest->post("{$workerUrl}/moderate-video", [
                'video_id' => $video->id,
                'video_url' => $videoUrl,
                'callback_url' => (string) config('services.video_worker.callback_url'),
            ]);

            if (! $response->successful()) {
                Log::warning('Video worker moderation request failed.', [
                    'video_id' => $video->id,
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 500),
                ]);
            }
        } catch (Throwable $throwable) {
            Log::warning('Video worker moderation request threw an exception.', [
                'video_id' => $video->id,
                'message' => $throwable->getMessage(),
            ]);
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

    private function storeLocalVideo(UploadedFile $videoFile, Restaurant $restaurant, array $moderation): array
    {
        $path = $videoFile->storePublicly("videos/restaurants/{$restaurant->id}", 'public');

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('The uploaded video could not be stored on public storage.');
        }

        $videoUrl = Storage::disk('public')->url($path);

        if (! Str::startsWith($videoUrl, ['http://', 'https://'])) {
            $videoUrl = url($videoUrl);
        }

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
}
