<?php

namespace App\Services;

use App\Models\Restaurant;
use Illuminate\Http\UploadedFile;
use RuntimeException;

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

        $moderation = $this->foodVideoModerationService->moderate($videoPath);
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
                'stream_ready' => $stream['ready_to_stream'],
                'stream_hls_url' => $stream['playback_hls_url'],
                'stream_dash_url' => $stream['playback_dash_url'],
                'stream_preview_url' => $stream['preview_url'],
            ],
            'moderation' => $moderation,
            'stream' => $stream,
        ];
    }
}
