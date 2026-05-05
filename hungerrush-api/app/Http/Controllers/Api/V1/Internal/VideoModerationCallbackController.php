<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

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
            'is_food_related' => ['required', 'boolean'],
        ]);

        $video = Video::query()->findOrFail($validated['video_id']);
        $isFoodRelated = $request->boolean('is_food_related');

        $attributes = [
            'status' => $isFoodRelated ? 'published' : 'draft',
        ];

        if (Schema::hasColumn('videos', 'stream_ready')) {
            $attributes['stream_ready'] = $isFoodRelated;
        }

        if (Schema::hasColumn('videos', 'published_at')) {
            $attributes['published_at'] = $isFoodRelated ? now() : null;
        }

        $video->forceFill($attributes)->save();

        return $this->successResponse(['updated' => true], message: 'Video moderation updated.');
    }
}
