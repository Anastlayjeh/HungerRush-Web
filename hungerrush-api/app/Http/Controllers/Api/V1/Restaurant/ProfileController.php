<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UpdateRestaurantProfileRequest;
use App\Models\Restaurant;

class ProfileController extends Controller
{
    public function show()
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('view', $restaurant);

        return $this->successResponse($restaurant);
    }

    public function update(UpdateRestaurantProfileRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('update', $restaurant);
        $restaurant->update($request->validated());

        return $this->successResponse($restaurant->refresh(), message: 'Restaurant profile updated.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
