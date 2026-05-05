<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SampleReviewsSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguarded(function (): void {
            DB::transaction(function (): void {
                $customers = User::query()
                    ->where('role', 'customer')
                    ->orderBy('id')
                    ->get();

                if ($customers->isEmpty()) {
                    return;
                }

                $this->seedDeliveredOrderReviews();
                $this->seedFallbackRestaurantReviews($customers);
            });
        });
    }

    private function seedDeliveredOrderReviews(): void
    {
        $templates = [
            [5, 'Fresh and tasty meal and fast delivery.', 'Thank you for your feedback.'],
            [4, 'Very good food overall, packaging could improve.', null],
            [5, 'Great flavor and good portion size.', 'Happy you enjoyed it.'],
            [3, 'Meal was fine but arrived a little late.', null],
        ];

        $orders = Order::query()
            ->where('status', 'delivered')
            ->with('restaurant:id,owner_user_id')
            ->orderBy('id')
            ->get();

        foreach ($orders as $index => $order) {
            [$rating, $comment, $reply] = $templates[$index % count($templates)];

            Review::query()->updateOrCreate(
                ['order_id' => $order->id],
                [
                    'restaurant_id' => $order->restaurant_id,
                    'customer_id' => $order->customer_id,
                    'rating' => $rating,
                    'comment' => $comment,
                    'reply' => $reply,
                    'replied_by' => $reply ? $order->restaurant?->owner_user_id : null,
                    'replied_at' => $reply ? now()->subDays($index) : null,
                ]
            );
        }
    }

    /**
     * @param  Collection<int, User>  $customers
     */
    private function seedFallbackRestaurantReviews(Collection $customers): void
    {
        $fallback = [
            [4, 'Good quality and clean packaging.'],
            [5, 'Excellent taste and presentation.'],
            [3, 'Decent meal, could improve delivery timing.'],
            [5, 'Very satisfied and will order again.'],
        ];

        $restaurants = Restaurant::query()->orderBy('id')->get();

        foreach ($restaurants as $index => $restaurant) {
            $hasReview = Review::query()
                ->where('restaurant_id', $restaurant->id)
                ->exists();

            if ($hasReview) {
                continue;
            }

            $customer = $customers[$index % $customers->count()];
            [$rating, $comment] = $fallback[$index % count($fallback)];
            $withReply = $index % 2 === 0;

            Review::query()->create([
                'restaurant_id' => $restaurant->id,
                'customer_id' => $customer->id,
                'order_id' => null,
                'rating' => $rating,
                'comment' => $comment,
                'reply' => $withReply ? 'Thanks for reviewing us.' : null,
                'replied_by' => $withReply ? $restaurant->owner_user_id : null,
                'replied_at' => $withReply ? now()->subHours($index + 2) : null,
                'created_at' => now()->subDays($index + 1),
                'updated_at' => now()->subDays($index + 1),
            ]);
        }
    }
}

