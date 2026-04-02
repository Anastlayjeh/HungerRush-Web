<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\Customer\PlaceOrderRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function place(PlaceOrderRequest $request)
    {
        $cart = Cart::with('items.menuItem')->where('customer_id', auth()->id())->firstOrFail();
        abort_if($cart->items->isEmpty(), 422, 'Cart is empty.');
        abort_if($cart->restaurant_id === null, 422, 'Cart restaurant is missing.');

        $order = DB::transaction(function () use ($cart, $request) {
            $subtotal = 0;
            foreach ($cart->items as $item) {
                $subtotal += (float) $item->menuItem->price * $item->quantity;
            }
            $fees = round($subtotal * 0.10, 2);
            $total = $subtotal + $fees;

            $order = Order::create([
                'customer_id' => auth()->id(),
                'restaurant_id' => $cart->restaurant_id,
                'branch_id' => $request->validated()['branch_id'] ?? null,
                'subtotal' => $subtotal,
                'fees' => $fees,
                'total' => $total,
                'status' => OrderStatus::Pending->value,
                'payment_status' => PaymentStatus::Unpaid->value,
            ]);

            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item->menu_item_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->menuItem->price,
                    'notes' => $item->notes,
                ]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => OrderStatus::Pending->value,
                'changed_by' => auth()->id(),
                'changed_at' => now(),
            ]);

            $cart->items()->delete();
            $cart->update(['restaurant_id' => null]);

            return $order;
        });

        return $this->successResponse(new OrderResource($order->load('items.menuItem')), message: 'Order placed successfully.', status: 201);
    }

    public function show(Order $order)
    {
        abort_unless($order->customer_id === auth()->id(), 404);
        return $this->successResponse(new OrderResource($order->load(['items.menuItem', 'statusHistory'])));
    }

    public function history()
    {
        $orders = Order::query()
            ->where('customer_id', auth()->id())
            ->latest()
            ->paginate(20);

        return $this->successResponse(OrderResource::collection($orders->items()), [
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }
}
