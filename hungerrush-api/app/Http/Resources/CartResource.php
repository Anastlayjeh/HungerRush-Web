<?php

namespace App\Http\Resources;

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
        if ($items instanceof \Illuminate\Support\Collection) {
            foreach ($items as $item) {
                $subtotal += ((float) ($item->menuItem?->price ?? 0)) * (int) $item->quantity;
            }
        }
        $fees = round($subtotal * 0.10, 2);
        $total = round($subtotal + $fees, 2);
        $totalLbp = (int) round($total * self::LBP_PER_USD);

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
            'discount' => 0.0,
            'loyalty_points_used' => 0,
            'total' => $total,
            'total_lbp' => $totalLbp,
            'loyalty_points_estimate' => intdiv(max($totalLbp, 0), self::LBP_PER_USD) * self::POINTS_PER_USD,
            'total_items' => $items instanceof \Illuminate\Support\Collection
                ? (int) $items->sum('quantity')
                : 0,
        ];
    }
}
