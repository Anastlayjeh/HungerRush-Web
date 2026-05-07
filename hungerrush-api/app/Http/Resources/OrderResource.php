<?php

namespace App\Http\Resources;

use App\Models\LoyaltyOffer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    private const LBP_PER_USD = 90000;
    private const POINTS_PER_USD = 20;

    public function toArray(Request $request): array
    {
        $subtotal = (float) $this->subtotal;
        $deliveryFee = (float) $this->fees;
        $discount = (float) ($this->loyalty_discount ?? 0);
        $pointsUsed = (int) ($this->loyalty_points_used ?? 0);
        $total = (float) $this->total;
        $subtotalLbp = (int) round($subtotal * self::LBP_PER_USD);
        $deliveryFeeLbp = (int) round($deliveryFee * self::LBP_PER_USD);
        $totalLbp = (int) round($total * self::LBP_PER_USD);
        $pointsEstimate = intdiv(max($totalLbp, 0), self::LBP_PER_USD) * self::POINTS_PER_USD;

        $earnedPoints = 0;
        if ($this->relationLoaded('loyaltyTransactions')) {
            $earnedPoints = (int) $this->loyaltyTransactions
                ->where('type', 'earned')
                ->sum('points');
        }
        $offer = $this->relationLoaded('loyaltyOffer') ? $this->loyaltyOffer : null;

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'restaurant_id' => $this->restaurant_id,
            'branch_id' => $this->branch_id,
            'loyalty_offer_id' => $this->loyalty_offer_id,
            'subtotal' => $subtotal,
            'fees' => $deliveryFee,
            'delivery_fee' => $deliveryFee,
            'discount' => $discount,
            'loyalty_points_used' => $pointsUsed,
            'loyalty_offer' => $this->transformOffer($offer),
            'total' => $total,
            'subtotal_lbp' => $subtotalLbp,
            'delivery_fee_lbp' => $deliveryFeeLbp,
            'total_lbp' => $totalLbp,
            'loyalty_points_earned' => $earnedPoints,
            'loyalty_points_estimate' => $pointsEstimate,
            'status' => $this->status?->value ?? $this->status,
            'payment_status' => $this->payment_status?->value ?? $this->payment_status,
            'payment_method' => $this->payment_method,
            'delivery_mode' => $this->delivery_mode,
            'channel' => $this->delivery_mode,
            'delivery_address' => $this->delivery_address,
            'delivery_address_label' => $this->delivery_address_label,
            'address' => $this->delivery_address_label,
            'delivery_phone' => $this->delivery_phone,
            'phone' => $this->delivery_phone,
            'order_notes' => $this->order_notes,
            'notes' => $this->order_notes,
            'scheduled_label' => $this->scheduled_label,
            'change_request' => $this->change_request,
            'use_loyalty' => (bool) $this->use_loyalty,
            'save_change_in_wallet' => (bool) $this->save_change_in_wallet,
            'is_quick_order' => (bool) $this->is_quick_order,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'email' => $this->customer?->email,
                'phone' => $this->customer?->phone,
            ]),
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'address' => $this->branch->address,
                'phone' => $this->branch->phone,
            ] : null),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(fn ($item) => [
                    'id' => $item->id,
                    'menu_item_id' => $item->menu_item_id,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'notes' => $item->notes,
                    'menu_item' => $item->relationLoaded('menuItem') ? new MenuItemResource($item->menuItem) : null,
                ]);
            }),
            'status_history' => $this->whenLoaded('statusHistory', function () {
                return $this->statusHistory->map(fn ($history) => [
                    'id' => $history->id,
                    'status' => $history->status?->value ?? $history->status,
                    'changed_by' => $history->changed_by,
                    'changed_at' => optional($history->changed_at)->toISOString(),
                ])->values();
            }),
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
}
