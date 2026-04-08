<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UpdateRestaurantSettingsRequest;
use App\Models\Restaurant;
use App\Models\RestaurantBranch;
use Illuminate\Validation\ValidationException;

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
            $mergedSettings = array_merge($this->defaultSettings(), $restaurant->settings ?? []);
            foreach ($this->normalizeSettingsPayload($validated['settings'] ?? []) as $key => $value) {
                $mergedSettings[$key] = $value;
            }

            $restaurant->update([
                'settings' => $mergedSettings,
            ]);
        }

        if (array_key_exists('locations', $validated)) {
            $this->syncLocations($restaurant, $validated['locations'] ?? []);
        }

        $ownerFields = [];
        if (array_key_exists('owner_name', $validated)) {
            $ownerFields['name'] = $validated['owner_name'];
        }
        if (array_key_exists('owner_email', $validated)) {
            $ownerFields['email'] = $validated['owner_email'];
        }
        if (array_key_exists('owner_phone', $validated)) {
            $ownerFields['phone'] = $validated['owner_phone'];
        }

        if (!empty($ownerFields)) {
            $restaurant->owner()->update($ownerFields);
        }

        $restaurant->refresh()->load(['owner:id,name,email,phone', 'branches:id,restaurant_id,name,address,phone,latitude,longitude']);

        return $this->successResponse($this->buildPayload($restaurant), message: 'Settings updated successfully.');
    }

    private function buildPayload(Restaurant $restaurant): array
    {
        $restaurant->loadMissing(['owner:id,name,email,phone', 'branches:id,restaurant_id,name,address,phone,latitude,longitude']);

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
                'phone' => $restaurant->owner?->phone,
            ],
            'settings' => array_merge($this->defaultSettings(), $restaurant->settings ?? []),
            'locations' => $restaurant->branches
                ->map(fn (RestaurantBranch $branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'address' => $branch->address,
                    'phone' => $branch->phone,
                    'latitude' => $branch->latitude !== null ? (float) $branch->latitude : null,
                    'longitude' => $branch->longitude !== null ? (float) $branch->longitude : null,
                ])
                ->values()
                ->all(),
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
            'contact_numbers' => [],
            'profile_photo_url' => null,
        ];
    }

    private function normalizeSettingsPayload(array $settings): array
    {
        $normalized = $settings;

        if (array_key_exists('contact_numbers', $settings)) {
            $numbers = collect($settings['contact_numbers'] ?? [])
                ->map(fn ($phone) => is_string($phone) ? trim($phone) : null)
                ->filter(fn ($phone) => $phone !== null && $phone !== '')
                ->values()
                ->all();

            $normalized['contact_numbers'] = $numbers;
        }

        if (array_key_exists('currency', $settings) && is_string($settings['currency'])) {
            $normalized['currency'] = strtoupper(trim($settings['currency']));
        }

        if (array_key_exists('timezone', $settings) && is_string($settings['timezone'])) {
            $normalized['timezone'] = trim($settings['timezone']);
        }

        if (array_key_exists('profile_photo_url', $settings) && is_string($settings['profile_photo_url'])) {
            $normalized['profile_photo_url'] = trim($settings['profile_photo_url']);
        }

        return $normalized;
    }

    private function syncLocations(Restaurant $restaurant, array $locations): void
    {
        $retainedBranchIds = [];

        foreach ($locations as $index => $location) {
            $payload = [
                'name' => trim((string) ($location['name'] ?? '')),
                'address' => trim((string) ($location['address'] ?? '')),
                'phone' => array_key_exists('phone', $location) && $location['phone'] !== null
                    ? trim((string) $location['phone'])
                    : null,
                'latitude' => array_key_exists('latitude', $location) ? $location['latitude'] : null,
                'longitude' => array_key_exists('longitude', $location) ? $location['longitude'] : null,
            ];

            $locationId = $location['id'] ?? null;

            if ($locationId !== null) {
                $branch = $restaurant->branches()->where('id', (int) $locationId)->first();
                if (!$branch) {
                    throw ValidationException::withMessages([
                        "locations.{$index}.id" => ['Invalid location id.'],
                    ]);
                }

                $branch->update($payload);
                $retainedBranchIds[] = $branch->id;
                continue;
            }

            $createdBranch = $restaurant->branches()->create($payload);
            $retainedBranchIds[] = $createdBranch->id;
        }

        $branchesQuery = $restaurant->branches();
        if (!empty($retainedBranchIds)) {
            $branchesQuery->whereNotIn('id', $retainedBranchIds)->delete();
            return;
        }

        $branchesQuery->delete();
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active', 'settings' => $this->defaultSettings()]
        );
    }
}
