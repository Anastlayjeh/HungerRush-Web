<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Services\OrderStatusTransitionService;

class OrderController extends Controller
{
    public function index()
    {
        $restaurant = $this->resolveRestaurant();
        $orders = Order::query()
            ->where('restaurant_id', $restaurant->id)
            ->latest()
            ->paginate(15);

        return $this->successResponse($orders->items(), [
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);
        $order->load(['items', 'statusHistory']);

        return $this->successResponse($order);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order, OrderStatusTransitionService $transitionService)
    {
        $this->authorize('update', $order);
        $targetStatus = OrderStatus::from($request->validated()['status']);

        if (!$transitionService->canTransition($order->status, $targetStatus)) {
            return $this->errorResponse(
                'Invalid status transition.',
                ['status' => ['Transition is not allowed from current status.']],
                'invalid_order_transition'
            );
        }

        $order->update(['status' => $targetStatus->value]);
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $targetStatus->value,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        return $this->successResponse($order->refresh(), message: 'Order status updated.');
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
