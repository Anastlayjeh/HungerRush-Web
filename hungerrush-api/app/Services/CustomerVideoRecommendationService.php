<?php

namespace App\Services;

use App\Models\CustomerSearch;
use App\Models\Order;
use App\Models\RestaurantFollow;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoComment;
use App\Models\VideoEngagement;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CustomerVideoRecommendationService
{
    public function buildFeedFor(User $user, array $filters = []): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(30, max(1, (int) ($filters['per_page'] ?? 15)));
        $query = trim((string) ($filters['q'] ?? ''));
        $debug = (bool) ($filters['debug'] ?? false);

        $videos = $this->candidateVideos($query);
        $signals = $this->loadSignals($user, $query);
        $scored = $videos->map(fn (Video $video) => $this->scoreVideo($video, $signals, $debug));
        $ranked = $this->diversify($scored);

        $total = $ranked->count();
        $items = $ranked
            ->slice(($page - 1) * $perPage, $perPage)
            ->values()
            ->map(fn (array $entry) => $entry['item'])
            ->all();

        return [
            'items' => $items,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ];
    }

    private function candidateVideos(string $query): Collection
    {
        $videos = Video::query()
            ->where('status', 'published')
            ->where('stream_ready', true)
            ->with([
                'restaurant:id,name,description',
                'menuItem:id,name,price',
            ])
            ->withCount([
                'engagements as views_count' => fn ($builder) => $builder->where('type', 'view'),
                'engagements as likes_count' => fn ($builder) => $builder->where('type', 'like'),
                'engagements as shares_count' => fn ($builder) => $builder->where('type', 'share'),
                'engagements as saves_count' => fn ($builder) => $builder->where('type', 'save'),
                'comments',
            ])
            ->latest('published_at')
            ->limit(250);

        if ($query !== '') {
            $videos->where(function ($builder) use ($query) {
                $builder
                    ->where('title', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%")
                    ->orWhereHas('restaurant', fn ($restaurantQuery) => $restaurantQuery
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%"))
                    ->orWhereHas('menuItem', fn ($menuItemQuery) => $menuItemQuery
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%")
                        ->orWhere('ingredients', 'like', "%{$query}%"));
            });
        }

        return $videos->get();
    }

    private function loadSignals(User $user, string $currentQuery): array
    {
        $orderedRestaurantWeights = [];
        $orderedMenuItemWeights = [];

        Order::query()
            ->where('customer_id', $user->id)
            ->with('items:order_id,menu_item_id,quantity')
            ->latest()
            ->take(15)
            ->get()
            ->values()
            ->each(function (Order $order, int $index) use (&$orderedRestaurantWeights, &$orderedMenuItemWeights) {
                $weight = max(1, 15 - $index);
                $orderedRestaurantWeights[$order->restaurant_id] = ($orderedRestaurantWeights[$order->restaurant_id] ?? 0) + ($weight * 3);

                foreach ($order->items as $item) {
                    $orderedMenuItemWeights[$item->menu_item_id] = ($orderedMenuItemWeights[$item->menu_item_id] ?? 0) + ($weight * max(1, (int) $item->quantity) * 4);
                }
            });

        $followedRestaurantIds = RestaurantFollow::query()
            ->where('user_id', $user->id)
            ->pluck('restaurant_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $engagedRestaurantWeights = [];
        $engagedMenuItemWeights = [];
        $recentViewCounts = [];

        VideoEngagement::query()
            ->where('user_id', $user->id)
            ->with('video:id,restaurant_id,menu_item_id')
            ->latest()
            ->take(120)
            ->get()
            ->values()
            ->each(function (VideoEngagement $engagement, int $index) use (&$engagedRestaurantWeights, &$engagedMenuItemWeights, &$recentViewCounts) {
                if (! $engagement->video) {
                    return;
                }

                $recencyWeight = max(1, 12 - $index);
                $restaurantId = (int) $engagement->video->restaurant_id;
                $menuItemId = $engagement->video->menu_item_id ? (int) $engagement->video->menu_item_id : null;

                if ($engagement->type === 'view') {
                    $recentViewCounts[$engagement->video_id] = ($recentViewCounts[$engagement->video_id] ?? 0) + 1;
                    return;
                }

                $base = match ($engagement->type) {
                    'save' => 6,
                    'share' => 5,
                    'like' => 4,
                    default => 0,
                };

                $engagedRestaurantWeights[$restaurantId] = ($engagedRestaurantWeights[$restaurantId] ?? 0) + ($base * $recencyWeight);
                if ($menuItemId) {
                    $engagedMenuItemWeights[$menuItemId] = ($engagedMenuItemWeights[$menuItemId] ?? 0) + ($base * $recencyWeight);
                }
            });

        $commentRestaurantWeights = [];
        $commentedVideoIds = [];

        VideoComment::query()
            ->where('user_id', $user->id)
            ->with('video:id,restaurant_id')
            ->latest()
            ->take(60)
            ->get()
            ->values()
            ->each(function (VideoComment $comment, int $index) use (&$commentRestaurantWeights, &$commentedVideoIds) {
                if (! $comment->video) {
                    return;
                }

                $weight = max(1, 10 - $index);
                $commentedVideoIds[(int) $comment->video_id] = true;
                $commentRestaurantWeights[(int) $comment->video->restaurant_id] = ($commentRestaurantWeights[(int) $comment->video->restaurant_id] ?? 0) + ($weight * 3);
            });

        $likedVideoIds = VideoEngagement::query()
            ->where('user_id', $user->id)
            ->where('type', 'like')
            ->pluck('video_id')
            ->mapWithKeys(fn ($id) => [(int) $id => true])
            ->all();

        $savedVideoIds = VideoEngagement::query()
            ->where('user_id', $user->id)
            ->where('type', 'save')
            ->pluck('video_id')
            ->mapWithKeys(fn ($id) => [(int) $id => true])
            ->all();

        return [
            'ordered_restaurant_weights' => $orderedRestaurantWeights,
            'ordered_menu_item_weights' => $orderedMenuItemWeights,
            'followed_restaurant_ids' => array_fill_keys($followedRestaurantIds, true),
            'engaged_restaurant_weights' => $engagedRestaurantWeights,
            'engaged_menu_item_weights' => $engagedMenuItemWeights,
            'comment_restaurant_weights' => $commentRestaurantWeights,
            'commented_video_ids' => $commentedVideoIds,
            'recent_view_counts' => $recentViewCounts,
            'liked_video_ids' => $likedVideoIds,
            'saved_video_ids' => $savedVideoIds,
            'search_term_weights' => $this->buildSearchTermWeights($user, $currentQuery),
        ];
    }

    private function buildSearchTermWeights(User $user, string $currentQuery): array
    {
        $weights = [];

        CustomerSearch::query()
            ->where('user_id', $user->id)
            ->latest()
            ->take(20)
            ->get()
            ->values()
            ->each(function (CustomerSearch $search, int $index) use (&$weights) {
                $weight = max(1, 10 - $index);
                foreach ($this->tokenize($search->normalized_query) as $token) {
                    $weights[$token] = max($weights[$token] ?? 0, $weight);
                }
            });

        foreach ($this->tokenize($currentQuery) as $token) {
            $weights[$token] = max($weights[$token] ?? 0, 12);
        }

        return $weights;
    }

    private function scoreVideo(Video $video, array $signals, bool $debug): array
    {
        $score = 0.0;
        $reasons = [];

        $views = (int) ($video->views_count ?? 0);
        $likes = (int) ($video->likes_count ?? 0);
        $shares = (int) ($video->shares_count ?? 0);
        $saves = (int) ($video->saves_count ?? 0);
        $comments = (int) ($video->comments_count ?? 0);

        $popularity = min(35, log(1 + $views + ($likes * 3) + ($shares * 4) + ($saves * 5) + ($comments * 2)) * 7);
        $score += $popularity;
        $this->maybeAddReason($reasons, $debug, 'popularity', $popularity);

        $freshness = $video->published_at
            ? max(0, 22 - (now()->diffInHours($video->published_at) / 36))
            : 0;
        $score += $freshness;
        $this->maybeAddReason($reasons, $debug, 'freshness', $freshness);

        $restaurantId = (int) $video->restaurant_id;
        $menuItemId = $video->menu_item_id ? (int) $video->menu_item_id : null;

        $menuOrderBoost = $menuItemId ? min(45, (float) ($signals['ordered_menu_item_weights'][$menuItemId] ?? 0)) : 0;
        $restaurantOrderBoost = min(30, (float) ($signals['ordered_restaurant_weights'][$restaurantId] ?? 0));
        $followBoost = isset($signals['followed_restaurant_ids'][$restaurantId]) ? 28.0 : 0.0;
        $engagementRestaurantBoost = min(24, (float) ($signals['engaged_restaurant_weights'][$restaurantId] ?? 0) * 0.4);
        $engagementMenuBoost = $menuItemId ? min(28, (float) ($signals['engaged_menu_item_weights'][$menuItemId] ?? 0) * 0.45) : 0;
        $commentBoost = min(18, (float) ($signals['comment_restaurant_weights'][$restaurantId] ?? 0) * 0.4);
        $searchBoost = min(30, $this->searchBoost($video, $signals['search_term_weights']));
        $viewPenalty = min(25, (float) (($signals['recent_view_counts'][$video->id] ?? 0) * 8));

        $score += $menuOrderBoost + $restaurantOrderBoost + $followBoost + $engagementRestaurantBoost + $engagementMenuBoost + $commentBoost + $searchBoost;
        $score -= $viewPenalty;

        $this->maybeAddReason($reasons, $debug, 'ordered_menu_item', $menuOrderBoost);
        $this->maybeAddReason($reasons, $debug, 'ordered_restaurant', $restaurantOrderBoost);
        $this->maybeAddReason($reasons, $debug, 'followed_restaurant', $followBoost);
        $this->maybeAddReason($reasons, $debug, 'restaurant_engagement', $engagementRestaurantBoost);
        $this->maybeAddReason($reasons, $debug, 'menu_item_engagement', $engagementMenuBoost);
        $this->maybeAddReason($reasons, $debug, 'comment_history', $commentBoost);
        $this->maybeAddReason($reasons, $debug, 'search_match', $searchBoost);
        $this->maybeAddReason($reasons, $debug, 'recent_view_penalty', -$viewPenalty);

        $item = [
            'id' => $video->id,
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
            'restaurant' => $video->restaurant ? [
                'id' => $video->restaurant->id,
                'name' => $video->restaurant->name,
                'description' => $video->restaurant->description,
            ] : null,
            'menu_item' => $video->menuItem ? [
                'id' => $video->menuItem->id,
                'name' => $video->menuItem->name,
                'price' => (float) $video->menuItem->price,
            ] : null,
            'stats' => [
                'views_count' => $views,
                'likes_count' => $likes,
                'shares_count' => $shares,
                'saves_count' => $saves,
                'comments_count' => $comments,
            ],
            'viewer_state' => [
                'is_liked' => isset($signals['liked_video_ids'][$video->id]),
                'is_saved' => isset($signals['saved_video_ids'][$video->id]),
                'is_following_restaurant' => isset($signals['followed_restaurant_ids'][$restaurantId]),
                'has_commented' => isset($signals['commented_video_ids'][$video->id]),
                'view_count' => (int) ($signals['recent_view_counts'][$video->id] ?? 0),
            ],
            'published_at' => optional($video->published_at)->toISOString(),
        ];

        if ($debug) {
            $item['recommendation'] = [
                'score' => round($score, 2),
                'reasons' => $reasons,
            ];
        }

        return [
            'restaurant_id' => $restaurantId,
            'score' => $score,
            'item' => $item,
        ];
    }

    private function searchBoost(Video $video, array $searchTermWeights): float
    {
        if ($searchTermWeights === []) {
            return 0.0;
        }

        $score = 0.0;
        $fields = [
            Str::lower($video->title ?? '') => 1.7,
            Str::lower($video->description ?? '') => 1.0,
            Str::lower($video->restaurant?->name ?? '') => 1.25,
            Str::lower($video->restaurant?->description ?? '') => 0.8,
            Str::lower($video->menuItem?->name ?? '') => 1.5,
        ];

        foreach ($searchTermWeights as $term => $weight) {
            foreach ($fields as $haystack => $fieldMultiplier) {
                if ($haystack !== '' && str_contains($haystack, $term)) {
                    $score += $weight * $fieldMultiplier;
                    break;
                }
            }
        }

        return $score;
    }

    private function diversify(Collection $scored): Collection
    {
        $remaining = $scored->sortByDesc('score')->values();
        $selected = collect();
        $restaurantCounts = [];

        while ($remaining->isNotEmpty()) {
            $bestIndex = 0;
            $bestAdjustedScore = null;

            foreach ($remaining as $index => $entry) {
                $repeatPenalty = ($restaurantCounts[$entry['restaurant_id']] ?? 0) * 12;
                $adjustedScore = $entry['score'] - $repeatPenalty;

                if ($bestAdjustedScore === null || $adjustedScore > $bestAdjustedScore) {
                    $bestAdjustedScore = $adjustedScore;
                    $bestIndex = $index;
                }
            }

            $picked = $remaining->get($bestIndex);
            $selected->push($picked);
            $restaurantCounts[$picked['restaurant_id']] = ($restaurantCounts[$picked['restaurant_id']] ?? 0) + 1;
            $remaining->forget($bestIndex);
            $remaining = $remaining->values();
        }

        return $selected;
    }

    private function tokenize(string $value): array
    {
        $normalized = Str::lower(trim($value));
        $normalized = preg_replace('/[^a-z0-9]+/i', ' ', $normalized) ?? $normalized;

        return collect(explode(' ', $normalized))
            ->map(fn ($token) => trim($token))
            ->filter(fn ($token) => strlen($token) >= 2)
            ->unique()
            ->values()
            ->all();
    }

    private function maybeAddReason(array &$reasons, bool $debug, string $label, float $value): void
    {
        if (! $debug || abs($value) < 0.01) {
            return;
        }

        $reasons[] = [
            'label' => $label,
            'value' => round($value, 2),
        ];
    }
}
