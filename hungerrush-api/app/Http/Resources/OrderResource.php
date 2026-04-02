<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'restaurant_id' => $this->restaurant_id,
            'branch_id' => $this->branch_id,
            'subtotal' => (float) $this->subtotal,
            'fees' => (float) $this->fees,
            'total' => (float) $this->total,
            'status' => $this->status?->value ?? $this->status,
            'payment_status' => $this->payment_status?->value ?? $this->payment_status,
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
        ];
    }
}
