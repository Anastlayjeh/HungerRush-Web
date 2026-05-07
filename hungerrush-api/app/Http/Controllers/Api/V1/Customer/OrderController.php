<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\PlaceOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\UserNotification;
use App\Services\OrderNotificationService;
use App\Services\OrderStatusTransitionService;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function place(PlaceOrderRequest $request, OrderNotificationService $orderNotificationService)
    {
        $cart = $this->resolveCartForPlacement($request->validated());
        $cart->load('items.menuItem');
        abort_if($cart->items->isEmpty(), 422, 'Cart is empty.');
        abort_if($cart->restaurant_id === null, 422, 'Cart restaurant is missing.');
        abort_if(
            $cart->items->contains(fn ($item) => !$item->menuItem?->is_available),
            422,
            'Cart contains unavailable menu items.'
        );

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
            $cart->delete();

            return $order;
        });

        UserNotification::create([
            'user_id' => auth()->id(),
            'type' => 'order',
            'title' => 'Order placed',
            'body' => "Order #{$order->id} was placed successfully.",
            'data' => ['order_id' => $order->id],
        ]);

        $orderNotificationService->notifyNewOrder($order);

        return $this->successResponse(
            new OrderResource($order->load(['restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions'])),
            message: 'Order placed successfully.',
            status: 201
        );
    }

    public function show(Order $order)
    {
        abort_unless($order->customer_id === auth()->id(), 404);
        return $this->successResponse(new OrderResource($order->load(['restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions'])));
    }

    public function history()
    {
        $orders = Order::query()
            ->where('customer_id', auth()->id())
            ->with(['restaurant.branches', 'branch', 'items.menuItem.category', 'loyaltyTransactions'])
            ->latest()
            ->paginate(20);

        return $this->successResponse(OrderResource::collection($orders->items()), [
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }

    public function cancel(
        Order $order,
        OrderStatusTransitionService $transitionService,
        OrderNotificationService $orderNotificationService
    ) {
        abort_unless($order->customer_id === auth()->id(), 404);

        if (!in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted], true)) {
            return $this->errorResponse(
                'Cancel order is not available for the current order status.',
                ['status' => ['Only pending or accepted orders can be canceled.']],
                'cancel_not_available',
                422
            );
        }

        $targetStatus = OrderStatus::Cancelled;
        if (!$transitionService->canTransition($order->status, $targetStatus)) {
            return $this->errorResponse(
                'Invalid status transition.',
                ['status' => ['Transition is not allowed from current status.']],
                'invalid_order_transition',
                422
            );
        }

        $order->update(['status' => $targetStatus->value]);
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $targetStatus->value,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        $orderNotificationService->notifyCustomerStatusChange($order, $targetStatus);

        return $this->successResponse(
            new OrderResource($order->refresh()->load(['restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions'])),
            message: 'Order canceled successfully.'
        );
    }

    private function resolveCartForPlacement(array $validated): Cart
    {
        $customerId = (int) auth()->id();
        $cartId = isset($validated['cart_id']) ? trim((string) $validated['cart_id']) : '';
        if ($cartId !== '') {
            return Cart::query()
                ->where('customer_id', $customerId)
                ->whereKey($cartId)
                ->firstOrFail();
        }

        $restaurantId = isset($validated['restaurant_id']) ? trim((string) $validated['restaurant_id']) : '';
        if ($restaurantId !== '') {
            return Cart::query()
                ->where('customer_id', $customerId)
                ->where('restaurant_id', $restaurantId)
                ->firstOrFail();
        }

        return Cart::query()
            ->where('customer_id', $customerId)
            ->whereHas('items')
            ->latest('updated_at')
            ->firstOrFail();
    }
}
