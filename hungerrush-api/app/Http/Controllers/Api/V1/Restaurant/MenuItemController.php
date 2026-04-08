<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreMenuItemRequest;
use App\Http\Requests\Restaurant\UpdateMenuItemAvailabilityRequest;
use App\Http\Requests\Restaurant\UpdateMenuItemRequest;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Support\MenuItemIngredients;

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
        $validated = $request->validated();
        $category = MenuCategory::findOrFail($validated['category_id']);
        abort_unless($category->restaurant?->owner_user_id === auth()->id(), 403, 'Not authorized for this category.');

        $validated['ingredients'] = $this->resolveIngredients(
            $validated['ingredients'] ?? null,
            (string) ($validated['name'] ?? ''),
            $category->name
        );

        $item = MenuItem::create($validated);

        return $this->successResponse($item, message: 'Menu item created.', status: 201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);
        $originalCategoryId = $menuItem->category_id;
        $validated = $request->validated();
        $resolvedCategory = $menuItem->category;

        if (array_key_exists('category_id', $validated)) {
            $resolvedCategory = MenuCategory::findOrFail((int) $validated['category_id']);
            abort_unless(
                $resolvedCategory->restaurant?->owner_user_id === auth()->id(),
                403,
                'Not authorized for this category.'
            );
        }

        $resolvedName = (string) ($validated['name'] ?? $menuItem->name);
        $categoryName = $resolvedCategory?->name;

        if (array_key_exists('ingredients', $validated)) {
            $validated['ingredients'] = $this->resolveIngredients(
                $validated['ingredients'],
                $resolvedName,
                $categoryName
            );
        } elseif (blank($menuItem->ingredients)) {
            $validated['ingredients'] = $this->resolveIngredients(null, $resolvedName, $categoryName);
        }

        $menuItem->update($validated);
        if ($menuItem->category_id !== $originalCategoryId) {
            $this->cleanupEmptyCategory($originalCategoryId);
        }

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
        $categoryId = $menuItem->category_id;
        $menuItem->delete();
        $this->cleanupEmptyCategory($categoryId);

        return $this->successResponse(['deleted' => true], message: 'Menu item deleted.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }

    private function resolveIngredients(mixed $ingredients, string $itemName, ?string $categoryName = null): string
    {
        $trimmed = is_string($ingredients) ? trim($ingredients) : '';
        if ($trimmed !== '') {
            return $trimmed;
        }

        return MenuItemIngredients::suggest($itemName, $categoryName);
    }

    private function cleanupEmptyCategory(int|string|null $categoryId): void
    {
        if (!$categoryId) {
            return;
        }

        $category = MenuCategory::query()->find((int) $categoryId);
        if (!$category) {
            return;
        }

        $hasItems = MenuItem::query()->where('category_id', $category->id)->exists();
        if (!$hasItems) {
            $category->delete();
        }
    }
}
