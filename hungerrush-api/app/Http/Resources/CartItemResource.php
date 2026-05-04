<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $unitPrice = $this->menuItem?->price !== null ? (float) $this->menuItem->price : 0.0;
        $lineTotal = $unitPrice * (int) $this->quantity;

        return [
            'id' => $this->id,
            'cart_id' => $this->cart_id,
            'menu_item_id' => $this->menu_item_id,
            'quantity' => $this->quantity,
            'notes' => $this->notes,
            'unit_price' => $unitPrice,
            'line_total' => round($lineTotal, 2),
            'menu_item' => new MenuItemResource($this->whenLoaded('menuItem')),
        ];
    }
}
