<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;

class RestaurantController extends Controller
{
    public function index()
    {
        $restaurants = Restaurant::query()
            ->where('status', 'active')
            ->with(['owner:id,name,email,phone', 'branches'])
            ->withCount(['orders', 'reviews', 'menuItems', 'follows'])
            ->withAvg('reviews', 'rating')
            ->orderByDesc('follows_count')
            ->orderByDesc('reviews_avg_rating')
            ->orderByDesc('reviews_count')
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
        $restaurant->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems', 'follows'])
            ->loadAvg('reviews', 'rating');

        return $this->successResponse(new RestaurantResource($restaurant));
    }

    public function menu(Restaurant $restaurant)
    {
        $restaurant->load(['owner:id,name,email,phone', 'branches'])
            ->loadCount(['orders', 'reviews', 'menuItems', 'follows'])
            ->loadAvg('reviews', 'rating');
        $categories = $restaurant->categories()
            ->with([
                'items' => fn ($query) => $query
                    ->with('category')
                    ->withCount('orderItems')
                    ->orderBy('name'),
            ])
            ->orderBy('sort_order')
            ->get();

        return $this->successResponse([
            'restaurant' => new RestaurantResource($restaurant),
            'categories' => MenuCategoryResource::collection($categories),
            'menu_items' => MenuItemResource::collection($categories->flatMap->items->values()),
        ]);
    }
}
