<?php

use App\Enums\UserRole;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Video;
use App\Services\CloudflareStreamService;
use App\Services\RestaurantVideoIngestionService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Symfony\Component\Console\Command\Command;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'videos:test-pipeline
        {file : Path to a local video file}
        {--title=CLI Pipeline Test}
        {--description=Uploaded through the CLI smoke test}
        {--owner-email=video-pipeline-tester@hungerrush.local}
        {--restaurant-name=Pipeline Test Restaurant}
        {--status=draft}
        {--menu-item-id=}
        {--cleanup : Delete the created DB record and Cloudflare video after the test}',
    function () {
        $file = (string) $this->argument('file');
        $status = trim((string) $this->option('status')) ?: 'draft';

        if (! in_array($status, ['draft', 'published', 'archived'], true)) {
            $this->error('The --status option must be one of: draft, published, archived.');

            return Command::FAILURE;
        }

        $resolvedPath = $file;
        if (! preg_match('/^(?:[A-Za-z]:[\\\\\\/]|\/)/', $resolvedPath)) {
            $resolvedPath = base_path($resolvedPath);
        }
        $resolvedPath = realpath($resolvedPath) ?: $resolvedPath;

        if (! is_file($resolvedPath) || ! is_readable($resolvedPath)) {
            $this->error("Video file not found or unreadable: {$resolvedPath}");

            return Command::FAILURE;
        }

        $ownerEmail = trim((string) $this->option('owner-email'));
        $restaurantName = trim((string) $this->option('restaurant-name')) ?: 'Pipeline Test Restaurant';
        $menuItemId = $this->option('menu-item-id');

        $owner = User::query()->firstOrCreate(
            ['email' => $ownerEmail],
            [
                'name' => 'Pipeline Tester',
                'phone' => '01' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
                'password' => Hash::make(Str::random(32)),
                'role' => UserRole::RestaurantOwner,
                'status' => 'active',
            ]
        );

        if ($owner->role !== UserRole::RestaurantOwner) {
            $owner->forceFill(['role' => UserRole::RestaurantOwner])->save();
        }

        $restaurant = Restaurant::query()->firstOrCreate(
            ['owner_user_id' => $owner->id],
            ['name' => $restaurantName, 'status' => 'active']
        );

        $uploadedFile = new UploadedFile(
            $resolvedPath,
            basename($resolvedPath),
            mime_content_type($resolvedPath) ?: 'video/mp4',
            test: true
        );

        $this->info('Running moderation and upload pipeline...');

        try {
            $result = app(RestaurantVideoIngestionService::class)->ingestWithReport($uploadedFile, $restaurant);
        } catch (\Throwable $throwable) {
            $this->error($throwable->getMessage());

            return Command::FAILURE;
        }

        $video = Video::query()->create([
            'restaurant_id' => $restaurant->id,
            'menu_item_id' => $menuItemId ? (int) $menuItemId : null,
            'title' => trim((string) $this->option('title')) ?: 'CLI Pipeline Test',
            'description' => trim((string) $this->option('description')) ?: null,
            ...$result['video_attributes'],
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
        ]);

        $moderation = $result['moderation'];
        $stream = $result['stream'];

        $this->newLine();
        $this->table(
            ['Field', 'Value'],
            [
                ['Video ID', (string) $video->id],
                ['Restaurant ID', (string) $restaurant->id],
                ['Duration (seconds)', (string) $moderation['duration_seconds']],
                ['Frames analyzed', (string) $moderation['frame_count']],
                ['Food frames', (string) $moderation['food_frame_count']],
                ['Food ratio', number_format((float) $moderation['food_frame_ratio'], 2)],
                ['Cloudflare UID', (string) $stream['uid']],
                ['Stream status', (string) $stream['status']],
                ['Ready to stream', $stream['ready_to_stream'] ? 'yes' : 'no'],
                ['HLS URL', (string) $stream['playback_hls_url']],
                ['DASH URL', (string) $stream['playback_dash_url']],
                ['Thumbnail URL', (string) $stream['thumbnail_url']],
                ['Preview URL', (string) $stream['preview_url']],
            ]
        );

        if ((bool) $this->option('cleanup')) {
            try {
                if ($video->cloudflare_stream_uid) {
                    app(CloudflareStreamService::class)->delete($video->cloudflare_stream_uid);
                }

                $video->delete();
                $this->info('Cleanup completed: removed the video record and Cloudflare asset.');
            } catch (\Throwable $throwable) {
                $this->error('The pipeline succeeded, but cleanup failed: ' . $throwable->getMessage());

                return Command::FAILURE;
            }
        } else {
            $this->info('Pipeline completed. The video record and Cloudflare asset were kept.');
        }

        return Command::SUCCESS;
    }
)->purpose('Run the real ffmpeg + Hugging Face + Cloudflare Stream pipeline against a local file');
