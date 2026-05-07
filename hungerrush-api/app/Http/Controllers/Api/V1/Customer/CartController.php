<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Requests\Customer\AddCartItemRequest;
use App\Http\Requests\Customer\UpdateCartItemRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\CartItemResource;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index()
    {
        $customerId = (int) auth()->id();
        $carts = Cart::query()
            ->where('customer_id', $customerId)
            ->whereHas('items')
            ->with(['restaurant.branches', 'items.menuItem.category', 'loyaltyOffer.menuItem'])
            ->withCount('items')
            ->orderByDesc('updated_at')
            ->get();

        return $this->successResponse(CartResource::collection($carts), [
            'total_carts' => $carts->count(),
            'total_items' => (int) $carts->sum('items_count'),
        ]);
    }

    public function show(Request $request)
    {
        $cart = $this->resolveCart(
            restaurantId: $request->query('restaurant_id'),
            cartId: $request->query('cart_id'),
        );
        $cart->load(['restaurant.branches', 'items.menuItem.category', 'loyaltyOffer.menuItem']);

        return $this->successResponse(new CartResource($cart));
    }

    public function addItem(AddCartItemRequest $request)
    {
        $validated = $request->validated();
        $menuItem = MenuItem::with('category')->findOrFail($validated['menu_item_id']);
        $restaurantId = $menuItem->category?->restaurant_id;
        abort_unless($restaurantId !== null, 422, 'Menu item does not belong to a restaurant.');

        if (!$menuItem->is_available) {
            return $this->errorResponse(
                'This menu item is currently unavailable.',
                ['menu_item_id' => ['Please choose another available item.']],
                'item_unavailable'
            );
        }

        $cart = Cart::query()->firstOrCreate([
            'customer_id' => auth()->id(),
            'restaurant_id' => $restaurantId,
        ]);

        $item = CartItem::query()->firstOrNew([
            'cart_id' => $cart->id,
            'menu_item_id' => $menuItem->id,
        ]);
        $item->quantity = ($item->exists ? $item->quantity : 0) + $validated['quantity'];
        $item->notes = $validated['notes'] ?? $item->notes;
        $item->save();
        $cart->touch();

        return $this->successResponse(new CartItemResource($item->load('menuItem.category')), message: 'Item added to cart.');
    }

    public function updateItem(UpdateCartItemRequest $request, CartItem $cartItem)
    {
        $cart = $cartItem->cart()->first();
        abort_unless($cart !== null && (int) $cart->customer_id === (int) auth()->id(), 404);
        $cartItem->update($request->validated());
        $cart->touch();

        return $this->successResponse(new CartItemResource($cartItem->refresh()->load('menuItem.category')), message: 'Cart item updated.');
    }

    public function removeItem(CartItem $cartItem)
    {
        $cart = $cartItem->cart()->first();
        abort_unless($cart !== null && (int) $cart->customer_id === (int) auth()->id(), 404);
        $cartItem->delete();
        $cart->touch();

        if (!$cart->items()->exists()) {
            $cart->delete();
        }

        return $this->successResponse(['deleted' => true], message: 'Cart item removed.');
    }

    private function resolveCart(mixed $restaurantId = null, mixed $cartId = null): Cart
    {
        $customerId = (int) auth()->id();

        $cleanedCartId = is_scalar($cartId) ? trim((string) $cartId) : '';
        if ($cleanedCartId !== '') {
            $cart = Cart::query()
                ->where('customer_id', $customerId)
                ->whereKey($cleanedCartId)
                ->first();
            if ($cart) {
                return $cart;
            }
        }

        $cleanedRestaurantId = is_scalar($restaurantId) ? trim((string) $restaurantId) : '';
        if ($cleanedRestaurantId !== '') {
            return Cart::query()->firstOrCreate([
                'customer_id' => $customerId,
                'restaurant_id' => $cleanedRestaurantId,
            ]);
        }

        $existing = Cart::query()
            ->where('customer_id', $customerId)
            ->withCount('items')
            ->orderByDesc('items_count')
            ->orderByDesc('updated_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        return Cart::query()->firstOrCreate([
            'customer_id' => $customerId,
            'restaurant_id' => null,
        ]);
    }
}
