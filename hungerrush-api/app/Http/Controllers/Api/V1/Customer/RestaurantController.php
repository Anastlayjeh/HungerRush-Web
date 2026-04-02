<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;

class RestaurantController extends Controller
{
    public function index()
    {
        $restaurants = Restaurant::query()
            ->where('status', 'active')
            ->latest()
            ->paginate(20);

        return $this->successResponse(RestaurantResource::collection($restaurants->items()), [
            'current_page' => $restaurants->currentPage(),
            'per_page' => $restaurants->perPage(),
            'total' => $restaurants->total(),
        ]);
    }

    public function show(Restaurant $restaurant)
    {
        return $this->successResponse(new RestaurantResource($restaurant));
    }

    public function menu(Restaurant $restaurant)
    {
        $categories = $restaurant->categories()->with('items')->orderBy('sort_order')->get();

        return $this->successResponse([
            'restaurant' => new RestaurantResource($restaurant),
            'categories' => MenuCategoryResource::collection($categories),
        ]);
    }
}
