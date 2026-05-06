<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $settings = $this->settings ?? [];
        $branches = $this->whenLoaded('branches');
        $firstBranch = $branches instanceof \Illuminate\Support\Collection
            ? $branches->first()
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'owner_user_id' => $this->owner_user_id,
            'cuisine_type' => is_array($settings) ? ($settings['cuisine_type'] ?? null) : null,
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
                'phone' => $this->owner->phone,
                'role' => $this->owner->role?->value ?? $this->owner->role,
                'status' => $this->owner->status,
                'last_login_at' => optional($this->owner->last_login_at)->toISOString(),
                'email_verified_at' => optional($this->owner->email_verified_at)->toISOString(),
                'created_at' => optional($this->owner->created_at)->toISOString(),
                'updated_at' => optional($this->owner->updated_at)->toISOString(),
            ] : null),
            'settings' => $settings,
            'profile_photo_url' => is_array($settings) ? ($settings['profile_photo_url'] ?? null) : null,
            'address' => $firstBranch?->address,
            'phone' => $firstBranch?->phone ?? $this->owner?->phone,
            'branches' => $branches instanceof \Illuminate\Support\Collection
                ? $branches->map(fn ($branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'address' => $branch->address,
                    'phone' => $branch->phone,
                    'latitude' => $branch->latitude !== null ? (float) $branch->latitude : null,
                    'longitude' => $branch->longitude !== null ? (float) $branch->longitude : null,
                ])->values()
                : [],
            'menu_items_count' => (int) ($this->menu_items_count ?? 0),
            'orders_count' => (int) ($this->orders_count ?? 0),
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'followers_count' => (int) ($this->follows_count ?? 0),
            'average_rating' => $this->reviews_avg_rating !== null
                ? round((float) $this->reviews_avg_rating, 1)
                : null,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
