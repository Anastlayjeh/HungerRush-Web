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

class CartController extends Controller
{
    public function show()
    {
        $cart = $this->resolveCart();
        $cart->load('items.menuItem');

        return $this->successResponse(new CartResource($cart));
    }

    public function addItem(AddCartItemRequest $request)
    {
        $validated = $request->validated();
        $menuItem = MenuItem::with('category')->findOrFail($validated['menu_item_id']);
        $cart = $this->resolveCart();

        if ($cart->restaurant_id !== null && $cart->restaurant_id !== $menuItem->category->restaurant_id) {
            return $this->errorResponse(
                'Cart can only contain items from one restaurant.',
                ['menu_item_id' => ['Please clear cart before adding this item.']],
                'mixed_restaurants'
            );
        }

        if ($cart->restaurant_id === null) {
            $cart->update(['restaurant_id' => $menuItem->category->restaurant_id]);
        }

        $item = CartItem::query()->firstOrNew([
            'cart_id' => $cart->id,
            'menu_item_id' => $menuItem->id,
        ]);
        $item->quantity = ($item->exists ? $item->quantity : 0) + $validated['quantity'];
        $item->notes = $validated['notes'] ?? $item->notes;
        $item->save();

        return $this->successResponse(new CartItemResource($item->load('menuItem')), message: 'Item added to cart.');
    }

    public function updateItem(UpdateCartItemRequest $request, CartItem $cartItem)
    {
        $cart = $this->resolveCart();
        abort_unless($cartItem->cart_id === $cart->id, 404);
        $cartItem->update($request->validated());

        return $this->successResponse(new CartItemResource($cartItem->refresh()->load('menuItem')), message: 'Cart item updated.');
    }

    public function removeItem(CartItem $cartItem)
    {
        $cart = $this->resolveCart();
        abort_unless($cartItem->cart_id === $cart->id, 404);
        $cartItem->delete();

        if ($cart->items()->count() === 0) {
            $cart->update(['restaurant_id' => null]);
        }

        return $this->successResponse(['deleted' => true], message: 'Cart item removed.');
    }

    private function resolveCart(): Cart
    {
        return Cart::firstOrCreate([
            'customer_id' => auth()->id(),
        ]);
    }
}
