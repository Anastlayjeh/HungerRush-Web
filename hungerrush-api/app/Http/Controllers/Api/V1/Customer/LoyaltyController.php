<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyOffer;
use App\Models\LoyaltyPoint;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoyaltyController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->user()->id;

        $orderedRestaurantIds = Order::query()
            ->where('customer_id', $userId)
            ->distinct()
            ->pluck('restaurant_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $pointRestaurantIds = LoyaltyPoint::query()
            ->where('user_id', $userId)
            ->pluck('restaurant_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $restaurantIds = $orderedRestaurantIds
            ->merge($pointRestaurantIds)
            ->unique()
            ->values();

        if ($restaurantIds->isEmpty()) {
            return $this->successResponse([
                'restaurants' => [],
                'total_points_balance' => 0,
                'total_points_earned' => 0,
                'total_points_redeemed' => 0,
            ]);
        }

        $restaurants = Restaurant::query()
            ->whereIn('id', $restaurantIds)
            ->with('branches:id,restaurant_id,address,phone')
            ->get()
            ->keyBy('id');

        $pointsByRestaurant = LoyaltyPoint::query()
            ->where('user_id', $userId)
            ->whereIn('restaurant_id', $restaurantIds)
            ->get()
            ->keyBy('restaurant_id');

        $items = $restaurantIds->map(function (int $restaurantId) use ($restaurants, $pointsByRestaurant) {
            $restaurant = $restaurants->get($restaurantId);
            if (!$restaurant) {
                return null;
            }

            $points = $pointsByRestaurant->get($restaurantId);

            return $this->transformRestaurantPoints(
                restaurant: $restaurant,
                pointsBalance: (int) ($points->points_balance ?? 0),
                totalEarned: (int) ($points->total_earned ?? 0),
                totalRedeemed: (int) ($points->total_redeemed ?? 0),
            );
        })->filter()->values();

        return $this->successResponse([
            'restaurants' => $items,
            'total_points_balance' => (int) $items->sum('points_balance'),
            'total_points_earned' => (int) $items->sum('total_earned'),
            'total_points_redeemed' => (int) $items->sum('total_redeemed'),
        ]);
    }

    public function show(Request $request, Restaurant $restaurant)
    {
        $points = LoyaltyPoint::query()
            ->where('user_id', $request->user()->id)
            ->where('restaurant_id', $restaurant->id)
            ->first();

        return $this->successResponse(
            $this->transformRestaurantPoints(
                restaurant: $restaurant->load('branches:id,restaurant_id,address,phone'),
                pointsBalance: (int) ($points->points_balance ?? 0),
                totalEarned: (int) ($points->total_earned ?? 0),
                totalRedeemed: (int) ($points->total_redeemed ?? 0),
            )
        );
    }

    public function offers(Restaurant $restaurant)
    {
        $offers = LoyaltyOffer::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_active', true)
            ->orderBy('required_points')
            ->get();

        return $this->successResponse($offers->map(fn (LoyaltyOffer $offer) => $this->transformOffer($offer))->values());
    }

    public function redeem(Request $request, LoyaltyOffer $loyaltyOffer)
    {
        if (!$loyaltyOffer->is_active) {
            return $this->errorResponse(
                'This loyalty offer is currently inactive.',
                ['offer' => ['Offer is inactive.']],
                'loyalty_offer_inactive'
            );
        }

        $userId = (int) $request->user()->id;
        $requiredPoints = (int) $loyaltyOffer->required_points;

        $points = DB::transaction(function () use ($userId, $loyaltyOffer, $requiredPoints) {
            $ledger = LoyaltyPoint::query()
                ->where('user_id', $userId)
                ->where('restaurant_id', $loyaltyOffer->restaurant_id)
                ->lockForUpdate()
                ->first();

            if (!$ledger) {
                throw ValidationException::withMessages([
                    'points' => ['You do not have enough loyalty points for this restaurant.'],
                ]);
            }

            if ((int) $ledger->points_balance < $requiredPoints) {
                throw ValidationException::withMessages([
                    'points' => ['You do not have enough loyalty points for this restaurant.'],
                ]);
            }

            $ledger->update([
                'points_balance' => max(((int) $ledger->points_balance) - $requiredPoints, 0),
                'total_redeemed' => max(((int) $ledger->total_redeemed) + $requiredPoints, 0),
            ]);

            LoyaltyTransaction::query()->create([
                'user_id' => $userId,
                'restaurant_id' => $loyaltyOffer->restaurant_id,
                'order_id' => null,
                'offer_id' => $loyaltyOffer->id,
                'points' => $requiredPoints,
                'type' => 'redeemed',
                'description' => "Redeemed loyalty offer: {$loyaltyOffer->title}",
            ]);

            return $ledger->refresh();
        });

        return $this->successResponse([
            'redeemed' => true,
            'offer' => $this->transformOffer($loyaltyOffer),
            'points' => [
                'restaurant_id' => $loyaltyOffer->restaurant_id,
                'points_balance' => (int) $points->points_balance,
                'total_earned' => (int) $points->total_earned,
                'total_redeemed' => (int) $points->total_redeemed,
            ],
        ], message: 'Loyalty offer redeemed successfully.');
    }

    private function transformRestaurantPoints(
        Restaurant $restaurant,
        int $pointsBalance,
        int $totalEarned,
        int $totalRedeemed
    ): array {
        $firstBranch = $restaurant->branches->first();

        return [
            'restaurant_id' => $restaurant->id,
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'description' => $restaurant->description,
                'status' => $restaurant->status,
                'address' => $firstBranch?->address,
                'phone' => $firstBranch?->phone,
            ],
            'points_balance' => max($pointsBalance, 0),
            'total_earned' => max($totalEarned, 0),
            'total_redeemed' => max($totalRedeemed, 0),
        ];
    }

    private function transformOffer(LoyaltyOffer $offer): array
    {
        return [
            'id' => $offer->id,
            'restaurant_id' => $offer->restaurant_id,
            'title' => $offer->title,
            'description' => $offer->description,
            'required_points' => (int) $offer->required_points,
            'is_active' => (bool) $offer->is_active,
            'created_at' => optional($offer->created_at)->toISOString(),
            'updated_at' => optional($offer->updated_at)->toISOString(),
        ];
    }
}
