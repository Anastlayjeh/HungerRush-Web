<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Http\Requests\Restaurant\UpdateRestaurantProfileRequest;
use App\Models\Restaurant;

class ProfileController extends Controller
{
    public function show()
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('view', $restaurant);
        $restaurant->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems'])
            ->loadAvg('reviews', 'rating');

        return $this->successResponse(new RestaurantResource($restaurant));
    }

    public function update(UpdateRestaurantProfileRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('update', $restaurant);
        $restaurant->update($request->validated());
        $restaurant->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems'])
            ->loadAvg('reviews', 'rating');

        $restaurant->refresh()
            ->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems'])
            ->loadAvg('reviews', 'rating');

        return $this->successResponse(new RestaurantResource($restaurant), message: 'Restaurant profile updated.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
