<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'ingredients' => $this->ingredients,
            'image_urls' => $this->image_urls ?? [],
            'price' => (float) $this->price,
            'is_available' => (bool) $this->is_available,
            'prep_time' => $this->prep_time,
        ];
    }
}
