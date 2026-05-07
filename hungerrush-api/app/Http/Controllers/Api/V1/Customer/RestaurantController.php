<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreRestaurantReviewRequest;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\RestaurantResource;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RestaurantController extends Controller
{
    public function index(Request $request)
    {
        $hasReviewTable = $this->tableIsQueryable('reviews');
        $hasFollowTable = $this->tableIsQueryable('restaurant_follows');
        $search = trim((string) $request->query('q', ''));
        $cuisine = trim((string) ($request->query('cuisine') ?? $request->query('category') ?? ''));
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $query = Restaurant::query()
            ->where('status', 'active')
            ->with(['owner:id,name,email,phone', 'branches']);

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('branches', function (Builder $branchBuilder) use ($search) {
                        $branchBuilder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('address', 'like', "%{$search}%");
                    });
            });
        }

        if ($cuisine !== '') {
            $this->applyCuisineFilter($query, $cuisine);
        }

        $this->applyRestaurantAggregatesToQuery($query);

        if ($hasFollowTable) {
            $query->orderByDesc('follows_count');
        }

        if ($hasReviewTable) {
            $query->orderByDesc('reviews_avg_rating');
            $query->orderByDesc('reviews_count');
        }

        $restaurants = $query->latest()->paginate($perPage);

        return $this->successResponse(RestaurantResource::collection($restaurants->items()), [
            'current_page' => $restaurants->currentPage(),
            'per_page' => $restaurants->perPage(),
            'total' => $restaurants->total(),
        ]);
    }

    public function cuisines()
    {
        $counts = [];

        Restaurant::query()
            ->where('status', 'active')
            ->get(['settings'])
            ->each(function (Restaurant $restaurant) use (&$counts) {
                $label = $this->restaurantCuisineLabel($restaurant);
                if ($label === null) {
                    return;
                }
                $key = strtolower($label);
                if (!isset($counts[$key])) {
                    $counts[$key] = [
                        'title' => $label,
                        'count' => 0,
                    ];
                }
                $counts[$key]['count']++;
            });

        $cuisines = collect($counts)
            ->sort(function (array $a, array $b) {
                $countCompare = $b['count'] <=> $a['count'];

                return $countCompare !== 0
                    ? $countCompare
                    : strcasecmp($a['title'], $b['title']);
            })
            ->values()
            ->map(fn (array $item) => [
                'title' => $item['title'],
                'label' => $item['title'],
                'restaurants_count' => (int) $item['count'],
            ])
            ->all();

        return $this->successResponse($cuisines);
    }

    public function show(Restaurant $restaurant)
    {
        $restaurant->load(['owner:id,name,email,phone', 'branches']);
        $this->loadRestaurantAggregates($restaurant);

        return $this->successResponse(new RestaurantResource($restaurant));
    }

    public function menu(Restaurant $restaurant)
    {
        $restaurant->load(['owner:id,name,email,phone', 'branches']);
        $this->loadRestaurantAggregates($restaurant);
        $categories = $restaurant->categories()
            ->with([
                'items' => fn ($query) => $query
                    ->with('category')
                    ->withCount('orderItems')
                    ->orderBy('name'),
            ])
            ->orderBy('sort_order')
            ->get();

        return $this->successResponse([
            'restaurant' => new RestaurantResource($restaurant),
            'categories' => MenuCategoryResource::collection($categories),
            'menu_items' => MenuItemResource::collection($categories->flatMap->items->values()),
        ]);
    }

    public function quickCravings(Request $request)
    {
        if (!$this->tableIsQueryable('menu_items') || !$this->tableIsQueryable('menu_categories')) {
            return $this->successResponse([], [
                'per_page' => 0,
                'total' => 0,
            ]);
        }

        $perPage = (int) $request->query('per_page', 6);
        $perPage = max(1, min($perPage, 20));

        $query = MenuItem::query()
            ->where('is_available', true)
            ->whereHas('category.restaurant', fn (Builder $builder) => $builder->where('status', 'active'))
            ->with([
                'category.restaurant.owner:id,name,email,phone',
                'category.restaurant.branches',
            ]);

        if ($this->tableIsQueryable('order_items')) {
            $query->withCount('orderItems')->orderByDesc('order_items_count');
        }

        $items = $query
            ->latest()
            ->limit($perPage)
            ->get();

        $data = $items
            ->map(function (MenuItem $item) {
                $restaurant = $item->category?->restaurant;
                if ($restaurant instanceof Restaurant) {
                    $this->loadRestaurantAggregates($restaurant);
                }

                return [
                    'menu_item' => new MenuItemResource($item),
                    'restaurant' => $restaurant instanceof Restaurant
                        ? new RestaurantResource($restaurant)
                        : null,
                ];
            })
            ->values();

        return $this->successResponse($data, [
            'per_page' => $perPage,
            'total' => $data->count(),
        ]);
    }

    public function reviews(Restaurant $restaurant, Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $query = Review::query()
            ->where('restaurant_id', $restaurant->id)
            ->with('customer:id,name,avatar')
            ->latest();

        $rating = (int) $request->query('rating', 0);
        if ($rating >= 1 && $rating <= 5) {
            $query->where('rating', $rating);
        }

        $reviews = $query->paginate($perPage);

        return $this->successResponse(
            $reviews->getCollection()->map(fn (Review $review) => $this->transformReview($review))->values(),
            [
                'current_page' => $reviews->currentPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
                'last_page' => $reviews->lastPage(),
            ]
        );
    }

    public function videos(Restaurant $restaurant, Request $request)
    {
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 50));

        $query = Video::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('status', 'published')
            ->where('stream_ready', true)
            ->where(function (Builder $builder) {
                $builder
                    ->whereNull('moderation_status')
                    ->orWhere('moderation_status', '')
                    ->orWhere('moderation_status', 'approved');
            })
            ->withCount([
                'engagements as views_count' => fn ($builder) => $builder->where('type', 'view'),
                'engagements as likes_count' => fn ($builder) => $builder->where('type', 'like'),
                'engagements as shares_count' => fn ($builder) => $builder->where('type', 'share'),
                'engagements as saves_count' => fn ($builder) => $builder->where('type', 'save'),
                'comments',
            ])
            ->orderByDesc('published_at')
            ->latest();

        $videos = $query->paginate($perPage);

        return $this->successResponse(
            $videos->getCollection()->map(fn (Video $video) => $this->transformVideo($video))->values(),
            [
                'current_page' => $videos->currentPage(),
                'per_page' => $videos->perPage(),
                'total' => $videos->total(),
                'last_page' => $videos->lastPage(),
            ]
        );
    }

    public function storeReview(Restaurant $restaurant, StoreRestaurantReviewRequest $request)
    {
        $validated = $request->validated();
        $customerId = (int) auth()->id();
        $requestedOrderId = isset($validated['order_id']) ? (int) $validated['order_id'] : null;

        if ($requestedOrderId !== null) {
            $order = Order::query()
                ->where('customer_id', $customerId)
                ->where('restaurant_id', $restaurant->id)
                ->whereKey($requestedOrderId)
                ->first();

            if (!$order) {
                return $this->errorResponse(
                    'Order was not found for this restaurant.',
                    ['order_id' => ['Order is invalid for this restaurant.']],
                    'invalid_order',
                    422
                );
            }

            if (!$this->orderCanBeReviewed($order)) {
                return $this->errorResponse(
                    'Review can be submitted only after delivery or successful payment.',
                    ['order_id' => ['Order is not eligible for review yet.']],
                    'order_not_reviewable',
                    422
                );
            }

            $existing = Review::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('customer_id', $customerId)
                ->where('order_id', $order->id)
                ->exists();

            if ($existing) {
                return $this->errorResponse(
                    'You already reviewed this order.',
                    ['order_id' => ['Duplicate review is not allowed for this order.']],
                    'duplicate_review',
                    422
                );
            }
        } else {
            $order = Order::query()
                ->where('customer_id', $customerId)
                ->where('restaurant_id', $restaurant->id)
                ->where(function (Builder $builder) {
                    $builder
                        ->where('status', OrderStatus::Delivered->value)
                        ->orWhere('payment_status', PaymentStatus::Paid->value);
                })
                ->whereDoesntHave('reviews', function (Builder $builder) use ($customerId) {
                    $builder->where('customer_id', $customerId);
                })
                ->latest()
                ->first();

            if (!$order) {
                return $this->errorResponse(
                    'No eligible completed order found to review.',
                    ['order_id' => ['Place and complete an order from this restaurant first.']],
                    'order_not_reviewable',
                    422
                );
            }
        }

        $review = Review::query()->create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customerId,
            'order_id' => $order->id,
            'rating' => (int) $validated['rating'],
            'comment' => trim((string) ($validated['comment'] ?? '')),
        ]);

        $review->load('customer:id,name,avatar');

        return $this->successResponse(
            $this->transformReview($review),
            message: 'Review submitted successfully.',
            status: 201
        );
    }

    private function orderCanBeReviewed(Order $order): bool
    {
        return $order->status === OrderStatus::Delivered
            || $order->payment_status === PaymentStatus::Paid;
    }

    private function transformReview(Review $review): array
    {
        return [
            'id' => $review->id,
            'restaurant_id' => $review->restaurant_id,
            'customer_id' => $review->customer_id,
            'order_id' => $review->order_id,
            'rating' => (int) $review->rating,
            'comment' => $review->comment,
            'reply' => $review->reply,
            'replied_at' => optional($review->replied_at)->toISOString(),
            'customer' => $review->customer ? [
                'id' => $review->customer->id,
                'name' => $review->customer->name,
                'avatar' => $review->customer->avatar,
            ] : null,
            'created_at' => optional($review->created_at)->toISOString(),
            'updated_at' => optional($review->updated_at)->toISOString(),
        ];
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
            'moderation_status' => $video->moderation_status,
            'moderation_reason' => $video->moderation_reason,
            'stats' => [
                'views_count' => (int) ($video->views_count ?? 0),
                'likes_count' => (int) ($video->likes_count ?? 0),
                'shares_count' => (int) ($video->shares_count ?? 0),
                'saves_count' => (int) ($video->saves_count ?? 0),
                'comments_count' => (int) ($video->comments_count ?? 0),
            ],
            'created_at' => optional($video->created_at)->toISOString(),
            'updated_at' => optional($video->updated_at)->toISOString(),
        ];
    }

    private function applyRestaurantAggregatesToQuery(Builder $query): void
    {
        if ($this->tableIsQueryable('orders')) {
            $query->withCount('orders');
        }

        if ($this->tableIsQueryable('reviews')) {
            $query->withCount('reviews')->withAvg('reviews', 'rating');
        }

        if ($this->tableIsQueryable('menu_items') && $this->tableIsQueryable('menu_categories')) {
            $query->withCount('menuItems');
        }

        if ($this->tableIsQueryable('restaurant_follows')) {
            $query->withCount('follows');
        }
    }

    private function applyCuisineFilter(Builder $query, string $cuisine): void
    {
        $cleaned = trim($cuisine);
        if ($cleaned === '') {
            return;
        }

        $query->where(function (Builder $builder) use ($cleaned) {
            foreach (['cuisine_type', 'cuisine', 'category', 'food_type'] as $key) {
                $builder->orWhere("settings->{$key}", $cleaned);
            }
        });
    }

    private function restaurantCuisineLabel(Restaurant $restaurant): ?string
    {
        $settings = is_array($restaurant->settings) ? $restaurant->settings : [];
        foreach (['cuisine_type', 'cuisine', 'category', 'food_type'] as $key) {
            $value = $settings[$key] ?? null;
            if (!is_string($value)) {
                continue;
            }
            $cleaned = trim($value);
            if ($cleaned !== '') {
                return $cleaned;
            }
        }

        return null;
    }

    private function loadRestaurantAggregates(Restaurant $restaurant): void
    {
        if ($this->tableIsQueryable('orders')) {
            $restaurant->loadCount('orders');
        }

        if ($this->tableIsQueryable('reviews')) {
            $restaurant->loadCount('reviews')->loadAvg('reviews', 'rating');
        }

        if ($this->tableIsQueryable('menu_items') && $this->tableIsQueryable('menu_categories')) {
            $restaurant->loadCount('menuItems');
        }

        if ($this->tableIsQueryable('restaurant_follows')) {
            $restaurant->loadCount('follows');
        }
    }

    private function tableIsQueryable(string $table): bool
    {
        if (!Schema::hasTable($table)) {
            return false;
        }

        try {
            DB::table($table)->limit(1)->get();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
