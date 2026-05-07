<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyOffer;
use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class LoyaltyOfferController extends Controller
{
    public function index()
    {
        if (!$this->offersTableReady()) {
            return $this->successResponse([]);
        }

        $restaurant = $this->resolveRestaurant();
        $offers = LoyaltyOffer::query()
            ->where('restaurant_id', $restaurant->id)
            ->with('menuItem:id,name,price,image_url,is_available')
            ->latest()
            ->get();

        return $this->successResponse($offers->map(fn (LoyaltyOffer $offer) => $this->transformOffer($offer))->values());
    }

    public function store(Request $request)
    {
        if (!$this->offersTableReady()) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'conditions' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'date'],
            'required_points' => ['required', 'integer', 'min:0'],
            'reward_type' => ['sometimes', 'in:discount,free_item,free_delivery,cashback,custom'],
            'menu_item_id' => ['nullable', 'integer', 'exists:menu_items,id'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'free_item_quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,draft,archived'],
        ]);

        if (isset($validated['menu_item_id'])) {
            $this->ensureMenuItemBelongsToRestaurant(
                menuItemId: (int) $validated['menu_item_id'],
                restaurantId: (int) $restaurant->id,
            );
        }

        $offer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurant->id,
            'title' => trim((string) $validated['title']),
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : null,
            'conditions' => isset($validated['conditions']) ? trim((string) $validated['conditions']) : null,
            'expires_at' => $validated['expires_at'] ?? null,
            'required_points' => (int) $validated['required_points'],
            'reward_type' => $validated['reward_type'] ?? 'custom',
            'menu_item_id' => $validated['menu_item_id'] ?? null,
            'discount_percentage' => $validated['discount_percentage'] ?? null,
            'discount_amount' => $validated['discount_amount'] ?? null,
            'free_item_quantity' => (int) ($validated['free_item_quantity'] ?? 1),
            'is_active' => array_key_exists('is_active', $validated)
                ? (bool) $validated['is_active']
                : (($validated['status'] ?? 'active') === 'active'),
        ]);

        return $this->successResponse(
            $this->transformOffer($offer->load('menuItem:id,name,price,image_url,is_available')),
            message: 'Loyalty offer created successfully.',
            status: 201
        );
    }

    public function update(Request $request, string $loyaltyOffer)
    {
        if (!$this->offersTableReady()) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $offerId = trim($loyaltyOffer);
        $offer = LoyaltyOffer::query()->find($offerId);
        abort_unless($offer !== null, 404);

        $restaurant = $this->resolveRestaurant();
        abort_unless($offer->restaurant_id === $restaurant->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'name' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string'],
            'conditions' => ['sometimes', 'nullable', 'string'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
            'required_points' => ['sometimes', 'integer', 'min:0'],
            'points_required' => ['sometimes', 'integer', 'min:0'],
            'reward_type' => ['sometimes', 'in:discount,free_item,free_delivery,cashback,custom'],
            'menu_item_id' => ['sometimes', 'nullable', 'integer', 'exists:menu_items,id'],
            'discount_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'free_item_quantity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:99'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,draft,archived'],
        ]);

        $payload = [];
        if (array_key_exists('title', $validated) || array_key_exists('name', $validated)) {
            $payload['title'] = trim((string) ($validated['title'] ?? $validated['name'] ?? $offer->title));
        }
        if (array_key_exists('description', $validated)) {
            $payload['description'] = $validated['description'] !== null
                ? trim((string) $validated['description'])
                : null;
        }
        if (array_key_exists('conditions', $validated)) {
            $payload['conditions'] = $validated['conditions'] !== null
                ? trim((string) $validated['conditions'])
                : null;
        }
        if (array_key_exists('expires_at', $validated)) {
            $payload['expires_at'] = $validated['expires_at'];
        }
        if (array_key_exists('required_points', $validated) || array_key_exists('points_required', $validated)) {
            $payload['required_points'] = (int) ($validated['required_points'] ?? $validated['points_required']);
        }
        if (array_key_exists('reward_type', $validated)) {
            $payload['reward_type'] = $validated['reward_type'];
        }
        if (array_key_exists('menu_item_id', $validated)) {
            $menuItemId = $validated['menu_item_id'];
            if ($menuItemId !== null) {
                $this->ensureMenuItemBelongsToRestaurant(
                    menuItemId: (int) $menuItemId,
                    restaurantId: (int) $restaurant->id,
                );
            }
            $payload['menu_item_id'] = $menuItemId;
        }
        if (array_key_exists('discount_percentage', $validated)) {
            $payload['discount_percentage'] = $validated['discount_percentage'];
        }
        if (array_key_exists('discount_amount', $validated)) {
            $payload['discount_amount'] = $validated['discount_amount'];
        }
        if (array_key_exists('free_item_quantity', $validated)) {
            $payload['free_item_quantity'] = $validated['free_item_quantity'] ?? 1;
        }
        if (array_key_exists('is_active', $validated)) {
            $payload['is_active'] = (bool) $validated['is_active'];
        } elseif (array_key_exists('status', $validated)) {
            $payload['is_active'] = $validated['status'] === 'active';
        }

        if (!empty($payload)) {
            $offer->update($payload);
        }

        return $this->successResponse(
            $this->transformOffer($offer->refresh()->load('menuItem:id,name,price,image_url,is_available')),
            message: 'Loyalty offer updated successfully.'
        );
    }

    public function destroy(string $loyaltyOffer)
    {
        if (!$this->offersTableReady()) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $offerId = trim($loyaltyOffer);
        $offer = LoyaltyOffer::query()->find($offerId);
        abort_unless($offer !== null && (int) $offer->restaurant_id === (int) $restaurant->id, 404);

        $offer->delete();

        return $this->successResponse(['deleted' => true], message: 'Loyalty offer deleted successfully.');
    }

    private function transformOffer(LoyaltyOffer $offer): array
    {
        $rewardType = (string) ($offer->reward_type ?? 'custom');
        $menuItem = $offer->menuItem;
        $status = (bool) $offer->is_active ? 'active' : 'archived';

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
            'status' => $status,
            'name' => $offer->title,
            'points_required' => (int) $offer->required_points,
        ];
    }

    private function ensureMenuItemBelongsToRestaurant(int $menuItemId, int $restaurantId): void
    {
        $belongs = MenuItem::query()
            ->whereKey($menuItemId)
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurantId))
            ->exists();

        if (!$belongs) {
            abort(422, 'Selected menu item does not belong to this restaurant.');
        }
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }

    private function offersTableReady(): bool
    {
        return Schema::hasTable('loyalty_offers');
    }
}
