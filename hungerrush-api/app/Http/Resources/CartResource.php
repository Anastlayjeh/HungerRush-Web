<?php

namespace App\Http\Resources;

use App\Models\LoyaltyOffer;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    private const LBP_PER_USD = 90000;
    private const POINTS_PER_USD = 20;

    public function toArray(Request $request): array
    {
        $items = $this->whenLoaded('items');
        $subtotal = 0.0;
        if ($items instanceof Collection) {
            foreach ($items as $item) {
                $subtotal += ((float) ($item->menuItem?->price ?? 0)) * (int) $item->quantity;
            }
        }
        $fees = round($subtotal * 0.10, 2);
        $offer = $this->relationLoaded('loyaltyOffer') ? $this->loyaltyOffer : null;
        $discount = $this->calculateDiscount($offer, $items, $subtotal, $fees);
        $total = round(max(($subtotal + $fees) - $discount, 0), 2);
        $totalLbp = (int) round($total * self::LBP_PER_USD);
        $pointsUsed = $offer ? (int) ($offer->required_points ?? 0) : 0;

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'restaurant_id' => $this->restaurant_id,
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'restaurant_name' => $this->whenLoaded('restaurant', fn () => $this->restaurant?->name),
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'subtotal' => round($subtotal, 2),
            'subtotal_lbp' => (int) round($subtotal * self::LBP_PER_USD),
            'fees' => $fees,
            'delivery_fee' => $fees,
            'delivery_fee_lbp' => (int) round($fees * self::LBP_PER_USD),
            'discount' => $discount,
            'loyalty_points_used' => $pointsUsed,
            'loyalty_offer_id' => $offer?->id,
            'loyalty_offer' => $this->transformOffer($offer),
            'total' => $total,
            'total_lbp' => $totalLbp,
            'loyalty_points_estimate' => intdiv(max($totalLbp, 0), self::LBP_PER_USD) * self::POINTS_PER_USD,
            'total_items' => $items instanceof Collection
                ? (int) $items->sum('quantity')
                : 0,
        ];
    }

    private function transformOffer(?LoyaltyOffer $offer): ?array
    {
        if ($offer === null) {
            return null;
        }

        $menuItem = $offer->relationLoaded('menuItem') ? $offer->menuItem : null;
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
            'title' => $offer->title,
            'description' => $offer->description,
            'conditions' => $offer->conditions,
            'expires_at' => optional($offer->expires_at)->toISOString(),
            'required_points' => (int) ($offer->required_points ?? 0),
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
        ];
    }

    private function calculateDiscount(
        ?LoyaltyOffer $offer,
        mixed $items,
        float $subtotal,
        float $fees
    ): float {
        if ($offer === null || !($items instanceof Collection) || $items->isEmpty()) {
            return 0.0;
        }

        $rewardType = (string) ($offer->reward_type ?? 'custom');
        $menuItemId = $offer->menu_item_id;
        $discount = 0.0;

        $matchingItem = null;
        if ($menuItemId !== null) {
            $matchingItem = $items->first(fn ($item) => (int) $item->menu_item_id === (int) $menuItemId);
        }

        if ($rewardType === 'free_delivery') {
            $discount = $fees;
        } elseif ($rewardType === 'free_item' && $matchingItem) {
            $unitPrice = (float) ($matchingItem->menuItem?->price ?? 0);
            $quantity = max((int) ($offer->free_item_quantity ?? 1), 1);
            $discount = $unitPrice * min($quantity, (int) $matchingItem->quantity);
        } elseif ($offer->discount_percentage !== null) {
            $percentage = max(min((float) $offer->discount_percentage, 100.0), 0.0);
            if ($matchingItem) {
                $discount = ((float) ($matchingItem->menuItem?->price ?? 0)) * ($percentage / 100);
            } else {
                $discount = $subtotal * ($percentage / 100);
            }
        } elseif ($offer->discount_amount !== null) {
            $discount = max((float) $offer->discount_amount, 0.0);
            if ($matchingItem) {
                $discount = min($discount, (float) ($matchingItem->menuItem?->price ?? 0));
            }
        }

        return round(min(max($discount, 0.0), $subtotal + $fees), 2);
    }
}
