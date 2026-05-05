<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class VideoModerationCallbackController extends Controller
{
    public function store(Request $request)
    {
        $expectedToken = (string) config('services.video_worker.token', '');
        $providedToken = (string) $request->header('X-Video-Worker-Token', '');

        abort_unless(
            $expectedToken !== '' && hash_equals($expectedToken, $providedToken),
            403,
            'Invalid video worker token.'
        );

        $validated = $request->validate([
            'video_id' => ['required', 'integer', 'exists:videos,id'],
            'is_food_related' => ['nullable', 'boolean'],
            'confidence' => ['nullable', 'numeric'],
            'moderation_confidence' => ['nullable', 'numeric'],
            'error' => ['nullable', 'string'],
            'message' => ['nullable', 'string'],
            'reason' => ['nullable', 'string'],
        ]);

        $video = Video::query()->findOrFail($validated['video_id']);
        $errorMessage = $this->errorMessage($request);
        $moderationFailed = $errorMessage !== null || ! $request->has('is_food_related');
        $isFoodRelated = ! $moderationFailed && $request->boolean('is_food_related');
        $checkedAt = now();

        if ($moderationFailed) {
            $attributes = [
                'status' => 'draft',
                'moderation_status' => 'failed',
                'moderation_reason' => $errorMessage ?: 'Video moderation failed',
                'moderation_confidence' => $this->confidence($request),
                'moderation_checked_at' => $checkedAt,
            ];
        } else {
            $attributes = [
                'status' => $isFoodRelated ? 'published' : 'draft',
                'moderation_status' => $isFoodRelated ? 'approved' : 'rejected',
                'moderation_reason' => $isFoodRelated
                    ? 'Food-related video approved'
                    : 'Video rejected because it does not appear to be food-related',
                'moderation_confidence' => $this->confidence($request),
                'moderation_checked_at' => $checkedAt,
            ];
        }

        if (Schema::hasColumn('videos', 'stream_ready')) {
            $attributes['stream_ready'] = $isFoodRelated;
        }

        if (Schema::hasColumn('videos', 'published_at')) {
            $attributes['published_at'] = $isFoodRelated ? now() : null;
        }

        $video->forceFill($attributes)->save();
        $this->deleteTemporaryModerationVideo($video, $request);

        return $this->successResponse(['updated' => true], message: 'Video moderation updated.');
    }

    private function deleteTemporaryModerationVideo(Video $video, Request $request): void
    {
        $path = $this->cachedTemporaryModerationVideoPath($video)
            ?: $this->publicDiskPathFromUrl((string) ($request->input('video_url') ?: $request->input('moderation_video_url')));

        if ($path === null || ! Str::startsWith($path, 'moderation-videos/')) {
            return;
        }

        try {
            Storage::disk('public')->delete($path);
        } catch (Throwable $throwable) {
            Log::warning('Temporary moderation video could not be deleted.', [
                'video_id' => $video->id,
                'path' => $path,
                'message' => $throwable->getMessage(),
            ]);
        }
    }

    private function cachedTemporaryModerationVideoPath(Video $video): ?string
    {
        try {
            $path = Cache::pull($this->temporaryModerationVideoCacheKey($video));
        } catch (Throwable $throwable) {
            Log::warning('Temporary moderation video path could not be read from cache.', [
                'video_id' => $video->id,
                'message' => $throwable->getMessage(),
            ]);

            return null;
        }

        return is_string($path) && $path !== '' ? $path : null;
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

    private function confidence(Request $request): ?float
    {
        $confidence = $request->input('confidence', $request->input('moderation_confidence'));

        return is_numeric($confidence) ? (float) $confidence : null;
    }

    private function errorMessage(Request $request): ?string
    {
        foreach (['error', 'message', 'reason'] as $field) {
            $message = trim((string) $request->input($field, ''));

            if ($message !== '') {
                return $message;
            }
        }

        return null;
    }
}
