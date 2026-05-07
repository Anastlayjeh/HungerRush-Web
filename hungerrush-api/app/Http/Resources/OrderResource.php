<?php

namespace App\Http\Resources;

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

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'restaurant_id' => $this->restaurant_id,
            'branch_id' => $this->branch_id,
            'subtotal' => $subtotal,
            'fees' => $deliveryFee,
            'delivery_fee' => $deliveryFee,
            'discount' => 0.0,
            'loyalty_points_used' => 0,
            'total' => $total,
            'subtotal_lbp' => $subtotalLbp,
            'delivery_fee_lbp' => $deliveryFeeLbp,
            'total_lbp' => $totalLbp,
            'loyalty_points_earned' => $earnedPoints,
            'loyalty_points_estimate' => $pointsEstimate,
            'status' => $this->status?->value ?? $this->status,
            'payment_status' => $this->payment_status?->value ?? $this->payment_status,
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
}
