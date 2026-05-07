<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreRestaurantReviewRequest;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
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

        $this->applyRestaurantAggregatesToQuery($query);

        if ($hasFollowTable) {
            $query->orderByDesc('follows_count');
        }

        if ($hasReviewTable) {
            $query->orderByDesc('reviews_avg_rating');
            $query->orderByDesc('reviews_count');
        }

        $restaurants = $query->latest()->paginate(20);

        return $this->successResponse(RestaurantResource::collection($restaurants->items()), [
            'current_page' => $restaurants->currentPage(),
            'per_page' => $restaurants->perPage(),
            'total' => $restaurants->total(),
        ]);
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
