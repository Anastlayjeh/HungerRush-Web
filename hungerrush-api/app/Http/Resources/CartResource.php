<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
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

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'restaurant_id' => $this->restaurant_id,
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'subtotal' => round($subtotal, 2),
            'fees' => $fees,
            'total' => round($subtotal + $fees, 2),
            'total_items' => $items instanceof \Illuminate\Support\Collection
                ? (int) $items->sum('quantity')
                : 0,
        ];
    }
}
