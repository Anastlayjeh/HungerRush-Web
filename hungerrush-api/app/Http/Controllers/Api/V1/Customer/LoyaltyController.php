<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\LoyaltyOffer;
use App\Models\LoyaltyPoint;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Services\LoyaltyPointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class LoyaltyController extends Controller
{
    public function index(Request $request, LoyaltyPointService $loyaltyPointService)
    {
        $userId = (int) $request->user()->id;
        $hasLoyaltyPointsTable = Schema::hasTable('loyalty_points');

        if ($hasLoyaltyPointsTable && Schema::hasTable('loyalty_transactions')) {
            $loyaltyPointService->syncEligibleOrdersForCustomer($userId);
        }

        $pointsByRestaurant = $hasLoyaltyPointsTable
            ? LoyaltyPoint::query()
                ->where('user_id', $userId)
                ->where('points_balance', '>', 0)
                ->get()
                ->keyBy('restaurant_id')
            : collect();

        $restaurantIds = $pointsByRestaurant
            ->keys()
            ->map(fn ($id) => (int) $id)
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

    public function show(Request $request, Restaurant $restaurant, LoyaltyPointService $loyaltyPointService)
    {
        if (Schema::hasTable('loyalty_points') && Schema::hasTable('loyalty_transactions')) {
            $loyaltyPointService->syncEligibleOrdersForCustomer((int) $request->user()->id);
        }

        $points = null;
        if (Schema::hasTable('loyalty_points')) {
            $points = LoyaltyPoint::query()
                ->where('user_id', $request->user()->id)
                ->where('restaurant_id', $restaurant->id)
                ->first();
        }

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
        if (!Schema::hasTable('loyalty_offers')) {
            return $this->successResponse([]);
        }

        $offers = LoyaltyOffer::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_active', true)
            ->with('menuItem:id,name,price,image_url,is_available')
            ->orderBy('required_points')
            ->get();

        return $this->successResponse(
            $offers->map(fn (LoyaltyOffer $offer) => $this->transformOffer($offer, $restaurant))->values()
        );
    }

    public function redeem(Request $request, string $loyaltyOffer)
    {
        if (!Schema::hasTable('loyalty_points')
            || !Schema::hasTable('loyalty_offers')
            || !Schema::hasTable('carts')) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $offerId = trim($loyaltyOffer);
        $offer = LoyaltyOffer::query()
            ->with('menuItem:id,name,price,image_url,is_available')
            ->find($offerId);
        abort_unless($offer !== null, 404);

        if (!$offer->is_active) {
            return $this->errorResponse(
                'This loyalty offer is currently inactive.',
                ['offer' => ['Offer is inactive.']],
                'loyalty_offer_inactive'
            );
        }

        if ($offer->expires_at !== null && $offer->expires_at->isPast()) {
            return $this->errorResponse(
                'This loyalty offer has already expired.',
                ['offer' => ['Offer has expired.']],
                'loyalty_offer_expired'
            );
        }

        $userId = (int) $request->user()->id;
        $requiredPoints = (int) $offer->required_points;

        [$points, $cart] = DB::transaction(function () use ($userId, $offer, $requiredPoints) {
            $ledger = LoyaltyPoint::query()
                ->where('user_id', $userId)
                ->where('restaurant_id', $offer->restaurant_id)
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

            $cart = Cart::query()->firstOrCreate([
                'customer_id' => $userId,
                'restaurant_id' => $offer->restaurant_id,
            ]);

            $cart->loyalty_offer_id = $offer->id;
            $cart->save();

            if (($offer->reward_type ?? 'custom') === 'free_item' && $offer->menu_item_id !== null) {
                $this->ensureOfferMenuItemIsAvailable(
                    menuItemId: (int) $offer->menu_item_id,
                    restaurantId: (int) $offer->restaurant_id,
                );

                $quantity = max((int) ($offer->free_item_quantity ?? 1), 1);
                $item = $cart->items()
                    ->where('menu_item_id', $offer->menu_item_id)
                    ->first();

                if ($item === null) {
                    $cart->items()->create([
                        'menu_item_id' => $offer->menu_item_id,
                        'quantity' => $quantity,
                        'notes' => "Loyalty offer: {$offer->title}",
                    ]);
                }
            }

            $cart->touch();
            $cart->load([
                'restaurant.branches',
                'items.menuItem.category',
                'loyaltyOffer.menuItem',
            ]);

            return [$ledger->refresh(), $cart];
        });

        return $this->successResponse([
            'redeemed' => true,
            'offer' => $this->transformOffer($offer, $offer->restaurant),
            'cart' => new CartResource($cart),
            'points' => [
                'restaurant_id' => $offer->restaurant_id,
                'points_balance' => (int) $points->points_balance,
                'total_earned' => (int) $points->total_earned,
                'total_redeemed' => (int) $points->total_redeemed,
            ],
        ], message: 'Offer added to your cart. Loyalty points will be deducted only after a successful order.');
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

    private function transformOffer(LoyaltyOffer $offer, ?Restaurant $restaurant = null): array
    {
        $restaurant ??= $offer->restaurant;
        $menuItem = $offer->menuItem;
        $rewardType = (string) ($offer->reward_type ?? 'custom');
        $discountedPrice = null;
        if ($menuItem) {
            $menuPrice = (float) ($menuItem->price ?? 0);
            if ($rewardType === 'free_item') {
                $discountedPrice = 0.0;
            } elseif ($offer->discount_percentage !== null) {
                $discountedPrice = round(max($menuPrice - ($menuPrice * ((float) $offer->discount_percentage / 100)), 0), 2);
            } elseif ($offer->discount_amount !== null) {
                $discountedPrice = round(max($menuPrice - (float) $offer->discount_amount, 0), 2);
            }
        }

        return [
            'id' => $offer->id,
            'restaurant_id' => $offer->restaurant_id,
            'restaurant_name' => $restaurant?->name,
            'title' => $offer->title,
            'description' => $offer->description,
            'conditions' => $offer->conditions,
            'expires_at' => optional($offer->expires_at)->toISOString(),
            'required_points' => (int) $offer->required_points,
            'reward_type' => $rewardType,
            'menu_item_id' => $offer->menu_item_id,
            'menu_item' => $menuItem ? [
                'id' => $menuItem->id,
                'name' => $menuItem->name,
                'price' => (float) $menuItem->price,
                'image_url' => $menuItem->image_url,
                'is_available' => (bool) $menuItem->is_available,
            ] : null,
            'discount_percentage' => $offer->discount_percentage !== null ? (float) $offer->discount_percentage : null,
            'discount_amount' => $offer->discount_amount !== null ? (float) $offer->discount_amount : null,
            'discounted_price' => $discountedPrice,
            'free_item_quantity' => (int) ($offer->free_item_quantity ?? 1),
            'is_active' => (bool) $offer->is_active,
            'created_at' => optional($offer->created_at)->toISOString(),
            'updated_at' => optional($offer->updated_at)->toISOString(),
        ];
    }

    private function ensureOfferMenuItemIsAvailable(int $menuItemId, int $restaurantId): void
    {
        $menuItem = MenuItem::query()
            ->whereKey($menuItemId)
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurantId))
            ->first();

        if ($menuItem === null) {
            throw ValidationException::withMessages([
                'menu_item' => ['This offer references a menu item that is no longer available.'],
            ]);
        }

        if (!(bool) $menuItem->is_available) {
            throw ValidationException::withMessages([
                'menu_item' => ['The free item in this offer is currently unavailable.'],
            ]);
        }
    }
}
