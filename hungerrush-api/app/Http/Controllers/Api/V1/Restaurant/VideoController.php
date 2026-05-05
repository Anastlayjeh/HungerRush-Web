<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreVideoRequest;
use App\Http\Requests\Restaurant\UpdateVideoRequest;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\Video;
use App\Services\CloudflareStreamService;
use App\Services\RestaurantVideoIngestionService;
use App\Services\VideoStreamStatusSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class VideoController extends Controller
{
    public function index(Request $request, VideoStreamStatusSyncService $videoStreamStatusSyncService)
    {
        $restaurant = $this->resolveRestaurant();
        $query = Video::query()
            ->where('restaurant_id', $restaurant->id)
            ->with('menuItem:id,name,price,is_available')
            ->withCount([
                'engagements as views_count' => fn ($builder) => $builder->where('type', 'view'),
                'engagements as likes_count' => fn ($builder) => $builder->where('type', 'like'),
                'engagements as shares_count' => fn ($builder) => $builder->where('type', 'share'),
            ])
            ->latest();

        $status = trim((string) $request->query('status', ''));
        if ($status !== '' && in_array($status, ['draft', 'published', 'archived'], true)) {
            $query->where('status', $status);
        }

        $search = trim((string) $request->query('q', ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $videos = $query->paginate(20);
        $videos->setCollection(
            $videos->getCollection()->map(
                fn (Video $video) => $this->syncVideoStreamStatus($video, $videoStreamStatusSyncService)
            )
        );

        return $this->successResponse(
            $videos->getCollection()->map(fn (Video $video) => $this->transformVideo($video))->values(),
            [
                'current_page' => $videos->currentPage(),
                'per_page' => $videos->perPage(),
                'total' => $videos->total(),
            ]
        );
    }

    public function store(StoreVideoRequest $request, RestaurantVideoIngestionService $restaurantVideoIngestionService)
    {
        $restaurant = $this->resolveRestaurant();
        $validated = $request->validated();
        $this->assertMenuItemBelongsToRestaurant($restaurant, $validated['menu_item_id'] ?? null);

        $streamData = $restaurantVideoIngestionService->ingest($request->file('video'), $restaurant);
        $status = ($streamData['stream_ready'] ?? false) ? 'published' : ($validated['status'] ?? 'draft');
        $video = $restaurant->videos()->create([
            ...Arr::except($validated, ['video']),
            ...$streamData,
            'status' => $status,
            'published_at' => $status === 'published' ? ($validated['published_at'] ?? now()) : null,
        ]);

        $video->load('menuItem:id,name,price,is_available')
            ->loadCount([
                'engagements as views_count' => fn ($builder) => $builder->where('type', 'view'),
                'engagements as likes_count' => fn ($builder) => $builder->where('type', 'like'),
                'engagements as shares_count' => fn ($builder) => $builder->where('type', 'share'),
            ]);

        return $this->successResponse(
            $this->transformVideo($video),
            message: 'Video created successfully.',
            status: 201
        );
    }

    public function update(UpdateVideoRequest $request, Video $video)
    {
        $restaurant = $this->resolveRestaurant();
        $this->assertVideoBelongsToRestaurant($restaurant, $video);

        $validated = $request->validated();
        $this->assertMenuItemBelongsToRestaurant($restaurant, $validated['menu_item_id'] ?? null);

        if (($validated['status'] ?? null) === 'published' && empty($video->published_at)) {
            $validated['published_at'] = $validated['published_at'] ?? now();
        }

        if (($validated['status'] ?? null) !== 'published' && array_key_exists('status', $validated)) {
            $validated['published_at'] = null;
        }

        $video->update($validated);
        $video->load('menuItem:id,name,price,is_available')
            ->loadCount([
                'engagements as views_count' => fn ($builder) => $builder->where('type', 'view'),
                'engagements as likes_count' => fn ($builder) => $builder->where('type', 'like'),
                'engagements as shares_count' => fn ($builder) => $builder->where('type', 'share'),
            ]);

        return $this->successResponse(
            $this->transformVideo($video),
            message: 'Video updated successfully.'
        );
    }

    public function destroy(Video $video, CloudflareStreamService $cloudflareStreamService)
    {
        $restaurant = $this->resolveRestaurant();
        $this->assertVideoBelongsToRestaurant($restaurant, $video);

        if ($video->cloudflare_stream_uid) {
            $cloudflareStreamService->delete($video->cloudflare_stream_uid);
        }

        $video->delete();

        return $this->successResponse(['deleted' => true], message: 'Video deleted successfully.');
    }

    private function transformVideo(Video $video): array
    {
        return [
            'id' => $video->id,
            'restaurant_id' => $video->restaurant_id,
            'menu_item_id' => $video->menu_item_id,
            'title' => $video->title,
            'description' => $video->description,
            'media_url' => $video->media_url,
            'thumbnail_url' => $video->thumbnail_url,
            'stream_uid' => $video->cloudflare_stream_uid,
            'duration_seconds' => $video->duration_seconds ? (int) $video->duration_seconds : null,
            'stream_status' => $video->stream_status,
            'stream_ready' => (bool) $video->stream_ready,
            'stream_hls_url' => $video->stream_hls_url,
            'stream_dash_url' => $video->stream_dash_url,
            'stream_preview_url' => $video->stream_preview_url,
            'status' => $video->status,
            'published_at' => optional($video->published_at)->toISOString(),
            'views_count' => (int) ($video->views_count ?? 0),
            'likes_count' => (int) ($video->likes_count ?? 0),
            'shares_count' => (int) ($video->shares_count ?? 0),
            'menu_item' => $video->menuItem ? [
                'id' => $video->menuItem->id,
                'name' => $video->menuItem->name,
                'price' => (float) $video->menuItem->price,
                'is_available' => (bool) $video->menuItem->is_available,
            ] : null,
            'created_at' => optional($video->created_at)->toISOString(),
            'updated_at' => optional($video->updated_at)->toISOString(),
        ];
    }

    private function assertVideoBelongsToRestaurant(Restaurant $restaurant, Video $video): void
    {
        abort_unless($video->restaurant_id === $restaurant->id, 404);
    }

    private function assertMenuItemBelongsToRestaurant(Restaurant $restaurant, int|string|null $menuItemId): void
    {
        if (! $menuItemId) {
            return;
        }

        $belongs = MenuItem::query()
            ->whereKey($menuItemId)
            ->whereHas('category', fn ($builder) => $builder->where('restaurant_id', $restaurant->id))
            ->exists();

        abort_unless($belongs, 403, 'Selected menu item does not belong to your restaurant.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }

    private function syncVideoStreamStatus(Video $video, VideoStreamStatusSyncService $videoStreamStatusSyncService): Video
    {
        if (! $video->cloudflare_stream_uid) {
            return $video;
        }

        try {
            return $videoStreamStatusSyncService->syncVideo($video);
        } catch (\Throwable) {
            return $video;
        }
    }
}
