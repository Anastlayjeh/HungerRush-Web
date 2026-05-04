<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imageUrls = $this->image_urls ?? [];
        if (is_string($imageUrls)) {
            $decoded = json_decode($imageUrls, true);
            $imageUrls = is_array($decoded) ? $decoded : [];
        }

        $imageUrls = collect($imageUrls)
            ->filter(fn ($url) => is_string($url) && trim($url) !== '')
            ->values()
            ->all();
        $category = $this->whenLoaded('category');
        $categoryName = $category instanceof \App\Models\MenuCategory
            ? $category->name
            : null;

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category' => $categoryName,
            'category_name' => $categoryName,
            'name' => $this->name,
            'title' => $this->name,
            'description' => $this->description,
            'ingredients' => $this->ingredients,
            'image_url' => $imageUrls[0] ?? null,
            'image_urls' => $imageUrls,
            'price' => (float) $this->price,
            'is_available' => (bool) $this->is_available,
            'available' => (bool) $this->is_available,
            'prep_time' => $this->prep_time,
            'orders_count' => (int) ($this->orders_count ?? $this->order_items_count ?? 0),
            'is_popular' => ((int) ($this->orders_count ?? $this->order_items_count ?? 0)) > 0,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
