<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UpdateRestaurantSettingsRequest;
use App\Models\Restaurant;

class SettingsController extends Controller
{
    public function show()
    {
        $restaurant = $this->resolveRestaurant();

        return $this->successResponse($this->buildPayload($restaurant));
    }

    public function update(UpdateRestaurantSettingsRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $validated = $request->validated();

        $restaurantFields = [];
        foreach (['name', 'description', 'status'] as $field) {
            if (array_key_exists($field, $validated)) {
                $restaurantFields[$field] = $validated[$field];
            }
        }

        if (!empty($restaurantFields)) {
            $restaurant->update($restaurantFields);
        }

        if (array_key_exists('settings', $validated)) {
            $restaurant->update([
                'settings' => array_merge($this->defaultSettings(), $restaurant->settings ?? [], $validated['settings'] ?? []),
            ]);
        }

        $ownerFields = [];
        if (array_key_exists('owner_name', $validated)) {
            $ownerFields['name'] = $validated['owner_name'];
        }
        if (array_key_exists('owner_email', $validated)) {
            $ownerFields['email'] = $validated['owner_email'];
        }

        if (!empty($ownerFields)) {
            $restaurant->owner()->update($ownerFields);
        }

        $restaurant->refresh()->load('owner:id,name,email');

        return $this->successResponse($this->buildPayload($restaurant), message: 'Settings updated successfully.');
    }

    private function buildPayload(Restaurant $restaurant): array
    {
        $restaurant->loadMissing('owner:id,name,email');

        return [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'description' => $restaurant->description,
                'status' => $restaurant->status,
            ],
            'owner' => [
                'id' => $restaurant->owner?->id,
                'name' => $restaurant->owner?->name,
                'email' => $restaurant->owner?->email,
            ],
            'settings' => array_merge($this->defaultSettings(), $restaurant->settings ?? []),
        ];
    }

    private function defaultSettings(): array
    {
        return [
            'default_prep_time' => 20,
            'auto_accept_orders' => false,
            'notifications_enabled' => true,
            'currency' => 'USD',
            'timezone' => 'Asia/Beirut',
        ];
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active', 'settings' => $this->defaultSettings()]
        );
    }
}
