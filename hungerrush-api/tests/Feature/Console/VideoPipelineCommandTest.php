<?php

namespace Tests\Feature\Console;

use App\Models\Video;
use App\Services\RestaurantVideoIngestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class VideoPipelineCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_pipeline_command_creates_a_video_record(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'video-pipeline-test-');
        file_put_contents($path, 'fake video bytes');

        $this->app->instance(RestaurantVideoIngestionService::class, new class extends RestaurantVideoIngestionService
        {
            public function __construct()
            {
            }

            public function ingestWithReport(UploadedFile $videoFile, \App\Models\Restaurant $restaurant): array
            {
                return [
                    'video_attributes' => [
                        'media_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/manifest/video.m3u8',
                        'thumbnail_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/thumbnails/thumbnail.jpg',
                        'cloudflare_stream_uid' => 'testuid12345678901234567890123456',
                        'duration_seconds' => 45,
                        'stream_status' => 'ready',
                        'stream_ready' => true,
                        'stream_hls_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/manifest/video.m3u8',
                        'stream_dash_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/manifest/video.mpd',
                        'stream_preview_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/watch',
                    ],
                    'moderation' => [
                        'duration_seconds' => 45,
                        'frame_count' => 12,
                        'food_frame_count' => 10,
                        'food_frame_ratio' => 0.83,
                    ],
                    'stream' => [
                        'uid' => 'testuid12345678901234567890123456',
                        'ready_to_stream' => true,
                        'status' => 'ready',
                        'playback_hls_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/manifest/video.m3u8',
                        'playback_dash_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/manifest/video.mpd',
                        'preview_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/watch',
                        'thumbnail_url' => 'https://customer-example.cloudflarestream.com/testuid12345678901234567890123456/thumbnails/thumbnail.jpg',
                    ],
                ];
            }
        });

        try {
            $this->artisan('videos:test-pipeline', [
                'file' => $path,
                '--title' => 'CLI Smoke Video',
                '--owner-email' => 'cli-smoke@example.com',
            ])->assertExitCode(0);

            $this->assertDatabaseHas('users', [
                'email' => 'cli-smoke@example.com',
            ]);

            $this->assertDatabaseHas('videos', [
                'title' => 'CLI Smoke Video',
                'cloudflare_stream_uid' => 'testuid12345678901234567890123456',
                'stream_ready' => 1,
            ]);
        } finally {
            if (is_file($path)) {
                unlink($path);
            }
        }
    }
}
