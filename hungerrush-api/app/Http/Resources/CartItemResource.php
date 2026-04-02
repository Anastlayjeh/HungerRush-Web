<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cart_id' => $this->cart_id,
            'menu_item_id' => $this->menu_item_id,
            'quantity' => $this->quantity,
            'notes' => $this->notes,
            'menu_item' => new MenuItemResource($this->whenLoaded('menuItem')),
        ];
    }
}
