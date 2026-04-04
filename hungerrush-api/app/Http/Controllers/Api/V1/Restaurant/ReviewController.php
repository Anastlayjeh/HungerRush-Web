<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\ReplyReviewRequest;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function summary()
    {
        $restaurant = $this->resolveRestaurant();
        $baseQuery = Review::query()->where('restaurant_id', $restaurant->id);
        $distribution = (clone $baseQuery)
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $total = (int) (clone $baseQuery)->count();
        $average = $total > 0 ? round((float) (clone $baseQuery)->avg('rating'), 1) : 0.0;

        return $this->successResponse([
            'average_rating' => $average,
            'total_reviews' => $total,
            'distribution' => [
                '1' => (int) ($distribution[1] ?? 0),
                '2' => (int) ($distribution[2] ?? 0),
                '3' => (int) ($distribution[3] ?? 0),
                '4' => (int) ($distribution[4] ?? 0),
                '5' => (int) ($distribution[5] ?? 0),
            ],
            'replied_count' => (int) (clone $baseQuery)->whereNotNull('reply')->count(),
            'pending_reply_count' => (int) (clone $baseQuery)->whereNull('reply')->count(),
        ]);
    }

    public function index(Request $request)
    {
        $restaurant = $this->resolveRestaurant();
        $query = Review::query()
            ->where('restaurant_id', $restaurant->id)
            ->with('customer:id,name,email')
            ->latest();

        $rating = (int) $request->query('rating', 0);
        if ($rating >= 1 && $rating <= 5) {
            $query->where('rating', $rating);
        }

        $replied = trim((string) $request->query('replied', ''));
        if ($replied === 'replied') {
            $query->whereNotNull('reply');
        } elseif ($replied === 'pending') {
            $query->whereNull('reply');
        }

        $search = trim((string) $request->query('q', ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('comment', 'like', "%{$search}%")
                    ->orWhere('reply', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($customerQuery) => $customerQuery->where('name', 'like', "%{$search}%"));
            });
        }

        $reviews = $query->paginate(10);

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

    public function reply(ReplyReviewRequest $request, Review $review)
    {
        $restaurant = $this->resolveRestaurant();
        abort_unless($review->restaurant_id === $restaurant->id, 404);

        $review->update([
            'reply' => $request->validated()['reply'],
            'replied_by' => auth()->id(),
            'replied_at' => now(),
        ]);

        $review->load('customer:id,name,email');

        return $this->successResponse(
            $this->transformReview($review),
            message: 'Review reply saved successfully.'
        );
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
                'email' => $review->customer->email,
            ] : null,
            'created_at' => optional($review->created_at)->toISOString(),
            'updated_at' => optional($review->updated_at)->toISOString(),
        ];
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
