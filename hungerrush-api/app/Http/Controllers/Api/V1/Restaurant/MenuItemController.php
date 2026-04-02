<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreMenuItemRequest;
use App\Http\Requests\Restaurant\UpdateMenuItemAvailabilityRequest;
use App\Http\Requests\Restaurant\UpdateMenuItemRequest;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;

class MenuItemController extends Controller
{
    public function index()
    {
        $restaurant = $this->resolveRestaurant();
        $items = MenuItem::query()
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurant->id))
            ->orderByDesc('id')
            ->get();

        return $this->successResponse($items);
    }

    public function store(StoreMenuItemRequest $request)
    {
        $this->authorize('create', MenuItem::class);
        $category = MenuCategory::findOrFail($request->validated()['category_id']);
        abort_unless($category->restaurant?->owner_user_id === auth()->id(), 403, 'Not authorized for this category.');

        $item = MenuItem::create($request->validated());

        return $this->successResponse($item, message: 'Menu item created.', status: 201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);
        $menuItem->update($request->validated());

        return $this->successResponse($menuItem->refresh(), message: 'Menu item updated.');
    }

    public function updateAvailability(UpdateMenuItemAvailabilityRequest $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);
        $menuItem->update($request->validated());

        return $this->successResponse($menuItem->refresh(), message: 'Menu item availability updated.');
    }

    public function destroy(MenuItem $menuItem)
    {
        $this->authorize('delete', $menuItem);
        $menuItem->delete();

        return $this->successResponse(['deleted' => true], message: 'Menu item deleted.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
