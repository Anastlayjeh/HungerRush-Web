<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Models\RestaurantFollow;

class RestaurantFollowController extends Controller
{
    public function index()
    {
        $restaurants = Restaurant::query()
            ->whereHas('follows', fn ($builder) => $builder->where('user_id', auth()->id()))
            ->latest()
            ->paginate(20);

        return $this->successResponse(RestaurantResource::collection($restaurants->items()), [
            'current_page' => $restaurants->currentPage(),
            'per_page' => $restaurants->perPage(),
            'total' => $restaurants->total(),
        ]);
    }

    public function store(Restaurant $restaurant)
    {
        RestaurantFollow::firstOrCreate([
            'restaurant_id' => $restaurant->id,
            'user_id' => auth()->id(),
        ]);

        return $this->successResponse([
            'restaurant_id' => $restaurant->id,
            'is_following' => true,
        ], message: 'Restaurant followed successfully.', status: 201);
    }

    public function destroy(Restaurant $restaurant)
    {
        RestaurantFollow::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('user_id', auth()->id())
            ->delete();

        return $this->successResponse([
            'restaurant_id' => $restaurant->id,
            'is_following' => false,
        ], message: 'Restaurant unfollowed successfully.');
    }
}
