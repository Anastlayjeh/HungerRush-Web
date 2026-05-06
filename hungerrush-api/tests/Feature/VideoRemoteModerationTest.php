<?php

namespace Tests\Feature;

use App\Models\Restaurant;
use App\Models\User;
use App\Models\Video;
use App\Services\CloudflareStreamService;
use App\Services\FoodVideoModerationService;
use App\Services\RestaurantVideoIngestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoRemoteModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_uses_local_storage_provider_without_cloudflare_configuration(): void
    {
        config()->set('app.url', 'https://hungerrush.site');
        config()->set('filesystems.disks.public.url', 'https://hungerrush.site/storage');
        Storage::fake('public');

        config()->set('services.video_processing.stream_provider', 'local');
        config()->set('services.video_processing.local_probing_enabled', false);
        config()->set('services.video_worker.url', 'https://worker.test');
        config()->set('services.video_worker.token', 'test-worker-token');
        config()->set('services.video_worker.callback_url', 'https://hungerrush.site/api/v1/internal/videos/moderation-callback');
        config()->set('services.cloudflare_stream.account_id', null);
        config()->set('services.cloudflare_stream.api_token', null);

        Http::fake([
            'https://worker.test/moderate-video' => Http::response(['queued' => true]),
        ]);

        $moderationService = new class extends FoodVideoModerationService
        {
            public bool $called = false;

            public function moderate(string $videoPath): array
            {
                $this->called = true;

                throw new \RuntimeException('Local probing should not run for local provider remote moderation.');
            }
        };

        $streamService = new class extends CloudflareStreamService
        {
            public bool $uploadCalled = false;

            public function upload(string $videoPath, string $originalFilename): array
            {
                $this->uploadCalled = true;

                throw new \RuntimeException('Cloudflare Stream should not be called for local provider.');
            }
        };

        $this->app->instance(
            RestaurantVideoIngestionService::class,
            new RestaurantVideoIngestionService($moderationService, $streamService)
        );

        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $response = $this->actingAs($owner, 'sanctum')
            ->post('/api/v1/restaurant/videos', [
                'title' => 'Local Stored Burger',
                'video' => UploadedFile::fake()->create('local-burger.mp4', 2048, 'video/mp4'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.stream_ready', false)
            ->assertJsonPath('data.stream_uid', null)
            ->assertJsonPath('data.moderation_status', 'pending')
            ->assertJsonPath('data.moderation_reason', 'Video is being reviewed');

        $videoId = $response->json('data.id');
        $videoUrl = (string) $response->json('data.media_url');
        $storedPath = ltrim(str_replace('/storage/', '', (string) parse_url($videoUrl, PHP_URL_PATH)), '/');

        $this->assertFalse($moderationService->called);
        $this->assertFalse($streamService->uploadCalled);
        $this->assertMatchesRegularExpression('#^https?://[^/]+/storage/videos/restaurants/#', $videoUrl);
        Storage::disk('public')->assertExists($storedPath);

        $this->assertDatabaseHas('videos', [
            'id' => $videoId,
            'media_url' => $videoUrl,
            'stream_hls_url' => $videoUrl,
            'cloudflare_stream_uid' => null,
            'status' => 'draft',
            'stream_status' => 'pending',
            'stream_ready' => 0,
            'moderation_status' => 'pending',
            'moderation_reason' => 'Video is being reviewed',
            'moderation_confidence' => null,
            'moderation_checked_at' => null,
        ]);

        $moderationVideoUrl = '';

        Http::assertSent(function (ClientRequest $request) use ($videoId, $videoUrl, &$moderationVideoUrl) {
            $moderationVideoUrl = (string) $request['video_url'];

            return $request->url() === 'https://worker.test/moderate-video'
                && $request->hasHeader('X-Video-Worker-Token', 'test-worker-token')
                && $request['video_id'] === $videoId
                && $moderationVideoUrl !== $videoUrl
                && str_contains($moderationVideoUrl, '/storage/moderation-videos/restaurants/')
                && ! str_contains($moderationVideoUrl, '/manifest/video.m3u8')
                && $request['callback_url'] === 'https://hungerrush.site/api/v1/internal/videos/moderation-callback';
        });

        $moderationPath = ltrim(str_replace('/storage/', '', (string) parse_url($moderationVideoUrl, PHP_URL_PATH)), '/');
        Storage::disk('public')->assertExists($moderationPath);
    }

    public function test_upload_uses_remote_moderation_when_local_probing_is_disabled(): void
    {
        config()->set('app.url', 'https://hungerrush.site');
        config()->set('filesystems.disks.public.url', 'https://hungerrush.site/storage');
        Storage::fake('public');

        config()->set('services.video_processing.stream_provider', 'cloudflare');
        config()->set('services.video_processing.local_probing_enabled', false);
        config()->set('services.video_worker.url', 'https://worker.test');
        config()->set('services.video_worker.token', 'test-worker-token');
        config()->set('services.video_worker.callback_url', 'https://hungerrush.site/api/v1/internal/videos/moderation-callback');

        Http::fake([
            'https://worker.test/moderate-video' => Http::response(['queued' => true]),
        ]);

        $moderationService = new class extends FoodVideoModerationService
        {
            public bool $called = false;

            public function moderate(string $videoPath): array
            {
                $this->called = true;

                throw new \RuntimeException('Local moderation should not run when local probing is disabled.');
            }
        };

        $streamService = new class extends CloudflareStreamService
        {
            public bool $uploadCalled = false;

            public function upload(string $videoPath, string $originalFilename): array
            {
                $this->uploadCalled = true;

                return [
                    'uid' => '9f3d8f11db3644d49be4f48fd3ab67f1',
                    'ready_to_stream' => true,
                    'status' => 'ready',
                    'playback_hls_url' => 'https://customer-example.cloudflarestream.com/9f3d8f11db3644d49be4f48fd3ab67f1/manifest/video.m3u8',
                    'playback_dash_url' => 'https://customer-example.cloudflarestream.com/9f3d8f11db3644d49be4f48fd3ab67f1/manifest/video.mpd',
                    'preview_url' => 'https://customer-example.cloudflarestream.com/9f3d8f11db3644d49be4f48fd3ab67f1/watch',
                    'thumbnail_url' => 'https://customer-example.cloudflarestream.com/9f3d8f11db3644d49be4f48fd3ab67f1/thumbnails/thumbnail.jpg',
                ];
            }
        };

        $this->app->instance(
            RestaurantVideoIngestionService::class,
            new RestaurantVideoIngestionService($moderationService, $streamService)
        );

        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $response = $this->actingAs($owner, 'sanctum')
            ->post('/api/v1/restaurant/videos', [
                'title' => 'Remote Moderated Burger',
                'video' => UploadedFile::fake()->create('remote-burger.mp4', 2048, 'video/mp4'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.stream_ready', false)
            ->assertJsonPath('data.moderation_status', 'pending')
            ->assertJsonPath('data.moderation_reason', 'Video is being reviewed');

        $videoId = $response->json('data.id');
        $moderationVideoUrl = '';

        $this->assertFalse($moderationService->called);
        $this->assertTrue($streamService->uploadCalled);
        $this->assertDatabaseHas('videos', [
            'id' => $videoId,
            'status' => 'draft',
            'stream_ready' => 0,
            'moderation_status' => 'pending',
            'moderation_reason' => 'Video is being reviewed',
        ]);

        Http::assertSent(function (ClientRequest $request) use ($videoId, &$moderationVideoUrl) {
            $moderationVideoUrl = (string) $request['video_url'];

            return $request->url() === 'https://worker.test/moderate-video'
                && $request->hasHeader('X-Video-Worker-Token', 'test-worker-token')
                && $request['video_id'] === $videoId
                && str_contains($moderationVideoUrl, '/storage/moderation-videos/restaurants/')
                && ! str_contains($moderationVideoUrl, '/manifest/video.m3u8')
                && $request['callback_url'] === 'https://hungerrush.site/api/v1/internal/videos/moderation-callback';
        });

        $this->assertMatchesRegularExpression(
            '#^https://hungerrush\.site/storage/moderation-videos/restaurants/\d+/.*\.mp4$#',
            $moderationVideoUrl
        );

        $storedPath = ltrim(str_replace('/storage/', '', (string) parse_url($moderationVideoUrl, PHP_URL_PATH)), '/');
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_remote_moderation_does_not_fallback_to_cloudflare_manifest_url(): void
    {
        config()->set('services.video_processing.stream_provider', 'cloudflare');
        config()->set('services.video_processing.local_probing_enabled', false);
        config()->set('services.video_worker.url', 'https://worker.test');
        config()->set('services.video_worker.token', 'test-worker-token');
        config()->set('services.video_worker.callback_url', 'https://hungerrush.site/api/v1/internal/videos/moderation-callback');

        Http::fake([
            'https://worker.test/moderate-video' => Http::response(['queued' => true]),
        ]);

        $moderationService = new class extends FoodVideoModerationService
        {
            public function moderate(string $videoPath): array
            {
                throw new \RuntimeException('Local probing should not run for remote moderation.');
            }
        };

        $streamService = new class extends CloudflareStreamService
        {
            public function upload(string $videoPath, string $originalFilename): array
            {
                throw new \RuntimeException('Cloudflare Stream upload is not part of this test.');
            }
        };

        $service = new RestaurantVideoIngestionService($moderationService, $streamService);
        $manifestUrl = 'https://customer-example.cloudflarestream.com/9f3d8f11db3644d49be4f48fd3ab67f1/manifest/video.m3u8';
        $video = Video::factory()->create([
            'media_url' => $manifestUrl,
            'stream_hls_url' => $manifestUrl,
            'status' => 'draft',
            'stream_ready' => false,
            'published_at' => null,
            'moderation_status' => 'pending',
            'moderation_reason' => 'Video is being reviewed',
        ]);

        $service->requestRemoteModeration($video, $manifestUrl);

        Http::assertSentCount(0);
        $this->assertDatabaseHas('videos', [
            'id' => $video->id,
            'status' => 'draft',
            'stream_ready' => 0,
            'published_at' => null,
            'moderation_status' => 'failed',
            'moderation_reason' => 'Video moderation failed',
        ]);
    }

    public function test_moderation_callback_publishes_or_keeps_video_draft(): void
    {
        config()->set('services.video_worker.token', 'test-worker-token');
        Storage::fake('public');

        $approvedVideo = Video::factory()->create([
            'status' => 'draft',
            'stream_ready' => false,
            'published_at' => null,
        ]);
        $approvedModerationPath = 'moderation-videos/restaurants/1/approved.mp4';
        Storage::disk('public')->put($approvedModerationPath, 'temporary video bytes');
        Cache::put("video-moderation-path:{$approvedVideo->id}", $approvedModerationPath, now()->addDay());

        $this->withHeader('X-Video-Worker-Token', 'test-worker-token')
            ->postJson('/api/v1/internal/videos/moderation-callback', [
                'video_id' => $approvedVideo->id,
                'is_food_related' => true,
                'confidence' => 0.94,
            ])
            ->assertOk()
            ->assertJsonPath('data.updated', true);

        $this->assertDatabaseHas('videos', [
            'id' => $approvedVideo->id,
            'status' => 'published',
            'stream_ready' => 1,
            'moderation_status' => 'approved',
            'moderation_reason' => 'Food-related video approved',
            'moderation_confidence' => 0.94,
        ]);
        $this->assertNotNull($approvedVideo->refresh()->moderation_checked_at);
        Storage::disk('public')->assertMissing($approvedModerationPath);

        $nonFoodVideo = Video::factory()->create([
            'status' => 'draft',
            'stream_ready' => true,
            'published_at' => now(),
        ]);
        $nonFoodModerationPath = 'moderation-videos/restaurants/1/non-food.mp4';
        Storage::disk('public')->put($nonFoodModerationPath, 'temporary video bytes');
        Cache::put("video-moderation-path:{$nonFoodVideo->id}", $nonFoodModerationPath, now()->addDay());

        $this->withHeader('X-Video-Worker-Token', 'test-worker-token')
            ->postJson('/api/v1/internal/videos/moderation-callback', [
                'video_id' => $nonFoodVideo->id,
                'is_food_related' => false,
                'confidence' => 0.18,
            ])
            ->assertOk();

        $this->assertDatabaseHas('videos', [
            'id' => $nonFoodVideo->id,
            'status' => 'draft',
            'stream_ready' => 0,
            'published_at' => null,
            'moderation_status' => 'rejected',
            'moderation_reason' => 'Video rejected because it does not appear to be food-related',
            'moderation_confidence' => 0.18,
        ]);
        $this->assertNotNull($nonFoodVideo->refresh()->moderation_checked_at);
        Storage::disk('public')->assertMissing($nonFoodModerationPath);
    }

    public function test_moderation_callback_marks_video_failed_when_worker_reports_error(): void
    {
        config()->set('services.video_worker.token', 'test-worker-token');

        $video = Video::factory()->create([
            'status' => 'draft',
            'stream_ready' => false,
            'published_at' => null,
            'moderation_status' => 'pending',
            'moderation_reason' => 'Video is being reviewed',
        ]);

        $this->withHeader('X-Video-Worker-Token', 'test-worker-token')
            ->postJson('/api/v1/internal/videos/moderation-callback', [
                'video_id' => $video->id,
                'error' => 'Worker could not download the video.',
            ])
            ->assertOk()
            ->assertJsonPath('data.updated', true);

        $this->assertDatabaseHas('videos', [
            'id' => $video->id,
            'status' => 'draft',
            'stream_ready' => 0,
            'published_at' => null,
            'moderation_status' => 'failed',
            'moderation_reason' => 'Worker could not download the video.',
        ]);
        $this->assertNotNull($video->refresh()->moderation_checked_at);
    }

    public function test_upload_marks_moderation_failed_when_worker_request_fails(): void
    {
        config()->set('app.url', 'https://hungerrush.site');
        config()->set('filesystems.disks.public.url', 'https://hungerrush.site/storage');
        Storage::fake('public');

        config()->set('services.video_processing.stream_provider', 'local');
        config()->set('services.video_processing.local_probing_enabled', false);
        config()->set('services.video_worker.url', 'https://worker.test');
        config()->set('services.video_worker.token', 'test-worker-token');
        config()->set('services.video_worker.callback_url', 'https://hungerrush.site/api/v1/internal/videos/moderation-callback');

        Http::fake([
            'https://worker.test/moderate-video' => Http::response(['error' => 'Worker unavailable'], 500),
        ]);

        $moderationService = new class extends FoodVideoModerationService
        {
            public function moderate(string $videoPath): array
            {
                throw new \RuntimeException('Local probing should not run for remote moderation.');
            }
        };

        $streamService = new class extends CloudflareStreamService
        {
            public function upload(string $videoPath, string $originalFilename): array
            {
                throw new \RuntimeException('Cloudflare Stream should not be called for local provider.');
            }
        };

        $this->app->instance(
            RestaurantVideoIngestionService::class,
            new RestaurantVideoIngestionService($moderationService, $streamService)
        );

        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $response = $this->actingAs($owner, 'sanctum')
            ->post('/api/v1/restaurant/videos', [
                'title' => 'Worker Failure Burger',
                'video' => UploadedFile::fake()->create('worker-failure.mp4', 2048, 'video/mp4'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.stream_ready', false)
            ->assertJsonPath('data.moderation_status', 'pending')
            ->assertJsonPath('data.moderation_reason', 'Video is being reviewed');

        $this->assertDatabaseHas('videos', [
            'id' => $response->json('data.id'),
            'status' => 'draft',
            'stream_ready' => 0,
            'published_at' => null,
            'moderation_status' => 'failed',
            'moderation_reason' => 'Worker unavailable',
        ]);
    }
}
