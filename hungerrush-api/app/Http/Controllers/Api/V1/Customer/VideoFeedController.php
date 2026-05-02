<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerSearchRequest;
use App\Http\Requests\Customer\StoreVideoCommentRequest;
use App\Http\Requests\Customer\StoreVideoEngagementRequest;
use App\Models\CustomerSearch;
use App\Models\Video;
use App\Models\VideoComment;
use App\Models\VideoEngagement;
use App\Services\CustomerVideoRecommendationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoFeedController extends Controller
{
    public function index(Request $request, CustomerVideoRecommendationService $customerVideoRecommendationService)
    {
        $feed = $customerVideoRecommendationService->buildFeedFor(auth()->user(), [
            'page' => $request->query('page'),
            'per_page' => $request->query('per_page'),
            'q' => $request->query('q'),
            'debug' => filter_var($request->query('debug', false), FILTER_VALIDATE_BOOL),
        ]);

        return $this->successResponse($feed['items'], $feed['meta']);
    }

    public function storeSearch(StoreCustomerSearchRequest $request)
    {
        $validated = $request->validated();
        $query = trim($validated['query']);

        $search = CustomerSearch::create([
            'user_id' => auth()->id(),
            'query' => $query,
            'normalized_query' => Str::lower($query),
            'context' => $validated['context'] ?? 'video_feed',
        ]);

        return $this->successResponse([
            'id' => $search->id,
            'query' => $search->query,
            'context' => $search->context,
            'created_at' => optional($search->created_at)->toISOString(),
        ], message: 'Search recorded successfully.', status: 201);
    }

    public function storeEngagement(StoreVideoEngagementRequest $request, Video $video)
    {
        $this->assertVideoAvailableForFeed($video);
        $type = $request->validated()['type'];

        if ($type === 'view') {
            $existingRecentView = VideoEngagement::query()
                ->where('video_id', $video->id)
                ->where('user_id', auth()->id())
                ->where('type', 'view')
                ->where('created_at', '>=', now()->subMinutes(30))
                ->exists();

            if (! $existingRecentView) {
                VideoEngagement::create([
                    'video_id' => $video->id,
                    'user_id' => auth()->id(),
                    'type' => 'view',
                ]);
            }
        } elseif (in_array($type, ['like', 'save'], true)) {
            VideoEngagement::firstOrCreate([
                'video_id' => $video->id,
                'user_id' => auth()->id(),
                'type' => $type,
            ]);
        } else {
            VideoEngagement::create([
                'video_id' => $video->id,
                'user_id' => auth()->id(),
                'type' => $type,
            ]);
        }

        return $this->successResponse($this->buildEngagementSummary($video->fresh()), message: 'Engagement recorded successfully.', status: 201);
    }

    public function destroyEngagement(Video $video, string $type)
    {
        $this->assertVideoAvailableForFeed($video);
        abort_unless(in_array($type, ['like', 'save'], true), 404);

        VideoEngagement::query()
            ->where('video_id', $video->id)
            ->where('user_id', auth()->id())
            ->where('type', $type)
            ->delete();

        return $this->successResponse($this->buildEngagementSummary($video->fresh()), message: 'Engagement removed successfully.');
    }

    public function comments(Video $video)
    {
        $this->assertVideoAvailableForFeed($video);

        $comments = VideoComment::query()
            ->where('video_id', $video->id)
            ->with('user:id,name,avatar')
            ->latest()
            ->paginate(20);

        return $this->successResponse(
            $comments->getCollection()->map(fn (VideoComment $comment) => $this->transformComment($comment))->values(),
            [
                'current_page' => $comments->currentPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
            ]
        );
    }

    public function storeComment(StoreVideoCommentRequest $request, Video $video)
    {
        $this->assertVideoAvailableForFeed($video);

        $comment = VideoComment::create([
            'video_id' => $video->id,
            'user_id' => auth()->id(),
            'body' => trim($request->validated()['body']),
        ])->load('user:id,name,avatar');

        return $this->successResponse($this->transformComment($comment), message: 'Comment added successfully.', status: 201);
    }

    private function assertVideoAvailableForFeed(Video $video): void
    {
        abort_unless($video->status === 'published' && $video->stream_ready, 404);
    }

    private function transformComment(VideoComment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'user' => $comment->user ? [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
                'avatar' => $comment->user->avatar,
            ] : null,
            'created_at' => optional($comment->created_at)->toISOString(),
            'updated_at' => optional($comment->updated_at)->toISOString(),
        ];
    }

    private function buildEngagementSummary(Video $video): array
    {
        return [
            'video_id' => $video->id,
            'viewer_state' => [
                'is_liked' => VideoEngagement::query()->where('video_id', $video->id)->where('user_id', auth()->id())->where('type', 'like')->exists(),
                'is_saved' => VideoEngagement::query()->where('video_id', $video->id)->where('user_id', auth()->id())->where('type', 'save')->exists(),
            ],
            'stats' => [
                'views_count' => VideoEngagement::query()->where('video_id', $video->id)->where('type', 'view')->count(),
                'likes_count' => VideoEngagement::query()->where('video_id', $video->id)->where('type', 'like')->count(),
                'shares_count' => VideoEngagement::query()->where('video_id', $video->id)->where('type', 'share')->count(),
                'saves_count' => VideoEngagement::query()->where('video_id', $video->id)->where('type', 'save')->count(),
                'comments_count' => VideoComment::query()->where('video_id', $video->id)->count(),
            ],
        ];
    }
}
