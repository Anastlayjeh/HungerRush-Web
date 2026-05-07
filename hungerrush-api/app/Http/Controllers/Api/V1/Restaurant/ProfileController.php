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
            ->loadCount(['orders', 'reviews', 'menuItems', 'videos', 'follows'])
            ->loadAvg('reviews', 'rating');

        return $this->successResponse(new RestaurantResource($restaurant));
    }

    public function update(UpdateRestaurantProfileRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('update', $restaurant);
        $restaurant->update($request->validated());
        $restaurant->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems', 'videos', 'follows'])
            ->loadAvg('reviews', 'rating');

        $restaurant->refresh()
            ->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems', 'videos', 'follows'])
            ->loadAvg('reviews', 'rating');

        return $this->successResponse(new RestaurantResource($restaurant), message: 'Restaurant profile updated.');
    }

    public function followers()
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('view', $restaurant);

        $followers = $restaurant->followers()
            ->select('users.id', 'users.name', 'users.email', 'users.phone', 'users.avatar')
            ->orderByPivot('created_at', 'desc')
            ->paginate(50);

        return $this->successResponse(
            $followers->getCollection()->map(function ($follower) {
                return [
                    'id' => $follower->id,
                    'name' => $follower->name,
                    'email' => $follower->email,
                    'phone' => $follower->phone,
                    'avatar_url' => $follower->avatar,
                    'followed_at' => optional($follower->pivot?->created_at)->toISOString(),
                ];
            })->values(),
            [
                'current_page' => $followers->currentPage(),
                'per_page' => $followers->perPage(),
                'total' => $followers->total(),
                'last_page' => $followers->lastPage(),
            ]
        );
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
