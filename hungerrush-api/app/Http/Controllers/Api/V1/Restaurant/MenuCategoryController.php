<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreMenuCategoryRequest;
use App\Http\Requests\Restaurant\UpdateMenuCategoryRequest;
use App\Models\MenuCategory;
use App\Models\Restaurant;

class MenuCategoryController extends Controller
{
    public function index()
    {
        $restaurant = $this->resolveRestaurant();
        $categories = $restaurant->categories()->orderBy('sort_order')->get();

        return $this->successResponse($categories);
    }

    public function store(StoreMenuCategoryRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $this->authorize('create', MenuCategory::class);

        $category = $restaurant->categories()->create($request->validated());

        return $this->successResponse($category, message: 'Menu category created.', status: 201);
    }

    public function update(UpdateMenuCategoryRequest $request, MenuCategory $menuCategory)
    {
        $this->authorize('update', $menuCategory);
        $menuCategory->update($request->validated());

        return $this->successResponse($menuCategory->refresh(), message: 'Menu category updated.');
    }

    public function destroy(MenuCategory $menuCategory)
    {
        $this->authorize('delete', $menuCategory);
        $menuCategory->delete();

        return $this->successResponse(['deleted' => true], message: 'Menu category deleted.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
